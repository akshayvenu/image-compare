export async function renderPdfToImages(file) {
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) throw new Error('PDF.js not loaded');

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';

  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/png');
    pages.push({ type: 'image', src: dataUrl, file: null, origSize: file.size, page: p });
  }

  return pages;
}

export async function extractPdfMetadata(file) {
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) throw new Error('PDF.js not loaded');

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';

  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  // PDF version
  const pdfVersion = pdf._pdfInfo?.version ? `PDF ${pdf._pdfInfo.version}` : '—';

  // Page count
  const pageCount = pdf.numPages;

  // Get first page for dimensions
  const page1 = await pdf.getPage(1);
  const vp = page1.getViewport({ scale: 1 });
  const widthMm = (vp.width * 0.352778).toFixed(1);
  const heightMm = (vp.height * 0.352778).toFixed(1);

  // Try to get page annotations for box info (TrimBox, BleedBox, CropBox)
  let trimBox = '—';
  let bleedBox = '—';
  let cropBox = '—';

  try {
    const pdfPage = await pdf.getPage(1);
    const dict = pdfPage.pageDict;

    if (dict && dict.get) {
      const mediaBox = dict.get('MediaBox');
      const trimboxVal = dict.get('TrimBox');
      const bleedboxVal = dict.get('BleedBox');
      const cropboxVal = dict.get('CropBox');

      if (trimboxVal) {
        const [x1, y1, x2, y2] = trimboxVal;
        const w = ((x2 - x1) * 0.352778).toFixed(1);
        const h = ((y2 - y1) * 0.352778).toFixed(1);
        trimBox = `${w} × ${h} mm`;
      }
      if (bleedboxVal) {
        const [x1, y1, x2, y2] = bleedboxVal;
        const w = ((x2 - x1) * 0.352778).toFixed(1);
        const h = ((y2 - y1) * 0.352778).toFixed(1);
        bleedBox = `${w} × ${h} mm`;
      }
      if (cropboxVal) {
        const [x1, y1, x2, y2] = cropboxVal;
        const w = ((x2 - x1) * 0.352778).toFixed(1);
        const h = ((y2 - y1) * 0.352778).toFixed(1);
        cropBox = `${w} × ${h} mm`;
      }
    }
  } catch (err) {
    console.warn('Could not extract PDF box info:', err);
  }

  return {
    pdfVersion,
    pageCount,
    widthMm,
    heightMm,
    trimBox,
    bleedBox,
    cropBox,
    simulationProfile: '—',
    resolution: '300 DPI',
    tac: null,
    fileName: file.name,
    fileSize: file.size,
  };
}
