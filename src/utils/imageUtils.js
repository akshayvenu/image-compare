export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '-';
  const thresh = 1000;
  if (Math.abs(bytes) < thresh) return bytes + ' B';
  const units = ['KB', 'MB', 'GB', 'TB'];
  let u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return (Math.round(bytes * 10) / 10).toFixed(1) + ' ' + units[u];
}

export function formatImageDPI(dpi = null) {
  return dpi ? `${dpi} DPI` : 'No DPI metadata';
}

// Read DPI from PNG pHYs chunk (pixels per unit, unit 1 = meter → multiply by 0.0254 for DPI)
async function getPngDPI(file) {
  const buf = await file.arrayBuffer();
  const view = new DataView(buf);
  // PNG signature is 8 bytes, then chunks: 4-len, 4-type, data, 4-crc
  let offset = 8;
  while (offset + 12 <= view.byteLength) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(
      view.getUint8(offset + 4), view.getUint8(offset + 5),
      view.getUint8(offset + 6), view.getUint8(offset + 7)
    );
    if (type === 'pHYs' && length >= 9) {
      const ppuX = view.getUint32(offset + 8);
      const ppuY = view.getUint32(offset + 12);
      const unit = view.getUint8(offset + 16);
      if (unit === 1 && ppuX > 0) {
        // unit = meter; convert to DPI
        const dpiX = Math.round(ppuX * 0.0254);
        const dpiY = Math.round(ppuY * 0.0254);
        return Math.round((dpiX + dpiY) / 2);
      }
      // unit = 0 (unknown/aspect ratio only) — no meaningful DPI
      return null;
    }
    if (type === 'IDAT') break; // pHYs always comes before IDAT
    offset += 12 + length;
  }
  return null;
}

// cb receives a number (DPI) or null (no metadata found)
export function getImageDPI(imgEl, cb, file = null) {
  // For PNG, read pHYs chunk directly — exif-js doesn't handle PNG DPI
  if (file && (file.type === 'image/png' || file.name?.toLowerCase().endsWith('.png'))) {
    getPngDPI(file).then(dpi => cb(dpi)).catch(() => cb(null));
    return;
  }

  // For JPEG and others, use exif-js
  try {
    window.EXIF.getData(imgEl, function () {
      let x = window.EXIF.getTag(this, 'XResolution');
      let y = window.EXIF.getTag(this, 'YResolution');
      let unit = window.EXIF.getTag(this, 'ResolutionUnit');

      function toNumber(r) {
        if (!r) return null;
        if (typeof r === 'number') return r;
        if (r.numerator !== undefined && r.denominator) return r.numerator / r.denominator;
        if (Array.isArray(r) && r.length >= 2) return r[0] / r[1];
        return null;
      }

      const xn = toNumber(x);
      const yn = toNumber(y);
      if (xn && unit) {
        if (unit === 2) return cb(Math.round((xn + (yn || xn)) / (yn ? 2 : 1)));
        if (unit === 3) return cb(Math.round(xn * 2.54));
      }
      if (xn) return cb(Math.round(xn));
      return cb(null);
    });
  } catch {
    return cb(null);
  }
}

export function setTransform(el, panX = 0, panY = 0, scale = 1) {
  el.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${scale})`;
}

export function autoFit(el, wrapper) {
  if (!el || !wrapper) return;
  el.style.maxWidth = wrapper.clientWidth + 'px';
  el.style.maxHeight = wrapper.clientHeight + 'px';
  el._state = { scale: 1, panX: 0, panY: 0 };
  setTransform(el, 0, 0, 1);
}
