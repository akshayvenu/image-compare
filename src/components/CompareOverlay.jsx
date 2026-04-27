import { useRef, useEffect, useState, useCallback } from 'react';
import { autoFit, setTransform, getImageDPI, formatBytes } from '../utils/imageUtils';

function CompareImage({ src, item, side, registerRef }) {
  const imgRef = useRef(null);
  const sideRef = useRef(null);
  const [info, setInfo] = useState('W: - | H: - | DPI: - | Size: -');

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

  function handleLoad() {
    const img = imgRef.current;
    const wrapper = sideRef.current;
    if (!img || !wrapper) return;
    autoFit(img, wrapper);
    applyTransformable(img);
    getImageDPI(img, (dpi) => {
      const w = img.naturalWidth || Math.round(img.width);
      const h = img.naturalHeight || Math.round(img.height);
      const size = item?.origSize
        ? formatBytes(item.origSize)
        : item?.file?.size
        ? formatBytes(item.file.size)
        : '-';
      setInfo(`W: ${w} | H: ${h} | DPI: ${dpi ?? 'N/A'} | Size: ${size}`);
    }, item?.file);
  }

  useEffect(() => {
    registerRef?.(imgRef);
    return () => {
      const img = imgRef.current;
      if (img && img._cleanup) img._cleanup();
    };
  }, []);

  return (
    <div className="compare-side" ref={sideRef}>
      <img
        ref={imgRef}
        className="transformable"
        src={src}
        alt={side}
        draggable={false}
        onLoad={handleLoad}
      />
      <div className="compare-side-info">{info}</div>
    </div>
  );
}

export default function CompareOverlay({ briefItem, multiItem, onExit }) {
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  function zoomLeft(f) {
    const el = leftRef.current?.current;
    if (!el) return;
    el._state = el._state || { scale: 1, panX: 0, panY: 0 };
    el._state.scale = Math.max(0.2, (el._state.scale || 1) * f);
    setTransform(el, el._state.panX || 0, el._state.panY || 0, el._state.scale);
  }
  function zoomRight(f) {
    const el = rightRef.current?.current;
    if (!el) return;
    el._state = el._state || { scale: 1, panX: 0, panY: 0 };
    el._state.scale = Math.max(0.2, (el._state.scale || 1) * f);
    setTransform(el, el._state.panX || 0, el._state.panY || 0, el._state.scale);
  }
  function resetLeft() {
    const el = leftRef.current?.current;
    if (!el) return;
    el._state = { scale: 1, panX: 0, panY: 0 };
    setTransform(el, 0, 0, 1);
  }
  function resetRight() {
    const el = rightRef.current?.current;
    if (!el) return;
    el._state = { scale: 1, panX: 0, panY: 0 };
    setTransform(el, 0, 0, 1);
  }

  return (
    <div id="compareOverlay" style={{ display: 'block' }}>
      <button className="compare-exit" onClick={onExit}>✕ Exit Compare</button>

      <div className="compare-mode">
        <CompareImage
          src={briefItem.src}
          item={briefItem}
          side="Brief"
          registerRef={(r) => { leftRef.current = r; }}
        />
        <CompareImage
          src={multiItem.src}
          item={multiItem}
          side="Multi"
          registerRef={(r) => { rightRef.current = r; }}
        />
      </div>

      <div className="compare-controls">
        <button onClick={() => zoomLeft(1.2)}>🔍+ Left</button>
        <button onClick={() => zoomLeft(0.8)}>🔍- Left</button>
        <button onClick={resetLeft}>⟳ Reset L</button>
        <button onClick={() => zoomRight(1.2)}>🔍+ Right</button>
        <button onClick={() => zoomRight(0.8)}>🔍- Right</button>
        <button onClick={resetRight}>⟳ Reset R</button>
      </div>
    </div>
  );
}
