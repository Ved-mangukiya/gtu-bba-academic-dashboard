// ============================================================
//  GTU BBA PDF Tracker — PDF Material Manager View Controller
//  Uses App.* helpers to access shared state & utilities
//  Clean UI & Vector SVG Icons for high-contrast crisp look
// ============================================================

const PdfTracker = (() => {

  const SVG = {
    check: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    download: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
    printer: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>`,
    clip: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>`,
    trash: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    fileDoc: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
    eyeShow: `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    eyeHide: `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`,
    plus: `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`
  };

  async function handlePdfFileSelect(subId, unitId, partId, fileInput) {
    if (!fileInput || !fileInput.files || !fileInput.files[0]) return;
    const file = fileInput.files[0];

    const meta = await PdfMeta.extractMeta(file);
    if (!meta) return;

    const { p } = App.find(subId, unitId, partId);
    if (!p) return;

    p.pdfFileName = meta.fileName || file.name;
    p.pdfPageCount = meta.pageCount;
    p.showPdfMeta = false;

    App.persist();
    App.render();

    const pageMsg = meta.pageCount ? ` (${meta.pageCount} Pages)` : '';
    App.toast(`Attached PDF: ${meta.fileName}${pageMsg}`);
  }

  function togglePdfMetaVisibility(subId, unitId, partId) {
    const { p } = App.find(subId, unitId, partId);
    if (!p) return;
    p.showPdfMeta = !p.showPdfMeta;
    App.persist();
    App.render();
  }

  function removePdfMeta(subId, unitId, partId) {
    const { p } = App.find(subId, unitId, partId);
    if (!p) return;
    p.pdfFileName = '';
    p.pdfPageCount = null;
    p.showPdfMeta = false;
    App.persist();
    App.render();
    App.toast('PDF attachment details removed');
  }

  function renderPart(subId, uId, p, ci) {
    const esc = App.esc;
    const isDone = p.downloaded;
    const isPrinted = p.printed;
    const hasPdf = !!p.pdfFileName;
    const isMetaShown = !!p.showPdfMeta;

    return `
      <div class="part-card ${isDone ? 'done' : ''} ${isPrinted ? 'printed' : ''}" data-part-id="${p.id}">
        <div class="part-main-row">
          <div class="part-check-group">
            <button class="ck-btn ck-dl ${isDone ? 'checked' : ''}" onclick="App.toggleDl('${subId}','${uId}','${p.id}')" title="${isDone ? 'Mark as Pending' : 'Mark as Downloaded'}">
              ${isDone ? SVG.check : ''}
            </button>
            <button class="ck-btn ck-pr ${isPrinted ? 'checked' : ''}" onclick="App.togglePr('${subId}','${uId}','${p.id}')" title="${isPrinted ? 'Mark as Unprinted' : 'Mark as Printed'}">
              ${SVG.printer}
            </button>
          </div>

          <div class="part-title-group">
            <span class="part-name editable" contenteditable="true"
                  onfocus="this.dataset.prev=this.textContent"
                  onblur="App.editPartName('${subId}','${uId}','${p.id}',this)"
                  onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}">${esc(p.name)}</span>
          </div>

          <div class="part-actions">
            <input type="file" id="pdfFileInput_${p.id}" accept=".pdf" style="display:none"
                   onchange="PdfTracker.handlePdfFileSelect('${subId}','${uId}','${p.id}', this)" />
            <button class="icon-btn-sm" onclick="document.getElementById('pdfFileInput_${p.id}').click()" title="Attach PDF for filename & page count">
              ${SVG.clip}
            </button>
            <button class="icon-btn-sm btn-danger-icon" onclick="App.deletePart('${subId}','${uId}','${p.id}')" title="Delete Part">
              ${SVG.trash}
            </button>
          </div>
        </div>

        ${hasPdf ? `
          <div class="part-meta-row">
            <div class="pdf-info-chip" onclick="PdfTracker.togglePdfMetaVisibility('${subId}','${uId}','${p.id}')" title="Click to toggle PDF file details">
              <span class="pdf-chip-icon">${SVG.fileDoc}</span>
              <span class="pdf-name-text">${esc(p.pdfFileName)}</span>
              ${p.pdfPageCount ? `<span class="pdf-pages-badge">${p.pdfPageCount} Pgs</span>` : ''}
              <span class="pdf-toggle-eye">${isMetaShown ? `${SVG.eyeHide} Hide` : `${SVG.eyeShow} Show`}</span>
            </div>
          </div>
          <div class="pdf-detail-card ${isMetaShown ? 'show' : ''}">
            <div class="pdf-meta-item">
              <span class="pdf-meta-label">PDF File Name:</span>
              <span class="pdf-meta-val">${esc(p.pdfFileName)}</span>
            </div>
            <div class="pdf-meta-item">
              <span class="pdf-meta-label">Total Pages:</span>
              <span class="pdf-meta-val">${p.pdfPageCount ? `${p.pdfPageCount} Pages` : 'Unknown / Unscanned'}</span>
            </div>
            <div class="pdf-meta-item" style="margin-top: 4px;">
              <button class="btn btn-ghost btn-sm btn-danger-text" onclick="PdfTracker.removePdfMeta('${subId}','${uId}','${p.id}')">
                Remove PDF Meta
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderUnit(subId, u, ci, s) {
    const partsCount = u.parts ? u.parts.length : 0;
    const dlCount = u.parts ? u.parts.filter(p => p.downloaded).length : 0;

    return `
      <div class="unit-card ${u.expanded ? 'open' : ''}" data-unit-id="${u.id}">
        <div class="unit-head" onclick="App.toggleUnit('${subId}','${u.id}')">
          <div class="unit-title-wrap">
            <span class="unit-num-tag">Unit ${u.number || 1}</span>
            <span class="unit-title-text">${App.esc(u.name)}</span>
          </div>
          <div class="unit-actions" onclick="event.stopPropagation()">
            <span class="unit-badge" title="${dlCount} of ${partsCount} parts downloaded">${dlCount}/${partsCount} DL</span>
            <button class="btn-xs btn-ghost" onclick="App.addPart('${subId}','${u.id}')" title="Add Part">
              ${SVG.plus} Part
            </button>
          </div>
        </div>
        <div class="unit-body">
          <div class="unit-inner">
            ${u.parts ? u.parts.map(p => renderPart(subId, u.id, p, ci)).join('') : ''}
          </div>
        </div>
      </div>
    `;
  }

  return {
    handlePdfFileSelect,
    togglePdfMetaVisibility,
    removePdfMeta,
    renderPart,
    renderUnit
  };
})();

if (typeof window !== 'undefined') {
  window.PdfTracker = PdfTracker;
}
