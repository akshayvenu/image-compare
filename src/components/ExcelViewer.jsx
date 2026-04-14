import { useEffect, useRef, useCallback } from 'react';

const MIN_COLUMN_WIDTH = 48;
const MIN_ROW_HEIGHT = 28;

function applyColumnWidth(table, columnIndex, width) {
  const rows = Array.from(table.rows);
  rows.forEach((row) => {
    const cell = row.cells[columnIndex];
    if (!cell) return;
    cell.style.width = `${width}px`;
    cell.style.minWidth = `${width}px`;
    cell.style.maxWidth = `${width}px`;
  });
}

function applyRowHeight(row, height) {
  row.style.height = `${height}px`;
  Array.from(row.cells).forEach((cell) => {
    cell.style.height = `${height}px`;
  });
}

export default function ExcelViewer({ htmlContent, wrapperRef: externalWrapperRef }) {
  const contentRef = useRef(null);
  const wrapperRef = externalWrapperRef;
  const zoomStateRef = useRef({ scale: 1 });
  const resizeStateRef = useRef(null);

  // Zoom functions
  const zoomBy = useCallback((factor) => {
    if (!contentRef.current) return;
    zoomStateRef.current.scale = Math.max(0.2, Math.min(3, (zoomStateRef.current.scale || 1) * factor));
    contentRef.current.style.transform = `scale(${zoomStateRef.current.scale})`;
  }, []);

  const reset = useCallback(() => {
    if (!contentRef.current) return;
    zoomStateRef.current.scale = 1;
    contentRef.current.style.transform = 'scale(1)';
  }, []);

  // Expose zoom methods on wrapper ref
  useEffect(() => {
    if (wrapperRef && wrapperRef.current) {
      wrapperRef.current._zoomBy = zoomBy;
      wrapperRef.current._reset = reset;
    }
  }, [wrapperRef, zoomBy, reset]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return undefined;

    root.innerHTML = htmlContent;
    const cleanupFns = [];

    const stopResize = () => {
      resizeStateRef.current = null;
      document.body.classList.remove('excel-resizing-col', 'excel-resizing-row');
    };

    const handlePointerMove = (event) => {
      const state = resizeStateRef.current;
      if (!state) return;

      if (state.type === 'column') {
        const nextWidth = Math.max(
          MIN_COLUMN_WIDTH,
          state.startSize + event.clientX - state.startPointer,
        );
        applyColumnWidth(state.table, state.index, nextWidth);
      } else if (state.type === 'row') {
        const nextHeight = Math.max(
          MIN_ROW_HEIGHT,
          state.startSize + event.clientY - state.startPointer,
        );
        applyRowHeight(state.row, nextHeight);
      }
    };

    const handlePointerUp = () => {
      stopResize();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    cleanupFns.push(() => window.removeEventListener('pointermove', handlePointerMove));
    cleanupFns.push(() => window.removeEventListener('pointerup', handlePointerUp));

    const tables = root.querySelectorAll('table');
    tables.forEach((table) => {
      const rows = Array.from(table.rows);
      if (!rows.length) return;

      const columnSourceRow = rows.find((row) => row.cells.length > 0);
      if (columnSourceRow) {
        Array.from(columnSourceRow.cells).forEach((cell, columnIndex) => {
          cell.classList.add('excel-resizable-column-anchor');

          const handle = document.createElement('button');
          handle.type = 'button';
          handle.className = 'excel-resize-handle excel-resize-handle-col';
          handle.setAttribute('aria-label', `Resize column ${columnIndex + 1}`);

          const onPointerDown = (event) => {
            event.preventDefault();
            event.stopPropagation();
            resizeStateRef.current = {
              type: 'column',
              table,
              index: columnIndex,
              startPointer: event.clientX,
              startSize: cell.getBoundingClientRect().width,
            };
            document.body.classList.add('excel-resizing-col');
          };

          const onDoubleClick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            cell.style.width = '';
            cell.style.minWidth = '';
            cell.style.maxWidth = '';
            const autoWidth = Math.max(MIN_COLUMN_WIDTH, cell.getBoundingClientRect().width);
            applyColumnWidth(table, columnIndex, autoWidth);
          };

          handle.addEventListener('pointerdown', onPointerDown);
          handle.addEventListener('dblclick', onDoubleClick);
          cell.appendChild(handle);

          cleanupFns.push(() => {
            handle.removeEventListener('pointerdown', onPointerDown);
            handle.removeEventListener('dblclick', onDoubleClick);
          });
        });
      }

      rows.forEach((row, rowIndex) => {
        const firstCell = row.cells[0];
        if (!firstCell) return;

        row.classList.add('excel-resizable-row');
        firstCell.classList.add('excel-resizable-row-anchor');

        const handle = document.createElement('button');
        handle.type = 'button';
        handle.className = 'excel-resize-handle excel-resize-handle-row';
        handle.setAttribute('aria-label', `Resize row ${rowIndex + 1}`);

        const onPointerDown = (event) => {
          event.preventDefault();
          event.stopPropagation();
          resizeStateRef.current = {
            type: 'row',
            row,
            startPointer: event.clientY,
            startSize: row.getBoundingClientRect().height,
          };
          document.body.classList.add('excel-resizing-row');
        };

        const onDoubleClick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          row.style.height = '';
          Array.from(row.cells).forEach((cell) => {
            cell.style.height = '';
          });
        };

        handle.addEventListener('pointerdown', onPointerDown);
        handle.addEventListener('dblclick', onDoubleClick);
        firstCell.appendChild(handle);

        cleanupFns.push(() => {
          handle.removeEventListener('pointerdown', onPointerDown);
          handle.removeEventListener('dblclick', onDoubleClick);
        });
      });
    });

    return () => {
      stopResize();
      cleanupFns.forEach((cleanup) => cleanup());
    };
  }, [htmlContent]);

  return (
    <div className="excel-wrapper">
      <div className="excel-hint">📌 Drag row/column borders to resize • Double-click to auto-fit</div>
      <div className="excel-content" ref={contentRef} style={{ transformOrigin: 'top left' }} />
    </div>
  );
}
