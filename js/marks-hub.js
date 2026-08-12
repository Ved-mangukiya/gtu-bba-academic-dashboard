// ============================================================
//  GTU BBA Academic Dashboard — Marks & GTU Performance Hub Controller
//  Uses App.getData() to access shared application state
// ============================================================

const MarksHub = (() => {

  // Convenience accessor — always gets the live data reference from App
  function d() { return App.getData(); }

  function getGtuGradeAndPoints(pct, isEseFailed = false) {
    if (isEseFailed || pct < 35) return { grade: 'FF', gp: 0, pass: false, text: 'Fail' };
    if (pct >= 85) return { grade: 'AA', gp: 10, pass: true, text: 'Pass' };
    if (pct >= 75) return { grade: 'AB', gp: 9, pass: true, text: 'Pass' };
    if (pct >= 65) return { grade: 'BB', gp: 8, pass: true, text: 'Pass' };
    if (pct >= 55) return { grade: 'BC', gp: 7, pass: true, text: 'Pass' };
    if (pct >= 45) return { grade: 'CC', gp: 6, pass: true, text: 'Pass' };
    if (pct >= 40) return { grade: 'CD', gp: 5, pass: true, text: 'Pass' };
    if (pct >= 35) return { grade: 'DD', gp: 4, pass: true, text: 'Pass' };
    return { grade: 'FF', gp: 0, pass: false, text: 'Fail' };
  }

  function calcSubjectMarks(s) {
    const m = s.marks || {};
    const credits = s.credits || 4;
    const maxEse = s.maxEse || (credits === 2 ? 50 : 70);
    const maxInternal = s.maxInternal || 30;
    const maxPractical = s.maxPractical || (credits === 2 ? 20 : 50);
    const maxMarks = s.maxMarks || (maxEse + maxInternal + maxPractical);

    let internalTotal = 0;
    if (m.isLumpsum) {
      internalTotal = (typeof m.internalLumpsum === 'number') ? Math.min(Math.max(m.internalLumpsum, 0), maxInternal) : 0;
    } else {
      const mid = (typeof m.internalMid === 'number') ? Math.min(Math.max(m.internalMid, 0), 20) : 0;
      const att = (typeof m.internalAtt === 'number') ? Math.min(Math.max(m.internalAtt, 0), 5) : 0;
      const beh = (typeof m.internalBeh === 'number') ? Math.min(Math.max(m.internalBeh, 0), 5) : 0;
      internalTotal = mid + att + beh;
    }

    const practical = (typeof m.practical === 'number') ? Math.min(Math.max(m.practical, 0), maxPractical) : 0;
    const ese = (typeof m.ese === 'number') ? Math.min(Math.max(m.ese, 0), maxEse) : 0;

    const totalScore = internalTotal + practical + ese;
    const pct = maxMarks ? (totalScore / maxMarks) * 100 : 0;

    const eseMinReq = maxEse * 0.35;
    const isEseFailed = (m.ese !== null && m.ese !== undefined && m.ese !== '') ? (ese < eseMinReq) : false;
    const gradeInfo = getGtuGradeAndPoints(pct, isEseFailed);

    return {
      credits, maxMarks, maxEse, maxInternal, maxPractical,
      internalTotal, practical, ese, totalScore, pct, isEseFailed,
      grade: gradeInfo.grade, gp: gradeInfo.gp, pass: gradeInfo.pass
    };
  }

  function calcOverallMarksStats() {
    const data = d();
    const sem1Subs = (data.subjects || []).filter(s => (s.sem || 1) === 1);

    let totalObtained = 0, totalMaxMarks = 0, weightedGpSum = 0, totalCreditsSum = 0, failCount = 0;

    sem1Subs.forEach(s => {
      const res = calcSubjectMarks(s);
      totalObtained += res.totalScore;
      totalMaxMarks += res.maxMarks;
      weightedGpSum += res.credits * res.gp;
      totalCreditsSum += res.credits;
      if (!res.pass) failCount++;
    });

    const spi = totalCreditsSum ? (weightedGpSum / totalCreditsSum) : 0;
    const overallPct = totalMaxMarks ? (totalObtained / totalMaxMarks) * 100 : 0;

    return { totalObtained, totalMaxMarks, overallPct, spi, totalCreditsSum, weightedGpSum, failCount };
  }

  function renderTargetBacktracker() {
    const data = d();
    const targetSpi = (data.settings && typeof data.settings.targetSpi === 'number') ? data.settings.targetSpi : 8.5;

    const inputEl = document.getElementById('targetSpiInput');
    if (inputEl && document.activeElement !== inputEl) inputEl.value = targetSpi;

    let targetGrade = 'DD', targetPct = 35;
    if (targetSpi >= 9.5) { targetGrade = 'AA'; targetPct = 85; }
    else if (targetSpi >= 8.5) { targetGrade = 'AB'; targetPct = 75; }
    else if (targetSpi >= 7.5) { targetGrade = 'BB'; targetPct = 65; }
    else if (targetSpi >= 6.5) { targetGrade = 'BC'; targetPct = 55; }
    else if (targetSpi >= 5.5) { targetGrade = 'CC'; targetPct = 45; }
    else if (targetSpi >= 4.5) { targetGrade = 'CD'; targetPct = 40; }
    else { targetGrade = 'DD'; targetPct = 35; }

    const targetTotal4 = Math.ceil(150 * (targetPct / 100));
    const targetTotal2 = Math.ceil(100 * (targetPct / 100));

    const sem1Subs = (data.subjects || []).filter(s => (s.sem || 1) === 1);
    let count4 = 0, sumIntPr4 = 0, maxIntPr4 = 0;
    let count2 = 0, sumIntPr2 = 0, maxIntPr2 = 0;

    sem1Subs.forEach(s => {
      const res = calcSubjectMarks(s);
      const intPrSum = res.internalTotal + res.practical;
      const intPrMax = res.maxInternal + res.maxPractical;
      if (res.credits === 4) { count4++; sumIntPr4 += intPrSum; maxIntPr4 += intPrMax; }
      else { count2++; sumIntPr2 += intPrSum; maxIntPr2 += intPrMax; }
    });

    const avgIntPrPct4 = (maxIntPr4 && sumIntPr4) ? sumIntPr4 / maxIntPr4 : 0.75;
    const avgIntPrPct2 = (maxIntPr2 && sumIntPr2) ? sumIntPr2 / maxIntPr2 : 0.75;

    const estIntPr4 = Math.round((30 + 50) * avgIntPrPct4);
    const estIntPr2 = Math.round((30 + 20) * avgIntPrPct2);

    const ese4Needed = Math.min(Math.max(targetTotal4 - estIntPr4, Math.ceil(70 * 0.35)), 70);
    const ese2Needed = Math.min(Math.max(targetTotal2 - estIntPr2, Math.ceil(50 * 0.35)), 50);

    const ese4El = document.getElementById('targetEse4Val');
    const grade4El = document.getElementById('targetGrade4Val');
    const ese2El = document.getElementById('targetEse2Val');
    const grade2El = document.getElementById('targetGrade2Val');
    const intValEl = document.getElementById('targetInternalVal');
    const intSubEl = document.getElementById('targetInternalSub');
    const suggBox = document.getElementById('targetSuggestionBox');

    if (ese4El) ese4El.textContent = `${ese4Needed} / 70`;
    if (grade4El) grade4El.textContent = `Target Grade: ${targetGrade}`;
    if (ese2El) ese2El.textContent = `${ese2Needed} / 50`;
    if (grade2El) grade2El.textContent = `Target Grade: ${targetGrade}`;

    const avgIntPct = Math.round(((avgIntPrPct4 + avgIntPrPct2) / 2) * 100);
    if (intValEl) intValEl.textContent = `${avgIntPct}% Avg`;
    if (intSubEl) intSubEl.textContent = avgIntPct >= 75 ? '🟢 Internal Score Strong' : '⚠️ Target >75% Internals';

    if (suggBox) {
      const currStats = calcOverallMarksStats();
      let statusIcon = '⚡', statusMsg = '';
      if (currStats.spi >= targetSpi) {
        statusIcon = '🎉';
        statusMsg = `<strong>Great job!</strong> Your current SPI (<strong>${currStats.spi.toFixed(2)}</strong>) meets your target of <strong>${targetSpi.toFixed(2)}</strong>! Keep it up.`;
      } else {
        statusMsg = `To reach SPI <strong>${targetSpi.toFixed(2)}</strong> (<strong>${targetGrade} Grade</strong>), aim for at least <strong>${ese4Needed}/70</strong> in 4-Credit ESE and <strong>${ese2Needed}/50</strong> in 2-Credit ESE papers.`;
      }
      suggBox.innerHTML = `<span>${statusIcon}</span> <div>${statusMsg}</div>`;
    }
  }

  function renderMarksHub() {
    renderTargetBacktracker();

    const stats = calcOverallMarksStats();
    const data = d();

    const spiValEl = document.getElementById('summarySpiVal');
    const spiGradeEl = document.getElementById('summarySpiGrade');
    const totalMarksEl = document.getElementById('summaryTotalMarksVal');
    const pctValEl = document.getElementById('summaryPctVal');
    const passStatusEl = document.getElementById('summaryPassStatus');
    const cgpaValEl = document.getElementById('summaryCgpaVal');

    if (spiValEl) spiValEl.textContent = stats.spi.toFixed(2);
    if (spiGradeEl) {
      const gInfo = getGtuGradeAndPoints(stats.overallPct, stats.failCount > 0);
      spiGradeEl.textContent = `${gInfo.grade} Grade`;
      spiGradeEl.className = `marks-sub-label grade-${gInfo.grade}`;
    }
    if (totalMarksEl) totalMarksEl.textContent = `${stats.totalObtained} / ${stats.totalMaxMarks}`;
    if (pctValEl) pctValEl.textContent = `${stats.overallPct.toFixed(1)}%`;
    if (passStatusEl) {
      passStatusEl.textContent = stats.failCount === 0
        ? '🟢 All Subjects Clear (Pass)'
        : `🔴 ${stats.failCount} Subject(s) Need Re-attempt`;
    }
    if (cgpaValEl) cgpaValEl.textContent = stats.spi.toFixed(2);

    const container = document.getElementById('marksSubjectsContainer');
    if (!container) return;

    const sem1Subs = (data.subjects || []).filter(s => (s.sem || 1) === 1);

    container.innerHTML = sem1Subs.map(s => {
      const m = s.marks || {};
      const res = calcSubjectMarks(s);
      const isLumpsum = !!m.isLumpsum;
      const icon = App.getSubjectIcon(s.code, s.colorIndex || 0);
      const esc = App.esc;

      return `
        <div class="marks-subject-card" data-sub-id="${s.id}">
          <div class="marks-card-head">
            <div class="marks-head-info">
              <div class="marks-sub-icon">${icon}</div>
              <div>
                <h3 class="marks-sub-name">${esc(s.name)}</h3>
                <div class="marks-sub-meta">
                  <span class="sub-meta-pill">${esc(s.code)}</span>
                  <span class="sub-meta-pill">${res.credits} Credits</span>
                  <span class="sub-meta-pill">Max ${res.maxMarks}</span>
                </div>
              </div>
            </div>
            <div class="marks-head-status">
              <span class="grade-badge-pill grade-${res.grade}">${res.grade} (${res.gp})</span>
              <span class="pass-fail-text ${res.pass ? 'text-pass' : 'text-fail'}">${res.pass ? 'PASS' : 'FAIL'}</span>
            </div>
          </div>

          <div class="internal-block">
            <div class="internal-toggle-row">
              <span class="internal-title">Internal Score (${res.internalTotal} / ${res.maxInternal})</span>
              <label class="switch-toggle-wrap" title="Toggle Lumpsum mode">
                <span class="switch-label">${isLumpsum ? 'Lumpsum' : 'Breakdown'}</span>
                <input type="checkbox" class="switch-input" ${isLumpsum ? 'checked' : ''} onchange="App.toggleLumpsumMode('${s.id}')" />
                <span class="switch-slider"></span>
              </label>
            </div>

            ${isLumpsum ? `
              <div class="marks-field-group">
                <label class="field-label">Internal Total Marks (Max ${res.maxInternal})</label>
                <input type="number" class="marks-num-input" min="0" max="${res.maxInternal}" placeholder="0 - ${res.maxInternal}"
                       value="${m.internalLumpsum !== null && m.internalLumpsum !== undefined ? m.internalLumpsum : ''}"
                       oninput="App.onMarksInput('${s.id}', 'internalLumpsum', this.value)" />
              </div>
            ` : `
              <div class="marks-input-row">
                <div class="marks-field-group">
                  <label class="field-label">Mid-Sem (Max 20)</label>
                  <input type="number" class="marks-num-input" min="0" max="20" placeholder="0-20"
                         value="${m.internalMid !== null && m.internalMid !== undefined ? m.internalMid : ''}"
                         oninput="App.onMarksInput('${s.id}', 'internalMid', this.value)" />
                </div>
                <div class="marks-field-group">
                  <label class="field-label">Attend. (Max 5)</label>
                  <input type="number" class="marks-num-input" min="0" max="5" placeholder="0-5"
                         value="${m.internalAtt !== null && m.internalAtt !== undefined ? m.internalAtt : ''}"
                         oninput="App.onMarksInput('${s.id}', 'internalAtt', this.value)" />
                </div>
                <div class="marks-field-group">
                  <label class="field-label">Beh/Assign (Max 5)</label>
                  <input type="number" class="marks-num-input" min="0" max="5" placeholder="0-5"
                         value="${m.internalBeh !== null && m.internalBeh !== undefined ? m.internalBeh : ''}"
                         oninput="App.onMarksInput('${s.id}', 'internalBeh', this.value)" />
                </div>
              </div>
            `}
          </div>

          <div class="marks-component-grid">
            <div class="marks-field-group">
              <label class="field-label">Practical / Viva (Max ${res.maxPractical})</label>
              <input type="number" class="marks-num-input" min="0" max="${res.maxPractical}" placeholder="0-${res.maxPractical}"
                     value="${m.practical !== null && m.practical !== undefined ? m.practical : ''}"
                     oninput="App.onMarksInput('${s.id}', 'practical', this.value)" />
            </div>
            <div class="marks-field-group">
              <label class="field-label">GTU ESE Exam (Max ${res.maxEse})</label>
              <input type="number" class="marks-num-input" min="0" max="${res.maxEse}" placeholder="0-${res.maxEse}"
                     value="${m.ese !== null && m.ese !== undefined ? m.ese : ''}"
                     oninput="App.onMarksInput('${s.id}', 'ese', this.value)" />
            </div>
          </div>

          <div class="marks-card-footer">
            <span class="total-score-val">Subject Total: ${res.totalScore} / ${res.maxMarks}</span>
            <span class="total-pct-val">${res.pct.toFixed(1)}%</span>
          </div>
        </div>
      `;
    }).join('');

    renderCgpaTable(stats.spi);
  }

  function renderCgpaTable(sem1Spi) {
    const body = document.getElementById('cgpaTableBody');
    if (!body) return;

    const sems = [
      { sem: 1, credits: 20, spi: sem1Spi.toFixed(2), isSem1: true },
      { sem: 2, credits: 20, spi: '--', isSem1: false },
      { sem: 3, credits: 20, spi: '--', isSem1: false },
      { sem: 4, credits: 20, spi: '--', isSem1: false },
      { sem: 5, credits: 20, spi: '--', isSem1: false },
      { sem: 6, credits: 20, spi: '--', isSem1: false }
    ];

    body.innerHTML = sems.map(s => {
      const gp = s.isSem1 ? (20 * sem1Spi).toFixed(1) : '--';
      return `
        <tr>
          <td><strong>Semester ${s.sem}</strong>${s.isSem1 ? ' (Current)' : ''}</td>
          <td>${s.credits} Credits</td>
          <td>${s.isSem1 ? `<strong>${s.spi}</strong>` : `<input type="number" class="cgpa-spi-input" placeholder="0.00" min="0" max="10" step="0.01" disabled />`}</td>
          <td>${gp}</td>
        </tr>
      `;
    }).join('');
  }

  return {
    getGtuGradeAndPoints,
    calcSubjectMarks,
    calcOverallMarksStats,
    renderTargetBacktracker,
    renderMarksHub
  };
})();
