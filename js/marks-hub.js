// ============================================================
//  GTU BBA Academic Dashboard — Marks & GTU Performance Hub Controller
//  Summary → Detail Architecture · Dynamic Shortfall Balancer · Progressive Disclosure
// ============================================================

const MarksHub = (() => {

  // Convenience accessor — always gets live data from App
  function d() { return App.getData(); }

  // GTU 10-Point Grading System Matrix
  const GTU_GRADES = [
    { grade: 'AA', gp: 10, minPct: 85, maxPct: 100, text: 'Outstanding', class: 'grade-AA' },
    { grade: 'AB', gp: 9, minPct: 75, maxPct: 84.99, text: 'Excellent', class: 'grade-AB' },
    { grade: 'BB', gp: 8, minPct: 65, maxPct: 74.99, text: 'Very Good', class: 'grade-BB' },
    { grade: 'BC', gp: 7, minPct: 55, maxPct: 64.99, text: 'Good', class: 'grade-BC' },
    { grade: 'CC', gp: 6, minPct: 45, maxPct: 54.99, text: 'Fair / Average', class: 'grade-CC' },
    { grade: 'CD', gp: 5, minPct: 40, maxPct: 44.99, text: 'Pass / Below Avg', class: 'grade-CD' },
    { grade: 'DD', gp: 4, minPct: 35, maxPct: 39.99, text: 'Minimum Pass', class: 'grade-DD' },
    { grade: 'FF', gp: 0, minPct: 0, maxPct: 34.99, text: 'Fail / Re-attempt', class: 'grade-FF' }
  ];

  function getGtuGradeAndPoints(pct, isEseFailed = false) {
    if (isEseFailed || pct < 35) return { grade: 'FF', gp: 0, pass: false, text: 'Fail' };
    if (pct >= 85) return { grade: 'AA', gp: 10, pass: true, text: 'Outstanding' };
    if (pct >= 75) return { grade: 'AB', gp: 9, pass: true, text: 'Excellent' };
    if (pct >= 65) return { grade: 'BB', gp: 8, pass: true, text: 'Very Good' };
    if (pct >= 55) return { grade: 'BC', gp: 7, pass: true, text: 'Good' };
    if (pct >= 45) return { grade: 'CC', gp: 6, pass: true, text: 'Fair' };
    if (pct >= 40) return { grade: 'CD', gp: 5, pass: true, text: 'Pass' };
    if (pct >= 35) return { grade: 'DD', gp: 4, pass: true, text: 'Min Pass' };
    return { grade: 'FF', gp: 0, pass: false, text: 'Fail' };
  }

  function getTargetGradeDetails(spi) {
    const val = typeof spi === 'number' ? spi : 8.5;
    if (val >= 9.5) return { grade: 'AA', gp: 10, minPct: 85, desc: 'Outstanding (85%+ Marks)' };
    if (val >= 8.5) return { grade: 'AB', gp: 9, minPct: 75, desc: 'Excellent (75%+ Marks)' };
    if (val >= 7.5) return { grade: 'BB', gp: 8, minPct: 65, desc: 'Very Good (65%+ Marks)' };
    if (val >= 6.5) return { grade: 'BC', gp: 7, minPct: 55, desc: 'Good (55%+ Marks)' };
    if (val >= 5.5) return { grade: 'CC', gp: 6, minPct: 45, desc: 'Fair (45%+ Marks)' };
    if (val >= 4.5) return { grade: 'CD', gp: 5, minPct: 40, desc: 'Pass (40%+ Marks)' };
    return { grade: 'DD', gp: 4, minPct: 35, desc: 'Minimum Pass (35%+ Marks)' };
  }

  function calcSubjectMarks(s) {
    const m = s.marks || {};
    const credits = s.credits || 4;
    const maxEse = s.maxEse || (credits === 2 ? 50 : 70);
    const maxInternal = s.maxInternal || 30;
    const maxPractical = s.maxPractical || (credits === 2 ? 20 : 50);
    const maxMarks = s.maxMarks || (maxEse + maxInternal + maxPractical);

    let internalTotal = 0;
    let hasInternalEntered = false;

    if (m.isLumpsum) {
      if (typeof m.internalLumpsum === 'number') {
        internalTotal = Math.min(Math.max(m.internalLumpsum, 0), maxInternal);
        hasInternalEntered = true;
      }
    } else {
      const hasMid = typeof m.internalMid === 'number';
      const hasAtt = typeof m.internalAtt === 'number';
      const hasBeh = typeof m.internalBeh === 'number';
      if (hasMid || hasAtt || hasBeh) {
        hasInternalEntered = true;
        const mid = hasMid ? Math.min(Math.max(m.internalMid, 0), 20) : 0;
        const att = hasAtt ? Math.min(Math.max(m.internalAtt, 0), 5) : 0;
        const beh = hasBeh ? Math.min(Math.max(m.internalBeh, 0), 5) : 0;
        internalTotal = mid + att + beh;
      }
    }

    const hasPracticalEntered = typeof m.practical === 'number';
    const practical = hasPracticalEntered ? Math.min(Math.max(m.practical, 0), maxPractical) : 0;

    const hasEseEntered = typeof m.ese === 'number';
    const ese = hasEseEntered ? Math.min(Math.max(m.ese, 0), maxEse) : 0;

    const totalScore = internalTotal + practical + ese;
    const pct = maxMarks ? (totalScore / maxMarks) * 100 : 0;

    const eseMinReq = maxEse * 0.35;
    const isEseFailed = hasEseEntered ? (ese < eseMinReq) : false;
    const gradeInfo = getGtuGradeAndPoints(pct, isEseFailed);

    return {
      credits, maxMarks, maxEse, maxInternal, maxPractical,
      internalTotal, practical, ese, totalScore, pct, isEseFailed,
      hasInternalEntered, hasPracticalEntered, hasEseEntered,
      grade: gradeInfo.grade, gp: gradeInfo.gp, pass: gradeInfo.pass
    };
  }

  let activeMarksSem = 1;

  function setActiveMarksSem(sem) {
    activeMarksSem = sem;
    renderMarksHub();
  }

  function calcOverallMarksStats() {
    const data = d();
    const semSubs = (data.subjects || []).filter(s => (s.sem || 1) === activeMarksSem);

    let totalObtained = 0, totalMaxMarks = 0, weightedGpSum = 0, totalCreditsSum = 0, failCount = 0;

    semSubs.forEach(s => {
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

  // Dynamic shortfall balancer algorithm
  function calcDynamicSubjectTargets(s, targetSpi) {
    const res = calcSubjectMarks(s);
    const m = s.marks || {};
    const targetDetails = getTargetGradeDetails(targetSpi);
    const targetPct = targetDetails.minPct;
    const targetTotalMarks = Math.ceil(s.maxMarks * (targetPct / 100));

    const credits = s.credits || 4;
    const maxInternal = s.maxInternal || 30;
    const maxPractical = s.maxPractical || (credits === 2 ? 20 : 50);
    const maxEse = s.maxEse || (credits === 2 ? 50 : 70);
    const eseMinPassing = Math.ceil(maxEse * 0.35);

    let baseInternal = Math.round(maxInternal * (targetPct / 100));
    let basePractical = Math.round(maxPractical * (targetPct / 100));

    if (targetSpi >= 9.5) {
      baseInternal = credits === 4 ? 28 : 27;
      basePractical = credits === 4 ? 44 : 18;
    } else if (targetSpi >= 8.5) {
      baseInternal = credits === 4 ? 26 : 25;
      basePractical = credits === 4 ? 40 : 16;
    } else if (targetSpi >= 7.5) {
      baseInternal = credits === 4 ? 23 : 22;
      basePractical = credits === 4 ? 35 : 14;
    } else if (targetSpi >= 6.5) {
      baseInternal = credits === 4 ? 20 : 19;
      basePractical = credits === 4 ? 30 : 12;
    } else {
      baseInternal = credits === 4 ? 16 : 15;
      basePractical = credits === 4 ? 24 : 10;
    }

    const actualInternal = res.hasInternalEntered ? res.internalTotal : baseInternal;
    const actualPractical = res.hasPracticalEntered ? res.practical : basePractical;

    const remainingForEse = targetTotalMarks - (actualInternal + actualPractical);
    const dynEse = Math.min(Math.max(remainingForEse, eseMinPassing), maxEse);

    const intDiff = res.hasInternalEntered ? res.internalTotal - baseInternal : 0;
    const practDiff = res.hasPracticalEntered ? res.practical - basePractical : 0;
    const totalDiff = intDiff + practDiff;

    let adviceType = 'normal';
    let adviceHtml = '';

    if (res.hasEseEntered && res.isEseFailed) {
      adviceType = 'shortfall';
      adviceHtml = `⚠️ <strong>ESE Passing Threshold:</strong> Minimum ${eseMinPassing}/${maxEse} required to pass. Current ESE is below threshold.`;
    } else if (totalDiff > 0) {
      adviceType = 'ahead';
      adviceHtml = `🟢 <strong>Target Balanced:</strong> Strong internal/practical (+${totalDiff} pts) lowers ESE target to <strong>${dynEse}/${maxEse}</strong> for ${targetDetails.grade} grade.`;
    } else if (totalDiff < 0) {
      adviceType = 'tight';
      adviceHtml = `⚡ <strong>Target Rebalanced:</strong> Internal shortfall (${totalDiff} pts) raised required ESE target to <strong>${dynEse}/${maxEse}</strong> for ${targetDetails.grade} grade.`;
    } else {
      adviceHtml = `🎯 <strong>Baseline Target:</strong> Aim for Internal ${baseInternal}/${maxInternal}, Practical ${basePractical}/${maxPractical}, and ESE ${dynEse}/${maxEse} for ${targetDetails.grade} grade.`;
    }

    const dynMid = Math.round(baseInternal * (20 / 30));
    const dynAtt = Math.round(baseInternal * (5 / 30));
    const dynBeh = Math.round(baseInternal * (5 / 30));

    return {
      targetTotalMarks,
      dynEse,
      dynInternal: baseInternal,
      dynPractical: basePractical,
      dynLump: baseInternal,
      dynMid,
      dynAtt,
      dynBeh,
      adviceType,
      adviceHtml
    };
  }

  // ── IN-PLACE SUBJECT CARD UPDATER (Non-destructive for active typing) ──
  function updateSubjectCardLive(subId) {
    const cardEl = document.querySelector(`.marks-subject-card[data-sub-id="${subId}"]`);
    if (!cardEl) return;

    const data = d();
    const s = (data.subjects || []).find(x => x.id === subId);
    if (!s) return;

    const targetSpi = (data.settings && typeof data.settings.targetSpi === 'number') ? data.settings.targetSpi : 8.5;
    const res = calcSubjectMarks(s);
    const dynTarget = calcDynamicSubjectTargets(s, targetSpi);

    // 1. Grade Badge Pill
    const gradeBadge = cardEl.querySelector('.grade-badge-pill');
    if (gradeBadge) {
      gradeBadge.textContent = `${res.grade} (${res.gp})`;
    }

    // 2. Pass / Fail Status Text
    const passFailText = cardEl.querySelector('.pass-fail-text');
    if (passFailText) {
      passFailText.className = `pass-fail-text ${res.pass ? 'text-pass' : 'text-fail'}`;
      passFailText.textContent = res.pass ? 'PASS' : 'FAIL';
    }

    // 3. Internal Title Score
    const internalTitle = cardEl.querySelector('.internal-title');
    if (internalTitle) {
      internalTitle.textContent = `Internal Score (${res.internalTotal} / ${res.maxInternal})`;
    }

    // 4. Header Score summary
    const headScore = cardEl.querySelector('.marks-sub-meta');
    if (headScore) {
      headScore.innerHTML = `<span>${App.esc(s.code)}</span> · <span>${res.credits} Credits</span> · <span>Score: <strong>${res.totalScore}/${res.maxMarks}</strong> (${res.pct.toFixed(1)}%)</span>`;
    }

    // 5. Footer Total & Percentage
    const totalScoreVal = cardEl.querySelector('.total-score-val');
    if (totalScoreVal) {
      totalScoreVal.innerHTML = `Total: <strong>${res.totalScore} / ${res.maxMarks}</strong>`;
    }
    const totalPctVal = cardEl.querySelector('.total-pct-val');
    if (totalPctVal) {
      totalPctVal.textContent = `${res.pct.toFixed(1)}%`;
    }

    // 6. Dynamic Shortfall Balancer Advice Box
    const adviceBox = cardEl.querySelector('.marks-target-advisor');
    if (adviceBox) {
      adviceBox.className = `marks-target-advisor advisor-${dynTarget.adviceType}`;
      adviceBox.innerHTML = dynTarget.adviceHtml;
    }

    // 7. Update benchmarks & placeholders
    const midBadge = cardEl.querySelector('.field-benchmark-badge[data-benchmark-for="internalMid"]');
    if (midBadge) midBadge.textContent = `Target: ${dynTarget.dynMid} / 20`;

    const attBadge = cardEl.querySelector('.field-benchmark-badge[data-benchmark-for="internalAtt"]');
    if (attBadge) attBadge.textContent = `Target: ${dynTarget.dynAtt} / 5`;

    const behBadge = cardEl.querySelector('.field-benchmark-badge[data-benchmark-for="internalBeh"]');
    if (behBadge) behBadge.textContent = `Target: ${dynTarget.dynBeh} / 5`;

    const lumpBadge = cardEl.querySelector('.field-benchmark-badge[data-benchmark-for="internalLumpsum"]');
    if (lumpBadge) lumpBadge.textContent = `Target: ${dynTarget.dynLump} / ${res.maxInternal}`;

    const prBadge = cardEl.querySelector('.field-benchmark-badge[data-benchmark-for="practical"]');
    if (prBadge) prBadge.textContent = `Target: ${dynTarget.dynPractical} / ${res.maxPractical}`;

    const eseBadge = cardEl.querySelector('.field-benchmark-badge[data-benchmark-for="ese"]');
    if (eseBadge) eseBadge.textContent = `Min ${Math.ceil(res.maxEse * 0.35)} | Target: ${dynTarget.dynEse} / ${res.maxEse}`;

    // 8. Update global dashboard summaries in place
    updateLiveSummary();
  }

  // ── LIVE GLOBAL DASHBOARD SUMMARY UPDATER ──────────────────
  function updateLiveSummary() {
    const stats = calcOverallMarksStats();
    const data = d();

    // 1. SPI Card
    const spiValEl = document.getElementById('summarySpiVal');
    const spiGradeEl = document.getElementById('summarySpiGrade');
    const spiTitleEl = document.getElementById('summarySpiTitle');
    if (spiTitleEl) spiTitleEl.textContent = `Semester ${activeMarksSem} SPI`;
    if (spiValEl) spiValEl.textContent = stats.spi.toFixed(2);
    if (spiGradeEl) {
      const gInfo = getGtuGradeAndPoints(stats.overallPct, stats.failCount > 0);
      spiGradeEl.textContent = `${gInfo.grade} Grade · ${gInfo.text}`;
    }

    // 2. Total Marks Card
    const totalMarksEl = document.getElementById('summaryTotalMarksVal');
    const pctValEl = document.getElementById('summaryPctVal');
    const passStatusEl = document.getElementById('summaryPassStatus');
    if (totalMarksEl) totalMarksEl.textContent = `${stats.totalObtained} / ${stats.totalMaxMarks}`;
    if (pctValEl) pctValEl.textContent = `${stats.overallPct.toFixed(1)}%`;
    if (passStatusEl) {
      passStatusEl.textContent = stats.failCount === 0
        ? '🟢 All Papers Passing'
        : `🔴 ${stats.failCount} Paper(s) Require Re-attempt`;
    }

    // 3. Multi-Semester CGPA Card & Table
    const cgpaStats = calcCumulativeCgpa();
    const cgpaValEl = document.getElementById('summaryCgpaVal');
    if (cgpaValEl) cgpaValEl.textContent = cgpaStats.cgpa.toFixed(2);

    // 4. Target Engine Suggestion Box
    renderTargetBacktracker();
    renderCgpaTable(cgpaStats);
  }

  // Calculates cumulative CGPA across all 6 semesters
  function calcCumulativeCgpa() {
    const data = d();
    const allSubs = data.subjects || [];
    let totalWeightedPoints = 0;
    let totalCredits = 0;
    const semSpiMap = {};

    for (let sNum = 1; sNum <= 6; sNum++) {
      const subsInSem = allSubs.filter(s => (s.sem || 1) === sNum);
      if (subsInSem.length === 0) {
        semSpiMap[sNum] = { hasData: false, spi: 0, credits: 0, gp: 0 };
        continue;
      }
      let semWeighted = 0, semCreds = 0, hasAnyEntered = false;
      subsInSem.forEach(s => {
        const res = calcSubjectMarks(s);
        semWeighted += res.credits * res.gp;
        semCreds += res.credits;
        if (res.hasInternalEntered || res.hasPracticalEntered || res.hasEseEntered) {
          hasAnyEntered = true;
        }
      });
      const semSpi = semCreds ? (semWeighted / semCreds) : 0;
      semSpiMap[sNum] = { hasData: hasAnyEntered, spi: semSpi, credits: semCreds, gp: semWeighted };
      if (hasAnyEntered) {
        totalWeightedPoints += semWeighted;
        totalCredits += semCreds;
      }
    }

    const cgpa = totalCredits ? (totalWeightedPoints / totalCredits) : (semSpiMap[activeMarksSem]?.spi || 0);
    return { cgpa, semSpiMap };
  }

  // ── TARGET BACKTRACKER RENDER ──────────────────────────────
  function renderTargetBacktracker() {
    const data = d();
    const targetSpi = (data.settings && typeof data.settings.targetSpi === 'number') ? data.settings.targetSpi : 8.5;
    const targetDetails = getTargetGradeDetails(targetSpi);
    const targetPct = targetDetails.minPct;

    const semEl = document.getElementById('targetActiveSemNum');
    if (semEl) semEl.textContent = activeMarksSem;

    const selectEl = document.getElementById('targetSpiSelect');
    if (selectEl) selectEl.value = targetSpi.toFixed(1);

    const semSubs = (data.subjects || []).filter(s => (s.sem || 1) === activeMarksSem);
    let count4 = 0, count2 = 0;
    let sumIntPr4 = 0, maxIntPr4 = 0;
    let sumIntPr2 = 0, maxIntPr2 = 0;

    const targetTotal4 = Math.ceil(150 * (targetPct / 100));
    const targetTotal2 = Math.ceil(100 * (targetPct / 100));

    semSubs.forEach(s => {
      const res = calcSubjectMarks(s);
      const intPrSum = res.internalTotal + res.practical;
      const intPrMax = res.maxInternal + res.maxPractical;
      if (res.credits === 4) { count4++; sumIntPr4 += intPrSum; maxIntPr4 += intPrMax; }
      else { count2++; sumIntPr2 += intPrSum; maxIntPr2 += intPrMax; }
    });

    const avgIntPrPct4 = (maxIntPr4 && sumIntPr4) ? sumIntPr4 / maxIntPr4 : (targetPct / 100);
    const avgIntPrPct2 = (maxIntPr2 && sumIntPr2) ? sumIntPr2 / maxIntPr2 : (targetPct / 100);

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
    if (grade4El) grade4El.textContent = `Grade Req: ${targetDetails.grade}`;
    if (ese2El) ese2El.textContent = `${ese2Needed} / 50`;
    if (grade2El) grade2El.textContent = `Grade Req: ${targetDetails.grade}`;

    const avgIntPct = Math.round(((avgIntPrPct4 + avgIntPrPct2) / 2) * 100);
    if (intValEl) intValEl.textContent = `${avgIntPct}% Avg`;
    if (intSubEl) intSubEl.textContent = avgIntPct >= targetPct ? '🟢 Safe Internals' : `⚠️ Aim >${targetPct}%`;

    if (suggBox) {
      const currStats = calcOverallMarksStats();
      let statusMsg = '';
      if (currStats.spi >= targetSpi && currStats.totalObtained > 0) {
        statusMsg = `🎉 Sem ${activeMarksSem} SPI of <strong>${currStats.spi.toFixed(2)}</strong> meets your <strong>${targetDetails.grade}</strong> target (<strong>${targetSpi.toFixed(2)} SPI</strong>).`;
      } else {
        statusMsg = `🎯 To reach <strong>${targetDetails.grade} Grade (${targetSpi.toFixed(1)} SPI · ${targetPct}%)</strong>, score approx. <strong>${ese4Needed}/70</strong> in 4-Credit & <strong>${ese2Needed}/50</strong> in 2-Credit ESE papers.`;
      }
      suggBox.innerHTML = `<div>${statusMsg}</div>`;
    }
  }

  // Collapsed by default — tracks expanded subject IDs
  const expandedMarksSubs = new Set();

  function toggleMarksSubject(subId) {
    if (expandedMarksSubs.has(subId)) {
      expandedMarksSubs.delete(subId);
    } else {
      expandedMarksSubs.add(subId);
    }
    const card = document.querySelector(`.marks-subject-card[data-sub-id="${subId}"]`);
    if (card) {
      card.classList.toggle('open', expandedMarksSubs.has(subId));
    }
  }

  // ── FULL RENDER (Tab switch / Semester change) ─────────────
  function renderMarksHub() {
    try {
      renderTargetBacktracker();

      const data = d();
      const targetSpi = (data.settings && typeof data.settings.targetSpi === 'number') ? data.settings.targetSpi : 8.5;
      const visibleSems = (data.settings && Array.isArray(data.settings.visibleSems)) ? data.settings.visibleSems : [1, 2, 3, 4, 5, 6];
    
      if (!visibleSems.includes(activeMarksSem)) {
        activeMarksSem = visibleSems.length ? visibleSems[0] : 1;
      }

      const semSubs = (data.subjects || []).filter(s => (s.sem || 1) === activeMarksSem);

      const marksSemFiltersEl = document.getElementById('marksSemFilters');
      if (marksSemFiltersEl) {
        marksSemFiltersEl.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            ${visibleSems.map(sem => `
              <button class="pill ${sem === activeMarksSem ? 'active' : ''}" onclick="MarksHub.setActiveMarksSem(${sem})">
                Sem ${sem}
              </button>
            `).join('')}
          </div>
        `;
      }

      const container = document.getElementById('marksSubjectsContainer');

      if (container) {
        if (semSubs.length === 0) {
          container.innerHTML = `
            <div style="text-align: center; padding: 32px 16px; background: var(--bg-card); border-radius: var(--r-lg); border: 1px dashed var(--border);">
              <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-dark); margin-bottom: 4px;">No Subjects in Semester ${activeMarksSem}</h3>
              <p style="font-size: 0.78rem; color: var(--text-mid); margin-bottom: 12px;">Add your GTU Semester ${activeMarksSem} subjects to record marks and calculate SPI.</p>
              <button class="btn btn-accent btn-sm" onclick="App.openAddSubjectModal(${activeMarksSem})">
                + Add Subject
              </button>
            </div>
          `;
        } else {
          container.innerHTML = semSubs.map(s => {
            const m = s.marks || {};
            const res = calcSubjectMarks(s);
            const dynTarget = calcDynamicSubjectTargets(s, targetSpi);
            const isLumpsum = !!m.isLumpsum;
            const icon = App.getSubjectIcon(s.code, s.colorIndex || 0);
            const esc = App.esc;
            const isOpen = expandedMarksSubs.has(s.id);

            return `
              <div class="marks-subject-card ${isOpen ? 'open' : ''}" data-sub-id="${s.id}">
                <div class="marks-card-head" onclick="MarksHub.toggleMarksSubject('${s.id}')">
                  <div class="marks-head-info">
                    <div class="marks-sub-icon">${icon}</div>
                    <div class="marks-head-text">
                      <h3 class="marks-sub-name">${esc(s.name)}</h3>
                      <div class="marks-sub-meta">
                        <span>${esc(s.code)}</span> · <span>${res.credits} Credits</span> · <span>Score: <strong>${res.totalScore}/${res.maxMarks}</strong> (${res.pct.toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                  <div class="marks-head-right">
                    <div class="marks-head-status">
                      <span class="grade-badge-pill">${res.grade} (${res.gp})</span>
                      <span class="pass-fail-text ${res.pass ? 'text-pass' : 'text-fail'}">${res.pass ? 'PASS' : 'FAIL'}</span>
                    </div>
                    <span class="marks-chevron">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </span>
                  </div>
                </div>

                <div class="marks-card-body">
                  <div class="marks-card-body-inner">
                    <!-- Dynamic Advisor -->
                    <div class="marks-target-advisor advisor-${dynTarget.adviceType}">
                      ${dynTarget.adviceHtml}
                    </div>

                    <!-- Internal Marks -->
                    <div class="internal-block">
                      <div class="internal-toggle-row">
                        <span class="internal-title">Internal Score (${res.internalTotal} / ${res.maxInternal})</span>
                        <label class="switch-toggle-wrap" title="Toggle Lumpsum vs Breakdown mode">
                          <span class="switch-label">${isLumpsum ? 'Lumpsum' : 'Breakdown'}</span>
                          <input type="checkbox" class="switch-input" ${isLumpsum ? 'checked' : ''} onchange="App.toggleLumpsumMode('${s.id}')" />
                          <span class="switch-slider"></span>
                        </label>
                      </div>

                      ${isLumpsum ? `
                        <div class="marks-field-group">
                          <div class="field-label-row">
                            <label class="field-label">Internal Total Marks (Max ${res.maxInternal})</label>
                            <span class="field-benchmark-badge" data-benchmark-for="internalLumpsum">Target: ${dynTarget.dynLump} / ${res.maxInternal}</span>
                          </div>
                          <input type="number" class="marks-num-input" data-field="internalLumpsum" min="0" max="${res.maxInternal}" placeholder="Target: ${dynTarget.dynLump}"
                                 value="${m.internalLumpsum !== null && m.internalLumpsum !== undefined ? m.internalLumpsum : ''}"
                                 oninput="App.onMarksInput('${s.id}', 'internalLumpsum', this.value)" />
                        </div>
                      ` : `
                        <div class="marks-input-row">
                          <div class="marks-field-group">
                            <div class="field-label-row">
                              <label class="field-label">Mid-Sem (20)</label>
                              <span class="field-benchmark-badge" data-benchmark-for="internalMid">Target: ${dynTarget.dynMid}</span>
                            </div>
                            <input type="number" class="marks-num-input" data-field="internalMid" min="0" max="20" placeholder="Target: ${dynTarget.dynMid}"
                                   value="${m.internalMid !== null && m.internalMid !== undefined ? m.internalMid : ''}"
                                   oninput="App.onMarksInput('${s.id}', 'internalMid', this.value)" />
                          </div>
                          <div class="marks-field-group">
                            <div class="field-label-row">
                              <label class="field-label">Attendance (5)</label>
                              <span class="field-benchmark-badge" data-benchmark-for="internalAtt">Target: ${dynTarget.dynAtt}</span>
                            </div>
                            <input type="number" class="marks-num-input" data-field="internalAtt" min="0" max="5" placeholder="Target: ${dynTarget.dynAtt}"
                                   value="${m.internalAtt !== null && m.internalAtt !== undefined ? m.internalAtt : ''}"
                                   oninput="App.onMarksInput('${s.id}', 'internalAtt', this.value)" />
                          </div>
                          <div class="marks-field-group">
                            <div class="field-label-row">
                              <label class="field-label">Behavior (5)</label>
                              <span class="field-benchmark-badge" data-benchmark-for="internalBeh">Target: ${dynTarget.dynBeh}</span>
                            </div>
                            <input type="number" class="marks-num-input" data-field="internalBeh" min="0" max="5" placeholder="Target: ${dynTarget.dynBeh}"
                                   value="${m.internalBeh !== null && m.internalBeh !== undefined ? m.internalBeh : ''}"
                                   oninput="App.onMarksInput('${s.id}', 'internalBeh', this.value)" />
                          </div>
                        </div>
                      `}
                    </div>

                    <!-- Practical & ESE Exam Components -->
                    <div class="marks-component-grid">
                      <div class="marks-field-group">
                        <div class="field-label-row">
                          <label class="field-label">Practical / Viva (Max ${res.maxPractical})</label>
                          <span class="field-benchmark-badge" data-benchmark-for="practical">Target: ${dynTarget.dynPractical}</span>
                        </div>
                        <input type="number" class="marks-num-input" data-field="practical" min="0" max="${res.maxPractical}" placeholder="Target: ${dynTarget.dynPractical}"
                               value="${m.practical !== null && m.practical !== undefined ? m.practical : ''}"
                               oninput="App.onMarksInput('${s.id}', 'practical', this.value)" />
                      </div>
                      <div class="marks-field-group">
                        <div class="field-label-row">
                          <label class="field-label">GTU ESE Exam (Max ${res.maxEse})</label>
                          <span class="field-benchmark-badge" data-benchmark-for="ese">Min ${Math.ceil(res.maxEse * 0.35)} | Target: ${dynTarget.dynEse}</span>
                        </div>
                        <input type="number" class="marks-num-input" data-field="ese" min="0" max="${res.maxEse}" placeholder="Target: ${dynTarget.dynEse}"
                               value="${m.ese !== null && m.ese !== undefined ? m.ese : ''}"
                               oninput="App.onMarksInput('${s.id}', 'ese', this.value)" />
                      </div>
                    </div>

                    <div class="marks-card-footer">
                      <div class="marks-footer-stats">
                        <span class="total-score-val">Subject Total: <strong>${res.totalScore} / ${res.maxMarks}</strong></span>
                        <span class="total-pct-val">${res.pct.toFixed(1)}%</span>
                      </div>
                      <button class="btn btn-accent btn-sm" onclick="App.saveSubjectMarks('${s.id}')">
                        💾 Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }
      }
      updateLiveSummary();
    } catch (err) {
      console.error('Marks Hub render error:', err);
    }
  }

  function renderCgpaTable(cgpaStats) {
    const body = document.getElementById('cgpaTableBody');
    if (!body) return;

    const stats = cgpaStats || calcCumulativeCgpa();
    const semSpiMap = stats.semSpiMap || {};

    let html = '';
    for (let sNum = 1; sNum <= 6; sNum++) {
      const sData = semSpiMap[sNum] || { hasData: false, spi: 0, credits: 20, gp: 0 };
      const isCurrent = (sNum === activeMarksSem);
      const spiText = sData.hasData ? sData.spi.toFixed(2) : '--';
      const gpText = sData.hasData ? sData.gp.toFixed(1) : '--';

      html += `
        <tr class="${isCurrent ? 'cgpa-row-current' : ''}">
          <td><strong>Sem ${sNum}</strong>${isCurrent ? ' <span class="active-sem-tag">(Active)</span>' : ''}</td>
          <td>${sData.credits}c</td>
          <td>${sData.hasData ? `<strong>${spiText}</strong>` : `--`}</td>
          <td>${gpText}</td>
        </tr>
      `;
    }
    body.innerHTML = html;
  }

  // ── INTERACTIVE GTU GRADING GUIDE SIMULATOR ──────────────
  let _simState = {
    c4Mid: 18, c4Att: 5, c4Beh: 4, c4Pract: 42, c4Ese: 55,
    c2Mid: 18, c2Att: 4, c2Beh: 4, c2Pract: 17, c2Ese: 39
  };

  function updateSimulator(field, val) {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      _simState[field] = Math.max(0, num);
    }
    renderSimulator();
  }

  function setSimulatorPreset(preset) {
    if (preset === 'aa') {
      _simState = { c4Mid: 20, c4Att: 5, c4Beh: 5, c4Pract: 47, c4Ese: 62, c2Mid: 20, c2Att: 5, c2Beh: 5, c2Pract: 19, c2Ese: 44 };
    } else if (preset === 'ab') {
      _simState = { c4Mid: 18, c4Att: 5, c4Beh: 4, c4Pract: 41, c4Ese: 56, c2Mid: 18, c2Att: 4, c2Beh: 4, c2Pract: 16, c2Ese: 38 };
    } else if (preset === 'bb') {
      _simState = { c4Mid: 15, c4Att: 4, c4Beh: 4, c4Pract: 35, c4Ese: 48, c2Mid: 15, c2Att: 4, c2Beh: 3, c2Pract: 14, c2Ese: 34 };
    } else if (preset === 'pass_edge') {
      _simState = { c4Mid: 10, c4Att: 3, c4Beh: 3, c4Pract: 20, c4Ese: 25, c2Mid: 10, c2Att: 3, c2Beh: 3, c2Pract: 8, c2Ese: 18 };
    }
    renderSimulator();
  }

  function renderSimulator() {
    const s = _simState;
    const c4Int = Math.min(s.c4Mid, 20) + Math.min(s.c4Att, 5) + Math.min(s.c4Beh, 5);
    const c4Pract = Math.min(s.c4Pract, 50);
    const c4Ese = Math.min(s.c4Ese, 70);
    const c4Total = c4Int + c4Pract + c4Ese;
    const c4Pct = (c4Total / 150) * 100;
    const c4EseFailed = c4Ese < 25;
    const c4GradeInfo = getGtuGradeAndPoints(c4Pct, c4EseFailed);
    const c4CreditPoints = 4 * c4GradeInfo.gp;

    const c2Int = Math.min(s.c2Mid, 20) + Math.min(s.c2Att, 5) + Math.min(s.c2Beh, 5);
    const c2Pract = Math.min(s.c2Pract, 20);
    const c2Ese = Math.min(s.c2Ese, 50);
    const c2Total = c2Int + c2Pract + c2Ese;
    const c2Pct = (c2Total / 100) * 100;
    const c2EseFailed = c2Ese < 18;
    const c2GradeInfo = getGtuGradeAndPoints(c2Pct, c2EseFailed);
    const c2CreditPoints = 2 * c2GradeInfo.gp;

    const totalCreditPoints = (4 * c4CreditPoints) + (2 * c2CreditPoints);
    const simSpi = totalCreditPoints / 20;

    const el4Total = document.getElementById('sim4Total');
    const el4Pct = document.getElementById('sim4Pct');
    const el4Grade = document.getElementById('sim4Grade');
    const el4Cp = document.getElementById('sim4Cp');

    const el2Total = document.getElementById('sim2Total');
    const el2Pct = document.getElementById('sim2Pct');
    const el2Grade = document.getElementById('sim2Grade');
    const el2Cp = document.getElementById('sim2Cp');

    const elSimSpi = document.getElementById('simResultSpi');
    const elSimFormula = document.getElementById('simResultFormula');

    if (el4Total) el4Total.textContent = `${c4Total} / 150`;
    if (el4Pct) el4Pct.textContent = `${c4Pct.toFixed(1)}%`;
    if (el4Grade) {
      el4Grade.textContent = `${c4GradeInfo.grade} (${c4GradeInfo.gp} GP)`;
    }
    if (el4Cp) el4Cp.textContent = `4c × ${c4GradeInfo.gp} = ${c4CreditPoints} pts`;

    if (el2Total) el2Total.textContent = `${c2Total} / 100`;
    if (el2Pct) el2Pct.textContent = `${c2Pct.toFixed(1)}%`;
    if (el2Grade) {
      el2Grade.textContent = `${c2GradeInfo.grade} (${c2GradeInfo.gp} GP)`;
    }
    if (el2Cp) el2Cp.textContent = `2c × ${c2GradeInfo.gp} = ${c2CreditPoints} pts`;

    if (elSimSpi) {
      elSimSpi.textContent = simSpi.toFixed(2);
    }
    if (elSimFormula) {
      elSimFormula.innerHTML = `(4 × ${c4CreditPoints} + 2 × ${c2CreditPoints}) ÷ 20 Credits = <strong>${simSpi.toFixed(2)} SPI</strong>`;
    }
  }

  function openGtuGuideModal() {
    const modal = document.getElementById('gtuGuideModal');
    if (modal) {
      modal.classList.add('show');
      renderSimulator();
    }
  }

  return {
    GTU_GRADES,
    getGtuGradeAndPoints,
    getTargetGradeDetails,
    calcSubjectMarks,
    calcOverallMarksStats,
    calcDynamicSubjectTargets,
    updateSubjectCardLive,
    updateLiveSummary,
    renderTargetBacktracker,
    renderMarksHub,
    toggleMarksSubject,
    setActiveMarksSem,
    openGtuGuideModal,
    updateSimulator,
    setSimulatorPreset,
    renderSimulator,
    getActiveMarksSem: () => activeMarksSem
  };
})();

if (typeof window !== 'undefined') {
  window.MarksHub = MarksHub;
}
