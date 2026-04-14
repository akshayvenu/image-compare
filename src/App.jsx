import { useState, useEffect, useCallback } from 'react';
import Panel from './components/Panel';
import CompareOverlay from './components/CompareOverlay';
import './App.css';

export default function App() {
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'

  // Brief panel state
  const [briefFiles, setBriefFiles] = useState([]);
  const [briefIndex, setBriefIndex] = useState(-1);

  // Multi panel state
  const [multiFiles, setMultiFiles] = useState([]);
  const [multiIndex, setMultiIndex] = useState(-1);

  // Compare mode
  const [compareOpen, setCompareOpen] = useState(false);

  function toggleTheme() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  }

  // Brief handlers
  function handleBriefAdd(newItems) {
    setBriefFiles(prev => {
      const updated = [...prev, ...newItems];
      if (prev.length === 0) setBriefIndex(0);
      return updated;
    });
  }
  function handleBriefRemove(idx) {
    setBriefFiles(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      if (updated.length === 0) {
        setBriefIndex(-1);
      } else if (briefIndex >= updated.length) {
        setBriefIndex(updated.length - 1);
      }
      return updated;
    });
  }
  function briefNext() { setBriefIndex(i => Math.min(i + 1, briefFiles.length - 1)); }
  function briefPrev() { setBriefIndex(i => Math.max(i - 1, 0)); }

  // Multi handlers
  function handleMultiAdd(newItems) {
    setMultiFiles(prev => {
      const updated = [...prev, ...newItems];
      if (prev.length === 0) setMultiIndex(0);
      return updated;
    });
  }
  function handleMultiRemove(idx) {
    setMultiFiles(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      if (updated.length === 0) {
        setMultiIndex(-1);
      } else if (multiIndex >= updated.length) {
        setMultiIndex(updated.length - 1);
      }
      return updated;
    });
  }
  function multiNext() { setMultiIndex(i => Math.min(i + 1, multiFiles.length - 1)); }
  function multiPrev() { setMultiIndex(i => Math.max(i - 1, 0)); }

  // Compare
  function enterCompare() {
    if (briefIndex < 0 || briefIndex >= briefFiles.length) {
      alert('Load Brief images and select one to compare.');
      return;
    }
    if (multiIndex < 0 || multiIndex >= multiFiles.length) {
      alert('Load Multi files and select one to compare.');
      return;
    }
    setCompareOpen(true);
  }

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (compareOpen) {
      if (e.key === 'Escape') setCompareOpen(false);
      return;
    }
    if (e.key === 'ArrowRight') {
      if (multiFiles.length) multiNext();
      else briefNext();
    }
    if (e.key === 'ArrowLeft') {
      if (multiFiles.length) multiPrev();
      else briefPrev();
    }
  }, [compareOpen, multiFiles.length, briefFiles.length, multiIndex, briefIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent default drag on images
  useEffect(() => {
    function block(e) {
      if (e.target?.tagName === 'IMG') e.preventDefault();
    }
    document.addEventListener('dragstart', block);
    return () => document.removeEventListener('dragstart', block);
  }, []);

  return (
    <div className={theme === 'light' ? 'light' : ''}>
      <div id="appTitle">Image Compare by Aryan</div>
      <button id="themeToggle" onClick={toggleTheme}>{theme === 'dark' ? '☀️ Light' : '🌙 Dark'}</button>

      <div className="container" id="normalMode">
        <Panel
          title="Brief — Images (multiple)"
          acceptPdf={false}
          files={briefFiles}
          index={briefIndex}
          onFilesAdd={handleBriefAdd}
          onFileRemove={handleBriefRemove}
          onNext={briefNext}
          onPrev={briefPrev}
        />
        <Panel
          title="Multiple — Images + PDF (pages)"
          acceptPdf={true}
          files={multiFiles}
          index={multiIndex}
          onFilesAdd={handleMultiAdd}
          onFileRemove={handleMultiRemove}
          onNext={multiNext}
          onPrev={multiPrev}
          onCompare={enterCompare}
        />
      </div>

      {compareOpen && (
        <CompareOverlay
          briefItem={briefFiles[briefIndex]}
          multiItem={multiFiles[multiIndex]}
          onExit={() => setCompareOpen(false)}
        />
      )}
    </div>
  );
}
