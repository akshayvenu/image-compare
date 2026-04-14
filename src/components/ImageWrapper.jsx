import { useRef, useEffect, useCallback } from 'react';
import { autoFit, setTransform, getImageDPI, formatBytes } from '../utils/imageUtils';

export default function ImageWrapper({ item, onInfoChange, wrapperRef: externalWrapperRef }) {
  const localWrapperRef = useRef(null);
  const wrapperRef = externalWrapperRef || localWrapperRef;
  const imgRef = useRef(null);

  const applyTransformable = useCallback((el) => {
    if (!el || el._isTransformable) return;
    el._isTransformable = true;
    if (!el._state) el._state = { scale: 1, panX: 0, panY: 0 };
    el.style.touchAction = 'none';

    let activePointerId = null;
    let startX = 0, startY = 0, startPanX = 0, startPanY = 0;

    function onPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      activePointerId = e.pointerId;
      try { el.setPointerCapture(activePointerId); } catch {}
      startX = e.clientX; startY = e.clientY;
      startPanX = el._state.panX || 0;
      startPanY = el._state.panY || 0;
      e.preventDefault();
    }
    function onPointerMove(e) {
      if (activePointerId !== e.pointerId) return;
      el._state.panX = startPanX + (e.clientX - startX);
      el._state.panY = startPanY + (e.clientY - startY);
      setTransform(el, el._state.panX, el._state.panY, el._state.scale || 1);
    }
    function onPointerUp(e) {
      if (activePointerId !== e.pointerId) return;
      activePointerId = null;
    }
    function onWheel(e) {
      const factor = -e.deltaY > 0 ? 1.08 : 0.92;
      el._state.scale = Math.max(0.2, Math.min(10, (el._state.scale || 1) * factor));
      setTransform(el, el._state.panX || 0, el._state.panY || 0, el._state.scale);
      e.preventDefault();
    }

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    el._cleanup = () => {
      el._isTransformable = false;
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  useEffect(() => {
    return () => {
      const img = imgRef.current;
      if (img && img._cleanup) img._cleanup();
    };
  }, [item]);

  function handleLoad() {
    const img = imgRef.current;
    const wrapper = wrapperRef.current;
    if (!img || !wrapper) return;
    autoFit(img, wrapper);
    applyTransformable(img);
    getImageDPI(img, 72, (dpi) => {
      const w = img.naturalWidth || Math.round(img.width);
      const h = img.naturalHeight || Math.round(img.height);
      const size = item?.origSize
        ? formatBytes(item.origSize)
        : item?.file?.size
        ? formatBytes(item.file.size)
        : '-';
      onInfoChange?.(`W: ${w} | H: ${h} | DPI: ${dpi} | Size: ${size}`);
    });
  }

  // expose zoom/reset via ref on the wrapper
  const zoomBy = useCallback((factor) => {
    const img = imgRef.current;
    if (!img) return;
    img._state = img._state || { scale: 1, panX: 0, panY: 0 };
    img._state.scale = Math.max(0.2, (img._state.scale || 1) * factor);
    setTransform(img, img._state.panX || 0, img._state.panY || 0, img._state.scale);
  }, []);

  const reset = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    img._state = { scale: 1, panX: 0, panY: 0 };
    setTransform(img, 0, 0, 1);
  }, []);

  // Attach helpers to the wrapper ref for parent access
  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current._zoomBy = zoomBy;
      wrapperRef.current._reset = reset;
    }
  });

  if (!item) return null;

  return (
    <img
      ref={imgRef}
      className="transformable"
      src={item.src}
      alt=""
      draggable={false}
      onLoad={handleLoad}
    />
  );
}
