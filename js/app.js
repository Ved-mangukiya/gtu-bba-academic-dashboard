// ============================================================
//  GTU BBA Academic Dashboard — Master Application Facade
//  Coordinates Materials Tracker, Marks Hub, Settings & Cloud Sync
// ============================================================

const App = (() => {

  // ── State ──────────────────────────────────────────────────
  let loaded = loadData();
  let data = (loaded && Array.isArray(loaded.subjects) && loaded.subjects.length) ? loaded : getDefaultData();
  let filter = 'all';
  let search = '';
  let semFilter = 'all';
  let _confirmCallback = null;

  function getData() { return data; }
  function setData(d) { data = d; }

  // ── Helpers ────────────────────────────────────────────────
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
    saveData(data);
    Cloud.save(data);
  }

  function getVisibleSubjects() {
    const visibleSems = data.settings && Array.isArray(data.settings.visibleSems) && data.settings.visibleSems.length ? data.settings.visibleSems : [1, 2, 3, 4, 5, 6];
    let list = (data.subjects || []).filter(s => {
      if (!s) return false;
      const sSem = s.sem || 1;
      const isSemVisible = visibleSems.includes(sSem);
      const isSemMatch = (semFilter === 'all' || sSem === parseInt(semFilter));
      return isSemVisible && isSemMatch;
    });
    if (!list.length && (data.subjects || []).length) {
      list = data.subjects;
    }
    return list;
  }

  // ── Smooth Counter Animation Engine ────────────────────────
  const _statPrev = { total: 0, dl: 0, pr: 0, pending: 0 };

  function animateCount(el, from, to, duration = 300) {
    if (!el) return;
    if (el._rafId) {
      cancelAnimationFrame(el._rafId);
      el._rafId = null;
    }
    const currentVal = parseFloat(el.textContent.replace(/[^0-9.-]/g, ''));
    const startVal = !isNaN(currentVal) ? currentVal : from;
    if (startVal === to) {
      el.textContent = to;
      return;
    }
    const startTime = performance.now();
    const diff = to - startVal;

    function step(now) {
      const elapsed = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      el.textContent = Math.round(startVal + diff * eased);
      if (elapsed < 1) {
        el._rafId = requestAnimationFrame(step);
      } else {
        el.textContent = to;
        el._rafId = null;
      }
    }
    el._rafId = requestAnimationFrame(step);
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

    animateCount(document.getElementById('statTotal'), _statPrev.total, total);
    animateCount(document.getElementById('statDownloaded'), _statPrev.dl, dl);
    animateCount(document.getElementById('statPrinted'), _statPrev.pr, pr);
    animateCount(document.getElementById('statPending'), _statPrev.pending, pending);
    _statPrev.total = total; _statPrev.dl = dl; _statPrev.pr = pr; _statPrev.pending = pending;

    const ringPct = document.getElementById('progressPct');
    if (ringPct) ringPct.textContent = pct + '%';

    const fillDl = document.getElementById('progressFill');
    const fillPr = document.getElementById('progressFillPr');
    if (fillDl) fillDl.style.width = pct + '%';
    if (fillPr) fillPr.style.width = prPct + '%';
  }

  const chevSvg = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

  const SVG_SUBJECT_ICONS = {
    'S1-PPM': `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
    'S1-FA': `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
    'S1-BSL': `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
    'S1-ENG': `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    'S1-IKS': `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M3 7h18M6 7v14M10 7v14M14 7v14M18 7v14M12 3L2 7h20L12 3z"></path></svg>`,
    'S1-ESG': `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`
  };

  function getSubjectIcon(code, ci) {
    if (code && SVG_SUBJECT_ICONS[code.toUpperCase()]) {
      return SVG_SUBJECT_ICONS[code.toUpperCase()];
    }
    return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;
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
    toast(data.settings.theme === 'dark' ? 'Dark theme enabled' : 'Light theme enabled');
  }

  // ── Actions ────────────────────────────────────────────────
  function updateSubjectCardMiniProgress(subId) {
    const subCard = document.querySelector(`.subject-card[data-id="${subId}"]`);
    if (!subCard) return;
    const s = data.subjects.find(x => x.id === subId);
    if (!s) return;
    let stotal = 0, sdl = 0, spr = 0;
    if (s.units && Array.isArray(s.units)) {
      s.units.forEach(u => {
        if (u && Array.isArray(u.parts)) {
          u.parts.forEach(p => { stotal++; if (p.downloaded) sdl++; if (p.printed) spr++; });
        }
      });
    }
    const spct = stotal ? Math.round((sdl / stotal) * 100) : 0;
    const sprPct = stotal ? Math.round((spr / stotal) * 100) : 0;
    const miniDl = subCard.querySelector('.mini-bar-dl');
    const miniPr = subCard.querySelector('.mini-bar-pr');
    const miniPct = subCard.querySelector('.mini-pct');
    if (miniDl) miniDl.style.width = spct + '%';
    if (miniPr) miniPr.style.width = sprPct + '%';
    if (miniPct) miniPct.textContent = spct + '%';
  }

  function toggleDl(subId, unitId, partId) {
    const { p } = find(subId, unitId, partId);
    if (!p) return;
    p.downloaded = !p.downloaded;
    persist();

    const partCard = document.querySelector(`.part-card[data-part-id="${partId}"]`);
    if (partCard) {
      partCard.classList.toggle('done', p.downloaded);
      const dlBtn = partCard.querySelector('.ck-dl');
      if (dlBtn) {
        dlBtn.classList.toggle('checked', p.downloaded);
        dlBtn.innerHTML = p.downloaded ? `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` : '';
        dlBtn.title = p.downloaded ? 'Downloaded · Tap to unmark' : 'Mark as Downloaded';
      }
    }
    updateStats();
    updateSubjectCardMiniProgress(subId);
  }

  function togglePr(subId, unitId, partId) {
    const { p } = find(subId, unitId, partId);
    if (!p) return;
    p.printed = !p.printed;
    persist();

    const partCard = document.querySelector(`.part-card[data-part-id="${partId}"]`);
    if (partCard) {
      partCard.classList.toggle('printed', p.printed);
      const prBtn = partCard.querySelector('.ck-pr');
      if (prBtn) {
        prBtn.classList.toggle('checked', p.printed);
        prBtn.title = p.printed ? 'Printed · Tap to unmark' : 'Mark as Printed';
      }
    }
    updateStats();
    updateSubjectCardMiniProgress(subId);
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
    const { s, u } = find(subId, unitId);
    if (!u) return;
    if (!u.parts) u.parts = [];
    const pNum = u.parts.length + 1;
    const subCode = (s && s.code) ? s.code : 'SUBJ';
    const uNum = u.number || 1;
    const newPart = {
      id: uid(),
      number: pNum,
      name: `${subCode}-U${uNum}-P${pNum}`,
      downloaded: false,
      printed: false,
      priority: 'none',
      note: '',
      pdfFileName: '',
      pdfDriveUrl: '',
      pdfPageCount: null,
      showPdfMeta: false
    };
    u.parts.push(newPart);
    u.parts.sort((a, b) => (a.number || 0) - (b.number || 0));
    u.expanded = true;
    persist();
    render();
    toast(`Added ${newPart.name}`);
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
    const bNavMaterials = document.getElementById('bNavMaterials');
    const bNavMarks = document.getElementById('bNavMarks');

    if (tabName === 'marks') {
      if (pdfView) { pdfView.style.display = 'none'; pdfView.classList.remove('active'); }
      if (marksView) { marksView.style.display = 'block'; setTimeout(() => marksView.classList.add('active'), 10); }
      if (btnPdf) btnPdf.classList.remove('active');
      if (btnMarks) btnMarks.classList.add('active');
      if (bNavMaterials) bNavMaterials.classList.remove('active');
      if (bNavMarks) bNavMarks.classList.add('active');
      MarksHub.renderMarksHub();
    } else {
      if (marksView) { marksView.style.display = 'none'; marksView.classList.remove('active'); }
      if (pdfView) { pdfView.style.display = 'block'; setTimeout(() => pdfView.classList.add('active'), 10); }
      if (btnMarks) btnMarks.classList.remove('active');
      if (btnPdf) btnPdf.classList.add('active');
      if (bNavMarks) bNavMarks.classList.remove('active');
      if (bNavMaterials) bNavMaterials.classList.add('active');
      renderSubjectList();
    }
  }

  function toggleLumpsumMode(subId) {
    const s = data.subjects.find(x => x.id === subId);
    if (!s) return;
    if (!s.marks) s.marks = createDefaultMarks();
    s.marks.isLumpsum = !s.marks.isLumpsum;
    persist();
    MarksHub.renderMarksHub();
    toast(s.marks.isLumpsum ? 'Switched to Lumpsum internal mode' : 'Switched to Breakdown internal mode');
  }

  function onMarksInput(subId, fieldKey, value) {
    const s = data.subjects.find(x => x.id === subId);
    if (!s) return;
    if (!s.marks) s.marks = createDefaultMarks();
    if (value === '' || value === null || value === undefined) {
      s.marks[fieldKey] = null;
    } else {
      let num = parseFloat(value);
      if (isNaN(num)) {
        s.marks[fieldKey] = null;
      } else {
        const credits = s.credits || 4;
        const maxInternal = s.maxInternal || 30;
        const maxPractical = s.maxPractical || (credits === 2 ? 20 : 50);
        const maxEse = s.maxEse || (credits === 2 ? 50 : 70);

        if (fieldKey === 'internalMid') num = Math.min(Math.max(0, num), 20);
        else if (fieldKey === 'internalAtt') num = Math.min(Math.max(0, num), 5);
        else if (fieldKey === 'internalBeh') num = Math.min(Math.max(0, num), 5);
        else if (fieldKey === 'internalLumpsum') num = Math.min(Math.max(0, num), maxInternal);
        else if (fieldKey === 'practical') num = Math.min(Math.max(0, num), maxPractical);
        else if (fieldKey === 'ese') num = Math.min(Math.max(0, num), maxEse);
        s.marks[fieldKey] = num;
      }
    }
    saveData(data);
    Cloud.saveDebounced(data, 1000);
    MarksHub.updateSubjectCardLive(subId);
  }

  function saveSubjectMarks(subId) {
    const s = data.subjects.find(x => x.id === subId);
    if (!s) return;
    persist();
    MarksHub.updateSubjectCardLive(subId);
    toast(`Saved ${s.code} marks`);
  }

  function onTargetSpiChange(val) {
    const targetVal = parseFloat(val);
    if (isNaN(targetVal)) return;
    if (!data.settings) data.settings = {};
    data.settings.targetSpi = Math.min(Math.max(targetVal, 4.0), 10.0);
    data.settings.targetCgpa = data.settings.targetSpi;
    saveData(data);
    Cloud.saveDebounced(data, 1000);
    MarksHub.renderTargetBacktracker();
    
    const sTargetCgpaEl = document.getElementById('settingTargetCgpa');
    if (sTargetCgpaEl) sTargetCgpaEl.value = data.settings.targetSpi;
    if (Array.isArray(data.subjects)) {
      data.subjects.forEach(s => {
        MarksHub.updateSubjectCardLive(s.id);
      });
    }
  }

  function updateStudentProfile(field, val) {
    if (!data.settings) data.settings = {};
    data.settings[field] = val;
    
    if (field === 'targetCgpa') {
      const spiVal = parseFloat(val);
      if (!isNaN(spiVal)) {
        data.settings.targetSpi = Math.min(Math.max(spiVal, 4.0), 10.0);
        MarksHub.renderTargetBacktracker();
        if (Array.isArray(data.subjects)) {
          data.subjects.forEach(s => {
            MarksHub.updateSubjectCardLive(s.id);
          });
        }
      }
    }
    
    saveData(data);
    Cloud.saveDebounced(data, 1000);
    toast(`Saved changes`);
  }

  function setCurrentSem(sem) {
    const semNum = parseInt(sem) || 1;
    if (!data.settings) data.settings = {};
    data.settings.currentSem = semNum;
    if (!Array.isArray(data.settings.visibleSems)) data.settings.visibleSems = [1];
    if (!data.settings.visibleSems.includes(semNum)) {
      data.settings.visibleSems.push(semNum);
    }
    persist();
    render();
    if (typeof MarksHub.setActiveMarksSem === 'function') {
      MarksHub.setActiveMarksSem(semNum);
    }
    toast(`Active Semester set to Sem ${semNum}`);
  }

  function resetAllMarks() {
    data.subjects.forEach(s => { s.marks = createDefaultMarks(); });
    persist();
    MarksHub.renderMarksHub();
    toast('Reset all marks to 0');
  }

  // ── Main Render ────────────────────────────────────────────
  function render() {
    applyTheme();
    updateStats();
    renderSemBar();

    const activeTab = (data.settings && data.settings.activeTab) ? data.settings.activeTab : 'pdf';
    const pdfView = document.getElementById('pdfTrackerView');
    const marksView = document.getElementById('marksHubView');
    const btnPdf = document.getElementById('tabPdfBtn');
    const btnMarks = document.getElementById('tabMarksBtn');
    const bNavMaterials = document.getElementById('bNavMaterials');
    const bNavMarks = document.getElementById('bNavMarks');

    if (activeTab === 'marks') {
      if (pdfView) { pdfView.style.display = 'none'; pdfView.classList.remove('active'); }
      if (marksView) { marksView.style.display = 'block'; marksView.classList.add('active'); }
      if (btnPdf) btnPdf.classList.remove('active');
      if (btnMarks) btnMarks.classList.add('active');
      if (bNavMaterials) bNavMaterials.classList.remove('active');
      if (bNavMarks) bNavMarks.classList.add('active');
      MarksHub.renderMarksHub();
    } else {
      if (marksView) { marksView.style.display = 'none'; marksView.classList.remove('active'); }
      if (pdfView) { pdfView.style.display = 'block'; pdfView.classList.add('active'); }
      if (btnMarks) btnMarks.classList.remove('active');
      if (btnPdf) btnPdf.classList.add('active');
      if (bNavMarks) bNavMarks.classList.remove('active');
      if (bNavMaterials) bNavMaterials.classList.add('active');
      renderSubjectList();
    }
  }

  function renderSubjectList() {
    const container = document.getElementById('subjectsContainer');
    const emptyEl = document.getElementById('emptyState');
    const term = search.toLowerCase().trim();
    const activeSubjects = getVisibleSubjects();

    const filtered = activeSubjects.map(s => {
      if (!s) return null;
      s.units = ensureArray(s.units);
      const sMatch = !term || (s.name && s.name.toLowerCase().includes(term)) || (s.code && s.code.toLowerCase().includes(term));

      const units = s.units.map(u => {
        if (!u) return null;
        u.parts = ensureArray(u.parts);
        const uMatch = !term || (u.name && u.name.toLowerCase().includes(term)) || sMatch;
        const parts = u.parts.filter(p => {
          const pMatch = !term || (p.name && p.name.toLowerCase().includes(term)) || uMatch;
          let fMatch = true;
          if (filter === 'pending') fMatch = !p.downloaded;
          else if (filter === 'downloaded') fMatch = p.downloaded;
          else if (filter === 'printed') fMatch = p.printed;
          return pMatch && fMatch;
        });
        if (filter === 'all' && !term) return u;
        return parts.length ? { ...u, parts } : (filter === 'all' ? u : null);
      }).filter(Boolean);

      if (filter === 'all' && !term) return s;
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
            <div class="subject-card ${orig.expanded ? 'open' : ''}" data-id="${s.id}">
              <div class="subject-head" onclick="App.toggleSubject('${s.id}')">
                <div class="subject-icon-badge">${getSubjectIcon(orig.code, ci)}</div>
                <div class="subject-info">
                  <div class="subject-meta">${esc(orig.code)} · ${orig.credits || 4} Credits · ${(orig.credits === 2 ? '3 Units' : '5 Units')}</div>
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
    t.innerHTML = `<span>${isError ? '✕' : '✓'}</span><span>${msg}</span>`;
    c.appendChild(t);
    const delay = 2400;
    setTimeout(() => t.classList.add('toast-out'), delay);
    setTimeout(() => { if (t.parentNode) t.remove(); }, delay + 300);
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
  }

  // ── Settings Suite Controllers ─────────────────────────────
  function toggleSettingsSubView(viewId) {
    const el = document.getElementById(viewId);
    if (!el) return;
    const isShown = el.style.display !== 'none';
    el.style.display = isShown ? 'none' : 'block';

    const chevId = viewId === 'subViewSemVisibility' ? 'chevSemVisibility' : 'chevRecycleBin';
    const chevEl = document.getElementById(chevId);
    if (chevEl) {
      chevEl.style.transform = isShown ? 'rotate(0deg)' : 'rotate(90deg)';
    }
  }

  function updateSemVisibilitySummary() {
    const vis = (data.settings && Array.isArray(data.settings.visibleSems)) ? data.settings.visibleSems : [1];
    const textEl = document.getElementById('semVisibilityCountText');
    if (textEl) {
      textEl.textContent = `${vis.length} of 6 semesters visible`;
    }
  }

  function toggleSemVisibility(semNum) {
    if (!data.settings) data.settings = {};
    if (!Array.isArray(data.settings.visibleSems)) data.settings.visibleSems = [1];
    const idx = data.settings.visibleSems.indexOf(semNum);
    if (idx > -1) {
      if (data.settings.visibleSems.length > 1) {
        data.settings.visibleSems.splice(idx, 1);
      } else {
        const sw = document.getElementById(`semSwitch_${semNum}`);
        if (sw) sw.checked = true;
        toast('At least 1 semester must remain visible', true);
        return;
      }
    } else {
      data.settings.visibleSems.push(semNum);
    }
    updateSemVisibilitySummary();
    persist();
    render();
  }

  function openSettingsModal() {
    const m = document.getElementById('settingsModal');
    if (!m) return;

    const sNameEl = document.getElementById('settingStudentName');
    const sEnrollEl = document.getElementById('settingEnrollment');
    const sCurSemEl = document.getElementById('settingCurrentSem');
    const sTargetCgpaEl = document.getElementById('settingTargetCgpa');

    if (sNameEl) sNameEl.value = (data.settings && data.settings.studentName) || '';
    if (sEnrollEl) sEnrollEl.value = (data.settings && data.settings.enrollmentNo) || '';
    if (sCurSemEl) sCurSemEl.value = String((data.settings && data.settings.currentSem) || 1);
    if (sTargetCgpaEl) sTargetCgpaEl.value = (data.settings && (data.settings.targetCgpa || data.settings.targetSpi)) || '10.0';

    const vis = (data.settings && Array.isArray(data.settings.visibleSems)) ? data.settings.visibleSems : [1, 2, 3, 4, 5, 6];
    for (let i = 1; i <= 6; i++) {
      const sw = document.getElementById(`semSwitch_${i}`);
      if (sw) sw.checked = vis.includes(i);
    }

    updateSemVisibilitySummary();
    renderTrashList();
    m.classList.add('show');
  }

  function openAddSubjectModal(semNum) {
    closeModal('settingsModal');
    const m = document.getElementById('addSubjectModal');
    if (!m) return;
    const semEl = document.getElementById('newSubSem');
    if (semEl && semNum) {
      semEl.value = String(semNum);
    }
    const nameEl = document.getElementById('newSubName');
    if (nameEl) {
      nameEl.value = '';
      setTimeout(() => nameEl.focus(), 80);
    }
    const codeEl = document.getElementById('newSubCode');
    if (codeEl) codeEl.value = '';
    m.classList.add('show');
  }

  function renderTrashList() {
    const list = document.getElementById('trashList');
    const clearBtn = document.getElementById('btnClearTrash');
    const badgeEl = document.getElementById('trashCountBadge');
    const subtitleEl = document.getElementById('trashCountSubtitle');

    const trash = (data.trash && Array.isArray(data.trash)) ? data.trash : [];

    if (badgeEl) {
      badgeEl.textContent = trash.length === 0 ? 'Empty' : `${trash.length} items`;
    }
    if (subtitleEl) {
      subtitleEl.textContent = trash.length === 0 ? 'No deleted items' : `${trash.length} item(s) available for restore`;
    }

    if (!list) return;
    if (trash.length === 0) {
      list.innerHTML = '<div style="font-size:0.75rem;color:var(--text-mid);text-align:center;padding:8px;">Recycle bin is empty.</div>';
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }
    if (clearBtn) clearBtn.style.display = 'block';
    list.innerHTML = trash.map(item => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-subtle);">
        <div style="font-size:0.78rem;color:var(--text-dark);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px;">
          <strong>${esc(item.name || 'Untitled')}</strong>
          <span style="font-size:0.7rem;color:var(--text-mid);">(${item.type || 'part'})</span>
        </div>
        <button class="btn btn-ghost btn-xs" onclick="App.restoreTrashItem('${item.id}')">Restore</button>
      </div>
    `).join('');
  }

  function restoreTrashItem(id) {
    if (!data.trash) return;
    const idx = data.trash.findIndex(x => x.id === id);
    if (idx === -1) return;
    const item = data.trash.splice(idx, 1)[0];
    if (item.type === 'part' && item.meta && item.payload) {
      const { subId, unitId } = item.meta;
      const { u } = find(subId, unitId);
      if (u) {
        if (!u.parts) u.parts = [];
        u.parts.push(item.payload);
        persist(); render();
        renderTrashList();
        toast(`Restored: ${item.name}`);
        return;
      }
    }
    persist(); render();
    renderTrashList();
    toast(`Restored item`);
  }

  function clearTrash() {
    data.trash = [];
    saveData(data);
    persist();
    renderTrashList();
    toast('Recycle bin cleared');
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

  // ── Confirmation Modal Engine ──────────────────────────────
  function openConfirm(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');
    if (!modal) return;
    if (titleEl) titleEl.textContent = title || 'Confirm Action';
    if (msgEl) msgEl.textContent = message || 'Are you sure you want to proceed?';
    _confirmCallback = onConfirm;
    modal.classList.add('show');
  }

  function closeConfirm(proceed) {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.remove('show');
    if (proceed && typeof _confirmCallback === 'function') {
      const cb = _confirmCallback;
      _confirmCallback = null;
      cb();
    } else {
      _confirmCallback = null;
    }
  }

  function confirmResetSemester() {
    closeModal('settingsModal');
    openConfirm(
      'Reset Semester 1 Data?',
      'This will reset your Semester 1 subjects, units, and marks to the default GTU syllabus. This action cannot be undone.',
      () => {
        resetToSyllabusDefaults();
      }
    );
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'gtu-bba-backup-' + Date.now() + '.json';
    a.click(); URL.revokeObjectURL(url);
    toast('Backup exported');
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
        toast('Data imported successfully');
      } catch (_) { toast('Failed to import backup', true); }
    };
    reader.readAsText(file);
  }

  function resetToSyllabusDefaults() {
    data = getDefaultData();
    persist(); render();
    toast('Reset to GTU BBA Sem 1 defaults');
  }

  function recoverMissingSyllabus() {
    let recoveredCount = 0;

    SUBJECT_SEED.forEach(seed => {
      let userSub = (data.subjects || []).find(s => s.code === seed.code);
      if (!userSub) {
        userSub = (data.subjects || []).find(s => (s.sem || 1) === (seed.sem || 1) && s.name && s.name.toLowerCase().includes(seed.name.substring(0, 10).toLowerCase()));
      }

      if (!userSub) {
        const newSub = {
          id: uid(),
          name: seed.name,
          code: seed.code,
          sem: seed.sem || 1,
          credits: seed.credits,
          maxMarks: seed.maxMarks,
          maxEse: seed.maxEse,
          maxInternal: seed.maxInternal,
          maxPractical: seed.maxPractical,
          marks: createDefaultMarks(),
          colorIndex: seed.colorIndex,
          expanded: false,
          units: buildUnits(seed.code, seed.unitNames)
        };
        if (!data.subjects) data.subjects = [];
        data.subjects.push(newSub);
        recoveredCount += seed.unitNames.length;
      } else {
        if (!Array.isArray(userSub.units)) userSub.units = [];

        seed.unitNames.forEach((unitName, i) => {
          const unitNum = i + 1;
          let userUnit = userSub.units.find(u => u.number === unitNum);
          if (!userUnit) {
            userUnit = userSub.units.find(u => u.name && (u.name === unitName || u.name.includes(unitName.substring(0, 15))));
          }

          if (!userUnit) {
            const newUnit = {
              id: uid(),
              number: unitNum,
              name: unitName,
              expanded: false,
              parts: [
                {
                  id: uid(),
                  number: 1,
                  name: `${seed.code}-U${unitNum}-P1`,
                  downloaded: false,
                  printed: false,
                  priority: 'none',
                  note: '',
                  pdfFileName: '',
                  pdfPageCount: null,
                  showPdfMeta: false
                }
              ]
            };
            userSub.units.push(newUnit);
            recoveredCount++;
          } else {
            userUnit.number = unitNum;
            if (!userUnit.name || userUnit.name.startsWith('Unit ')) {
              userUnit.name = unitName;
            }
            if (!Array.isArray(userUnit.parts) || userUnit.parts.length === 0) {
              userUnit.parts = [
                {
                  id: uid(),
                  number: 1,
                  name: `${seed.code}-U${unitNum}-P1`,
                  downloaded: false,
                  printed: false,
                  priority: 'none',
                  note: '',
                  pdfFileName: '',
                  pdfPageCount: null,
                  showPdfMeta: false
                }
              ];
              recoveredCount++;
            }
          }
        });

        userSub.units.sort((a, b) => (a.number || 0) - (b.number || 0));
      }
    });

    if (recoveredCount > 0) {
      persist(); 
      render();
      toast(`Restored ${recoveredCount} missing syllabus unit(s)`);
    } else {
      toast(`All GTU syllabus units are intact`);
    }
  }

  // ── Init & Event Listeners ─────────────────────────────────
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => { search = e.target.value; renderSubjectList(); });
  }

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

  function isUserInteracting() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName ? el.tagName.toUpperCase() : '';
    return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
  }

  function handleRemoteCloudUpdate(newCloudData) {
    const sanitized = sanitizeData(newCloudData);
    if (!sanitized || !Array.isArray(sanitized.subjects) || !sanitized.subjects.length) return;

    const prevTab = (data.settings && data.settings.activeTab) ? data.settings.activeTab : 'pdf';
    data = sanitized;
    if (!data.settings) data.settings = {};
    if (!data.settings.activeTab) data.settings.activeTab = prevTab;
    saveData(data);

    if (isUserInteracting()) {
      updateStats();
      if (data.settings.activeTab === 'marks' && typeof MarksHub.updateLiveSummary === 'function') {
        MarksHub.updateLiveSummary();
      }
      return;
    }

    render();
  }

  function init() {
    if (!data.settings) data.settings = {};
    data.settings.activeTab = 'pdf';
    semFilter = 'all';
    filter = 'all';
    search = '';

    render();

    Cloud.init((newCloudData) => {
      handleRemoteCloudUpdate(newCloudData);
    });
  }

  return {
    init,
    getData,
    setData,
    esc,
    find,
    persist,
    render,
    toast,
    getSubjectIcon,
    toggleSubject,
    toggleUnit,
    toggleDl,
    togglePr,
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
    toggleSettingsSubView,
    toggleTheme,
    exportData,
    importData,
    resetToSyllabusDefaults,
    recoverMissingSyllabus,
    confirmResetSemester,
    openConfirm,
    closeConfirm,
    switchTab,
    toggleLumpsumMode,
    onMarksInput,
    saveSubjectMarks,
    onTargetSpiChange,
    resetAllMarks,
    updateStudentProfile,
    setCurrentSem,
    restoreTrashItem,
    clearTrash,
    openGtuGuideModal: () => MarksHub.openGtuGuideModal(),
    updateSimulator: (f, v) => MarksHub.updateSimulator(f, v),
    setSimulatorPreset: (p) => MarksHub.setSimulatorPreset(p)
  };

})();

if (typeof window !== 'undefined') {
  window.App = App;
}
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
