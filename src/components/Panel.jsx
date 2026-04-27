import { useState, useRef, useEffect } from 'react';
import DropZone from './DropZone';
import ImageWrapper from './ImageWrapper';
import ExcelViewer from './ExcelViewer';
import DocViewer from './DocViewer';
import { renderPdfToImages } from '../utils/pdfUtils';
import { parseExcelToHTML } from '../utils/excelUtils';
import { parseWordToHTML } from '../utils/wordUtils';
import { renderPptIntoElement } from '../utils/pptUtils';
import { formatBytes } from '../utils/imageUtils';

export default function Panel({
  title,
  acceptPdf = false,
  onCompare,
  onFileRemove,
  // Controlled from outside (for keyboard nav)
  files,
  index,
  onFilesAdd,
  onNext,
  onPrev,
  style,
}) {
  const [info, setInfo] = useState('W: - | H: - | DPI: - | Size: -');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setInfo('W: - | H: - | DPI: - | Size: -');
  }, [index]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  async function handleFiles(fileList) {
    const arr = Array.from(fileList);
    const newItems = [];
    for (const f of arr) {
      const fname = f.name.toLowerCase();
      if (acceptPdf && fname.endsWith('.pdf')) {
        try {
          const pages = await renderPdfToImages(f);
          newItems.push(...pages);
        } catch (err) {
          console.error('PDF render error', err);
          alert('Failed to render PDF: ' + f.name);
        }
      } else if (!acceptPdf && (fname.endsWith('.xlsx') || fname.endsWith('.xlsm'))) {
        // Handle Excel files for left panel only
        try {
          const htmlContent = await parseExcelToHTML(f);
          newItems.push({ type: 'excel', src: htmlContent, file: f, origSize: f.size });
        } catch (err) {
          console.error('Excel parse error', err);
          alert('Failed to parse Excel: ' + f.name);
        }
      } else if (!acceptPdf && fname.endsWith('.docx')) {
        try {
          const htmlContent = await parseWordToHTML(f);
          newItems.push({ type: 'word', src: htmlContent, file: f, origSize: f.size });
        } catch (err) {
          console.error('Word parse error', err);
          alert('Failed to parse Word: ' + f.name);
        }
      } else if (!acceptPdf && fname.endsWith('.pptx')) {
        newItems.push({
          type: 'ppt',
          renderFn: (el) => renderPptIntoElement(f, el),
          file: f,
          origSize: f.size,
        });
      } else if (!acceptPdf && (fname.endsWith('.doc') || fname.endsWith('.ppt'))) {
        alert('Legacy .doc/.ppt are not supported. Please save as .docx/.pptx: ' + f.name);
      } else if (f.type && f.type.startsWith('image/')) {
        const url = URL.createObjectURL(f);
        newItems.push({ type: 'image', src: url, file: f, origSize: f.size });
      }
    }
    if (newItems.length) onFilesAdd(newItems);
  }

  function enterFullscreen() {
    if (wrapperRef.current?.requestFullscreen) {
      wrapperRef.current.requestFullscreen();
    }
  }

  function exitFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }

  function handleDeleteFile() {
    if (currentItem && onFileRemove) {
      onFileRemove(index);
    }
  }

  const currentItem = index >= 0 && index < files.length ? files[index] : null;

  const accept = acceptPdf
    ? 'application/pdf,image/*'
    : 'image/*,.xlsx,.xlsm,.docx,.pptx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation';
  const dropLabel = acceptPdf
    ? 'Click or drag images / PDFs here (multiple)'
    : 'Click or drag images, Excel, Word, or PowerPoint here (multiple)';

  return (
    <div className="panel" style={style}>
      <div className="title">{title}</div>

      <DropZone accept={accept} multiple label={dropLabel} onFiles={handleFiles} />

      <div className="image-wrapper" ref={wrapperRef}>
        {currentItem && (
          currentItem.type === 'excel' ? (
            <ExcelViewer key={currentItem.src} htmlContent={currentItem.src} wrapperRef={wrapperRef} />
          ) : currentItem.type === 'word' ? (
            <DocViewer
              key={'word-' + index}
              kind="word"
              htmlContent={currentItem.src}
              wrapperRef={wrapperRef}
            />
          ) : currentItem.type === 'ppt' ? (
            <DocViewer
              key={'ppt-' + index}
              kind="ppt"
              renderFn={currentItem.renderFn}
              wrapperRef={wrapperRef}
            />
          ) : (
            <ImageWrapper
              key={currentItem.src + index}
              item={currentItem}
              onInfoChange={setInfo}
              wrapperRef={wrapperRef}
            />
          )
        )}
        {isFullscreen && currentItem?.type === 'image' && (
          <div className="fullscreen-controls">
            <button onClick={() => wrapperRef.current?._zoomBy?.(1.2)} title="Zoom In">🔍+ Zoom In</button>
            <button onClick={() => wrapperRef.current?._zoomBy?.(0.8)} title="Zoom Out">🔍- Zoom Out</button>
            <button onClick={() => wrapperRef.current?._reset?.()} title="Reset">⟳ Reset</button>
            <button onClick={exitFullscreen} className="exit-fs" title="Exit Fullscreen (ESC)">✕ Exit</button>
          </div>
        )}
      </div>

      <div className="info-bar">
        {currentItem?.type === 'excel' ? (
          <>
            <span>📊 {currentItem?.file?.name || 'Excel'}</span>
            <span>Size: {formatBytes(currentItem?.origSize)}</span>
          </>
        ) : currentItem?.type === 'word' ? (
          <>
            <span>📝 {currentItem?.file?.name || 'Word'}</span>
            <span>Size: {formatBytes(currentItem?.origSize)}</span>
          </>
        ) : currentItem?.type === 'ppt' ? (
          <>
            <span>🎞 {currentItem?.file?.name || 'PowerPoint'}</span>
            <span>Size: {formatBytes(currentItem?.origSize)}</span>
          </>
        ) : (
          <>
            <span>📄 {currentItem?.file?.name || 'No file'}</span>
            <span>{info}</span>
          </>
        )}
      </div>

      <div className="controls">
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button
            className="small"
            onClick={onPrev}
            disabled={index <= 0}
          >
            ← Previous
          </button>
          <button
            className="small"
            onClick={onNext}
            disabled={index >= files.length - 1}
          >
            Next →
          </button>
          {['image', 'excel', 'word', 'ppt'].includes(currentItem?.type) && (
            <>
              <button onClick={() => wrapperRef.current?._zoomBy?.(1.2)}>🔍+ Zoom In</button>
              <button onClick={() => wrapperRef.current?._zoomBy?.(0.8)}>🔍- Zoom Out</button>
              <button onClick={() => wrapperRef.current?._reset?.()}>⟳ Reset</button>
              {currentItem?.type === 'image' && (
                <button onClick={enterFullscreen}>⛶ Fullscreen</button>
              )}
            </>
          )}
          <span className="counter">
            {files.length === 0 ? '0/0' : `${index + 1}/${files.length}`}
          </span>
        </div>
        <button className="delete-btn small" onClick={handleDeleteFile} title="Delete this file">
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}
