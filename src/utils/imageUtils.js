export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '-';
  const thresh = 1024;
  if (Math.abs(bytes) < thresh) return bytes + ' B';
  const units = ['KB', 'MB', 'GB', 'TB'];
  let u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  // Use Math.ceil to round up to match macOS "on disk" sizing
  const rounded = Math.ceil(bytes * 10) / 10;
  return rounded.toFixed(1) + ' ' + units[u];
}

export function getImageDPI(imgEl, fallbackDPI = 72, cb) {
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
      return cb(fallbackDPI);
    });
  } catch {
    return cb(fallbackDPI);
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
