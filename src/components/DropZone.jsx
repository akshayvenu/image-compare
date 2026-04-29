import { useRef, forwardRef, useImperativeHandle } from 'react';

const DropZone = forwardRef(function DropZone(
  { accept, multiple, label, hint, onFiles, className = '' },
  ref
) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    open: () => inputRef.current?.click(),
  }));

  function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('is-dragover');
    onFiles(e.dataTransfer.files);
  }
  function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('is-dragover');
  }
  function handleDragLeave(e) {
    e.currentTarget.classList.remove('is-dragover');
  }
  function handleChange() {
    onFiles(inputRef.current.files);
    inputRef.current.value = '';
  }

  return (
    <>
      <div
        className={`drop-zone ${className}`}
        onClick={() => inputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="drop-zone-text">{label}</div>
        {hint && <div className="drop-zone-hint">{hint}</div>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </>
  );
});

export default DropZone;
