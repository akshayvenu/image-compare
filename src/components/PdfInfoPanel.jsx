function PdfCard({ label, value, subtitle, badge }) {
  return (
    <div className="pdf-info-card">
      <div className="pdf-info-label">{label}</div>
      <div className="pdf-info-value">{value}</div>
      {subtitle && <div className="pdf-info-subtitle">{subtitle}</div>}
      {badge && (
        <div className={`pdf-info-badge ${badge.type}`}>
          {badge.icon} {badge.text}
        </div>
      )}
    </div>
  );
}

export default function PdfInfoPanel({ metadata, showMore, onToggleMore }) {
  if (!metadata) return null;

  const getTacBadge = (tac) => {
    if (tac === null || tac === undefined) return null;
    if (tac > 300) return { type: 'red', icon: '⚠️', text: 'High' };
    if (tac >= 280) return { type: 'yellow', icon: '⚡', text: 'Caution' };
    return { type: 'green', icon: '✓', text: 'OK' };
  };

  const getResBadge = (res) => {
    if (res === '—') return null;
    const dpi = parseInt(res);
    if (dpi < 300) return { type: 'yellow', icon: '⚠️', text: 'Low' };
    return { type: 'green', icon: '✓', text: 'OK' };
  };

  return (
    <div className="pdf-info-panel">
      <div className="pdf-info-title">
        <span>📋 PDF Preflight</span>
      </div>

      <div className="pdf-info-grid">
        <PdfCard
          label="PDF Version"
          value={metadata.pdfVersion}
          subtitle="file standard"
        />
        <PdfCard
          label="Simulation Profile"
          value={metadata.simulationProfile}
          subtitle="color profile"
        />
        <PdfCard
          label="Resolution"
          value={metadata.resolution}
          subtitle="image quality"
          badge={getResBadge(metadata.resolution)}
        />
        <PdfCard
          label="TrimBox"
          value={metadata.trimBox}
          subtitle="final cut size"
        />
        <PdfCard
          label="BleedBox"
          value={metadata.bleedBox}
          subtitle="bleed area"
        />
        <PdfCard
          label="TAC"
          value={metadata.tac ? `${metadata.tac}%` : '—'}
          subtitle="ink limit check"
          badge={getTacBadge(metadata.tac)}
        />
      </div>

      <div className="pdf-info-toggle" onClick={onToggleMore}>
        {showMore ? '▼' : '▶'} More Details ({metadata.pageCount} page{metadata.pageCount !== 1 ? 's' : ''})
      </div>

      {showMore && (
        <div className="pdf-info-extra">
          <PdfCard
            label="CropBox"
            value={metadata.cropBox}
            subtitle="crop area"
          />
          <PdfCard
            label="Width"
            value={`${metadata.widthMm} mm`}
            subtitle="page width"
          />
          <PdfCard
            label="Height"
            value={`${metadata.heightMm} mm`}
            subtitle="page height"
          />
          <PdfCard
            label="File Size"
            value={formatBytes(metadata.fileSize)}
            subtitle="pdf size"
          />
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let idx = 0;
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024;
    idx++;
  }
  return `${size.toFixed(2)} ${units[idx]}`;
}
