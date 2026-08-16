// ============================================================
//  GTU BBA PDF Tracker — Materials & PDF Attachment Controller
//  Uses App.* helpers to access shared state & utilities
//  Clean Minimal UI with SVG Icons
// ============================================================

const PdfTracker = (() => {

  const SVG = {
    check: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    printer: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>`,
    clip: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>`,
    trash: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    fileDoc: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
    eyeShow: `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    eyeHide: `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`,
    plus: `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    gDrive: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
    externalLink: `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`
  };

  function openAttachModal(subId, unitId, partId) {
    const { s, u, p } = App.find(subId, unitId, partId);
    if (!p || !s || !u) return;

    const modal = document.getElementById('attachPdfModal');
    if (!modal) return;

    const elSubId = document.getElementById('attachSubId');
    const elUnitId = document.getElementById('attachUnitId');
    const elPartId = document.getElementById('attachPartId');
    const elSubTitle = document.getElementById('attachPdfSubtitle');
    const elDriveUrl = document.getElementById('attachDriveUrl');
    const elPdfName = document.getElementById('attachPdfName');
    const elPdfPages = document.getElementById('attachPdfPages');
    const elBtnRemove = document.getElementById('btnRemoveAttachment');

    if (elSubId) elSubId.value = subId;
    if (elUnitId) elUnitId.value = unitId;
    if (elPartId) elPartId.value = partId;

    if (elSubTitle) {
      elSubTitle.textContent = `${s.name} · Unit ${u.number || 1} Part ${p.number || 1}`;
    }

    if (elDriveUrl) elDriveUrl.value = p.pdfDriveUrl || '';
    if (elPdfName) {
      elPdfName.value = p.pdfFileName || `${s.name} - Unit ${u.number || 1} Notes.pdf`;
    }
    if (elPdfPages) {
      elPdfPages.value = (p.pdfPageCount !== null && p.pdfPageCount !== undefined) ? p.pdfPageCount : '';
    }

    if (elBtnRemove) {
      elBtnRemove.style.display = (p.pdfDriveUrl || p.pdfFileName) ? 'inline-block' : 'none';
    }

    modal.classList.add('show');
    if (elDriveUrl) {
      setTimeout(() => elDriveUrl.focus(), 100);
    }
  }

  async function handleModalFileScan(input) {
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    const meta = await PdfMeta.extractMeta(file);
    if (!meta) return;

    const elPdfName = document.getElementById('attachPdfName');
    const elPdfPages = document.getElementById('attachPdfPages');

    if (elPdfName && meta.fileName) {
      elPdfName.value = meta.fileName;
    }
    if (elPdfPages && meta.pageCount) {
      elPdfPages.value = meta.pageCount;
    }
    App.toast(`Detected: ${meta.fileName} (${meta.pageCount || '?'} Pages)`);
  }

  function submitSaveAttachment() {
    const elSubId = document.getElementById('attachSubId');
    const elUnitId = document.getElementById('attachUnitId');
    const elPartId = document.getElementById('attachPartId');
    if (!elSubId || !elUnitId || !elPartId) return;

    const subId = elSubId.value;
    const unitId = elUnitId.value;
    const partId = elPartId.value;
    const { p } = App.find(subId, unitId, partId);
    if (!p) return;

    const elDriveUrl = document.getElementById('attachDriveUrl');
    const elPdfName = document.getElementById('attachPdfName');
    const elPdfPages = document.getElementById('attachPdfPages');

    const rawUrl = elDriveUrl ? elDriveUrl.value.trim() : '';
    const rawName = elPdfName ? elPdfName.value.trim() : '';
    const rawPages = elPdfPages ? parseInt(elPdfPages.value) : null;

    if (!rawUrl && !rawName) {
      App.toast('Please enter a Google Drive link or PDF title', true);
      return;
    }

    let finalUrl = rawUrl;
    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    p.pdfDriveUrl = finalUrl;
    p.pdfFileName = rawName || (finalUrl ? 'Google Drive PDF' : '');
    p.pdfPageCount = (!isNaN(rawPages) && rawPages > 0) ? rawPages : null;

    App.persist();
    App.render();
    App.closeModal('attachPdfModal');
    App.toast(`Saved study material for ${p.name}`);
  }

  function submitRemoveAttachment() {
    const elSubId = document.getElementById('attachSubId');
    const elUnitId = document.getElementById('attachUnitId');
    const elPartId = document.getElementById('attachPartId');
    if (!elSubId || !elUnitId || !elPartId) return;

    const subId = elSubId.value;
    const unitId = elUnitId.value;
    const partId = elPartId.value;
    const { p } = App.find(subId, unitId, partId);
    if (!p) return;

    p.pdfFileName = '';
    p.pdfDriveUrl = '';
    p.pdfPageCount = null;
    p.showPdfMeta = false;

    App.persist();
    App.render();
    App.closeModal('attachPdfModal');
    App.toast('Attachment removed');
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
    p.pdfDriveUrl = '';
    p.pdfPageCount = null;
    p.showPdfMeta = false;
    App.persist();
    App.render();
    App.toast('Attachment removed');
  }

  function renderPart(subId, uId, p, ci) {
    const esc = App.esc;
    const isDone = !!p.downloaded;
    const isPrinted = !!p.printed;
    const hasPdf = !!p.pdfFileName;
    const hasDrive = !!p.pdfDriveUrl;
    const isAttached = hasPdf || hasDrive;

    return `
      <div class="part-card ${isDone ? 'done' : ''} ${isPrinted ? 'printed' : ''}" data-part-id="${p.id}">
        <div class="part-main-row">
          <div class="part-left-group">
            <div class="part-check-group">
              <button class="ck-btn ck-dl ${isDone ? 'checked' : ''}" onclick="App.toggleDl('${subId}','${uId}','${p.id}')" title="${isDone ? 'Downloaded · Tap to unmark' : 'Mark as Downloaded'}" aria-label="Toggle Download Status">
                ${isDone ? SVG.check : ''}
              </button>
              <button class="ck-btn ck-pr ${isPrinted ? 'checked' : ''}" onclick="App.togglePr('${subId}','${uId}','${p.id}')" title="${isPrinted ? 'Printed · Tap to unmark' : 'Mark as Printed'}" aria-label="Toggle Print Status">
                ${SVG.printer}
              </button>
            </div>

            <div class="part-title-group">
              <span class="part-seq-badge">P${p.number || 1}</span>
              <span class="part-name editable" contenteditable="true"
                    onfocus="this.dataset.prev=this.textContent"
                    onblur="App.editPartName('${subId}','${uId}','${p.id}',this)"
                    onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}">${esc(p.name)}</span>
            </div>
          </div>

          <div class="part-actions">
            ${!isAttached ? `
              <button class="btn-attach-pill" onclick="PdfTracker.openAttachModal('${subId}','${uId}','${p.id}')" title="Attach Google Drive PDF or notes">
                <span class="attach-pill-icon">${SVG.clip}</span>
                <span>Attach PDF</span>
              </button>
            ` : ''}
            <button class="icon-btn-sm btn-danger-icon" onclick="App.deletePart('${subId}','${uId}','${p.id}')" title="Delete Part" aria-label="Delete Part">
              ${SVG.trash}
            </button>
          </div>
        </div>

        ${isAttached ? `
          <div class="part-attachment-bar">
            <div class="part-attachment-info" onclick="PdfTracker.openAttachModal('${subId}','${uId}','${p.id}')" title="Click to edit attachment details">
              <span class="attachment-file-icon">${SVG.fileDoc}</span>
              <div class="attachment-text-col">
                <span class="attachment-filename">${esc(p.pdfFileName || 'Study Notes PDF')}</span>
                ${p.pdfPageCount ? `<span class="attachment-pages-tag">${p.pdfPageCount} Pages</span>` : ''}
              </div>
            </div>

            <div class="part-attachment-actions">
              ${hasDrive ? `
                <a href="${esc(p.pdfDriveUrl)}" target="_blank" rel="noopener noreferrer" class="btn-view-pdf" title="Open PDF in new tab" onclick="event.stopPropagation()">
                  <span class="btn-view-pdf-icon">${SVG.fileDoc}</span>
                  <span>View PDF</span>
                  <span class="btn-view-pdf-ext">${SVG.externalLink}</span>
                </a>
              ` : ''}
              <button class="btn-edit-pdf-inline" onclick="PdfTracker.openAttachModal('${subId}','${uId}','${p.id}')" title="Edit attachment link or details">
                ✏️ Edit
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderUnit(subId, u, ci, s) {
    const parts = (u.parts || []).slice().sort((a, b) => (a.number || 0) - (b.number || 0));
    const partsCount = parts.length;
    const dlCount = parts.filter(p => p.downloaded).length;

    return `
      <div class="unit-card ${u.expanded ? 'open' : ''}" data-unit-id="${u.id}">
        <div class="unit-head" onclick="App.toggleUnit('${subId}','${u.id}')">
          <div class="unit-title-wrap">
            <span class="unit-num-tag">Unit ${u.number || 1}</span>
            <span class="unit-title-text">${App.esc(u.name)}</span>
          </div>
          <div class="unit-actions" onclick="event.stopPropagation()">
            <span class="unit-badge" title="${dlCount} of ${partsCount} parts downloaded">${dlCount}/${partsCount} DL</span>
            <button class="btn btn-ghost btn-xs" onclick="App.addPart('${subId}','${u.id}')" title="Add Part to Unit">
              ${SVG.plus} Part
            </button>
          </div>
        </div>
        <div class="unit-body">
          <div class="unit-inner">
            ${parts.map(p => renderPart(subId, u.id, p, ci, u)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  return {
    openAttachModal,
    handleModalFileScan,
    submitSaveAttachment,
    submitRemoveAttachment,
    togglePdfMetaVisibility,
    removePdfMeta,
    renderPart,
    renderUnit
  };
})();

if (typeof window !== 'undefined') {
  window.PdfTracker = PdfTracker;
}
