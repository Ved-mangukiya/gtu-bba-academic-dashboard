// ============================================================
//  GTU BBA Academic Dashboard — Universal GTU SPI & CGPA Calculator
//  Dedicated peer calculator suite: Sem 1 Quick Calc · Universal Custom Calc · CGPA Planner
//  Isolated in-memory execution · Zero interference with personal saved tracker data
// ============================================================

const GtuCalculator = (() => {

  // GTU Official 10-Point Grade Matrix
  const GTU_SCALE = [
    { grade: 'AA', gp: 10, minPct: 85, maxPct: 100, text: 'Outstanding' },
    { grade: 'AB', gp: 9, minPct: 75, maxPct: 84.99, text: 'Excellent' },
    { grade: 'BB', gp: 8, minPct: 65, maxPct: 74.99, text: 'Very Good' },
    { grade: 'BC', gp: 7, minPct: 55, maxPct: 64.99, text: 'Good' },
    { grade: 'CC', gp: 6, minPct: 45, maxPct: 54.99, text: 'Fair / Average' },
    { grade: 'CD', gp: 5, minPct: 40, maxPct: 44.99, text: 'Pass' },
    { grade: 'DD', gp: 4, minPct: 35, maxPct: 39.99, text: 'Minimum Pass' },
    { grade: 'FF', gp: 0, minPct: 0, maxPct: 34.99, text: 'Fail / Remedial' }
  ];

  // Active sub-mode in calculator tab
  let activeCalcMode = 'sem1'; // 'sem1' | 'custom' | 'cgpa'

  // ─────────────────────────────────────────────────────────────
  // 1. STATE FOR MODE 1: GTU BBA SEMESTER 1 QUICK CALCULATOR
  // ─────────────────────────────────────────────────────────────
  const SEM1_SUBJECT_TEMPLATES = [
    { id: 'ppm', code: 'S1-PPM', name: 'Principles & Practices of Management', credits: 4, maxEse: 70, maxInt: 30, maxPrac: 50, maxTotal: 150 },
    { id: 'fa',  code: 'S1-FA',  name: 'Financial Accounting', credits: 4, maxEse: 70, maxInt: 30, maxPrac: 50, maxTotal: 150 },
    { id: 'bsl', code: 'S1-BSL', name: 'Business Statistics and Logic', credits: 4, maxEse: 70, maxInt: 30, maxPrac: 50, maxTotal: 150 },
    { id: 'eng', code: 'S1-ENG', name: 'General Communicative English', credits: 4, maxEse: 70, maxInt: 30, maxPrac: 50, maxTotal: 150 },
    { id: 'iks', code: 'S1-IKS', name: 'Indian Knowledge Systems', credits: 2, maxEse: 50, maxInt: 30, maxPrac: 20, maxTotal: 100 },
    { id: 'esg', code: 'S1-ESG', name: 'Fundamentals of ESG for Sustainability', credits: 2, maxEse: 50, maxInt: 30, maxPrac: 20, maxTotal: 100 }
  ];

  let sem1Inputs = {};

  function initSem1Inputs() {
    sem1Inputs = {};
    SEM1_SUBJECT_TEMPLATES.forEach(s => {
      sem1Inputs[s.id] = {
        examRaw: null,   // 0 - 40 College Internal Exam
        practical: null, // 0 - 50 or 0 - 20
        ese: null        // 0 - 70 or 0 - 50
      };
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 2. STATE FOR MODE 2: UNIVERSAL CUSTOM SPI / SGPA CALCULATOR
  // ─────────────────────────────────────────────────────────────
  let customSubjects = [
    { id: 'csub_1', name: 'Subject 1', credits: 4, grade: 'AA' },
    { id: 'csub_2', name: 'Subject 2', credits: 4, grade: 'AB' },
    { id: 'csub_3', name: 'Subject 3', credits: 4, grade: 'AB' },
    { id: 'csub_4', name: 'Subject 4', credits: 4, grade: 'BB' },
    { id: 'csub_5', name: 'Subject 5', credits: 2, grade: 'AA' },
    { id: 'csub_6', name: 'Subject 6', credits: 2, grade: 'AB' }
  ];

  // ─────────────────────────────────────────────────────────────
  // 3. STATE FOR MODE 3: MULTI-SEMESTER CGPA & TARGET PLANNER
  // ─────────────────────────────────────────────────────────────
  let cgpaSemesters = [
    { sem: 1, name: 'Semester 1', credits: 20, spi: null, completed: false },
    { sem: 2, name: 'Semester 2', credits: 20, spi: null, completed: false },
    { sem: 3, name: 'Semester 3', credits: 20, spi: null, completed: false },
    { sem: 4, name: 'Semester 4', credits: 20, spi: null, completed: false },
    { sem: 5, name: 'Semester 5', credits: 20, spi: null, completed: false },
    { sem: 6, name: 'Semester 6', credits: 20, spi: null, completed: false }
  ];
  let targetCgpaGoal = 8.5;

  // Grade helper
  function getGradeInfo(pct, hasComponentFailed = false) {
    if (hasComponentFailed || pct < 35) return { grade: 'FF', gp: 0, text: 'Fail / Remedial', pass: false };
    if (pct >= 85) return { grade: 'AA', gp: 10, text: 'Outstanding', pass: true };
    if (pct >= 75) return { grade: 'AB', gp: 9, text: 'Excellent', pass: true };
    if (pct >= 65) return { grade: 'BB', gp: 8, text: 'Very Good', pass: true };
    if (pct >= 55) return { grade: 'BC', gp: 7, text: 'Good', pass: true };
    if (pct >= 45) return { grade: 'CC', gp: 6, text: 'Fair / Average', pass: true };
    if (pct >= 40) return { grade: 'CD', gp: 5, text: 'Pass / Below Avg', pass: true };
    if (pct >= 35) return { grade: 'DD', gp: 4, text: 'Minimum Pass', pass: true };
    return { grade: 'FF', gp: 0, text: 'Fail / Remedial', pass: false };
  }

  function getGpForGrade(grade) {
    const item = GTU_SCALE.find(g => g.grade === grade);
    return item ? item.gp : 0;
  }

  // ─────────────────────────────────────────────────────────────
  // CONTROLLER INITIALIZATION & TAB SWITCHING
  // ─────────────────────────────────────────────────────────────
  function init() {
    if (Object.keys(sem1Inputs).length === 0) {
      initSem1Inputs();
    }
    renderCalculatorView();
  }

  function setCalcMode(mode) {
    activeCalcMode = mode;
    renderCalculatorView();
  }

  function renderCalculatorView() {
    const container = document.getElementById('calculatorContent');
    if (!container) return;

    // Update nav pill buttons
    const pillSem1 = document.getElementById('calcPillSem1');
    const pillCustom = document.getElementById('calcPillCustom');
    const pillCgpa = document.getElementById('calcPillCgpa');
    if (pillSem1) pillSem1.classList.toggle('active', activeCalcMode === 'sem1');
    if (pillCustom) pillCustom.classList.toggle('active', activeCalcMode === 'custom');
    if (pillCgpa) pillCgpa.classList.toggle('active', activeCalcMode === 'cgpa');

    if (activeCalcMode === 'sem1') {
      renderSem1Mode(container);
    } else if (activeCalcMode === 'custom') {
      renderCustomMode(container);
    } else {
      renderCgpaMode(container);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER MODE 1: GTU BBA SEMESTER 1 QUICK CALCULATOR
  // ─────────────────────────────────────────────────────────────
  function calculateSem1Row(tmpl, rowData) {
    const minInternal = 11; // 35% of 30
    const minPractical = Math.ceil(tmpl.maxPrac * 0.35); // 18 for 4c, 7 for 2c
    const minEse = Math.ceil(tmpl.maxEse * 0.35);         // 25 for 4c, 18 for 2c
    const minTotal = Math.ceil(tmpl.maxTotal * 0.35);     // 53 for 4c, 35 for 2c

    const hasExam = typeof rowData.examRaw === 'number' && !isNaN(rowData.examRaw);
    const hasPractical = typeof rowData.practical === 'number' && !isNaN(rowData.practical);
    const hasEse = typeof rowData.ese === 'number' && !isNaN(rowData.ese);

    // Scaling: 40 marks exam converts directly to 30 marks GTU internal score (raw * 0.75)
    const scaledInt = hasExam ? Math.min(30, Math.round((rowData.examRaw * 0.75) * 10) / 10) : 0;
    const practical = hasPractical ? Math.min(tmpl.maxPrac, rowData.practical) : 0;
    const ese = hasEse ? Math.min(tmpl.maxEse, rowData.ese) : 0;

    const totalScore = Math.round((scaledInt + practical + ese) * 10) / 10;
    const pct = Math.round((totalScore / tmpl.maxTotal) * 1000) / 10;

    const isIntFailed = hasExam && (scaledInt < minInternal);
    const isPracFailed = hasPractical && (practical < minPractical);
    const isEseFailed = hasEse && (ese < minEse);
    const hasAnyFailed = isIntFailed || isPracFailed || isEseFailed;

    const hasAnyDeclared = hasExam || hasPractical || hasEse;
    const hasAllDeclared = hasExam && hasPractical && hasEse;

    let gradeInfo = { grade: '--', gp: 0, text: 'Pending', pass: false };
    if (hasAnyFailed) {
      gradeInfo = { grade: 'FF', gp: 0, text: 'Backlog / Component Fail', pass: false };
    } else if (hasAllDeclared) {
      gradeInfo = getGradeInfo(pct, totalScore < minTotal);
    } else if (hasAnyDeclared) {
      // Pacing grade based on declared components
      const declaredMax = (hasExam ? tmpl.maxInt : 0) + (hasPractical ? tmpl.maxPrac : 0) + (hasEse ? tmpl.maxEse : 0);
      const declaredPct = declaredMax > 0 ? (totalScore / declaredMax) * 100 : 0;
      gradeInfo = getGradeInfo(declaredPct, false);
    }

    return {
      hasExam, hasPractical, hasEse, hasAnyDeclared, hasAllDeclared,
      scaledInt, practical, ese, totalScore, pct,
      isIntFailed, isPracFailed, isEseFailed, hasAnyFailed,
      grade: gradeInfo.grade, gp: gradeInfo.gp, gradeText: gradeInfo.text,
      creditPoints: tmpl.credits * gradeInfo.gp,
      minInternal, minPractical, minEse, minTotal
    };
  }

  function getSem1OverallStats() {
    let totalScore = 0;
    let totalMax = 0;
    let weightedGp = 0;
    let totalCredits = 20;
    let declaredCredits = 0;
    let failCount = 0;
    let declaredSubs = 0;
    let allDeclaredCount = 0;

    const gradeCounts = {};

    SEM1_SUBJECT_TEMPLATES.forEach(tmpl => {
      const row = sem1Inputs[tmpl.id] || {};
      const res = calculateSem1Row(tmpl, row);
      totalScore += res.totalScore;
      totalMax += tmpl.maxTotal;

      if (res.hasAnyDeclared) {
        declaredSubs++;
        declaredCredits += tmpl.credits;
        weightedGp += res.creditPoints;
      }
      if (res.hasAllDeclared) allDeclaredCount++;
      if (res.hasAnyFailed) failCount++;

      if (res.grade !== '--') {
        gradeCounts[res.grade] = (gradeCounts[res.grade] || 0) + 1;
      }
    });

    const spi = totalCredits ? Math.round((weightedGp / totalCredits) * 100) / 100 : 0;
    const pacingSpi = declaredCredits ? Math.round((weightedGp / declaredCredits) * 100) / 100 : 0;
    const overallPct = totalMax ? Math.round((totalScore / totalMax) * 1000) / 10 : 0;
    const gtuEquivPct = spi >= 5.0 ? Math.round((spi - 0.5) * 10 * 100) / 100 : Math.round(overallPct * 10) / 10;

    let resultClass = 'Pending Evaluation';
    if (failCount > 0) {
      resultClass = '⚠️ Remedial / Backlog';
    } else if (spi >= 8.5) {
      resultClass = '🌟 Outstanding (Distinction)';
    } else if (spi >= 7.5) {
      resultClass = '🎯 First Class with Distinction';
    } else if (spi >= 6.5) {
      resultClass = '📈 First Class';
    } else if (spi >= 5.5) {
      resultClass = '📊 Higher Second Class';
    } else if (spi >= 4.0) {
      resultClass = 'Pass Class';
    }

    return {
      totalScore, totalMax, overallPct, spi, pacingSpi, gtuEquivPct, resultClass,
      failCount, declaredSubs, allDeclaredCount, totalSubs: SEM1_SUBJECT_TEMPLATES.length,
      gradeCounts
    };
  }

  function renderSem1Mode(container) {
    const stats = getSem1OverallStats();

    let subjectsHtml = '';
    SEM1_SUBJECT_TEMPLATES.forEach(s => {
      const row = sem1Inputs[s.id] || {};
      const res = calculateSem1Row(s, row);

      const rawMidVal = (row.examRaw !== null && row.examRaw !== undefined) ? row.examRaw : '';
      const pracVal = (row.practical !== null && row.practical !== undefined) ? row.practical : '';
      const eseVal = (row.ese !== null && row.ese !== undefined) ? row.ese : '';

      subjectsHtml += `
        <div class="calc-sub-card ${res.hasAnyFailed ? 'calc-card-failed' : ''}">
          <div class="calc-sub-head">
            <div class="calc-sub-title-wrap">
              <span class="calc-sub-code">${s.code}</span>
              <span class="calc-sub-name">${s.name}</span>
              <span class="calc-credit-pill">${s.credits} Credits</span>
            </div>
            <div class="calc-sub-badge-wrap">
              <span class="calc-grade-badge grade-${res.grade === '--' ? 'pending' : res.grade}">
                ${res.grade} ${res.gp ? `(${res.gp} GP)` : ''}
              </span>
            </div>
          </div>

          <div class="calc-inputs-grid">
            <!-- College Exam Input (0-40) -->
            <div class="calc-field-col">
              <label class="calc-field-label">
                <span>College Exam</span>
                <span class="calc-max-hint">/ 40</span>
              </label>
              <div class="calc-input-wrap">
                <input type="number" class="calc-num-input ${res.isIntFailed ? 'input-error' : ''}"
                       min="0" max="40" step="0.5" placeholder="0–40"
                       value="${rawMidVal}"
                       oninput="GtuCalculator.onSem1Input('${s.id}', 'examRaw', this.value)" />
              </div>
              <div class="calc-sub-hint">
                ${res.hasExam
                  ? `<span class="calc-conv-tag ${res.isIntFailed ? 'tag-failed' : 'tag-passed'}">
                      ⚡ <strong>${res.scaledInt}/30</strong> GTU (×0.75)
                    </span>`
                  : `<span class="calc-conv-tag">Scales: 40 ➔ 30 (Min 15)</span>`
                }
              </div>
            </div>

            <!-- College Practical Input -->
            <div class="calc-field-col">
              <label class="calc-field-label">
                <span>Practical</span>
                <span class="calc-max-hint">/ ${s.maxPrac}</span>
              </label>
              <div class="calc-input-wrap">
                <input type="number" class="calc-num-input ${res.isPracFailed ? 'input-error' : ''}"
                       min="0" max="${s.maxPrac}" step="0.5" placeholder="0–${s.maxPrac}"
                       value="${pracVal}"
                       oninput="GtuCalculator.onSem1Input('${s.id}', 'practical', this.value)" />
              </div>
              <div class="calc-sub-hint">
                <span class="calc-conv-tag ${res.isPracFailed ? 'tag-failed' : ''}">Min ${res.minPractical} to pass</span>
              </div>
            </div>

            <!-- ESE University Exam Input -->
            <div class="calc-field-col">
              <label class="calc-field-label">
                <span>GTU Exam (ESE)</span>
                <span class="calc-max-hint">/ ${s.maxEse}</span>
              </label>
              <div class="calc-input-wrap">
                <input type="number" class="calc-num-input ${res.isEseFailed ? 'input-error' : ''}"
                       min="0" max="${s.maxEse}" step="0.5" placeholder="0–${s.maxEse}"
                       value="${eseVal}"
                       oninput="GtuCalculator.onSem1Input('${s.id}', 'ese', this.value)" />
              </div>
              <div class="calc-sub-hint">
                <span class="calc-conv-tag ${res.isEseFailed ? 'tag-failed' : ''}">Min ${res.minEse} to pass</span>
              </div>
            </div>
          </div>

          <div class="calc-sub-foot">
            <div class="calc-score-display">
              Total: <strong>${res.totalScore} / ${s.maxTotal}</strong>
              <span class="calc-pct-tag">(${res.pct.toFixed(1)}%)</span>
            </div>
            <div class="calc-cp-display">
              Credit Points: <strong>${s.credits}c × ${res.gp} = ${res.creditPoints} pts</strong>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <!-- RESULT HERO SUMMARY CARD -->
      <section class="calc-hero-summary">
        <div class="calc-hero-top">
          <div>
            <span class="calc-hero-badge">🎓 SSASIT GTU BBA Sem 1</span>
            <h2 class="calc-hero-h2">Calculated SPI / SGPA</h2>
            <p class="calc-hero-sub">Pinpoint 20-Credit Formula with 40 ➔ 30 Internal Scaling</p>
          </div>
          <div class="calc-hero-actions">
            <button type="button" class="btn btn-accent btn-sm" onclick="GtuCalculator.copyWhatsAppReport()" title="Copy clean formatted report to share on WhatsApp">
              📋 Copy WhatsApp Report
            </button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="GtuCalculator.resetSem1()" title="Reset all marks to 0">
              🔄 Clear
            </button>
          </div>
        </div>

        <div class="calc-stat-cards-grid">
          <div class="calc-stat-card card-hero-spi">
            <span class="calc-stat-lbl">Official Semester SPI</span>
            <span class="calc-stat-val" id="calcSpiVal">${stats.spi.toFixed(2)}</span>
            <span class="calc-stat-sub">${stats.resultClass}</span>
          </div>

          <div class="calc-stat-card card-hero-marks">
            <span class="calc-stat-lbl">Total Marks Secured</span>
            <span class="calc-stat-val">${stats.totalScore} / ${stats.totalMax}</span>
            <span class="calc-stat-sub">Raw: ${stats.overallPct.toFixed(1)}% Marks</span>
          </div>

          <div class="calc-stat-card card-hero-gtu">
            <span class="calc-stat-lbl">GTU Equivalent %</span>
            <span class="calc-stat-val">${stats.gtuEquivPct.toFixed(1)}%</span>
            <span class="calc-stat-sub">(SPI - 0.5) × 10 Formula</span>
          </div>
        </div>

        <!-- QUICK PRESETS ROW -->
        <div class="calc-presets-bar">
          <span class="calc-preset-lbl">Quick Presets:</span>
          <button type="button" class="calc-preset-chip" onclick="GtuCalculator.applySem1Preset('aa')">🌟 10.0 SPI (All AA)</button>
          <button type="button" class="calc-preset-chip" onclick="GtuCalculator.applySem1Preset('ab')">🎯 8.5 SPI (Distinction)</button>
          <button type="button" class="calc-preset-chip" onclick="GtuCalculator.applySem1Preset('bb')">📈 7.5 SPI (First Class)</button>
          <button type="button" class="calc-preset-chip" onclick="GtuCalculator.applySem1Preset('min_pass')">⚠️ 4.0 SPI (Min Pass)</button>
        </div>
      </section>

      <!-- SUBJECT INPUT LIST -->
      <section class="calc-subjects-section">
        <div class="calc-section-header">
          <h3 class="calc-h3">Sem 1 Subjects & Marks Breakdown</h3>
          <span class="calc-sub-note">Enter any component — calculation updates instantly</span>
        </div>
        <div class="calc-cards-list">
          ${subjectsHtml}
        </div>
      </section>
    `;
  }

  function onSem1Input(subId, field, val) {
    if (!sem1Inputs[subId]) sem1Inputs[subId] = {};
    if (val === '' || val === null || val === undefined) {
      sem1Inputs[subId][field] = null;
    } else {
      const num = parseFloat(val);
      sem1Inputs[subId][field] = isNaN(num) ? null : Math.max(0, num);
    }
    renderCalculatorView();
  }

  function resetSem1() {
    initSem1Inputs();
    renderCalculatorView();
    App.toast('Reset calculator marks');
  }

  function applySem1Preset(presetKey) {
    SEM1_SUBJECT_TEMPLATES.forEach(s => {
      const is4c = s.credits === 4;
      if (presetKey === 'aa') {
        // 10.0 SPI: AA Grade (>= 85%)
        sem1Inputs[s.id] = { examRaw: 40, practical: is4c ? 48 : 19, ese: is4c ? 65 : 46 };
      } else if (presetKey === 'ab') {
        // ~8.5 SPI: AB Grade (75-84%)
        sem1Inputs[s.id] = { examRaw: 36, practical: is4c ? 42 : 17, ese: is4c ? 56 : 40 };
      } else if (presetKey === 'bb') {
        // ~7.5 SPI: BB Grade (65-74%)
        sem1Inputs[s.id] = { examRaw: 32, practical: is4c ? 36 : 14, ese: is4c ? 48 : 34 };
      } else if (presetKey === 'min_pass') {
        // ~4.0 SPI: DD Grade (35-39%)
        sem1Inputs[s.id] = { examRaw: 16, practical: is4c ? 18 : 7, ese: is4c ? 26 : 18 };
      }
    });
    renderCalculatorView();
    App.toast(`Applied preset: ${presetKey.toUpperCase()}`);
  }

  function copyWhatsAppReport() {
    const stats = getSem1OverallStats();

    let breakdown = '';
    SEM1_SUBJECT_TEMPLATES.forEach(s => {
      const row = sem1Inputs[s.id] || {};
      const res = calculateSem1Row(s, row);
      const rawExam = row.examRaw !== null ? `${row.examRaw}/40` : '--';
      const prac = row.practical !== null ? `${row.practical}/${s.maxPrac}` : '--';
      const ese = row.ese !== null ? `${row.ese}/${s.maxEse}` : '--';

      breakdown += `• ${s.code} (${s.credits}c): ${res.totalScore}/${s.maxTotal} [${res.grade} · ${res.gp} GP]\n  Exam: ${rawExam} (➔ ${res.scaledInt}/30) | Prac: ${prac} | ESE: ${ese}\n`;
    });

    const text = 
`🎓 *GTU BBA SEMESTER 1 RESULT REPORT*
━━━━━━━━━━━━━━━━━━━━━━━━
📊 *Calculated SPI / SGPA:* *${stats.spi.toFixed(2)}*
🎯 *GTU Equivalent %:* *${stats.gtuEquivPct.toFixed(1)}%*
📝 *Total Marks:* *${stats.totalScore} / ${stats.totalMax}* (${stats.overallPct.toFixed(1)}%)
🏆 *Result Status:* *${stats.resultClass}*
━━━━━━━━━━━━━━━━━━━━━━━━
📚 *Subject-wise Performance:*
${breakdown}━━━━━━━━━━━━━━━━━━━━━━━━
⚡ *Official College Policy:* 40 Marks Internal Exam converted directly to 30 Marks GTU Internal.
🌐 *Generated via SSASIT GTU BBA Academic Portal*`;

    navigator.clipboard.writeText(text).then(() => {
      App.toast('📋 WhatsApp Report copied to clipboard!');
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      App.toast('📋 Report copied to clipboard!');
    });
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER MODE 2: UNIVERSAL CUSTOM SPI / SGPA CALCULATOR
  // ─────────────────────────────────────────────────────────────
  function renderCustomMode(container) {
    let weightedGp = 0;
    let totalCredits = 0;
    let hasFail = false;

    let rowsHtml = '';
    customSubjects.forEach((sub, idx) => {
      const gp = getGpForGrade(sub.grade);
      const cp = sub.credits * gp;
      weightedGp += cp;
      totalCredits += sub.credits;
      if (sub.grade === 'FF') hasFail = true;

      const gradeOptions = GTU_SCALE.map(g => `
        <option value="${g.grade}" ${sub.grade === g.grade ? 'selected' : ''}>
          ${g.grade} (${g.gp} GP · ${g.text})
        </option>
      `).join('');

      rowsHtml += `
        <tr class="custom-row ${sub.grade === 'FF' ? 'row-fail' : ''}">
          <td>
            <input type="text" class="custom-name-input" value="${sub.name}"
                   oninput="GtuCalculator.onCustomSubChange('${sub.id}', 'name', this.value)" placeholder="Subject Name" />
          </td>
          <td>
            <input type="number" class="custom-cred-input" min="1" max="8" value="${sub.credits}"
                   oninput="GtuCalculator.onCustomSubChange('${sub.id}', 'credits', this.value)" />
          </td>
          <td>
            <select class="custom-grade-select" onchange="GtuCalculator.onCustomSubChange('${sub.id}', 'grade', this.value)">
              ${gradeOptions}
            </select>
          </td>
          <td class="custom-cp-cell">
            <strong>${cp} pts</strong>
            <span class="custom-cp-sub">${sub.credits} × ${gp}</span>
          </td>
          <td class="custom-del-cell">
            <button type="button" class="custom-del-btn" onclick="GtuCalculator.deleteCustomSub('${sub.id}')" title="Delete Subject">✕</button>
          </td>
        </tr>
      `;
    });

    const spi = totalCredits ? Math.round((weightedGp / totalCredits) * 100) / 100 : 0;
    const gtuPct = spi >= 5.0 ? Math.round((spi - 0.5) * 10 * 100) / 100 : 0;

    let statusText = hasFail ? '⚠️ Remedial (FF Grade)' : (spi >= 8.5 ? '🌟 Outstanding' : (spi >= 7.5 ? '🎯 Distinction' : (spi >= 6.5 ? 'First Class' : 'Pass')));

    container.innerHTML = `
      <section class="calc-hero-summary">
        <div class="calc-hero-top">
          <div>
            <span class="calc-hero-badge">🌐 Universal GTU Calculator</span>
            <h2 class="calc-hero-h2">Custom Semester SPI / SGPA</h2>
            <p class="calc-hero-sub">Add any subjects with custom credits to calculate weighted SPI for any semester or branch</p>
          </div>
          <div class="calc-hero-actions">
            <button type="button" class="btn btn-accent btn-sm" onclick="GtuCalculator.addCustomSub()">
              ➕ Add Subject
            </button>
          </div>
        </div>

        <div class="calc-stat-cards-grid">
          <div class="calc-stat-card card-hero-spi">
            <span class="calc-stat-lbl">Calculated SPI / SGPA</span>
            <span class="calc-stat-val">${spi.toFixed(2)}</span>
            <span class="calc-stat-sub">${statusText}</span>
          </div>

          <div class="calc-stat-card card-hero-gtu">
            <span class="calc-stat-lbl">GTU Equivalent %</span>
            <span class="calc-stat-val">${gtuPct.toFixed(1)}%</span>
            <span class="calc-stat-sub">(SPI - 0.5) × 10</span>
          </div>

          <div class="calc-stat-card card-hero-marks">
            <span class="calc-stat-lbl">Total Credits</span>
            <span class="calc-stat-val">${totalCredits}</span>
            <span class="calc-stat-sub">Sum of Credit Points: ${weightedGp}</span>
          </div>
        </div>
      </section>

      <section class="calc-custom-table-wrap">
        <table class="calc-table">
          <thead>
            <tr>
              <th>Subject Name</th>
              <th style="width: 100px;">Credits</th>
              <th style="width: 180px;">Letter Grade</th>
              <th style="width: 140px;">Credit Points</th>
              <th style="width: 60px;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </section>
    `;
  }

  function addCustomSub() {
    const nextNum = customSubjects.length + 1;
    customSubjects.push({
      id: 'csub_' + Date.now(),
      name: `Subject ${nextNum}`,
      credits: 4,
      grade: 'AB'
    });
    renderCalculatorView();
  }

  function deleteCustomSub(id) {
    if (customSubjects.length <= 1) {
      App.toast('Keep at least 1 subject');
      return;
    }
    customSubjects = customSubjects.filter(x => x.id !== id);
    renderCalculatorView();
  }

  function onCustomSubChange(id, field, val) {
    const sub = customSubjects.find(x => x.id === id);
    if (!sub) return;
    if (field === 'credits') {
      const num = parseInt(val, 10);
      sub.credits = isNaN(num) ? 1 : Math.max(1, Math.min(10, num));
    } else if (field === 'grade') {
      sub.grade = val;
    } else {
      sub.name = val;
    }
    renderCalculatorView();
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER MODE 3: MULTI-SEMESTER CGPA / CPI & TARGET PLANNER
  // ─────────────────────────────────────────────────────────────
  function renderCgpaMode(container) {
    let completedPoints = 0;
    let completedCredits = 0;
    let totalPlannedCredits = 0;

    let rowsHtml = '';
    cgpaSemesters.forEach(s => {
      totalPlannedCredits += s.credits;
      const hasSpi = typeof s.spi === 'number' && !isNaN(s.spi) && s.spi > 0;
      const cp = hasSpi ? Math.round(s.credits * s.spi * 100) / 100 : 0;
      if (hasSpi) {
        completedPoints += cp;
        completedCredits += s.credits;
      }

      rowsHtml += `
        <tr>
          <td><strong>${s.name}</strong></td>
          <td>
            <input type="number" class="cgpa-cred-input" min="1" max="30" value="${s.credits}"
                   oninput="GtuCalculator.onCgpaChange(${s.sem}, 'credits', this.value)" />
          </td>
          <td>
            <input type="number" class="cgpa-spi-input" min="0" max="10" step="0.01" placeholder="e.g. 8.50"
                   value="${hasSpi ? s.spi : ''}"
                   oninput="GtuCalculator.onCgpaChange(${s.sem}, 'spi', this.value)" />
          </td>
          <td>
            <strong>${hasSpi ? cp.toFixed(2) : '--'} pts</strong>
          </td>
        </tr>
      `;
    });

    const cgpa = completedCredits ? Math.round((completedPoints / completedCredits) * 100) / 100 : 0;
    const gtuPct = cgpa >= 5.0 ? Math.round((cgpa - 0.5) * 10 * 100) / 100 : 0;

    // Target Planner calculation:
    const neededTotalPoints = targetCgpaGoal * totalPlannedCredits;
    const remainingPoints = neededTotalPoints - completedPoints;
    const remainingCredits = totalPlannedCredits - completedCredits;
    const reqFutureSpi = remainingCredits > 0 ? (remainingPoints / remainingCredits) : 0;

    let targetAdviceHtml = '';
    if (remainingCredits <= 0) {
      targetAdviceHtml = `🎉 All 6 semesters completed! Final CGPA is <strong>${cgpa.toFixed(2)}</strong>.`;
    } else if (reqFutureSpi > 10.0) {
      targetAdviceHtml = `⚠️ <strong>High Target:</strong> Even with a perfect 10.00 SPI in all remaining ${remainingCredits} credits, maximum achievable CGPA is <strong>${((completedPoints + remainingCredits * 10) / totalPlannedCredits).toFixed(2)}</strong>.`;
    } else if (reqFutureSpi <= 4.0) {
      targetAdviceHtml = `🟢 <strong>Comfortable:</strong> You only need minimum passing SPI (<strong>${Math.max(4.0, reqFutureSpi).toFixed(2)}</strong>) in remaining semesters to achieve ${targetCgpaGoal.toFixed(2)} CGPA!`;
    } else {
      targetAdviceHtml = `🎯 To achieve your target of <strong>${targetCgpaGoal.toFixed(2)} CGPA</strong>, score an average of <strong>${reqFutureSpi.toFixed(2)} SPI</strong> across the remaining ${remainingCredits} credits (${(remainingCredits / 20).toFixed(0)} semesters).`;
    }

    container.innerHTML = `
      <section class="calc-hero-summary">
        <div class="calc-hero-top">
          <div>
            <span class="calc-hero-badge">📊 Multi-Semester Tracker</span>
            <h2 class="calc-hero-h2">Cumulative CGPA & Target Planner</h2>
            <p class="calc-hero-sub">Enter SPI secured in each completed semester to calculate cumulative CGPA and plan future SPI goals</p>
          </div>
        </div>

        <div class="calc-stat-cards-grid">
          <div class="calc-stat-card card-hero-spi">
            <span class="calc-stat-lbl">Cumulative CGPA</span>
            <span class="calc-stat-val">${cgpa.toFixed(2)}</span>
            <span class="calc-stat-sub">${completedCredits} of ${totalPlannedCredits} Credits Evaluated</span>
          </div>

          <div class="calc-stat-card card-hero-gtu">
            <span class="calc-stat-lbl">GTU Equivalent %</span>
            <span class="calc-stat-val">${gtuPct.toFixed(1)}%</span>
            <span class="calc-stat-sub">(CGPA - 0.5) × 10</span>
          </div>

          <div class="calc-stat-card card-hero-marks">
            <span class="calc-stat-lbl">Total Credit Points</span>
            <span class="calc-stat-val">${completedPoints.toFixed(1)}</span>
            <span class="calc-stat-sub">Earned Points so far</span>
          </div>
        </div>

        <!-- TARGET PLANNER CARD -->
        <div class="cgpa-target-planner-box">
          <div class="target-planner-head">
            <label for="cgpaGoalInput">🎯 Set Your Target Final CGPA Goal:</label>
            <div class="target-goal-stepper">
              <input type="number" id="cgpaGoalInput" min="5" max="10" step="0.1" value="${targetCgpaGoal.toFixed(1)}"
                     oninput="GtuCalculator.onTargetGoalChange(this.value)" />
              <span>CGPA</span>
            </div>
          </div>
          <div class="target-planner-advice">
            ${targetAdviceHtml}
          </div>
        </div>
      </section>

      <section class="calc-custom-table-wrap">
        <table class="calc-table">
          <thead>
            <tr>
              <th>Semester</th>
              <th style="width: 140px;">Credits</th>
              <th style="width: 180px;">SPI Secured</th>
              <th style="width: 140px;">Credit Points</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </section>
    `;
  }

  function onCgpaChange(semNum, field, val) {
    const s = cgpaSemesters.find(x => x.sem === semNum);
    if (!s) return;
    if (field === 'spi') {
      const num = parseFloat(val);
      s.spi = isNaN(num) ? null : Math.max(0, Math.min(10, num));
    } else if (field === 'credits') {
      const num = parseInt(val, 10);
      s.credits = isNaN(num) ? 20 : Math.max(1, Math.min(35, num));
    }
    renderCalculatorView();
  }

  function onTargetGoalChange(val) {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      targetCgpaGoal = Math.max(4.0, Math.min(10.0, num));
      renderCalculatorView();
    }
  }

  // Public API
  return {
    init,
    setCalcMode,
    onSem1Input,
    resetSem1,
    applySem1Preset,
    copyWhatsAppReport,
    addCustomSub,
    deleteCustomSub,
    onCustomSubChange,
    onCgpaChange,
    onTargetGoalChange
  };

})();

window.GtuCalculator = GtuCalculator;
