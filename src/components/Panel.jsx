import { useState, useRef, useEffect } from 'react';
import DropZone from './DropZone';
import ImageWrapper from './ImageWrapper';
import ExcelViewer from './ExcelViewer';
import DocViewer from './DocViewer';
import PdfInfoPanel from './PdfInfoPanel';
import { renderPdfToImages } from '../utils/pdfUtils';
import { parseExcelToHTML } from '../utils/excelUtils';
import { parseWordToHTML } from '../utils/wordUtils';
import { renderPptIntoElement } from '../utils/pptUtils';
import { formatBytes } from '../utils/imageUtils';

const SIDE_LABELS = {
  brief: 'BRIEF',
  multi: 'MULTIPLE',
};

export default function Panel({
  side = 'brief',
  acceptPdf = false,
  onCompare,
  onFileRemove,
  files,
  index,
  onFilesAdd,
  onNext,
  onPrev,
  style,
}) {
  const [info, setInfo] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfMeta, setPdfMeta] = useState(null);
  const [showMorePdf, setShowMorePdf] = useState(false);
  const wrapperRef = useRef(null);
  const dropZoneRef = useRef(null);
  const thumbStripRef = useRef(null);

  const currentItem = index >= 0 && index < files.length ? files[index] : null;

  useEffect(() => {
    setInfo('');
    setShowMorePdf(false);

    if (side === 'multi' && currentItem?.isPdfPage && currentItem?.pdfMeta) {
      setPdfMeta(currentItem.pdfMeta);
    } else {
      setPdfMeta(null);
    }
  }, [index, files, side, currentItem]);

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

  function handleThumbnailClick(targetIndex) {
    if (targetIndex === index) return;
    const delta = targetIndex - index;
    const step = delta > 0 ? onNext : onPrev;
    for (let i = 0; i < Math.abs(delta); i++) step();
  }

  const accept = acceptPdf
    ? 'application/pdf,image/*'
    : 'image/*,.xlsx,.xlsm,.docx,.pptx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation';

  const dropLabel = 'Drop files here or click to browse';
  const dropHint = acceptPdf
    ? 'Images · PDFs'
    : 'Images · Excel · Word · PowerPoint';

  const isEmpty = files.length === 0;
  const sideLabel = SIDE_LABELS[side] || side.toUpperCase();

  // Build info bar text
  function getDisplayName() {
    if (!currentItem) return '';
    if (currentItem.isPdfPage) {
      const pdfName = currentItem.sourceFile?.name || 'PDF';
      return `${pdfName} · Page ${currentItem.page}/${currentItem.pdfMeta?.pageCount || '?'}`;
    }
    return currentItem.file?.name || '';
  }

  function getFileIcon() {
    if (!currentItem) return '';
    if (currentItem.isPdfPage) return '📕';
    if (currentItem.type === 'excel') return '📊';
    if (currentItem.type === 'word') return '📝';
    if (currentItem.type === 'ppt') return '🎞';
    return '🖼';
  }

  return (
    <div className="panel" style={style}>
      <div className="panel-header">
        <div className="panel-label">
          <span>{sideLabel}</span>
          {!isEmpty && (
            <span className="panel-label-count">
              {files.length} file{files.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="panel-header-actions">
          {!isEmpty && (
            <button className="add-btn" onClick={() => dropZoneRef.current?.open()} title="Add more files">
              + Add
            </button>
          )}
        </div>
      </div>

      <DropZone
        ref={dropZoneRef}
        accept={accept}
        multiple
        label={dropLabel}
        hint={dropHint}
        onFiles={handleFiles}
        className={isEmpty ? '' : 'dz-compact'}
      />

      {!isEmpty && (
        <>
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
                <button onClick={() => wrapperRef.current?._zoomBy?.(1.2)} title="Zoom In">🔍+</button>
                <button onClick={() => wrapperRef.current?._zoomBy?.(0.8)} title="Zoom Out">🔍-</button>
                <button onClick={() => wrapperRef.current?._reset?.()} title="Reset">↺</button>
                <button onClick={exitFullscreen} className="exit-fs" title="Exit Fullscreen (ESC)">✕ Exit</button>
              </div>
            )}
          </div>

          {files.length > 1 && (
            <div className="thumbnail-strip" ref={thumbStripRef}>
              {files.map((file, i) => (
                <div
                  key={i}
                  className={`thumbnail ${i === index ? 'active' : ''}`}
                  onClick={() => handleThumbnailClick(i)}
                  title={`Item ${i + 1}`}
                >
                  {file.type === 'image' && file.src ? (
                    <img src={file.src} alt={`Item ${i + 1}`} />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {pdfMeta && side === 'multi' && (
            <PdfInfoPanel
              metadata={pdfMeta}
              showMore={showMorePdf}
              onToggleMore={() => setShowMorePdf(!showMorePdf)}
            />
          )}

          <div className="image-title-bar">
            <span className="image-title-icon">{getFileIcon()}</span>
            <span className="image-title-name" title={getDisplayName()}>{getDisplayName()}</span>
          </div>
          <div className="info-bar">
            {info ? (
              <span className="info-meta info-meta-main">{info}</span>
            ) : currentItem?.origSize ? (
              <span className="info-meta">{formatBytes(currentItem.origSize)}</span>
            ) : null}
          </div>

          <div className="controls">
            <div className="controls-group">
              <button
                className="btn-icon"
                onClick={onPrev}
                disabled={index <= 0}
                title="Previous"
              >
                ‹
              </button>
              <button
                className="btn-icon"
                onClick={onNext}
                disabled={index >= files.length - 1}
                title="Next"
              >
                ›
              </button>
            </div>
            {['image', 'excel', 'word', 'ppt'].includes(currentItem?.type) && (
              <div className="controls-group">
                <button className="btn-icon" onClick={() => wrapperRef.current?._zoomBy?.(1.2)} title="Zoom In">🔍+</button>
                <button className="btn-icon" onClick={() => wrapperRef.current?._zoomBy?.(0.8)} title="Zoom Out">🔍−</button>
                <button className="btn-icon" onClick={() => wrapperRef.current?._reset?.()} title="Reset">↺</button>
                {currentItem?.type === 'image' && (
                  <button className="btn-icon" onClick={enterFullscreen} title="Fullscreen">⛶</button>
                )}
              </div>
            )}
            <div className="controls-spacer" />
            <span className="counter">
              {index + 1} / {files.length}
            </span>
            <button className="delete-btn" onClick={handleDeleteFile} title="Delete this file">
              🗑
            </button>
          </div>
        </>
      )}
    </div>
  );
}
