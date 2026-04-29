function ensurePdfJs() {
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) throw new Error('PDF.js not loaded');
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';
  return pdfjsLib;
}

export async function renderPdfToImages(file) {
  const pdfjsLib = ensurePdfJs();

  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  const meta = await extractMetaFromPdf(pdf, file);
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
    pages.push({
      type: 'image',
      src: dataUrl,
      file: null,
      sourceFile: file,
      pdfMeta: meta,
      origSize: file.size,
      page: p,
      isPdfPage: true,
    });
  }

  return pages;
}

export async function extractPdfMetadata(file) {
  const pdfjsLib = ensurePdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  return extractMetaFromPdf(pdf, file);
}

async function extractMetaFromPdf(pdf, file) {
  const pdfVersion = pdf._pdfInfo?.version ? `PDF ${pdf._pdfInfo.version}` : '—';
  const pageCount = pdf.numPages;

  const page1 = await pdf.getPage(1);
  const vp = page1.getViewport({ scale: 1 });
  const widthMm = (vp.width * 0.352778).toFixed(1);
  const heightMm = (vp.height * 0.352778).toFixed(1);

  let trimBox = '—';
  let bleedBox = '—';
  let cropBox = '—';

  try {
    const dict = page1.pageDict;

    if (dict && dict.get) {
      const trimboxVal = dict.get('TrimBox');
      const bleedboxVal = dict.get('BleedBox');
      const cropboxVal = dict.get('CropBox');

      const formatBox = (box) => {
        if (!box || box.length !== 4) return null;
        const [x1, y1, x2, y2] = box;
        const w = ((x2 - x1) * 0.352778).toFixed(0);
        const h = ((y2 - y1) * 0.352778).toFixed(0);
        return `${w} × ${h} mm`;
      };

      trimBox = formatBox(trimboxVal) || '—';
      bleedBox = formatBox(bleedboxVal) || '—';
      cropBox = formatBox(cropboxVal) || '—';
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
