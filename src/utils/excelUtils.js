export function parseExcelToHTML(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Use global XLSX object loaded from CDN
        const XLSX = window.XLSX;
        if (!XLSX) {
          throw new Error('XLSX library not loaded. Please ensure the CDN script is included in index.html');
        }
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const html = workbook.SheetNames.map((name) => {
          const sheet = workbook.Sheets[name];
          const table = XLSX.utils.sheet_to_html(sheet);
          return `<div class="xl-sheet"><div class="xl-sheet-name">${name}</div>${table}</div>`;
        }).join('');
        resolve(html);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
