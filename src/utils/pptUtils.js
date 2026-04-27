let _pptCounter = 0;

export function renderPptIntoElement(file, containerEl) {
  const $ = window.jQuery || window.$;
  if (!$) return Promise.reject(new Error('jQuery is not loaded'));
  if (!$.fn || !$.fn.pptxToHtml) return Promise.reject(new Error('PPTXjs is not loaded'));
  if (!containerEl) return Promise.reject(new Error('No container element'));

  // PPTXjs uses $("#id .slide") selectors internally — the container MUST have an id.
  if (!containerEl.id) {
    containerEl.id = 'pptx-container-' + (++_pptCounter);
  }

  const url = URL.createObjectURL(file);
  containerEl.innerHTML = '';

  return new Promise((resolve) => {
    try {
      $(containerEl).pptxToHtml({
        pptxFileUrl: url,
        slidesScale: '50%',
        slideMode: false,
        keyBoardShortCut: false,
        mediaProcess: true,
      });
    } catch (err) {
      URL.revokeObjectURL(url);
      throw err;
    }

    // PPTXjs has no completion callback — poll for rendered .slide nodes.
    const start = Date.now();
    const timer = setInterval(() => {
      const slides = containerEl.querySelectorAll('.slide');
      if (slides.length > 0 || Date.now() - start > 30000) {
        clearInterval(timer);
        URL.revokeObjectURL(url);
        resolve(slides.length);
      }
    }, 300);
  });
}
