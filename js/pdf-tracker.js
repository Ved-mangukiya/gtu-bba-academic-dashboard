// ============================================================
//  GTU BBA PDF Tracker — PDF Material Manager View Controller
//  Uses App.* helpers to access shared state & utilities
// ============================================================

const PdfTracker = (() => {

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
              ${isDone ? '✓' : ''}
            </button>
            <button class="ck-btn ck-pr ${isPrinted ? 'checked' : ''}" onclick="App.togglePr('${subId}','${uId}','${p.id}')" title="${isPrinted ? 'Mark as Unprinted' : 'Mark as Printed'}">
              🖨️
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
              📎
            </button>
            <button class="icon-btn-sm btn-danger-icon" onclick="App.deletePart('${subId}','${uId}','${p.id}')" title="Delete Part">
              🗑️
            </button>
          </div>
        </div>

        ${hasPdf ? `
          <div class="part-meta-row">
            <div class="pdf-info-chip" onclick="PdfTracker.togglePdfMetaVisibility('${subId}','${uId}','${p.id}')" title="Click to toggle PDF file details">
              <span>📄</span>
              <span class="pdf-name-text">${esc(p.pdfFileName)}</span>
              ${p.pdfPageCount ? `<span class="pdf-pages-badge">${p.pdfPageCount} Pgs</span>` : ''}
              <span class="pdf-toggle-eye">${isMetaShown ? '🙈 Hide' : '👁️ Show'}</span>
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
    const isAllDl = partsCount > 0 && dlCount === partsCount;

    return `
      <div class="unit-card ${u.expanded ? 'open' : ''}" data-unit-id="${u.id}">
        <div class="unit-head" onclick="App.toggleUnit('${subId}','${u.id}')">
          <span class="unit-title">${App.esc(u.name)}</span>
          <div class="unit-actions" onclick="event.stopPropagation()">
            <span class="unit-badge">${dlCount}/${partsCount}</span>
            <button class="btn-xs ${isAllDl ? 'btn-success' : 'btn-ghost'}" onclick="App.markUnitDl('${subId}','${u.id}')">
              ${isAllDl ? '✓ All DL' : 'Mark All DL'}
            </button>
            <button class="btn-xs btn-ghost" onclick="App.addPart('${subId}','${u.id}')">+ Part</button>
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
