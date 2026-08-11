// ============================================================
//  GTU BBA PDF Tracker — Application Logic
//  Units are fixed. Parts can be added/removed freely.
//  Fully synced with Firebase Cloud Storage.
// ============================================================

const App = (() => {

  // ── State ──────────────────────────────────────────────
  let loaded = loadData();
  let data = (loaded && Array.isArray(loaded.subjects) && loaded.subjects.length) ? loaded : getDefaultData();
  let filter = 'all';
  let search = '';
  let semFilter = 'all';

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
    if (from === to) {
      el.textContent = to;
      return;
    }
    const start = performance.now();
    const diff = to - from;
    function step(now) {
      const elapsed = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3); // ease-out-cubic
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

    // Animated counters
    animateCount(document.getElementById('statTotal'), _statPrev.total, total, 500);
    animateCount(document.getElementById('statDownloaded'), _statPrev.dl, dl, 500);
    animateCount(document.getElementById('statPrinted'), _statPrev.pr, pr, 500);
    animateCount(document.getElementById('statPending'), _statPrev.pending, pending, 500);
    _statPrev.total = total; _statPrev.dl = dl; _statPrev.pr = pr; _statPrev.pending = pending;

    // SVG Ring Progress (circumference = 2π × 34 ≈ 213.6)
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

    // Dual-segment overlapping bar: green = total downloaded %, purple = printed % overlapping on top
    const fillDl = document.getElementById('progressFill');
    const fillPr = document.getElementById('progressFillPr');
    if (fillDl) fillDl.style.width = pct + '%';
    if (fillPr) fillPr.style.width = prPct + '%';
  }

  // ── Chevron & Action SVGs ───────────────────────────────
  const chevSvg = `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>`;
  const dlSvg = `<svg class="ck-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/></svg>`;
  const prSvg = `<svg class="ck-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>`;

  function getSubjectIcon(code, ci) {
    const iconMap = {
      'S1-PPM': '💼',
      'S1-FA': '💰', // Universal Money Bag Emoji for Financial Accounting
      'S1-BSL': '📊',
      'S1-ENG': '💬',
      'S1-IKS': '🏛️',
      'S1-ESG': '🌱',
      'S2-AFA': '💰',
      'S2-OB': '👥',
      'S2-BE': '🌐',
      'S2-MM': '📢',
      'S2-BC': '✉️',
      'S3-CA': '🪙',
      'S3-HRM': '👔',
      'S3-FM': '📈',
      'S3-BL': '⚖️',
      'S4-COST': '📊',
      'S4-POM': '⚙️',
      'S4-MIS': '💻',
      'S4-RM': '🔬',
      'S5-SM': '🎯',
      'S5-ED': '🚀',
      'S5-TAX': '📑',
      'S6-GBE': '🌍',
      'S6-PROJ': '🎓',
      'S6-BEG': '🛡️'
    };
    if (code && iconMap[code.toUpperCase()]) return iconMap[code.toUpperCase()];
    const fallbackIcons = ['💼', '💰', '📊', '💬', '🏛️', '🌱', '📈', '🎯'];
    return fallbackIcons[ci % fallbackIcons.length];
  }

  // ── Semester Navigation Bar ────────────────────────────
  function renderSemBar() {
    const bar = document.getElementById('semBar');
    if (!bar) return;
    const existingSems = Array.from(new Set(data.subjects.map(s => s.sem || 1))).sort((a, b) => a - b);
    const visibleSettings = (data.settings && Array.isArray(data.settings.visibleSems) ? data.settings.visibleSems : [1]);
    const activeSems = existingSems.filter(s => visibleSettings.includes(s));

    if (activeSems.length <= 1) {
      bar.innerHTML = '';
      bar.style.display = 'none';
      return;
    }

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

  // ── Dark Mode / Theme Handler ──────────────────────────
  function applyTheme() {
    const isDark = data.settings && data.settings.theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.textContent = isDark ? '☀️' : '🌙';
  }

  function toggleTheme() {
    if (!data.settings) data.settings = {};
    data.settings.theme = data.settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    persist();
    toast(data.settings.theme === 'dark' ? 'OLED Dark Mode enabled' : 'Light Mode enabled');
  }

  // ── Exam Target Countdown ──────────────────────────────
  function updateCountdown() {
    const timerEl = document.getElementById('countdownTimer');
    if (!timerEl) return;
    const examDateStr = data.settings ? data.settings.examDate : '';
    if (!examDateStr) {
      timerEl.textContent = 'No target date set · Click "Set Target Date"';
      return;
    }

    const targetDate = new Date(examDateStr).getTime();
    const now = Date.now();
    const diff = targetDate - now;

    if (diff <= 0) {
      timerEl.textContent = '🎉 Exam Day is Here! Best of luck!';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    timerEl.textContent = `${days} Days ${hours}h ${mins}m Remaining`;
  }

  async function editExamDate() {
    const currentDate = data.settings ? data.settings.examDate : '';
    const newDate = prompt('Enter your GTU Exam target date (YYYY-MM-DD):', currentDate || '2026-11-15');
    if (newDate === null) return;
    if (newDate.trim() === '') {
      data.settings.examDate = '';
      persist(); updateCountdown();
      toast('Exam countdown cleared');
      return;
    }
    if (isNaN(new Date(newDate).getTime())) {
      toast('Invalid date format. Use YYYY-MM-DD', true);
      return;
    }
    data.settings.examDate = newDate.trim();
    persist();
    updateCountdown();
    toast('Exam target date updated!');
  }

  // ── Semester Readiness Breakdown ───────────────────────
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

    // Calculate per-semester readiness
    const semMap = {};
    for (let sNum = 1; sNum <= 6; sNum++) {
      semMap[sNum] = { total: 0, dl: 0, pr: 0 };
    }

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
        </div>
      `;
    }).join('');
  }

  // ── Render ─────────────────────────────────────────────
  function render() {
    applyTheme();
    updateCountdown();
    renderReadinessGrid();
    updateStats();
    renderSemBar();

    const container = document.getElementById('subjectsContainer');
    const emptyEl = document.getElementById('emptyState');
    const term = search.toLowerCase().trim();
    const activeSubjects = getVisibleSubjects();

    // Build filtered view
    const filtered = activeSubjects.map(s => {
      if (!s || !Array.isArray(s.units)) return null;
      const sMatch = !term || s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term);

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
      container.innerHTML = '';
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';

    container.innerHTML = filtered.map((s, si) => {
      const orig = data.subjects.find(o => o.id === s.id);
      if (!orig) return '';
      const ci = orig.colorIndex % 8;

      // Subject-level progress (from original, not filtered)
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
              ${s.units && Array.isArray(s.units) ? s.units.map(u => renderUnit(s.id, u, ci, orig)).join('') : ''}
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function renderUnit(subId, u, ci, origSubject) {
    if (!origSubject || !Array.isArray(origSubject.units)) return '';
    const origUnit = origSubject.units.find(x => x.id === u.id);
    const isOpen = origUnit ? origUnit.expanded : false;
    // count unit-level progress
    const uTotal = (u.parts && Array.isArray(u.parts)) ? u.parts.length : 0;
    const uDl = (u.parts && Array.isArray(u.parts)) ? u.parts.filter(p => p.downloaded).length : 0;
    const uPr = (u.parts && Array.isArray(u.parts)) ? u.parts.filter(p => p.printed).length : 0;
    const uPct = uTotal ? Math.round((uDl / uTotal) * 100) : 0;

    return `
      <div class="unit ${isOpen ? 'open' : ''}" data-uid="${u.id}">
        <div class="unit-head" onclick="App.toggleUnit('${subId}','${u.id}')">
          <span class="unit-tag">U${origUnit ? origUnit.number : u.number}</span>
          <span class="unit-name editable" contenteditable="true"
                onfocus="this.dataset.prev=this.textContent"
                onblur="App.editUnitName('${subId}','${u.id}',this)"
                onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}">${esc(origUnit ? origUnit.name : u.name)}</span>
          <span class="unit-stat" title="${uDl}/${uTotal} downloaded · ${uPr} printed">${uDl}/${uTotal}</span>
          <span class="unit-chev">${chevSvg}</span>
        </div>
        <div class="unit-body">
          <div class="unit-inner">
            ${u.parts && Array.isArray(u.parts) ? u.parts.map((p, idx) => renderPart(subId, u.id, p, idx)).join('') : ''}
            <button class="add-part" onclick="App.addPart('${subId}','${u.id}')">+ Add Part</button>
          </div>
        </div>
      </div>`;
  }

  function renderPart(subId, unitId, p, idx) {
    const done = p.downloaded && p.printed;
    const delay = (idx || 0) * 38;
    const trashSvg = `<svg class="del-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`;

    let priorityBadge = '';
    if (p.priority === 'high') {
      priorityBadge = `<span class="priority-badge p-high" onclick="App.cyclePartPriority('${subId}','${unitId}','${p.id}')" title="Click to cycle priority">🔥 High Imp</span>`;
    } else if (p.priority === 'revision') {
      priorityBadge = `<span class="priority-badge p-rev" onclick="App.cyclePartPriority('${subId}','${unitId}','${p.id}')" title="Click to cycle priority">⚡ Revision</span>`;
    } else if (p.priority === 'mastered') {
      priorityBadge = `<span class="priority-badge p-mastered" onclick="App.cyclePartPriority('${subId}','${unitId}','${p.id}')" title="Click to cycle priority">✅ Mastered</span>`;
    } else {
      priorityBadge = `<span class="priority-badge p-none" onclick="App.cyclePartPriority('${subId}','${unitId}','${p.id}')" title="Click to set priority">+ Tag</span>`;
    }

    return `
      <div class="part ${done ? 'done' : ''}" style="animation-delay:${delay}ms">
        <span class="part-tag">P${p.number}</span>
        <span class="part-name editable" contenteditable="true"
              onfocus="this.dataset.prev=this.textContent"
              onblur="App.editPartName('${subId}','${unitId}','${p.id}',this)"
              onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}">${esc(p.name)}</span>
        ${priorityBadge}
        <div class="part-checks">
          <button class="ck ck-dl ${p.downloaded ? 'on' : ''}"
                  onclick="App.toggleDl('${subId}','${unitId}','${p.id}')" title="${p.downloaded ? 'Downloaded ✓' : 'Mark Downloaded'}">${dlSvg}</button>
          <button class="ck ck-pr ${p.printed ? 'on' : ''}"
                  onclick="App.togglePr('${subId}','${unitId}','${p.id}')" title="${p.printed ? 'Printed ✓' : 'Mark Printed'}">${prSvg}</button>
          <button class="part-del" onclick="App.deletePart('${subId}','${unitId}','${p.id}')" title="Delete part">${trashSvg}</button>
        </div>
      </div>`;
  }

  // ── rAF Height Animation (true physical accordion) ───────────
  //  easeOutExpo: very fast initial drop, then gradually settles — feels like yanking open
  function _easeOutExpo(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  //  easeInCubic: starts slowly (resistance), then accelerates closed — feels like gravity
  function _easeInCubic(t) { return t * t * t; }

  function _animOpen(bodyEl, duration) {
    // Cancel any running animation on this element
    if (bodyEl._raf) { cancelAnimationFrame(bodyEl._raf); bodyEl._raf = null; }

    // Measure natural height: temporarily unlock, read, lock back
    bodyEl.style.height = 'auto';
    const targetH = bodyEl.scrollHeight;
    bodyEl.style.height = (bodyEl._currentH || 0) + 'px';
    // Force browser to register the style before we animate
    void bodyEl.offsetHeight;

    const fromH = parseFloat(bodyEl.style.height) || 0;
    const start = performance.now();

    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const h = fromH + (targetH - fromH) * _easeOutExpo(t);
      bodyEl.style.height = h + 'px';
      bodyEl._currentH = h;
      if (t < 1) {
        bodyEl._raf = requestAnimationFrame(frame);
      } else {
        bodyEl.style.height = 'auto'; // unlock for dynamic reflows
        bodyEl._currentH = null;
        bodyEl._raf = null;
      }
    }
    bodyEl._raf = requestAnimationFrame(frame);
  }

  function _animClose(bodyEl, duration) {
    if (bodyEl._raf) { cancelAnimationFrame(bodyEl._raf); bodyEl._raf = null; }

    // Snapshot current rendered height (may be mid-open-animation)
    const fromH = bodyEl.getBoundingClientRect().height;
    bodyEl.style.height = fromH + 'px';
    void bodyEl.offsetHeight;

    const start = performance.now();
    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const h = fromH * (1 - _easeInCubic(t));
      bodyEl.style.height = h + 'px';
      bodyEl._currentH = h;
      if (t < 1) {
        bodyEl._raf = requestAnimationFrame(frame);
      } else {
        bodyEl.style.height = '0px';
        bodyEl._currentH = 0;
        bodyEl._raf = null;
      }
    }
    bodyEl._raf = requestAnimationFrame(frame);
  }

  // ── Toggle expand (rAF pixel-by-pixel height animation) ───────
  function toggleSubject(id) {
    const s = data.subjects.find(x => x.id === id);
    if (!s) return;
    s.expanded = !s.expanded;
    persist();

    const cardEl = document.querySelector(`.subject-card[data-id="${id}"]`);
    if (!cardEl) { render(); return; }

    const bodyEl = cardEl.querySelector('.subject-body');
    if (!bodyEl) { render(); return; }

    cardEl.classList.toggle('open', s.expanded);

    if (s.expanded) {
      _animOpen(bodyEl, 420);
    } else {
      _animClose(bodyEl, 300);
    }
  }

  function toggleUnit(subId, unitId) {
    const { u } = find(subId, unitId);
    if (!u) return;
    u.expanded = !u.expanded;
    persist();

    const unitEl = document.querySelector(`.unit[data-uid="${unitId}"]`);
    if (!unitEl) { render(); return; }

    const bodyEl = unitEl.querySelector('.unit-body');
    if (!bodyEl) { render(); return; }

    unitEl.classList.toggle('open', u.expanded);

    if (u.expanded) {
      _animOpen(bodyEl, 360);
    } else {
      _animClose(bodyEl, 260);
    }
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

  // ── Batch Unit Actions & Priority ───────────────────────
  function markUnitDl(subId, unitId) {
    const { u } = find(subId, unitId);
    if (!u || !Array.isArray(u.parts)) return;
    const allDl = u.parts.every(p => p.downloaded);
    u.parts.forEach(p => p.downloaded = !allDl);
    persist(); render();
    toast(allDl ? 'Unit marked incomplete' : 'All unit parts downloaded');
  }

  function markUnitPr(subId, unitId) {
    const { u } = find(subId, unitId);
    if (!u || !Array.isArray(u.parts)) return;
    const allPr = u.parts.every(p => p.printed);
    u.parts.forEach(p => {
      p.printed = !allPr;
      if (!allPr) p.downloaded = true;
    });
    persist(); render();
    toast(allPr ? 'Unit print status reset' : 'All unit parts printed');
  }

  function cyclePartPriority(subId, unitId, partId) {
    const { p } = find(subId, unitId, partId);
    if (!p) return;
    const states = ['none', 'high', 'revision', 'mastered'];
    const nextIdx = (states.indexOf(p.priority || 'none') + 1) % states.length;
    p.priority = states[nextIdx];
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
    const { s, u } = find(subId, unitId);
    if (!u || !Array.isArray(u.parts)) return;
    const pIdx = u.parts.findIndex(p => p.id === partId);
    if (pIdx === -1) return;

    const item = u.parts[pIdx];

    // Backup for Undo
    lastDeleted = {
      type: 'part',
      subId,
      unitId,
      item,
      index: pIdx
    };

    // Add to Recycle Bin / Trash
    if (!data.trash) data.trash = [];
    data.trash.push({
      id: uid(),
      type: 'part',
      name: item.name,
      deletedAt: Date.now(),
      payload: item,
      meta: {
        subId,
        unitId,
        subName: s.name,
        unitName: u.name,
        originalIndex: pIdx
      }
    });

    u.parts.splice(pIdx, 1);
    persist(); render();
    toast('Part removed', false, true);
  }

  async function deleteSubject(id) {
    const sIdx = data.subjects.findIndex(x => x.id === id);
    if (sIdx === -1) return;
    const s = data.subjects[sIdx];
    const isYes = await showConfirm(
      'Delete Subject',
      `Are you sure you want to delete "${s.name}"? This will move it to the Recycle Bin.`,
      'Delete Subject',
      true
    );
    if (!isYes) return;

    // Backup for Undo
    lastDeleted = {
      type: 'subject',
      item: s,
      index: sIdx
    };

    // Add to Recycle Bin / Trash
    if (!data.trash) data.trash = [];
    data.trash.push({
      id: uid(),
      type: 'subject',
      name: s.name,
      deletedAt: Date.now(),
      payload: s,
      meta: {
        originalIndex: sIdx
      }
    });

    data.subjects.splice(sIdx, 1);
    persist(); render();
    toast('Subject deleted', false, true);
  }

  // ── Add Subject Modal ──────────────────────────────────
  function openAddSubjectModal() {
    document.getElementById('newSubName').value = '';
    document.getElementById('newSubCode').value = '';
    document.getElementById('newSubUnits').value = '5';
    document.getElementById('newSubSem').value = (semFilter !== 'all' ? semFilter.toString() : '1');
    openModal('addSubjectModal');
  }

  function addSubject() {
    const name = document.getElementById('newSubName').value.trim();
    const code = document.getElementById('newSubCode').value.trim();
    const sem = parseInt(document.getElementById('newSubSem').value) || 1;
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
      sem,
      colorIndex: ci,
      expanded: true,
      units: buildUnits(code, unitNames)
    });

    persist(); render();
    closeModal('addSubjectModal');
    toast(`"${name}" added`);
  }

  // ── Settings Modal ─────────────────────────────────────
  function openSettingsModal() {
    const visible = (data.settings && Array.isArray(data.settings.visibleSems) ? data.settings.visibleSems : [1, 2, 3, 4, 5, 6]);
    document.querySelectorAll('#semCheckGrid input[type="checkbox"]').forEach(ck => {
      const sNum = parseInt(ck.value);
      ck.checked = visible.includes(sNum);
    });
    renderTrash();
    openModal('settingsModal');
  }

  function toggleSemVisibility(semNum) {
    if (!data.settings) data.settings = { visibleSems: [1, 2, 3, 4, 5, 6] };
    let visible = data.settings.visibleSems;
    if (visible.includes(semNum)) {
      if (visible.length <= 1) {
        toast('At least one semester must remain visible', true);
        openSettingsModal();
        return;
      }
      visible = visible.filter(x => x !== semNum);
    } else {
      visible.push(semNum);
    }
    data.settings.visibleSems = visible;
    if (semFilter !== 'all' && !visible.includes(semFilter)) {
      semFilter = 'all';
    }
    persist();
    render();
  }

  // ── Modals ─────────────────────────────────────────────
  function openModal(id) { document.getElementById(id).classList.add('show'); }
  function closeModal(id) { document.getElementById(id).classList.remove('show'); }

  let confirmResolve = null;

  function showConfirm(title, message, yesText = 'Yes, Proceed', isDanger = true) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    const yesBtn = document.getElementById('confirmYesBtn');
    yesBtn.textContent = yesText;

    if (isDanger) {
      yesBtn.className = 'btn btn-accent btn-danger';
    } else {
      yesBtn.className = 'btn btn-accent';
    }

    openModal('confirmModal');
    return new Promise((resolve) => {
      confirmResolve = resolve;
    });
  }

  function closeConfirm(result) {
    closeModal('confirmModal');
    if (confirmResolve) {
      confirmResolve(result);
      confirmResolve = null;
    }
  }

  // ── Export / Import ────────────────────────────────────
  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bba_pdf_tracker_${new Date().toISOString().slice(0, 10)}.json`;
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
        const imported = sanitizeData(JSON.parse(ev.target.result));
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

  async function resetToSyllabusDefaults() {
    const isYes = await showConfirm(
      'Reset Syllabus Defaults',
      'Are you sure you want to reset all subjects & units to the official GTU BBA syllabus defaults? This will erase all your custom progress.',
      'Reset Syllabus',
      true
    );
    if (!isYes) return;
    data = getDefaultData();
    persist();
    render();
    closeModal('settingsModal');
    toast('Reset to official syllabus defaults');
  }

  let lastDeleted = null;

  function undo() {
    if (!lastDeleted) return;

    if (lastDeleted.type === 'part') {
      const { u } = find(lastDeleted.subId, lastDeleted.unitId);
      if (u) {
        if (!u.parts) u.parts = [];
        u.parts.splice(lastDeleted.index, 0, lastDeleted.item);
        persist(); render();
        toast('Part restored');
      }
    } else if (lastDeleted.type === 'subject') {
      data.subjects.splice(lastDeleted.index, 0, lastDeleted.item);
      persist(); render();
      toast('Subject restored');
    }

    lastDeleted = null;
    const undoBtn = document.querySelector('.toast-undo-btn');
    if (undoBtn && undoBtn.closest('.toast')) {
      undoBtn.closest('.toast').remove();
    }
  }

  // ── Recycle Bin ─────────────────────────────────────────
  function restoreTrashItem(trashId) {
    if (!data.trash) return;
    const idx = data.trash.findIndex(t => t.id === trashId);
    if (idx === -1) return;
    const item = data.trash[idx];

    if (item.type === 'part') {
      const { u } = find(item.meta.subId, item.meta.unitId);
      if (u) {
        if (!u.parts) u.parts = [];
        u.parts.push(item.payload);
        u.parts.sort((a, b) => (a.number || 0) - (b.number || 0));
        persist(); render();
        toast(`Restored part "${item.name}"`);
      } else {
        toast(`Cannot restore: parent subject or unit was deleted`, true);
      }
    } else if (item.type === 'subject') {
      data.subjects.push(item.payload);
      data.subjects.sort((a, b) => (a.sem || 1) - (b.sem || 1));
      persist(); render();
      toast(`Restored subject "${item.name}"`);
    }

    data.trash.splice(idx, 1);
    persist();
    renderTrash();
  }

  async function clearTrash() {
    const isYes = await showConfirm(
      'Empty Recycle Bin',
      'Are you sure you want to permanently delete all items in the Recycle Bin? This action is permanent and cannot be undone.',
      'Clear Recycle Bin',
      true
    );
    if (!isYes) return;
    data.trash = [];
    persist();
    renderTrash();
    toast('Recycle Bin cleared');
  }

  function renderTrash() {
    const list = document.getElementById('trashList');
    const clearBtn = document.getElementById('btnClearTrash');
    if (!list) return;

    if (!data.trash || !data.trash.length) {
      list.innerHTML = `<div class="trash-empty-state">Recycle Bin is empty</div>`;
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }

    if (clearBtn) clearBtn.style.display = 'block';

    list.innerHTML = data.trash.map(t => {
      const typeLabel = t.type === 'subject' ? '💼 Subject' : '📄 Part';
      const timeStr = new Date(t.deletedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const contextInfo = t.type === 'part' ? `${t.meta.subName} · ${t.meta.unitName}` : `Semester ${t.payload.sem || 1}`;

      return `
        <div class="trash-item">
          <div class="trash-item-info">
            <span class="trash-item-type">${typeLabel}</span>
            <span class="trash-item-name">${esc(t.name)}</span>
            <span class="trash-item-meta">${esc(contextInfo)} · ${timeStr}</span>
          </div>
          <button class="trash-restore-btn" onclick="App.restoreTrashItem('${t.id}')" title="Restore item">↩️ Restore</button>
        </div>
      `;
    }).join('');
  }

  // ── Toast ──────────────────────────────────────────────
  function toast(msg, isError, showUndo) {
    const c = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = isError ? 'toast toast-error' : 'toast toast-success';
    
    let html = `<span class="toast-icon">${isError ? '✕' : '✓'}</span><span class="toast-msg">${msg}</span>`;
    if (showUndo) {
      html += `<button class="toast-undo-btn" onclick="App.undo()">Undo</button>`;
    }
    t.innerHTML = html;
    c.appendChild(t);
    const delay = showUndo ? 5600 : 2600;
    const removeDelay = showUndo ? 6000 : 3000;
    setTimeout(() => t.classList.add('toast-out'), delay);
    setTimeout(() => { if (t.parentNode) t.remove(); }, removeDelay);
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
    const sanitized = sanitizeData(newCloudData);
    if (sanitized && Array.isArray(sanitized.subjects) && sanitized.subjects.length) {
      data = sanitized;
      saveData(data); // update local cache
      render();
    }
  });

  // ── Public API ─────────────────────────────────────────
  return {
    toggleSubject,
    toggleUnit,
    toggleDl,
    togglePr,
    markUnitDl,
    markUnitPr,
    cyclePartPriority,
    editSubjectName,
    editUnitName,
    editPartName,
    addPart,
    deletePart,
    deleteSubject,
    undo,
    restoreTrashItem,
    clearTrash,
    openAddSubjectModal,
    addSubject,
    openSettingsModal,
    toggleSemVisibility,
    setSemFilter,
    openModal,
    closeModal,
    closeConfirm,
    toggleTheme,
    editExamDate,
    toggleReadinessView,
    exportData,
    importData,
    resetToSyllabusDefaults
  };

})();
