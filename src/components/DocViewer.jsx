import { useEffect, useRef, useCallback } from 'react';

export default function DocViewer({ kind, htmlContent, renderFn, wrapperRef: externalWrapperRef }) {
  const contentRef = useRef(null);
  const wrapperRef = externalWrapperRef;
  const zoomStateRef = useRef({ scale: 1 });

  const applyScale = useCallback(() => {
    if (!contentRef.current) return;
    contentRef.current.style.transform = `scale(${zoomStateRef.current.scale})`;
  }, []);

  const zoomBy = useCallback((factor) => {
    zoomStateRef.current.scale = Math.max(0.2, Math.min(3, (zoomStateRef.current.scale || 1) * factor));
    applyScale();
  }, [applyScale]);

  const reset = useCallback(() => {
    zoomStateRef.current.scale = 1;
    applyScale();
  }, [applyScale]);

  useEffect(() => {
    if (wrapperRef && wrapperRef.current) {
      wrapperRef.current._zoomBy = zoomBy;
      wrapperRef.current._reset = reset;
    }
  }, [wrapperRef, zoomBy, reset]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    zoomStateRef.current.scale = 1;
    root.style.transform = 'scale(1)';

    if (htmlContent != null) {
      root.innerHTML = htmlContent;
      return;
    }
    if (typeof renderFn === 'function') {
      let cancelled = false;
      Promise.resolve(renderFn(root)).catch((err) => {
        if (cancelled) return;
        console.error('DocViewer render error', err);
        root.innerHTML = `<div style="padding:16px;color:#c00">Failed to render: ${err?.message || err}</div>`;
      });
      return () => { cancelled = true; };
    }
  }, [htmlContent, renderFn]);

  return (
    <div className={`doc-wrapper doc-${kind}`}>
      <div className="doc-content" ref={contentRef} style={{ transformOrigin: 'top left' }} />
    </div>
  );
}
