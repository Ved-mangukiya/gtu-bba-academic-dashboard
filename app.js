// ============================================================
//  GTU BBA PDF Tracker — Application Logic
//  Units are fixed. Parts can be added/removed freely.
//  Fully synced with Firebase Cloud Storage.
// ============================================================

const App = (() => {

  // ── State ──────────────────────────────────────────────
  let data = loadData() || getDefaultData();
  let filter = 'all';
  let search = '';

  // ── Helpers ────────────────────────────────────────────
  function esc(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  function find(subId, unitId, partId) {
    const s = data.subjects.find(x => x.id === subId);
    if (!s) return {};
    const u = unitId ? s.units.find(x => x.id === unitId) : null;
    const p = (u && partId) ? u.parts.find(x => x.id === partId) : null;
    return { s, u, p };
  }

  function persist() {
    Cloud.save(data);
  }

  // ── Stats ──────────────────────────────────────────────
  function updateStats() {
    let total = 0, dl = 0, pr = 0;
    data.subjects.forEach(s => s.units.forEach(u => u.parts.forEach(p => {
      total++;
      if (p.downloaded) dl++;
      if (p.printed)    pr++;
    })));
    const pending = total - dl;
    const pct = total ? Math.round((dl / total) * 100) : 0;

    document.getElementById('statTotal').textContent      = total;
    document.getElementById('statDownloaded').textContent  = dl;
    document.getElementById('statPrinted').textContent     = pr;
    document.getElementById('statPending').textContent     = pending;
    document.getElementById('progressPct').textContent     = pct + '%';
    document.getElementById('progressFill').style.width    = pct + '%';
  }

  // ── Chevron SVG ────────────────────────────────────────
  const chevSvg = `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>`;

  // ── Render ─────────────────────────────────────────────
  function render() {
    updateStats();

    const container = document.getElementById('subjectsContainer');
    const emptyEl   = document.getElementById('emptyState');
    const term      = search.toLowerCase().trim();

    // Build filtered view
    const filtered = data.subjects.map(s => {
      const sMatch = !term || s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term);

      const units = s.units.map(u => {
        const uMatch = !term || u.name.toLowerCase().includes(term) || sMatch;

        const parts = u.parts.filter(p => {
          const pMatch = !term || p.name.toLowerCase().includes(term) || uMatch;
          let fMatch = true;
          if (filter === 'pending')     fMatch = !p.downloaded;
          else if (filter === 'downloaded') fMatch = p.downloaded;
          else if (filter === 'printed')    fMatch = p.printed;
          return pMatch && fMatch;
        });

        return parts.length ? { ...u, parts } : null;
      }).filter(Boolean);

      return units.length ? { ...s, units } : null;
    }).filter(Boolean);

    if (!filtered.length) {
      container.innerHTML = '';
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';

    container.innerHTML = filtered.map((s, si) => {
      const orig = data.subjects.find(o => o.id === s.id);
      const ci   = orig.colorIndex % 8;

      // Subject-level progress (from original, not filtered)
      let stotal = 0, sdl = 0;
      orig.units.forEach(u => u.parts.forEach(p => { stotal++; if (p.downloaded) sdl++; }));
      const spct = stotal ? Math.round((sdl / stotal) * 100) : 0;

      return `
        <div class="subject-card ${orig.expanded ? 'open' : ''}" data-id="${s.id}" style="animation-delay:${si * 40}ms">
          <div class="subject-head" onclick="App.toggleSubject('${s.id}')">
            <div class="subject-dot dot-${ci}"></div>
            <div class="subject-info">
              <div class="subject-name editable" contenteditable="true"
                   onfocus="this.dataset.prev=this.textContent"
                   onblur="App.editSubjectName('${s.id}',this)"
                   onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}">${esc(orig.name)}</div>
              <div class="subject-code">${esc(orig.code)}</div>
            </div>
            <div class="subject-mini-progress">
              <div class="mini-track"><div class="mini-fill fill-${ci}" style="width:${spct}%"></div></div>
              <span class="mini-pct">${spct}%</span>
            </div>
            <button class="subject-del" onclick="event.stopPropagation();App.deleteSubject('${s.id}')" title="Delete">✕</button>
            <span class="chevron">${chevSvg}</span>
          </div>
          <div class="subject-body">
            <div class="subject-inner">
              ${s.units.map(u => renderUnit(s.id, u, ci, orig)).join('')}
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function renderUnit(subId, u, ci, origSubject) {
    const origUnit = origSubject.units.find(x => x.id === u.id);
    const isOpen   = origUnit ? origUnit.expanded : false;

    return `
      <div class="unit ${isOpen ? 'open' : ''}" data-uid="${u.id}">
        <div class="unit-head" onclick="App.toggleUnit('${subId}','${u.id}')">
          <span class="unit-tag tag-${ci}">U${origUnit ? origUnit.number : u.number}</span>
          <span class="unit-name editable" contenteditable="true"
                onfocus="this.dataset.prev=this.textContent"
                onblur="App.editUnitName('${subId}','${u.id}',this)"
                onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"
                onclick="event.stopPropagation()">${esc(origUnit ? origUnit.name : u.name)}</span>
          <span class="unit-chev">${chevSvg}</span>
        </div>
        <div class="unit-body">
          <div class="unit-inner">
            ${u.parts.map(p => renderPart(subId, u.id, p)).join('')}
            <button class="add-part" onclick="App.addPart('${subId}','${u.id}')">+ Add Part</button>
          </div>
        </div>
      </div>`;
  }

  function renderPart(subId, unitId, p) {
    const done = p.downloaded && p.printed;
    return `
      <div class="part ${done ? 'done' : ''}">
        <span class="part-tag">P${p.number}</span>
        <span class="part-name editable" contenteditable="true"
              onfocus="this.dataset.prev=this.textContent"
              onblur="App.editPartName('${subId}','${unitId}','${p.id}',this)"
              onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}">${esc(p.name)}</span>
        <div class="part-checks">
          <button class="ck ck-dl ${p.downloaded ? 'on' : ''}"
                  onclick="App.toggleDl('${subId}','${unitId}','${p.id}')" title="${p.downloaded ? 'Downloaded ✓' : 'Mark Downloaded'}">⬇</button>
          <button class="ck ck-pr ${p.printed ? 'on' : ''}"
                  onclick="App.togglePr('${subId}','${unitId}','${p.id}')" title="${p.printed ? 'Printed ✓' : 'Mark Printed'}">🖨</button>
        </div>
        <button class="part-del" onclick="App.deletePart('${subId}','${unitId}','${p.id}')" title="Delete">✕</button>
      </div>`;
  }

  // ── Toggle expand ──────────────────────────────────────
  function toggleSubject(id) {
    const s = data.subjects.find(x => x.id === id);
    if (s) { s.expanded = !s.expanded; persist(); render(); }
  }

  function toggleUnit(subId, unitId) {
    const { u } = find(subId, unitId);
    if (u) { u.expanded = !u.expanded; persist(); render(); }
  }

  // ── Checkbox toggles ──────────────────────────────────
  function toggleDl(subId, unitId, partId) {
    const { p } = find(subId, unitId, partId);
    if (!p) return;
    p.downloaded = !p.downloaded;
    if (!p.downloaded) p.printed = false;
    persist(); render();
  }

  function togglePr(subId, unitId, partId) {
    const { p } = find(subId, unitId, partId);
    if (!p) return;
    p.printed = !p.printed;
    if (p.printed) p.downloaded = true;
    persist(); render();
  }

  // ── Inline editing ─────────────────────────────────────
  function editSubjectName(id, el) {
    const v = el.textContent.trim();
    if (!v) { el.textContent = el.dataset.prev; return; }
    if (v === el.dataset.prev) return;
    const s = data.subjects.find(x => x.id === id);
    if (s) { s.name = v; persist(); toast('Subject renamed'); }
  }

  function editUnitName(subId, unitId, el) {
    const v = el.textContent.trim();
    if (!v) { el.textContent = el.dataset.prev; return; }
    if (v === el.dataset.prev) return;
    const { u } = find(subId, unitId);
    if (u) { u.name = v; persist(); toast('Unit renamed'); }
  }

  function editPartName(subId, unitId, partId, el) {
    const v = el.textContent.trim();
    if (!v) { el.textContent = el.dataset.prev; return; }
    if (v === el.dataset.prev) return;
    const { p } = find(subId, unitId, partId);
    if (p) { p.name = v; persist(); toast('Part renamed'); }
  }

  // ── Add / Delete ───────────────────────────────────────
  function addPart(subId, unitId) {
    const { s, u } = find(subId, unitId);
    if (!u) return;
    const nextNum = u.parts.length ? Math.max(...u.parts.map(p => p.number)) + 1 : 1;
    u.parts.push({
      id: uid(),
      number: nextNum,
      name: `${s.code}-U${u.number}-P${nextNum}`,
      downloaded: false,
      printed: false
    });
    u.expanded = true;
    persist(); render();
    toast('Part added');
  }

  function deletePart(subId, unitId, partId) {
    const { u } = find(subId, unitId);
    if (!u) return;
    u.parts = u.parts.filter(p => p.id !== partId);
    persist(); render();
    toast('Part removed');
  }

  function deleteSubject(id) {
    const s = data.subjects.find(x => x.id === id);
    if (!s) return;
    if (!confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    data.subjects = data.subjects.filter(x => x.id !== id);
    persist(); render();
    toast('Subject deleted');
  }

  // ── Add Subject Modal ──────────────────────────────────
  function openAddSubjectModal() {
    document.getElementById('newSubName').value  = '';
    document.getElementById('newSubCode').value  = '';
    document.getElementById('newSubUnits').value = '5';
    openModal('addSubjectModal');
  }

  function addSubject() {
    const name  = document.getElementById('newSubName').value.trim();
    const code  = document.getElementById('newSubCode').value.trim();
    const uCount = parseInt(document.getElementById('newSubUnits').value) || 5;

    if (!name) { toast('Enter a subject name', true); return; }
    if (!code) { toast('Enter a subject code', true); return; }

    const ci = data.subjects.length % 8;
    const unitNames = [];
    for (let i = 1; i <= uCount; i++) unitNames.push(`Unit ${i}`);

    data.subjects.push({
      id: uid(),
      name,
      code,
      colorIndex: ci,
      expanded: true,
      units: buildUnits(code, unitNames)
    });

    persist(); render();
    closeModal('addSubjectModal');
    toast(`"${name}" added`);
  }

  // ── Modals ─────────────────────────────────────────────
  function openModal(id) { document.getElementById(id).classList.add('show'); }
  function closeModal(id) { document.getElementById(id).classList.remove('show'); }

  // ── Export / Import ────────────────────────────────────
  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `bba_pdf_tracker_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Backup exported');
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!imported.subjects || !Array.isArray(imported.subjects)) throw 0;
        data = imported;
        persist(); render();
        toast('Data imported successfully');
      } catch (_) {
        toast('Invalid JSON file', true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ── Toast ──────────────────────────────────────────────
  function toast(msg, isError) {
    const c = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    if (isError) t.style.background = '#d46060';
    c.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.remove(); }, 3000);
  }

  // ── Event Bindings ─────────────────────────────────────
  // Search
  document.getElementById('searchInput').addEventListener('input', e => {
    search = e.target.value;
    render();
  });

  // Filters
  document.getElementById('filters').addEventListener('click', e => {
    if (!e.target.classList.contains('pill')) return;
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');
    filter = e.target.dataset.filter;
    render();
  });

  // Close modals on overlay click
  document.querySelectorAll('.overlay').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('show'); });
  });

  // ESC to close modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.overlay.show').forEach(m => m.classList.remove('show'));
  });

  // Prevent newline in contenteditable
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.classList.contains('editable')) {
      e.preventDefault();
      e.target.blur();
    }
  });

  // ── Initialize Cloud Sync ──────────────────────────────
  render();
  Cloud.init((newCloudData) => {
    data = newCloudData;
    saveData(data); // update local cache
    render();
  });

  // ── Public API ─────────────────────────────────────────
  return {
    toggleSubject,
    toggleUnit,
    toggleDl,
    togglePr,
    editSubjectName,
    editUnitName,
    editPartName,
    addPart,
    deletePart,
    deleteSubject,
    openAddSubjectModal,
    addSubject,
    openModal,
    closeModal,
    exportData,
    importData
  };

})();
