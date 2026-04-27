# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite, localhost:5173)
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
```

No test runner or linter is configured.

## Architecture

Single-page React app (Vite) for side-by-side image/PDF/Excel QA comparison.

**Two-panel layout** (`App.jsx`):
- **Left panel ("Brief")** — accepts images and Excel files (.xlsx/.xlsm)
- **Right panel ("Multiple")** — accepts images and PDFs

Each panel is a controlled component: file state and current index live in `App.jsx` and are passed down as props. Arrow-key navigation in `App.jsx` moves the active index for whichever panel has files.

**Compare mode** — clicking Compare opens `CompareOverlay`, a full-screen side-by-side view of the currently selected Brief and Multiple items. Each side supports independent pan (pointer drag) and zoom (scroll wheel). ESC closes the overlay.

**File handling** (`src/components/Panel.jsx`):
- Images → `URL.createObjectURL` → `{ type: 'image', src, file, origSize }`
- PDFs → rendered to PNG data URLs via PDF.js (one item per page) → same image shape
- Excel → parsed to HTML string via SheetJS → `{ type: 'excel', src: htmlString, file, origSize }`

**Third-party libraries loaded via CDN** (not npm) — accessed as globals:
- `window.pdfjsLib` — PDF.js 2.14.305 (pdf rendering)
- `window.EXIF` — exif-js 2.3.0 (reads XResolution/YResolution/ResolutionUnit EXIF tags for DPI display)
- `window.XLSX` — SheetJS 0.18.5 (Excel parsing)

**DPI detection** (`src/utils/imageUtils.js → getImageDPI`): reads EXIF tags via exif-js. Falls back to 72 DPI if tags are absent. ResolutionUnit 2 = inches (DPI as-is), unit 3 = centimeters (multiply by 2.54).

**Transform system**: pan/zoom state (`scale`, `panX`, `panY`) is stored directly on the DOM element as `el._state`. `setTransform` applies `translate(calc(-50% + Xpx), calc(-50% + Ypx)) scale(S)` — the -50% centers the image in its wrapper before offsets are applied.

**`ImageWrapper` component** (`src/components/ImageWrapper.jsx`): exposes `_zoomBy` and `_reset` methods on its `wrapperRef` DOM node so parent `Panel` can call them from toolbar buttons.

**ExcelViewer** renders the HTML string from SheetJS inside an iframe or scrollable div (see `src/components/ExcelViewer.jsx`).
