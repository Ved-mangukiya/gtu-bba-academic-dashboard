// ============================================================
//  GTU BBA Academic Dashboard — Master Application Facade
//  Coordinates PDF Tracker, Marks Hub, Modals, Theme & Cloud
// ============================================================

const App = (() => {

  // ── State (accessible via App.getData() by other modules) ──
  let loaded = loadData();
  let data = (loaded && Array.isArray(loaded.subjects) && loaded.subjects.length) ? loaded : getDefaultData();
  let filter = 'all';
  let search = '';
  let semFilter = 'all';

  // ── Public data accessor so other modules (MarksHub, PdfTracker) can read data ──
  function getData() { return data; }
  function setData(d) { data = d; }

  // ── Helpers (also exposed globally for sub-modules) ──────
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

  function getVisibleSubjects() {
    const visibleSems = data.settings && Array.isArray(data.settings.visibleSems) && data.settings.visibleSems.length ? data.settings.visibleSems : [1, 2, 3, 4, 5, 6];
    let list = data.subjects.filter(s => {
      const sSem = s.sem || 1;
      const isSemVisible = visibleSems.includes(sSem);
      const isSemMatch = (semFilter === 'all' || sSem === parseInt(semFilter));
      return isSemVisible && isSemMatch;
    });
    if (!list.length && semFilter === 'all' && data.subjects.length) {
      list = data.subjects;
    }
    return list;
  }

  // ── Stats ──────────────────────────────────────────────
  const _statPrev = { total: 0, dl: 0, pr: 0, pending: 0 };

  function animateCount(el, from, to, duration) {
    if (!el) return;
    if (from === to) { el.textContent = to; return; }
    const start = performance.now();
    const diff = to - from;
    function step(now) {
      const elapsed = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      el.textContent = Math.round(from + diff * eased);
      if (elapsed < 1) requestAnimationFrame(step);
      else el.textContent = to;
    }
    requestAnimationFrame(step);
  }

  function updateStats() {
    let total = 0, dl = 0, pr = 0;
    const activeSubjects = getVisibleSubjects();
    activeSubjects.forEach(s => {
      if (s && Array.isArray(s.units)) {
        s.units.forEach(u => {
          if (u && Array.isArray(u.parts)) {
            u.parts.forEach(p => {
              total++;
              if (p.downloaded) dl++;
              if (p.printed) pr++;
            });
          }
        });
      }
    });
    const pending = total - dl;
    const pct = total ? Math.round((dl / total) * 100) : 0;
    const prPct = total ? Math.round((pr / total) * 100) : 0;

    animateCount(document.getElementById('statTotal'), _statPrev.total, total, 500);
    animateCount(document.getElementById('statDownloaded'), _statPrev.dl, dl, 500);
    animateCount(document.getElementById('statPrinted'), _statPrev.pr, pr, 500);
    animateCount(document.getElementById('statPending'), _statPrev.pending, pending, 500);
    _statPrev.total = total; _statPrev.dl = dl; _statPrev.pr = pr; _statPrev.pending = pending;

    const ringFill = document.getElementById('ringFill');
    const ringPct = document.getElementById('progressPct');
    const ringCenter = document.getElementById('ringCenterPct');
    if (ringFill) {
      const circ = 213.6;
      const offset = circ - (pct / 100) * circ;
      ringFill.style.strokeDashoffset = offset;
    }
    if (ringPct) ringPct.textContent = pct + '%';
    if (ringCenter) ringCenter.textContent = pct + '%';

    const fillDl = document.getElementById('progressFill');
    const fillPr = document.getElementById('progressFillPr');
    if (fillDl) fillDl.style.width = pct + '%';
    if (fillPr) fillPr.style.width = prPct + '%';
  }

  const chevSvg = `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>`;

  const SVG_SUBJECT_ICONS = {
    'S1-PPM': `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
    'S1-FA': `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
    'S1-BSL': `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
    'S1-ENG': `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    'S1-IKS': `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M3 7h18M6 7v14M10 7v14M14 7v14M18 7v14M12 3L2 7h20L12 3z"></path></svg>`,
    'S1-ESG': `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`
  };

  function getSubjectIcon(code, ci) {
    if (code && SVG_SUBJECT_ICONS[code.toUpperCase()]) {
      return SVG_SUBJECT_ICONS[code.toUpperCase()];
    }
    const iconMap = {
      'S1-PPM': '💼', 'S1-FA': '💰', 'S1-BSL': '📊', 'S1-ENG': '💬', 'S1-IKS': '🏛️', 'S1-ESG': '🌱'
    };
    if (code && iconMap[code.toUpperCase()]) return iconMap[code.toUpperCase()];
    const fallbackIcons = ['💼', '💰', '📊', '💬', '🏛️', '🌱', '📈', '🎯'];
    return fallbackIcons[ci % fallbackIcons.length];
  }

  function renderSemBar() {
    const bar = document.getElementById('semBar');
    if (!bar) return;
    const existingSems = Array.from(new Set(data.subjects.map(s => s.sem || 1))).sort((a, b) => a - b);
    const visibleSettings = (data.settings && Array.isArray(data.settings.visibleSems) ? data.settings.visibleSems : [1]);
    const activeSems = existingSems.filter(s => visibleSettings.includes(s));

    if (activeSems.length <= 1) { bar.innerHTML = ''; bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    let html = `<button class="sem-tab ${semFilter === 'all' ? 'active' : ''}" onclick="App.setSemFilter('all')">All Sems</button>`;
    activeSems.forEach(sNum => {
      html += `<button class="sem-tab ${semFilter === sNum ? 'active' : ''}" onclick="App.setSemFilter(${sNum})">Sem ${sNum}</button>`;
    });
    bar.innerHTML = html;
  }

  function setSemFilter(sem) {
    semFilter = sem === 'all' ? 'all' : parseInt(sem);
    render();
  }

  function applyTheme() {
    const isDark = data.settings && data.settings.theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.innerHTML = isDark
        ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
        : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    }
  }

  function toggleTheme() {
    if (!data.settings) data.settings = {};
    data.settings.theme = data.settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    persist();
    toast(data.settings.theme === 'dark' ? 'OLED Dark Mode enabled' : 'Light Mode enabled');
  }

  function updateCountdown() {
    const timerEl = document.getElementById('countdownTimer');
    if (!timerEl) return;
    const examDateStr = data.settings ? data.settings.examDate : '';
    if (!examDateStr) { timerEl.textContent = 'No target date set · Click "Set Target Date"'; return; }
    const targetDate = new Date(examDateStr).getTime();
    const now = Date.now();
    const diff = targetDate - now;
    if (diff <= 0) { timerEl.textContent = '🎉 Exam Day is Here! Best of luck!'; return; }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    timerEl.textContent = `${days} Days ${hours}h ${mins}m Remaining`;
  }

  function toggleReadinessView() {
    if (!data.settings) data.settings = {};
    data.settings.hideReadiness = !data.settings.hideReadiness;
    persist();
    renderReadinessGrid();
  }

  function renderReadinessGrid() {
    const section = document.getElementById('semReadinessSection');
    const grid = document.getElementById('readinessGrid');
    const toggleBtn = document.getElementById('btnToggleReadiness');
    if (!grid || !section) return;
    const isHidden = data.settings && data.settings.hideReadiness;
    if (toggleBtn) toggleBtn.textContent = isHidden ? 'Show' : 'Hide';
    grid.style.display = isHidden ? 'none' : 'grid';

    const semMap = {};
    for (let sNum = 1; sNum <= 6; sNum++) semMap[sNum] = { total: 0, dl: 0, pr: 0 };
    if (Array.isArray(data.subjects)) {
      data.subjects.forEach(s => {
        const sem = s.sem || 1;
        if (semMap[sem] && Array.isArray(s.units)) {
          s.units.forEach(u => {
            if (Array.isArray(u.parts)) {
              u.parts.forEach(p => {
                semMap[sem].total++;
                if (p.downloaded) semMap[sem].dl++;
                if (p.printed) semMap[sem].pr++;
              });
            }
          });
        }
      });
    }

    const visibleSems = (data.settings && Array.isArray(data.settings.visibleSems)) ? data.settings.visibleSems : [1, 2, 3, 4, 5, 6];
    grid.innerHTML = visibleSems.map(semNum => {
      const stats = semMap[semNum] || { total: 0, dl: 0, pr: 0 };
      const pct = stats.total ? Math.round((stats.dl / stats.total) * 100) : 0;
      const statusBadge = pct >= 80 ? '🟢 Exam Ready' : pct >= 40 ? '🟡 Progressing' : '🔴 Needs Study';
      return `
        <div class="readiness-card">
          <div class="readiness-card-head">
            <span class="readiness-sem-title">Sem ${semNum}</span>
            <span class="readiness-status-badge">${statusBadge}</span>
          </div>
          <div class="readiness-bar-track">
            <div class="readiness-bar-fill" style="width:${pct}%"></div>
          </div>
          <div class="readiness-card-footer">
            <span>${pct}% Downloaded</span>
            <span>${stats.dl}/${stats.total} Parts</span>
          </div>
        </div>`;
    }).join('');
  }

  // ── Actions ────────────────────────────────────────────
  function toggleDl(subId, unitId, partId) {
    const { p } = find(subId, unitId, partId);
    if (!p) return;
    p.downloaded = !p.downloaded;
    persist(); render();
  }

  function togglePr(subId, unitId, partId) {
    const { p } = find(subId, unitId, partId);
    if (!p) return;
    p.printed = !p.printed;
    persist(); render();
  }

  function markUnitDl(subId, unitId) {
    const { u } = find(subId, unitId);
    if (!u || !Array.isArray(u.parts)) return;
    const allDl = u.parts.every(p => p.downloaded);
    u.parts.forEach(p => { p.downloaded = !allDl; });
    persist(); render();
  }

  function toggleSubject(subId) {
    const s = data.subjects.find(x => x.id === subId);
    if (!s) return;
    s.expanded = !s.expanded;
    persist(); render();
  }

  function toggleUnit(subId, unitId) {
    const { u } = find(subId, unitId);
    if (!u) return;
    u.expanded = !u.expanded;
    persist(); render();
  }

  function addPart(subId, unitId) {
    const { u } = find(subId, unitId);
    if (!u) return;
    const pNum = (u.parts ? u.parts.length : 0) + 1;
    const newPart = {
      id: uid(), number: pNum, name: `Part ${pNum}`,
      downloaded: false, printed: false, priority: 'none', note: '',
      pdfFileName: '', pdfPageCount: null, showPdfMeta: false
    };
    if (!u.parts) u.parts = [];
    u.parts.push(newPart);
    u.expanded = true;
    persist(); render();
    toast('Added new part');
  }

  function deletePart(subId, unitId, partId) {
    const { s, u, p } = find(subId, unitId, partId);
    if (!u || !p) return;
    if (!data.trash) data.trash = [];
    data.trash.unshift({
      id: 'trash_' + uid(), type: 'part', name: p.name,
      payload: JSON.parse(JSON.stringify(p)),
      meta: { subId, unitId, subName: s ? s.name : '', unitName: u ? u.name : '' },
      deletedAt: Date.now()
    });
    u.parts = u.parts.filter(x => x.id !== partId);
    persist(); render();
    toast('Part moved to Recycle Bin');
  }

  function editPartName(subId, unitId, partId, el) {
    const newName = el.textContent.trim();
    const { p } = find(subId, unitId, partId);
    if (!p) return;
    if (newName && newName !== p.name) { p.name = newName; persist(); }
    else { el.textContent = p.name; }
  }

  function editSubjectName(subId, el) {
    const newName = el.textContent.trim();
    const s = data.subjects.find(x => x.id === subId);
    if (!s) return;
    if (newName && newName !== s.name) { s.name = newName; persist(); }
    else { el.textContent = s.name; }
  }

  function switchTab(tabName) {
    if (!data.settings) data.settings = {};
    data.settings.activeTab = tabName;

    const pdfView = document.getElementById('pdfTrackerView');
    const marksView = document.getElementById('marksHubView');
    const btnPdf = document.getElementById('tabPdfBtn');
    const btnMarks = document.getElementById('tabMarksBtn');

    if (tabName === 'marks') {
      if (pdfView) { pdfView.style.display = 'none'; pdfView.classList.remove('active'); }
      if (marksView) { marksView.style.display = 'block'; setTimeout(() => marksView.classList.add('active'), 10); }
      if (btnPdf) btnPdf.classList.remove('active');
      if (btnMarks) btnMarks.classList.add('active');
      MarksHub.renderMarksHub();
    } else {
      if (marksView) { marksView.style.display = 'none'; marksView.classList.remove('active'); }
      if (pdfView) { pdfView.style.display = 'block'; setTimeout(() => pdfView.classList.add('active'), 10); }
      if (btnMarks) btnMarks.classList.remove('active');
      if (btnPdf) btnPdf.classList.add('active');
    }
  }

  function toggleLumpsumMode(subId) {
    const s = data.subjects.find(x => x.id === subId);
    if (!s) return;
    if (!s.marks) s.marks = createDefaultMarks();
    s.marks.isLumpsum = !s.marks.isLumpsum;
    persist();
    MarksHub.renderMarksHub();
    toast(s.marks.isLumpsum ? 'Switched to Lumpsum Internal Mode' : 'Switched to Breakdown Internal Mode');
  }

  function onMarksInput(subId, fieldKey, value) {
    const s = data.subjects.find(x => x.id === subId);
    if (!s) return;
    if (!s.marks) s.marks = createDefaultMarks();
    if (value === '' || value === null || value === undefined) {
      s.marks[fieldKey] = null;
    } else {
      const num = parseFloat(value);
      s.marks[fieldKey] = isNaN(num) ? null : Math.max(0, num);
    }
    persist();
    MarksHub.renderMarksHub();
  }

  function onTargetSpiChange(val) {
    const targetVal = parseFloat(val);
    if (isNaN(targetVal)) return;
    if (!data.settings) data.settings = {};
    data.settings.targetSpi = Math.min(Math.max(targetVal, 4.0), 10.0);
    persist();
    MarksHub.renderTargetBacktracker();
  }

  function resetAllMarks() {
    data.subjects.forEach(s => { s.marks = createDefaultMarks(); });
    persist();
    MarksHub.renderMarksHub();
    toast('All subject marks reset to default');
  }

  // ── Main Render ────────────────────────────────────────
  function render() {
    applyTheme();
    updateCountdown();
    renderReadinessGrid();
    updateStats();
    renderSemBar();

    const activeTab = (data.settings && data.settings.activeTab) ? data.settings.activeTab : 'pdf';
    // Update tab buttons without triggering full switchTab (avoid double renders)
    const pdfView = document.getElementById('pdfTrackerView');
    const marksView = document.getElementById('marksHubView');
    const btnPdf = document.getElementById('tabPdfBtn');
    const btnMarks = document.getElementById('tabMarksBtn');

    if (activeTab === 'marks') {
      if (pdfView) { pdfView.style.display = 'none'; pdfView.classList.remove('active'); }
      if (marksView) { marksView.style.display = 'block'; marksView.classList.add('active'); }
      if (btnPdf) btnPdf.classList.remove('active');
      if (btnMarks) btnMarks.classList.add('active');
      MarksHub.renderMarksHub();
    } else {
      if (marksView) { marksView.style.display = 'none'; marksView.classList.remove('active'); }
      if (pdfView) { pdfView.style.display = 'block'; pdfView.classList.add('active'); }
      if (btnMarks) btnMarks.classList.remove('active');
      if (btnPdf) btnPdf.classList.add('active');
      renderSubjectList();
    }
  }

  function renderSubjectList() {
    const container = document.getElementById('subjectsContainer');
    const emptyEl = document.getElementById('emptyState');
    const term = search.toLowerCase().trim();
    const activeSubjects = getVisibleSubjects();

    const filtered = activeSubjects.map(s => {
      if (!s || !Array.isArray(s.units)) return null;
      const sMatch = !term || s.name.toLowerCase().includes(term) || (s.code && s.code.toLowerCase().includes(term));

      const units = s.units.map(u => {
        if (!u || !Array.isArray(u.parts)) return null;
        const uMatch = !term || u.name.toLowerCase().includes(term) || sMatch;
        const parts = u.parts.filter(p => {
          const pMatch = !term || p.name.toLowerCase().includes(term) || uMatch;
          let fMatch = true;
          if (filter === 'pending') fMatch = !p.downloaded;
          else if (filter === 'downloaded') fMatch = p.downloaded;
          else if (filter === 'printed') fMatch = p.printed;
          return pMatch && fMatch;
        });
        return parts.length ? { ...u, parts } : null;
      }).filter(Boolean);

      return units.length ? { ...s, units } : null;
    }).filter(Boolean);

    if (!filtered.length) {
      if (container) container.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';

    if (container) {
      container.innerHTML = filtered.map((s, si) => {
        try {
        const orig = data.subjects.find(o => o.id === s.id);
        if (!orig) return '';
        const ci = (orig.colorIndex || 0) % 8;

        let stotal = 0, sdl = 0, spr = 0;
        if (orig.units && Array.isArray(orig.units)) {
          orig.units.forEach(u => {
            if (u && Array.isArray(u.parts)) {
              u.parts.forEach(p => { stotal++; if (p.downloaded) sdl++; if (p.printed) spr++; });
            }
          });
        }
        const spct = stotal ? Math.round((sdl / stotal) * 100) : 0;
        const sprPct = stotal ? Math.round((spr / stotal) * 100) : 0;
        const tooltip = `${sdl}/${stotal} downloaded · ${spr} printed`;

        return `
          <div class="subject-card sub-theme-${ci} ${orig.expanded ? 'open' : ''}" data-id="${s.id}" style="animation-delay:${si * 40}ms">
            <div class="subject-head" onclick="App.toggleSubject('${s.id}')">
              <div class="subject-icon-badge">${getSubjectIcon(orig.code, ci)}</div>
              <div class="subject-info">
                <div class="subject-meta">
                  <span class="subject-sem-badge">Sem ${orig.sem || 1}</span>
                  <span class="subject-code-badge">${esc(orig.code)}</span>
                </div>
                <div class="subject-name editable" contenteditable="true"
                     onfocus="this.dataset.prev=this.textContent"
                     onblur="App.editSubjectName('${s.id}',this)"
                     onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}">${esc(orig.name)}</div>
              </div>
              <div class="subject-mini-progress" title="${tooltip}">
                <div class="mini-track">
                  <div class="mini-bar-dl" style="width:${spct}%"></div>
                  <div class="mini-bar-pr" style="width:${sprPct}%"></div>
                </div>
                <span class="mini-pct">${spct}%</span>
              </div>
              <span class="chevron">${chevSvg}</span>
            </div>
            <div class="subject-body">
              <div class="subject-inner">
                ${s.units && Array.isArray(s.units) ? s.units.map(u => {
                  try { return PdfTracker.renderUnit(s.id, u, ci, orig); }
                  catch(e) { console.error('renderUnit error:', e); return ''; }
                }).join('') : ''}
              </div>
            </div>
          </div>`;
        } catch(e) {
          console.error('Subject card render error for', s.id, e);
          return `<div class="subject-card" style="padding:12px;color:red">Error rendering: ${(s.name||s.id)}</div>`;
        }
      }).join('');
    }
  }

  function toast(msg, isError) {
    const c = document.getElementById('toasts');
    if (!c) return;
    const t = document.createElement('div');
    t.className = isError ? 'toast toast-error' : 'toast toast-success';
    t.innerHTML = `<span class="toast-icon">${isError ? '✕' : '✓'}</span><span class="toast-msg">${msg}</span>`;
    c.appendChild(t);
    const delay = 2600;
    setTimeout(() => t.classList.add('toast-out'), delay);
    setTimeout(() => { if (t.parentNode) t.remove(); }, delay + 400);
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
  }

  function openSettingsModal() {
    const m = document.getElementById('settingsModal');
    if (m) m.classList.add('show');
  }

  function openAddSubjectModal() {
    const m = document.getElementById('addSubjectModal');
    if (m) m.classList.add('show');
  }

  function addSubject() {
    const nameEl = document.getElementById('newSubName');
    const codeEl = document.getElementById('newSubCode');
    const semEl = document.getElementById('newSubSem');
    const unitsEl = document.getElementById('newSubUnits');
    const name = nameEl ? nameEl.value.trim() : '';
    const code = codeEl ? codeEl.value.trim().toUpperCase() : '';
    const sem = semEl ? parseInt(semEl.value) : 1;
    const unitCount = unitsEl ? Math.max(1, Math.min(20, parseInt(unitsEl.value) || 5)) : 5;
    if (!name) { toast('Please enter a subject name', true); return; }

    const unitNames = Array.from({ length: unitCount }, (_, i) => `Unit ${i + 1}`);
    const ci = data.subjects.length % 8;
    const newSub = {
      id: uid(), name, code: code || 'S' + sem + '-' + name.substring(0, 3).toUpperCase(),
      sem, credits: 4, maxMarks: 150, maxEse: 70, maxInternal: 30, maxPractical: 50,
      marks: createDefaultMarks(), colorIndex: ci, expanded: false,
      units: buildUnits(code || 'SUBJ', unitNames)
    };
    data.subjects.push(newSub);
    if (!data.settings.visibleSems) data.settings.visibleSems = [1];
    if (!data.settings.visibleSems.includes(sem)) data.settings.visibleSems.push(sem);
    persist(); render();
    closeModal('addSubjectModal');
    toast(`Added: ${name}`);
  }

  function toggleSemVisibility(semNum) {
    if (!data.settings) data.settings = {};
    if (!Array.isArray(data.settings.visibleSems)) data.settings.visibleSems = [1];
    const idx = data.settings.visibleSems.indexOf(semNum);
    if (idx > -1) {
      if (data.settings.visibleSems.length > 1) data.settings.visibleSems.splice(idx, 1);
    } else {
      data.settings.visibleSems.push(semNum);
    }
    persist(); render();
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'gtu-bba-backup-' + Date.now() + '.json';
    a.click(); URL.revokeObjectURL(url);
    toast('Backup exported!');
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        const sanitized = sanitizeData(imported);
        if (!sanitized || !Array.isArray(sanitized.subjects) || !sanitized.subjects.length) {
          toast('Invalid backup file', true); return;
        }
        data = sanitized;
        persist(); render();
        toast('Data imported successfully!');
      } catch (_) { toast('Failed to import — invalid file', true); }
    };
    reader.readAsText(file);
  }

  function resetToSyllabusDefaults() {
    data = getDefaultData();
    persist(); render();
    toast('Reset to GTU BBA Sem 1 syllabus defaults');
  }

  // ── Init: Cloud sync & event listeners ────────────────
  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => { search = e.target.value; renderSubjectList(); });
  }
  // Filter pills
  const filtersEl = document.getElementById('filters');
  if (filtersEl) {
    filtersEl.addEventListener('click', (e) => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      filter = pill.dataset.filter || 'all';
      filtersEl.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderSubjectList();
    });
  }

  // Countdown tick
  setInterval(updateCountdown, 60000);

  // Initial render
  render();

  // Cloud sync — load from Firebase on init, then listen for changes
  Cloud.init((newCloudData) => {
    const sanitized = sanitizeData(newCloudData);
    if (sanitized && Array.isArray(sanitized.subjects) && sanitized.subjects.length) {
      data = sanitized;
      saveData(data);
      render();
    }
  });

  return {
    getData,
    setData,
    // expose helpers for sub-modules
    esc,
    find,
    persist,
    render,
    toast,
    getSubjectIcon,
    // public actions
    toggleSubject,
    toggleUnit,
    toggleDl,
    togglePr,
    markUnitDl,
    addPart,
    deletePart,
    editPartName,
    editSubjectName,
    openAddSubjectModal,
    addSubject,
    toggleSemVisibility,
    setSemFilter,
    openSettingsModal,
    closeModal,
    toggleTheme,
    toggleReadinessView,
    exportData,
    importData,
    resetToSyllabusDefaults,
    switchTab,
    toggleLumpsumMode,
    onMarksInput,
    onTargetSpiChange,
    resetAllMarks
  };

})();
