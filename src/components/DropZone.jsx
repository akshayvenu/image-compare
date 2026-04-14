import { useRef } from 'react';

export default function DropZone({ accept, multiple, label, onFiles }) {
  const inputRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.style.background = 'transparent';
    onFiles(e.dataTransfer.files);
  }
  function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.style.background = 'var(--drop-bg)';
  }
  function handleDragLeave(e) {
    e.currentTarget.style.background = 'transparent';
  }
  function handleChange() {
    onFiles(inputRef.current.files);
    inputRef.current.value = '';
  }

  return (
    <>
      <div
        className="drop-zone"
        onClick={() => inputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {label}
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
}
