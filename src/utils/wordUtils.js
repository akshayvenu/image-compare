export async function parseWordToHTML(file) {
  const mammoth = window.mammoth;
  if (!mammoth) throw new Error('mammoth.js not loaded');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value || '<p>(empty document)</p>';
}
