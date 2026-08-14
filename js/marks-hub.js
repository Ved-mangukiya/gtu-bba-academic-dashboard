// ============================================================
//  GTU BBA Academic Dashboard — Marks & GTU Performance Hub Controller
//  Optimistic UI Updates · Live Dynamic Shortfall Balancer · GTU Grading Engine
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

  // ── DYNAMIC SHORTFALL BALANCER ALGORITHM ──────────────────
  // Calculates real-time minimum requirements for remaining components
  // If one component drops (e.g. got 26 vs baseline 27), the deficit (+1)
  // is dynamically distributed to the remaining components (Practical or ESE).
  function calcDynamicSubjectTargets(s, targetSpi) {
    const res = calcSubjectMarks(s);
    const targetDetails = getTargetGradeDetails(targetSpi);
    const targetPct = targetDetails.minPct;
    const targetTotalMarks = Math.ceil(s.maxMarks * (targetPct / 100));

    // Baseline targets proportional to weightage
    let baseInternal = Math.round(s.maxInternal * (targetPct / 100));
    let basePractical = Math.round(s.maxPractical * (targetPct / 100));
    let eseMinPassing = Math.ceil(s.maxEse * 0.35); // mandatory 35% in ESE
    let baseEse = Math.max(eseMinPassing, targetTotalMarks - (baseInternal + basePractical));

    // For 4-Credit standard AB baseline anchor (user cited 27-56-41 requirement)
    if (s.credits === 4 && targetSpi >= 8.5) {
      baseInternal = 27; // out of 30
      basePractical = 41; // out of 50
      baseEse = 56; // out of 70 (27+41+56 = 124, provides strong AB/AA safety)
    } else if (s.credits === 2 && targetSpi >= 8.5) {
      baseInternal = 26; // out of 30
      basePractical = 16; // out of 20
      baseEse = 38; // out of 50
    }

    const isIntDone = res.hasInternalEntered;
    const isPrDone = res.hasPracticalEntered;
    const isEseDone = res.hasEseEntered;

    const enteredSum = (isIntDone ? res.internalTotal : 0) +
                       (isPrDone ? res.practical : 0) +
                       (isEseDone ? res.ese : 0);

    const remainingNeeded = Math.max(0, targetTotalMarks - enteredSum);
    const unenteredCount = (!isIntDone ? 1 : 0) + (!isPrDone ? 1 : 0) + (!isEseDone ? 1 : 0);

    let adviceType = 'neutral'; // 'surplus' | 'shortfall' | 'achieved' | 'ontrack' | 'warning'
    let adviceHtml = '';
    let reqPr = basePractical;
    let reqEse = baseEse;

    if (unenteredCount === 0) {
      // All marks entered
      if (res.totalScore >= targetTotalMarks && res.pass) {
        adviceType = 'achieved';
        adviceHtml = `<strong>🎉 Target Secured!</strong> Scored <strong>${res.totalScore}/${s.maxMarks}</strong> (${res.pct.toFixed(1)}% · <strong>${res.grade} Grade</strong>). Meets target ${targetDetails.grade}!`;
      } else {
        const diff = targetTotalMarks - res.totalScore;
        adviceType = 'shortfall';
        adviceHtml = `<strong>⚠️ Scored ${res.totalScore}/${s.maxMarks}</strong> (${res.grade} Grade). Shortfall of <strong>${diff} marks</strong> to reach ${targetDetails.grade} (${targetTotalMarks} pts).`;
      }
    } else if (isIntDone && !isPrDone && !isEseDone) {
      // Internal is entered, Practical & ESE remaining
      const internalShortfall = baseInternal - res.internalTotal;
      if (internalShortfall > 0) {
        // Shortfall in internal! E.g. got 26 instead of 27 (-1)
        adviceType = 'shortfall';
        reqPr = Math.min(s.maxPractical, basePractical + internalShortfall);
        reqEse = Math.min(s.maxEse, baseEse + internalShortfall);
        const splitPr = Math.min(s.maxPractical, Math.ceil(basePractical + internalShortfall / 2));
        const splitEse = Math.min(s.maxEse, Math.ceil(baseEse + internalShortfall / 2));

        adviceHtml = `<span>⚠️ <strong>${internalShortfall} Mark Shortfall in Internal</strong> (${res.internalTotal}/${s.maxInternal}). To secure <strong>${targetDetails.grade} Grade</strong>, compensate by scoring:</span>
          <div class="dynamic-target-chips">
            <span class="target-chip chip-boost">Practical: <strong>${reqPr}/${s.maxPractical}</strong> (+${internalShortfall})</span>
            <span class="target-chip-or">OR</span>
            <span class="target-chip chip-boost">ESE Exam: <strong>${reqEse}/${s.maxEse}</strong> (+${internalShortfall})</span>
            <span class="target-chip-or">OR</span>
            <span class="target-chip chip-split">Split: <strong>${splitPr}</strong> Pract + <strong>${splitEse}</strong> ESE</span>
          </div>`;
      } else if (internalShortfall < 0) {
        // Bonus surplus in internal! E.g. got 29 instead of 27 (+2)
        const surplus = Math.abs(internalShortfall);
        adviceType = 'surplus';
        reqPr = Math.max(0, basePractical - surplus);
        reqEse = Math.max(eseMinPassing, baseEse - surplus);
        adviceHtml = `<span>🎉 <strong>+${surplus} Bonus Marks in Internal</strong> (${res.internalTotal}/${s.maxInternal})! Targets relaxed:</span>
          <div class="dynamic-target-chips">
            <span class="target-chip chip-ease">Practical: <strong>${reqPr}/${s.maxPractical}</strong> (-${surplus})</span>
            <span class="target-chip-or">OR</span>
            <span class="target-chip chip-ease">ESE Exam: <strong>${reqEse}/${s.maxEse}</strong> (-${surplus})</span>
          </div>`;
      } else {
        // Exactly on target
        adviceType = 'ontrack';
        adviceHtml = `<span>🎯 <strong>Internal On Target</strong> (${res.internalTotal}/${s.maxInternal}). Maintain baseline: Practical <strong>${basePractical}/${s.maxPractical}</strong> and ESE <strong>${baseEse}/${s.maxEse}</strong>.</span>`;
      }
    } else if (isIntDone && isPrDone && !isEseDone) {
      // Internal & Practical entered, only ESE remaining
      const currentSum = res.internalTotal + res.practical;
      const eseNeeded = Math.min(s.maxEse, Math.max(eseMinPassing, targetTotalMarks - currentSum));
      const totalShortfall = (baseInternal + basePractical) - currentSum;

      if (eseNeeded > s.maxEse) {
        adviceType = 'warning';
        adviceHtml = `<span>⚠️ Cannot reach ${targetDetails.grade} with remaining ESE alone (Needs ${eseNeeded}/${s.maxEse}). Max achievable ESE will give ${getGtuGradeAndPoints(((currentSum + s.maxEse) / s.maxMarks) * 100).grade} Grade.</span>`;
      } else if (totalShortfall > 0) {
        adviceType = 'shortfall';
        adviceHtml = `<span>⚠️ <strong>${totalShortfall} Total Shortfall</strong> in Internals/Pract. You must score at least <strong>${eseNeeded}/${s.maxEse}</strong> in GTU ESE Exam to secure <strong>${targetDetails.grade} Grade</strong> (${targetSpi} SPI).</span>`;
      } else {
        adviceType = 'ontrack';
        adviceHtml = `<span>✅ <strong>Strong Internals (${currentSum}/${s.maxInternal + s.maxPractical})</strong>. Score at least <strong>${eseNeeded}/${s.maxEse}</strong> (min pass ${eseMinPassing}) in GTU ESE Exam for ${targetDetails.grade}.</span>`;
      }
    } else {
      // Default baseline preview
      adviceType = 'neutral';
      adviceHtml = `<span>🎯 <strong>Target ${targetDetails.grade} (${targetSpi} SPI · ${targetTotalMarks}/${s.maxMarks} pts)</strong>: Aim for Internal <strong>${baseInternal}/${s.maxInternal}</strong>, Practical <strong>${basePractical}/${s.maxPractical}</strong>, ESE <strong>${baseEse}/${s.maxEse}</strong>.</span>`;
    }

    return {
      targetTotalMarks,
      targetGrade: targetDetails.grade,
      baseInternal,
      basePractical,
      baseEse,
      remainingNeeded,
      adviceType,
      adviceHtml
    };
  }

  // ── LIVE SURGICAL DOM UPDATER (Fixes Keyboard 1-Digit Bug) ──
  // Updates only the computed text nodes and classes in place,
  // preventing inputs from re-rendering and losing focus/keyboard.
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
      gradeBadge.className = `grade-badge-pill grade-${res.grade}`;
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

    // 4. Footer Total & Percentage
    const totalScoreVal = cardEl.querySelector('.total-score-val');
    if (totalScoreVal) {
      totalScoreVal.innerHTML = `Subject Total: <strong>${res.totalScore} / ${res.maxMarks}</strong>`;
    }
    const totalPctVal = cardEl.querySelector('.total-pct-val');
    if (totalPctVal) {
      totalPctVal.textContent = `${res.pct.toFixed(1)}%`;
    }

    // 5. Dynamic Shortfall Balancer Advice Box
    const adviceBox = cardEl.querySelector('.marks-target-advisor');
    if (adviceBox) {
      adviceBox.className = `marks-target-advisor advisor-${dynTarget.adviceType}`;
      adviceBox.innerHTML = dynTarget.adviceHtml;
    }

    // 6. Update global dashboard summaries in place
    updateLiveSummary();
  }

  // ── LIVE GLOBAL DASHBOARD SUMMARY UPDATER ──────────────────
  function updateLiveSummary() {
    const stats = calcOverallMarksStats();
    const data = d();

    // SPI Card
    const spiValEl = document.getElementById('summarySpiVal');
    const spiGradeEl = document.getElementById('summarySpiGrade');
    if (spiValEl) spiValEl.textContent = stats.spi.toFixed(2);
    if (spiGradeEl) {
      const gInfo = getGtuGradeAndPoints(stats.overallPct, stats.failCount > 0);
      spiGradeEl.textContent = `${gInfo.grade} Grade`;
      spiGradeEl.className = `marks-sub-label grade-${gInfo.grade}`;
    }

    // Total Marks Card
    const totalMarksEl = document.getElementById('summaryTotalMarksVal');
    const pctValEl = document.getElementById('summaryPctVal');
    const passStatusEl = document.getElementById('summaryPassStatus');
    if (totalMarksEl) totalMarksEl.textContent = `${stats.totalObtained} / ${stats.totalMaxMarks}`;
    if (pctValEl) pctValEl.textContent = `${stats.overallPct.toFixed(1)}%`;
    if (passStatusEl) {
      passStatusEl.textContent = stats.failCount === 0
        ? '🟢 All Subjects Clear (Pass)'
        : `🔴 ${stats.failCount} Subject(s) Need Re-attempt`;
    }

    // CGPA Card
    const cgpaValEl = document.getElementById('summaryCgpaVal');
    if (cgpaValEl) cgpaValEl.textContent = stats.spi.toFixed(2);

    // Target Engine Suggestion Box
    renderTargetBacktracker();
    renderCgpaTable(stats.spi);
  }

  // ── TARGET BACKTRACKER TOP ENGINE ─────────────────────────
  function renderTargetBacktracker() {
    const data = d();
    const targetSpi = (data.settings && typeof data.settings.targetSpi === 'number') ? data.settings.targetSpi : 8.5;

    // Sync dropdown menu if present
    const selectEl = document.getElementById('targetSpiSelect');
    if (selectEl && selectEl.value !== String(targetSpi)) {
      selectEl.value = String(targetSpi);
    }

    const targetDetails = getTargetGradeDetails(targetSpi);
    const targetPct = targetDetails.minPct;

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
    if (grade4El) grade4El.textContent = `Target Grade: ${targetDetails.grade}`;
    if (ese2El) ese2El.textContent = `${ese2Needed} / 50`;
    if (grade2El) grade2El.textContent = `Target Grade: ${targetDetails.grade}`;

    const avgIntPct = Math.round(((avgIntPrPct4 + avgIntPrPct2) / 2) * 100);
    if (intValEl) intValEl.textContent = `${avgIntPct}% Avg`;
    if (intSubEl) intSubEl.textContent = avgIntPct >= targetPct ? '🟢 Internal Score Strong' : `⚠️ Target >${targetPct}% Internals`;

    if (suggBox) {
      const currStats = calcOverallMarksStats();
      let statusIcon = '⚡', statusMsg = '';
      if (currStats.spi >= targetSpi && currStats.totalObtained > 0) {
        statusIcon = '🎉';
        statusMsg = `<strong>Outstanding!</strong> Current SPI of <strong>${currStats.spi.toFixed(2)}</strong> meets your <strong>${targetDetails.grade}</strong> target (<strong>${targetSpi.toFixed(2)} SPI</strong>)! Keep up the momentum.`;
      } else {
        statusMsg = `To secure <strong>${targetDetails.grade} Grade</strong> (<strong>${targetSpi.toFixed(2)} SPI</strong> · <strong>${targetPct}% marks</strong>), maintain at least <strong>${ese4Needed}/70</strong> in 4-Credit ESE and <strong>${ese2Needed}/50</strong> in 2-Credit ESE papers. Live dynamic advisor will rebalance shortfalls below.`;
      }
      suggBox.innerHTML = `<span class="target-sugg-icon">${statusIcon}</span> <div>${statusMsg}</div>`;
    }
  }

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

  // ── FULL RENDER (Used on tab switch / reset) ──────────────
  function renderMarksHub() {
    renderTargetBacktracker();

    const data = d();
    const targetSpi = (data.settings && typeof data.settings.targetSpi === 'number') ? data.settings.targetSpi : 8.5;
    
    // Get visible semesters from settings (which are controlled by PDF Tracker tabs)
    const visibleSems = (data.settings && Array.isArray(data.settings.visibleSems)) ? data.settings.visibleSems : [1, 2, 3, 4, 5, 6];
    
    // Auto-select the first visible semester if activeMarksSem is not visible
    if (!visibleSems.includes(activeMarksSem)) {
      activeMarksSem = visibleSems.length ? visibleSems[0] : 1;
    }

    const marksSemFiltersEl = document.getElementById('marksSemFilters');
    if (marksSemFiltersEl) {
      marksSemFiltersEl.innerHTML = visibleSems.map(sem => `
        <button class="pill ${sem === activeMarksSem ? 'active' : ''}" onclick="MarksHub.setActiveMarksSem(${sem})">
          Semester ${sem}
        </button>
      `).join('');
    }

    const semSubs = (data.subjects || []).filter(s => (s.sem || 1) === activeMarksSem);
    const container = document.getElementById('marksSubjectsContainer');

    if (container) {
      if (semSubs.length === 0) {
        container.innerHTML = `
          <div class="empty-state-card" style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: var(--bg-card); border-radius: var(--r-xl); border: 2px dashed var(--border);">
            <div style="font-size: 2.8rem; margin-bottom: 10px;">📋</div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-dark); margin-bottom: 6px;">No Subjects in Semester ${activeMarksSem} Yet</h3>
            <p style="font-size: 0.84rem; color: var(--text-mid); max-width: 440px; margin: 0 auto 18px; line-height: 1.5;">
              Add your GTU Semester ${activeMarksSem} subjects to record marks, calculate SPI, and balance shortfall targets across your 3-year degree.
            </p>
            <button class="btn btn-accent btn-sm" onclick="App.openAddSubjectModal(${activeMarksSem})">
              ➕ Add Subject for Sem ${activeMarksSem}
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
                    <span class="sub-meta-pill">${esc(s.code)}</span>
                    <span class="sub-meta-pill">${res.credits} Credits · ${(res.credits === 2 ? '3 Units' : '5 Units')}</span>
                    <span class="sub-meta-pill">Max ${res.maxMarks}</span>
                  </div>
                </div>
              </div>
              <div class="marks-head-right">
                <div class="marks-head-status">
                  <span class="grade-badge-pill grade-${res.grade}">${res.grade} (${res.gp})</span>
                  <span class="pass-fail-text ${res.pass ? 'text-pass' : 'text-fail'}">${res.pass ? 'PASS' : 'FAIL'}</span>
                </div>
                <span class="marks-chevron">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </span>
              </div>
            </div>

            <div class="marks-card-body">
              <!-- Dynamic Target & Shortfall Balancer Card Header -->
              <div class="marks-target-advisor advisor-${dynTarget.adviceType}">
                ${dynTarget.adviceHtml}
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
                    <div class="field-label-row">
                      <label class="field-label">Internal Total Marks (Max ${res.maxInternal})</label>
                      <span class="field-benchmark-badge">Target: ${dynTarget.baseInternal}</span>
                    </div>
                    <input type="number" class="marks-num-input" min="0" max="${res.maxInternal}" placeholder="0 - ${res.maxInternal}"
                           value="${m.internalLumpsum !== null && m.internalLumpsum !== undefined ? m.internalLumpsum : ''}"
                           oninput="App.onMarksInput('${s.id}', 'internalLumpsum', this.value)" />
                  </div>
                ` : `
                  <div class="marks-input-row">
                    <div class="marks-field-group">
                      <div class="field-label-row">
                        <label class="field-label">Mid-Sem (20)</label>
                      </div>
                      <input type="number" class="marks-num-input" min="0" max="20" placeholder="0-20"
                             value="${m.internalMid !== null && m.internalMid !== undefined ? m.internalMid : ''}"
                             oninput="App.onMarksInput('${s.id}', 'internalMid', this.value)" />
                    </div>
                    <div class="marks-field-group">
                      <div class="field-label-row">
                        <label class="field-label">Attend. (5)</label>
                      </div>
                      <input type="number" class="marks-num-input" min="0" max="5" placeholder="0-5"
                             value="${m.internalAtt !== null && m.internalAtt !== undefined ? m.internalAtt : ''}"
                             oninput="App.onMarksInput('${s.id}', 'internalAtt', this.value)" />
                    </div>
                    <div class="marks-field-group">
                      <div class="field-label-row">
                        <label class="field-label">Beh/Assign (5)</label>
                      </div>
                      <input type="number" class="marks-num-input" min="0" max="5" placeholder="0-5"
                             value="${m.internalBeh !== null && m.internalBeh !== undefined ? m.internalBeh : ''}"
                             oninput="App.onMarksInput('${s.id}', 'internalBeh', this.value)" />
                    </div>
                  </div>
                `}
              </div>

              <div class="marks-component-grid">
                <div class="marks-field-group">
                  <div class="field-label-row">
                    <label class="field-label">Practical / Viva (Max ${res.maxPractical})</label>
                    <span class="field-benchmark-badge">Target: ${dynTarget.basePractical}</span>
                  </div>
                  <input type="number" class="marks-num-input" min="0" max="${res.maxPractical}" placeholder="0-${res.maxPractical}"
                         value="${m.practical !== null && m.practical !== undefined ? m.practical : ''}"
                         oninput="App.onMarksInput('${s.id}', 'practical', this.value)" />
                </div>
                <div class="marks-field-group">
                  <div class="field-label-row">
                    <label class="field-label">GTU ESE Exam (Max ${res.maxEse})</label>
                    <span class="field-benchmark-badge">Min ${Math.ceil(res.maxEse * 0.35)} | Target: ${dynTarget.baseEse}</span>
                  </div>
                  <input type="number" class="marks-num-input" min="0" max="${res.maxEse}" placeholder="0-${res.maxEse}"
                         value="${m.ese !== null && m.ese !== undefined ? m.ese : ''}"
                         oninput="App.onMarksInput('${s.id}', 'ese', this.value)" />
                </div>
              </div>

              <div class="marks-card-footer">
                <div class="marks-footer-stats">
                  <span class="total-score-val">Subject Total: <strong>${res.totalScore} / ${res.maxMarks}</strong></span>
                  <span class="total-pct-val">${res.pct.toFixed(1)}%</span>
                </div>
                <button class="btn btn-accent btn-full btn-save-marks" onclick="App.saveSubjectMarks('${s.id}')">
                  💾 Save & Sync ${s.code} Marks
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    updateLiveSummary();
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

  // ── INTERACTIVE GTU GRADING GUIDE MODAL SIMULATOR ──────────
  let _simState = {
    c4Mid: 18, c4Att: 5, c4Beh: 4, c4Pract: 42, c4Ese: 55, // 124 / 150 -> 82.7% -> AB (9 GP)
    c2Mid: 18, c2Att: 4, c2Beh: 4, c2Pract: 17, c2Ese: 39  // 82 / 100 -> 82.0% -> AB (9 GP)
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
    // 4-Credit Subject Calc
    const c4Int = Math.min(s.c4Mid, 20) + Math.min(s.c4Att, 5) + Math.min(s.c4Beh, 5);
    const c4Pract = Math.min(s.c4Pract, 50);
    const c4Ese = Math.min(s.c4Ese, 70);
    const c4Total = c4Int + c4Pract + c4Ese;
    const c4Pct = (c4Total / 150) * 100;
    const c4EseFailed = c4Ese < 25; // 35% of 70 = 24.5 -> 25
    const c4GradeInfo = getGtuGradeAndPoints(c4Pct, c4EseFailed);
    const c4CreditPoints = 4 * c4GradeInfo.gp;

    // 2-Credit Subject Calc
    const c2Int = Math.min(s.c2Mid, 20) + Math.min(s.c2Att, 5) + Math.min(s.c2Beh, 5);
    const c2Pract = Math.min(s.c2Pract, 20);
    const c2Ese = Math.min(s.c2Ese, 50);
    const c2Total = c2Int + c2Pract + c2Ese;
    const c2Pct = (c2Total / 100) * 100;
    const c2EseFailed = c2Ese < 18; // 35% of 50 = 17.5 -> 18
    const c2GradeInfo = getGtuGradeAndPoints(c2Pct, c2EseFailed);
    const c2CreditPoints = 2 * c2GradeInfo.gp;

    // Weighted SPI Simulation for Sem 1 (4 four-credit + 2 two-credit = 20 credits)
    const totalCreditPoints = (4 * c4CreditPoints) + (2 * c2CreditPoints);
    const simSpi = totalCreditPoints / 20;

    // Update DOM elements in guide modal
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
      el4Grade.className = `sim-badge grade-${c4GradeInfo.grade}`;
      el4Grade.textContent = `${c4GradeInfo.grade} (${c4GradeInfo.gp} GP)`;
    }
    if (el4Cp) el4Cp.textContent = `4c × ${c4GradeInfo.gp} = ${c4CreditPoints} pts`;

    if (el2Total) el2Total.textContent = `${c2Total} / 100`;
    if (el2Pct) el2Pct.textContent = `${c2Pct.toFixed(1)}%`;
    if (el2Grade) {
      el2Grade.className = `sim-badge grade-${c2GradeInfo.grade}`;
      el2Grade.textContent = `${c2GradeInfo.grade} (${c2GradeInfo.gp} GP)`;
    }
    if (el2Cp) el2Cp.textContent = `2c × ${c2GradeInfo.gp} = ${c2CreditPoints} pts`;

    if (elSimSpi) {
      elSimSpi.textContent = simSpi.toFixed(2);
      elSimSpi.className = `sim-spi-val grade-${getGtuGradeAndPoints(simSpi * 10).grade}`;
    }
    if (elSimFormula) {
      elSimFormula.innerHTML = `(${4} × ${c4CreditPoints} + ${2} × ${c2CreditPoints}) ÷ 20 Credits = <strong>${simSpi.toFixed(2)} SPI</strong>`;
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
    renderSimulator
  };
})();
