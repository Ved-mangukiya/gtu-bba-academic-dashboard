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

  function getGtuGradeAndPoints(pct, hasFailed = false) {
    if (hasFailed || pct < 35) return { grade: 'FF', gp: 0, pass: false, text: 'Fail / Remedial' };
    if (pct >= 85) return { grade: 'AA', gp: 10, pass: true, text: 'Outstanding' };
    if (pct >= 75) return { grade: 'AB', gp: 9, pass: true, text: 'Excellent' };
    if (pct >= 65) return { grade: 'BB', gp: 8, pass: true, text: 'Very Good' };
    if (pct >= 55) return { grade: 'BC', gp: 7, pass: true, text: 'Good' };
    if (pct >= 45) return { grade: 'CC', gp: 6, pass: true, text: 'Fair' };
    if (pct >= 40) return { grade: 'CD', gp: 5, pass: true, text: 'Pass' };
    if (pct >= 35) return { grade: 'DD', gp: 4, pass: true, text: 'Min Pass' };
    return { grade: 'FF', gp: 0, pass: false, text: 'Fail / Remedial' };
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

    // Strict GTU minimum passing marks (35% in each individual component head)
    const minEse = Math.ceil(maxEse * 0.35);             // 25/70 for 4c, 18/50 for 2c
    const minInternal = Math.ceil(maxInternal * 0.35);   // 11/30 (Mid-Sem 20 + Att 10)
    const minPractical = Math.ceil(maxPractical * 0.35); // 18/50 for 4c, 7/20 for 2c
    const minAggregate = Math.ceil(maxMarks * 0.35);     // 53/150 for 4c, 35/100 for 2c

    let internalTotal = 0;
    let hasInternalDeclared = false;

    if (m.isLumpsum) {
      if (typeof m.internalLumpsum === 'number' && m.internalLumpsum > 0) {
        internalTotal = Math.min(Math.max(m.internalLumpsum, 0), maxInternal);
        hasInternalDeclared = true;
      }
    } else {
      const hasMidRaw = typeof m.internalMidRaw === 'number' && m.internalMidRaw > 0;
      const hasMid = typeof m.internalMid === 'number' && m.internalMid > 0;
      const hasAtt = typeof m.internalAtt === 'number' && m.internalAtt > 0;
      const hasBeh = typeof m.internalBeh === 'number' && m.internalBeh > 0;
      if (hasMidRaw || hasMid || hasAtt || hasBeh) {
        let mid = 0;
        if (hasMidRaw) {
          mid = Math.min(Math.max(m.internalMidRaw / 2, 0), 20);
        } else if (hasMid) {
          mid = Math.min(Math.max(m.internalMid, 0), 20);
        }
        // Attendance: 10 Marks (Mid 20 + Attendance 10 = 30 Internal Total)
        const att = hasAtt ? Math.min(Math.max(m.internalAtt, 0), 10) : 0;
        const beh = hasBeh ? Math.min(Math.max(m.internalBeh, 0), 5) : 0;
        internalTotal = Math.min(mid + att + (hasBeh && att <= 5 ? beh : 0), maxInternal);
        hasInternalDeclared = internalTotal > 0;
      }
    }

    // 0 or null/empty marks mean NOT DECLARED / PENDING EXAM — NOT A BACKLOG!
    const hasPracticalDeclared = typeof m.practical === 'number' && m.practical > 0;
    const practical = hasPracticalDeclared ? Math.min(Math.max(m.practical, 0), maxPractical) : 0;

    const hasEseDeclared = typeof m.ese === 'number' && m.ese > 0;
    const ese = hasEseDeclared ? Math.min(Math.max(m.ese, 0), maxEse) : 0;

    const totalScore = internalTotal + practical + ese;
    const pct = maxMarks ? (totalScore / maxMarks) * 100 : 0;

    // Component-level individual pass/fail checks:
    // A component is ONLY failed if an actual declared score (> 0) is below the minimum passing threshold!
    const isEseFailed = hasEseDeclared && (ese < minEse);
    const isInternalFailed = hasInternalDeclared && (internalTotal < minInternal);
    const isPracticalFailed = hasPracticalDeclared && (practical < minPractical);

    const failedComponents = [];
    if (isInternalFailed) failedComponents.push(`Internal Theory (${internalTotal}/${maxInternal} < ${minInternal})`);
    if (isPracticalFailed) failedComponents.push(`Practical (${practical}/${maxPractical} < ${minPractical})`);
    if (isEseFailed) failedComponents.push(`GTU Exam (${ese}/${maxEse} < ${minEse})`);

    const hasAnyFailed = failedComponents.length > 0;
    const hasAllDeclared = hasInternalDeclared && hasPracticalDeclared && hasEseDeclared;
    const hasAnyDeclared = hasInternalDeclared || hasPracticalDeclared || hasEseDeclared;

    // Aggregate failure check ONLY applies when ALL component heads have been declared!
    const isAggregateFailed = hasAllDeclared && (pct < 35);
    if (isAggregateFailed && !hasAnyFailed) {
      failedComponents.push(`Overall Aggregate (${pct.toFixed(1)}% < 35%)`);
    }

    const isFailedOverall = hasAnyFailed || isAggregateFailed;
    const pass = !isFailedOverall;

    // Performance metrics calculated strictly over declared components
    const declaredTotal = totalScore;
    const declaredMax = (hasInternalDeclared ? maxInternal : 0) + (hasPracticalDeclared ? maxPractical : 0) + (hasEseDeclared ? maxEse : 0);
    const declaredPct = declaredMax > 0 ? (declaredTotal / declaredMax) * 100 : 0;

    // Grade calculation:
    let gradeInfo = { grade: '--', gp: 0, text: 'Pending' };
    if (hasAnyFailed) {
      gradeInfo = getGtuGradeAndPoints(pct, true); // FF Grade
    } else if (hasAllDeclared) {
      gradeInfo = getGtuGradeAndPoints(pct, isAggregateFailed);
    } else if (hasAnyDeclared) {
      // Pacing grade based on declared components (e.g., 50/50 Practical = AA)
      gradeInfo = getGtuGradeAndPoints(declaredPct, false);
    }

    let status = 'PENDING';
    if (hasAnyFailed) {
      status = 'BACKLOG';
    } else if (hasAllDeclared) {
      status = 'PASS';
    } else if (hasAnyDeclared) {
      status = 'ON TRACK';
    } else {
      status = 'PENDING';
    }

    return {
      credits, maxMarks, maxEse, maxInternal, maxPractical,
      minEse, minInternal, minPractical, minAggregate,
      internalTotal, practical, ese, totalScore, pct,
      declaredTotal, declaredMax, declaredPct,
      isEseFailed, isInternalFailed, isPracticalFailed, isAggregateFailed,
      failedComponents, hasAnyFailed, isFailedOverall,
      hasInternalDeclared, hasPracticalDeclared, hasEseDeclared,
      hasAllDeclared, hasAnyDeclared,
      // Backwards-compatible aliases
      hasInternalEntered: hasInternalDeclared,
      hasPracticalEntered: hasPracticalDeclared,
      hasEseEntered: hasEseDeclared,
      hasAllEntered: hasAllDeclared,
      hasAnyEntered: hasAnyDeclared,
      grade: gradeInfo.grade, gp: gradeInfo.gp, pass, status
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
      if (res.hasAnyDeclared) {
        weightedGpSum += res.credits * res.gp;
        totalCreditsSum += res.credits;
      }
      if (res.hasAnyFailed) failCount++;
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

    if (res.hasAnyFailed) {
      adviceType = 'shortfall';
      adviceHtml = `⚠️ <strong>Strict Component Backlog:</strong> Below passing mark in ${res.failedComponents.join(' · ')}. In GTU, failing any component results in FF grade regardless of total!`;
    } else if (totalDiff > 0) {
      adviceType = 'ahead';
      adviceHtml = `🟢 <strong>Target Balanced:</strong> Strong internal/practical (+${totalDiff} pts) lowers ESE target to <strong>${dynEse}/${maxEse}</strong> for ${targetDetails.grade} grade.`;
    } else if (totalDiff < 0) {
      adviceType = 'tight';
      adviceHtml = `⚡ <strong>Target Rebalanced:</strong> Internal shortfall (${totalDiff} pts) raised required ESE target to <strong>${dynEse}/${maxEse}</strong> for ${targetDetails.grade} grade.`;
    } else {
      adviceHtml = `🎯 <strong>Baseline Target:</strong> Aim for Internal ${baseInternal}/${maxInternal} (Min 11), Practical ${basePractical}/${maxPractical} (Min ${res.minPractical}), and ESE ${dynEse}/${maxEse} (Min ${res.minEse}) for ${targetDetails.grade} grade.`;
    }

    const dynMid = Math.round(baseInternal * (20 / 30));
    const dynMidCollege = Math.min(40, dynMid * 2);
    const dynAtt = Math.round(baseInternal * (10 / 30));
    const dynBeh = 0;

    return {
      targetTotalMarks,
      dynEse,
      dynInternal: baseInternal,
      dynPractical: basePractical,
      dynLump: baseInternal,
      dynMid,
      dynMidCollege,
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
      gradeBadge.className = `grade-badge-pill grade-${res.hasAnyFailed ? 'FF' : (res.grade === '--' ? 'pending' : res.grade)}`;
      gradeBadge.textContent = `${res.grade}${res.gp ? ` (${res.gp})` : ''}`;
    }

    // 2. Pass / Fail Status Text
    const passFailText = cardEl.querySelector('.pass-fail-text');
    if (passFailText) {
      if (res.hasAnyFailed) {
        passFailText.className = 'pass-fail-text text-fail';
        passFailText.textContent = 'BACKLOG';
      } else if (res.hasAllDeclared) {
        passFailText.className = 'pass-fail-text text-pass';
        passFailText.textContent = 'PASS';
      } else if (res.hasAnyDeclared) {
        passFailText.className = 'pass-fail-text text-ontrack';
        passFailText.textContent = 'ON TRACK';
      } else {
        passFailText.className = 'pass-fail-text text-pending';
        passFailText.textContent = 'PENDING';
      }
    }

    // 2b. Card Backlog Alert Banner (ONLY triggers if an actual score > 0 is failed!)
    const bannerEl = cardEl.querySelector('.card-backlog-banner-wrap');
    if (bannerEl) {
      if (res.hasAnyFailed) {
        bannerEl.innerHTML = `
          <div class="card-backlog-banner">
            ⚠️ <strong>Backlog Alert:</strong> GTU requires passing marks in each component individually! Below minimum in: ${res.failedComponents.join(' · ')}
          </div>
        `;
      } else if (res.hasAllDeclared && res.pass) {
        bannerEl.innerHTML = `
          <div class="card-passed-banner">
            ✅ <strong>All Heads Passed:</strong> Internal Theory (${res.internalTotal}/30 ≥ 11), Practical (${res.practical}/${res.maxPractical} ≥ ${res.minPractical}), GTU Exam (${res.ese}/${res.maxEse} ≥ ${res.minEse}).
          </div>
        `;
      } else {
        bannerEl.innerHTML = '';
      }
    }

    // 2c. Component Wrappers and Pass Badges
    const eseWrap = cardEl.querySelector('.stepper-input-wrap[data-wrap-for="ese"]');
    if (eseWrap) {
      eseWrap.className = `stepper-input-wrap ${res.hasEseDeclared && res.isEseFailed ? 'ese-failed-wrap' : (res.hasEseDeclared ? 'ese-passed-wrap' : '')}`;
    }
    const esePassBadge = cardEl.querySelector('.component-pass-badge[data-pass-for="ese"]');
    if (esePassBadge) {
      esePassBadge.className = `component-pass-badge ${res.hasEseDeclared ? (res.isEseFailed ? 'badge-failed' : 'badge-passed') : ''}`;
      esePassBadge.innerHTML = res.hasEseDeclared
        ? (res.isEseFailed ? `❌ Fail (${res.ese}/${res.maxEse})` : `✅ Pass (${res.ese}/${res.maxEse})`)
        : `⏳ Pending · Min ${res.minEse} to pass`;
    }

    const practWrap = cardEl.querySelector('.stepper-input-wrap[data-wrap-for="practical"]');
    if (practWrap) {
      practWrap.className = `stepper-input-wrap ${res.hasPracticalDeclared && res.isPracticalFailed ? 'pract-failed-wrap' : (res.hasPracticalDeclared ? 'pract-passed-wrap' : '')}`;
    }
    const practPassBadge = cardEl.querySelector('.component-pass-badge[data-pass-for="practical"]');
    if (practPassBadge) {
      practPassBadge.className = `component-pass-badge ${res.hasPracticalDeclared ? (res.isPracticalFailed ? 'badge-failed' : 'badge-passed') : ''}`;
      practPassBadge.innerHTML = res.hasPracticalDeclared
        ? (res.isPracticalFailed ? `❌ Fail (${res.practical}/${res.maxPractical})` : `✅ Pass (${res.practical}/${res.maxPractical})`)
        : `⏳ Pending · Min ${res.minPractical} to pass`;
    }

    const intWrap = cardEl.querySelector('.stepper-input-wrap[data-wrap-for="internal"]');
    if (intWrap) {
      intWrap.className = `stepper-input-wrap ${res.hasInternalDeclared && res.isInternalFailed ? 'internal-failed-wrap' : (res.hasInternalDeclared ? 'internal-passed-wrap' : '')}`;
    }
    const intPassBadge = cardEl.querySelector('.component-pass-badge[data-pass-for="internal"]');
    if (intPassBadge) {
      intPassBadge.className = `component-pass-badge ${res.hasInternalDeclared ? (res.isInternalFailed ? 'badge-failed' : 'badge-passed') : ''}`;
      intPassBadge.innerHTML = res.hasInternalDeclared
        ? (res.isInternalFailed ? `❌ Fail (${res.internalTotal}/${res.maxInternal})` : `✅ Pass (${res.internalTotal}/${res.maxInternal})`)
        : `⏳ Pending · Min ${res.minInternal} to pass`;
    }

    // 3. Internal Title Score
    const internalTitle = cardEl.querySelector('.internal-title');
    if (internalTitle) {
      internalTitle.textContent = `Internal Theory (${res.internalTotal} / ${res.maxInternal})`;
    }

    // 4. Header Score summary
    const headScore = cardEl.querySelector('.marks-sub-meta');
    if (headScore) {
      headScore.innerHTML = `<span>${App.esc(s.code)}</span> · <span>${res.credits} Credits</span> · <span>Score: <strong>${res.totalScore}/${res.maxMarks}</strong>${res.hasAllDeclared ? ` (${res.pct.toFixed(1)}%)` : (res.hasAnyDeclared ? ` · Declared: <strong>${res.declaredTotal}/${res.declaredMax}</strong> (${res.declaredPct.toFixed(1)}%)` : '')}</span>`;
    }

    // 5. Footer Total & Percentage
    const totalScoreVal = cardEl.querySelector('.total-score-val');
    if (totalScoreVal) {
      totalScoreVal.innerHTML = `Total: <strong>${res.totalScore} / ${res.maxMarks}</strong>`;
    }
    const totalPctVal = cardEl.querySelector('.total-pct-val');
    if (totalPctVal) {
      totalPctVal.className = `total-pct-val ${res.hasAnyFailed ? 'text-fail' : ''}`;
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
    if (midBadge) midBadge.textContent = `Target: ${dynTarget.dynMidCollege}/40 (${dynTarget.dynMid}/20)`;

    // 7b. Live Mid-Sem Conversion Hint Pill
    const midConvPill = cardEl.querySelector('.mid-conv-pill');
    if (midConvPill) {
      const m = s.marks || {};
      const rawMid = (m.internalMidRaw !== null && m.internalMidRaw !== undefined)
        ? m.internalMidRaw
        : ((typeof m.internalMid === 'number') ? m.internalMid * 2 : null);
      if (rawMid !== null && !isNaN(rawMid)) {
        const gtuMid = Math.round((rawMid / 2) * 10) / 10;
        midConvPill.classList.add('active');
        midConvPill.innerHTML = `⚡ <strong>${rawMid} / 40</strong> Exam = <strong>${gtuMid} / 20</strong> GTU (÷ 2)`;
      } else {
        midConvPill.classList.remove('active');
        midConvPill.textContent = `College: 40 Marks ➔ GTU: 20 Marks (÷ 2)`;
      }
    }

    const attBadge = cardEl.querySelector('.field-benchmark-badge[data-benchmark-for="internalAtt"]');
    if (attBadge) attBadge.textContent = `Target: ${dynTarget.dynAtt} / 10`;

    const lumpBadge = cardEl.querySelector('.field-benchmark-badge[data-benchmark-for="internalLumpsum"]');
    if (lumpBadge) lumpBadge.textContent = `Target: ${dynTarget.dynLump} / ${res.maxInternal}`;

    const prBadge = cardEl.querySelector('.field-benchmark-badge[data-benchmark-for="practical"]');
    if (prBadge) prBadge.textContent = `Target: ${dynTarget.dynPractical} / ${res.maxPractical}`;

    const eseBadge = cardEl.querySelector('.field-benchmark-badge[data-benchmark-for="ese"]');
    if (eseBadge) eseBadge.textContent = `Min ${res.minEse} | Target: ${dynTarget.dynEse} / ${res.maxEse}`;

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
        if (res.hasAnyDeclared) {
          hasAnyEntered = true;
          semWeighted += res.credits * res.gp;
          semCreds += res.credits;
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

    const badgeEl = document.getElementById('targetSpiBadge');
    if (badgeEl) badgeEl.textContent = `${targetSpi.toFixed(1)} SPI`;

    const summaryEl = document.getElementById('targetShortSummary');
    if (summaryEl) summaryEl.textContent = `Target: ${targetSpi.toFixed(1)} SPI (${targetDetails.grade}) · Tap to view strategy`;

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

  // Progressive Disclosure: Target Strategy, Advice, and CGPA Table drawers
  function toggleTargetDetails() {
    const drawer = document.getElementById('targetDetailsDrawer');
    const chev = document.getElementById('targetDetailsChev');
    if (!drawer) return;
    const isShown = drawer.style.display !== 'none';
    drawer.style.display = isShown ? 'none' : 'block';
    if (chev) chev.style.transform = isShown ? 'rotate(0deg)' : 'rotate(180deg)';
  }

  function toggleCgpaTable() {
    const drawer = document.getElementById('cgpaTableDrawer');
    const chev = document.getElementById('cgpaTableChev');
    if (!drawer) return;
    const isShown = drawer.style.display !== 'none';
    drawer.style.display = isShown ? 'none' : 'block';
    if (chev) chev.style.transform = isShown ? 'rotate(0deg)' : 'rotate(180deg)';
  }

  function toggleSubjectAdvice(subId) {
    const box = document.getElementById(`adviceBox_${subId}`);
    const chev = document.getElementById(`chevAdvice_${subId}`);
    if (!box) return;
    const isShown = box.style.display !== 'none';
    box.style.display = isShown ? 'none' : 'block';
    if (chev) chev.style.transform = isShown ? 'rotate(0deg)' : 'rotate(180deg)';
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
                        <span>${esc(s.code)}</span> · <span>${res.credits} Credits</span> · <span>Score: <strong>${res.totalScore}/${res.maxMarks}</strong>${res.hasAllDeclared ? ` (${res.pct.toFixed(1)}%)` : (res.hasAnyDeclared ? ` · Declared: <strong>${res.declaredTotal}/${res.declaredMax}</strong> (${res.declaredPct.toFixed(1)}%)` : '')}</span>
                      </div>
                    </div>
                  </div>
                  <div class="marks-head-right">
                    <div class="marks-head-status">
                      <span class="grade-badge-pill grade-${res.hasAnyFailed ? 'FF' : (res.grade === '--' ? 'pending' : res.grade)}">${res.grade}${res.gp ? ` (${res.gp})` : ''}</span>
                      <span class="pass-fail-text ${res.hasAnyFailed ? 'text-fail' : (res.hasAllDeclared ? 'text-pass' : (res.hasAnyDeclared ? 'text-ontrack' : 'text-pending'))}">
                        ${res.hasAnyFailed ? 'BACKLOG' : (res.hasAllDeclared ? 'PASS' : (res.hasAnyDeclared ? 'ON TRACK' : 'PENDING'))}
                      </span>
                    </div>
                    <span class="marks-chevron">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </span>
                  </div>
                </div>

                <div class="marks-card-body">
                  <div class="marks-card-body-inner">
                    <!-- Card Backlog / Pass Banner -->
                    <div class="card-backlog-banner-wrap">
                      ${res.hasAnyFailed ? `
                        <div class="card-backlog-banner">
                          ⚠️ <strong>Backlog Alert:</strong> GTU requires passing marks in each component individually! Below minimum in: ${res.failedComponents.join(' · ')}
                        </div>
                      ` : (res.hasAllDeclared && res.pass ? `
                        <div class="card-passed-banner">
                          ✅ <strong>All Heads Passed:</strong> Internal Theory (${res.internalTotal}/30 ≥ 11), Practical (${res.practical}/${res.maxPractical} ≥ ${res.minPractical}), GTU Exam (${res.ese}/${res.maxEse} ≥ ${res.minEse}).
                        </div>
                      ` : '')}
                    </div>

                    <!-- Clean Progressive Advice Disclosure Button -->
                    <div class="advice-toggle-row" onclick="MarksHub.toggleSubjectAdvice('${s.id}')">
                      <span class="advice-toggle-label">💡 View Target Strategy & Guidance</span>
                      <span class="advice-toggle-chev" id="chevAdvice_${s.id}">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </span>
                    </div>
                    <div class="marks-target-advisor advisor-${dynTarget.adviceType}" id="adviceBox_${s.id}" style="display: none;">
                      ${dynTarget.adviceHtml}
                    </div>

                    <!-- Internal Marks -->
                    <div class="internal-block">
                      <div class="internal-toggle-row">
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                          <span class="internal-title">Internal Theory (${res.internalTotal} / ${res.maxInternal})</span>
                          <span class="component-pass-badge ${res.hasInternalDeclared ? (res.isInternalFailed ? 'badge-failed' : 'badge-passed') : ''}" data-pass-for="internal">
                            ${res.hasInternalDeclared ? (res.isInternalFailed ? `❌ Fail (${res.internalTotal}/${res.maxInternal})` : `✅ Pass (${res.internalTotal}/${res.maxInternal})`) : `⏳ Pending · Min ${res.minInternal} to pass`}
                          </span>
                        </div>
                        <label class="switch-toggle-wrap" title="Toggle Lumpsum vs Breakdown mode">
                          <span class="switch-label">${isLumpsum ? 'Lumpsum' : 'Breakdown'}</span>
                          <input type="checkbox" class="switch-input" ${isLumpsum ? 'checked' : ''} onchange="App.toggleLumpsumMode('${s.id}')" />
                          <span class="switch-slider"></span>
                        </label>
                      </div>

                      ${isLumpsum ? `
                        <div class="marks-field-group">
                          <div class="field-label-row">
                            <label class="field-label">Internal Theory Total <span class="mid-college-tag">/ ${res.maxInternal}</span></label>
                            <span class="field-benchmark-badge" data-benchmark-for="internalLumpsum">Target: ${dynTarget.dynLump}/${res.maxInternal}</span>
                          </div>
                          <div class="stepper-input-wrap ${res.hasInternalDeclared && res.isInternalFailed ? 'internal-failed-wrap' : (res.hasInternalDeclared ? 'internal-passed-wrap' : '')}" data-wrap-for="internal">
                            <button type="button" class="stepper-btn stepper-minus" onclick="App.stepMarksInput('${s.id}', 'internalLumpsum', -1)" title="Decrease Internal Total" aria-label="Decrease Internal">−</button>
                            <input type="number" class="marks-num-input" data-field="internalLumpsum" min="0" max="${res.maxInternal}" placeholder="0–${res.maxInternal}"
                                   value="${(m.internalLumpsum !== null && m.internalLumpsum !== undefined) ? m.internalLumpsum : ''}"
                                   oninput="App.onMarksInput('${s.id}', 'internalLumpsum', this.value)" />
                            <button type="button" class="stepper-btn stepper-plus" onclick="App.stepMarksInput('${s.id}', 'internalLumpsum', 1)" title="Increase Internal Total" aria-label="Increase Internal">+</button>
                          </div>
                        </div>
                      ` : (() => {
                        const rawMidVal = (m.internalMidRaw !== null && m.internalMidRaw !== undefined)
                          ? m.internalMidRaw
                          : ((m.internalMid !== null && m.internalMid !== undefined) ? m.internalMid * 2 : null);
                        const hasMidVal = rawMidVal !== null && rawMidVal !== undefined && !isNaN(rawMidVal) && rawMidVal > 0;
                        const gtuMidVal = hasMidVal ? (Math.round((rawMidVal / 2) * 10) / 10) : 0;
                        return `
                        <div class="marks-input-row">
                          <div class="marks-field-group">
                            <div class="field-label-row">
                              <label class="field-label">Mid-Sem Exam <span class="mid-college-tag">/ 40</span></label>
                              <span class="field-benchmark-badge" data-benchmark-for="internalMid">Target: ${dynTarget.dynMidCollege}/40</span>
                            </div>
                            <div class="stepper-input-wrap">
                              <button type="button" class="stepper-btn stepper-minus" onclick="App.stepMarksInput('${s.id}', 'internalMid', -1)" title="Decrease Mid-Sem" aria-label="Decrease Mid-Sem">−</button>
                              <input type="number" class="marks-num-input" data-field="internalMid" min="0" max="40" step="0.5" placeholder="0–40"
                                     value="${rawMidVal !== null && rawMidVal !== undefined ? rawMidVal : ''}"
                                     oninput="App.onMarksInput('${s.id}', 'internalMid', this.value)" />
                              <button type="button" class="stepper-btn stepper-plus" onclick="App.stepMarksInput('${s.id}', 'internalMid', 1)" title="Increase Mid-Sem" aria-label="Increase Mid-Sem">+</button>
                            </div>
                            <div class="mid-conversion-hint">
                              <span class="mid-conv-pill ${hasMidVal ? 'active' : ''}">
                                ${hasMidVal ? `⚡ <strong>${rawMidVal}/40</strong> = <strong>${gtuMidVal}/20</strong> GTU` : `College: 40 ➔ GTU: 20 (÷ 2)`}
                              </span>
                            </div>
                          </div>
                          <div class="marks-field-group">
                            <div class="field-label-row">
                              <label class="field-label">Attendance <span class="mid-college-tag">/ 10</span></label>
                              <span class="field-benchmark-badge" data-benchmark-for="internalAtt">Target: ${dynTarget.dynAtt}/10</span>
                            </div>
                            <div class="stepper-input-wrap">
                              <button type="button" class="stepper-btn stepper-minus" onclick="App.stepMarksInput('${s.id}', 'internalAtt', -1)" title="Decrease Attendance" aria-label="Decrease Attendance">−</button>
                              <input type="number" class="marks-num-input" data-field="internalAtt" min="0" max="10" placeholder="0–10"
                                     value="${(m.internalAtt !== null && m.internalAtt !== undefined) ? m.internalAtt : ''}"
                                     oninput="App.onMarksInput('${s.id}', 'internalAtt', this.value)" />
                              <button type="button" class="stepper-btn stepper-plus" onclick="App.stepMarksInput('${s.id}', 'internalAtt', 1)" title="Increase Attendance" aria-label="Increase Attendance">+</button>
                            </div>
                          </div>
                        </div>
                      `;
                      })()}
                    </div>

                    <!-- College Practical/Internal & GTU Exam Components -->
                    <div class="marks-component-grid">
                      <div class="marks-field-group">
                        <div class="field-label-row">
                          <label class="field-label">Practical / Project <span class="mid-college-tag">${res.credits === 4 ? 'Unit 5 · / 50' : 'Unit 3 · / 20'}</span></label>
                          <span class="component-pass-badge ${res.hasPracticalDeclared ? (res.isPracticalFailed ? 'badge-failed' : 'badge-passed') : ''}" data-pass-for="practical">
                            ${res.hasPracticalDeclared ? (res.isPracticalFailed ? `❌ Fail (${res.practical}/${res.maxPractical})` : `✅ Pass (${res.practical}/${res.maxPractical})`) : `⏳ Pending · Min ${res.minPractical} to pass`}
                          </span>
                        </div>
                        <div class="stepper-input-wrap ${res.hasPracticalDeclared && res.isPracticalFailed ? 'pract-failed-wrap' : (res.hasPracticalDeclared ? 'pract-passed-wrap' : '')}" data-wrap-for="practical">
                          <button type="button" class="stepper-btn stepper-minus" onclick="App.stepMarksInput('${s.id}', 'practical', -1)" title="Decrease Practical" aria-label="Decrease Practical">−</button>
                          <input type="number" class="marks-num-input" data-field="practical" min="0" max="${res.maxPractical}" placeholder="0–${res.maxPractical}"
                                 value="${(m.practical !== null && m.practical !== undefined) ? m.practical : ''}"
                                 oninput="App.onMarksInput('${s.id}', 'practical', this.value)" />
                          <button type="button" class="stepper-btn stepper-plus" onclick="App.stepMarksInput('${s.id}', 'practical', 1)" title="Increase Practical" aria-label="Increase Practical">+</button>
                        </div>
                      </div>
                      <div class="marks-field-group">
                        <div class="field-label-row">
                          <label class="field-label">GTU Exam <span class="mid-college-tag">${res.credits === 4 ? '/ 70' : '/ 50'}</span></label>
                          <span class="component-pass-badge ${res.hasEseDeclared ? (res.isEseFailed ? 'badge-failed' : 'badge-passed') : ''}" data-pass-for="ese">
                            ${res.hasEseDeclared ? (res.isEseFailed ? `❌ Fail (${res.ese}/${res.maxEse})` : `✅ Pass (${res.ese}/${res.maxEse})`) : `⏳ Pending · Min ${res.minEse} to pass`}
                          </span>
                        </div>
                        <div class="stepper-input-wrap ${res.hasEseDeclared && res.isEseFailed ? 'ese-failed-wrap' : (res.hasEseDeclared ? 'ese-passed-wrap' : '')}" data-wrap-for="ese">
                          <button type="button" class="stepper-btn stepper-minus" onclick="App.stepMarksInput('${s.id}', 'ese', -1)" title="Decrease ESE" aria-label="Decrease ESE">−</button>
                          <input type="number" class="marks-num-input" data-field="ese" min="0" max="${res.maxEse}" placeholder="0–${res.maxEse}"
                                 value="${(m.ese !== null && m.ese !== undefined) ? m.ese : ''}"
                                 oninput="App.onMarksInput('${s.id}', 'ese', this.value)" />
                          <button type="button" class="stepper-btn stepper-plus" onclick="App.stepMarksInput('${s.id}', 'ese', 1)" title="Increase ESE" aria-label="Increase ESE">+</button>
                        </div>
                      </div>
                    </div>

                    <div class="marks-card-footer">
                      <div class="marks-footer-stats">
                        <span class="total-score-val">Subject Total: <strong>${res.totalScore} / ${res.maxMarks}</strong></span>
                        <span class="total-pct-val ${res.hasAnyFailed ? 'text-fail' : ''}">${res.pct.toFixed(1)}%</span>
                      </div>
                      <button class="btn btn-accent btn-sm" onclick="App.saveSubjectMarks('${s.id}')">
                        💾 Save Marks
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
    c4Mid: 36, c4Att: 9, c4Pract: 42, c4Ese: 55,
    c2Mid: 36, c2Att: 8, c2Pract: 17, c2Ese: 39
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
      _simState = { c4Mid: 40, c4Att: 10, c4Pract: 47, c4Ese: 62, c2Mid: 40, c2Att: 10, c2Pract: 19, c2Ese: 44 };
    } else if (preset === 'ab') {
      _simState = { c4Mid: 36, c4Att: 9, c4Pract: 41, c4Ese: 56, c2Mid: 36, c2Att: 8, c2Pract: 16, c2Ese: 38 };
    } else if (preset === 'bb') {
      _simState = { c4Mid: 30, c4Att: 8, c4Pract: 35, c4Ese: 48, c2Mid: 30, c2Att: 7, c2Pract: 14, c2Ese: 34 };
    } else if (preset === 'pass_edge') {
      _simState = { c4Mid: 20, c4Att: 5, c4Pract: 20, c4Ese: 25, c2Mid: 20, c2Att: 5, c2Pract: 8, c2Ese: 18 };
    }
    // Update inputs in DOM if modal is open
    ['c4Mid', 'c4Att', 'c4Pract', 'c4Ese', 'c2Mid', 'c2Att', 'c2Pract', 'c2Ese'].forEach(f => {
      const inp = document.querySelector(`input[oninput*="'${f}'"]`);
      if (inp) inp.value = _simState[f];
    });
    renderSimulator();
  }

  function renderSimulator() {
    const s = _simState;
    const c4MidGtu = Math.min(Math.max(s.c4Mid / 2, 0), 20);
    const c4Int = c4MidGtu + Math.min(s.c4Att, 10);
    const c4Pract = Math.min(s.c4Pract, 50);
    const c4Ese = Math.min(s.c4Ese, 70);
    const c4Total = Math.round((c4Int + c4Pract + c4Ese) * 10) / 10;
    const c4Pct = (c4Total / 150) * 100;

    // Strict GTU Component-level passing checks for 4-credit subject
    const c4IntFailed = c4Int < 11;
    const c4PractFailed = c4Pract < 18;
    const c4EseFailed = c4Ese < 25;
    const c4HasFailed = c4IntFailed || c4PractFailed || c4EseFailed || (c4Pct < 35);
    const c4GradeInfo = getGtuGradeAndPoints(c4Pct, c4HasFailed);
    const c4CreditPoints = 4 * c4GradeInfo.gp;

    const c2MidGtu = Math.min(Math.max(s.c2Mid / 2, 0), 20);
    const c2Int = c2MidGtu + Math.min(s.c2Att, 10);
    const c2Pract = Math.min(s.c2Pract, 20);
    const c2Ese = Math.min(s.c2Ese, 50);
    const c2Total = Math.round((c2Int + c2Pract + c2Ese) * 10) / 10;
    const c2Pct = (c2Total / 100) * 100;

    // Strict GTU Component-level passing checks for 2-credit subject
    const c2IntFailed = c2Int < 11;
    const c2PractFailed = c2Pract < 7;
    const c2EseFailed = c2Ese < 18;
    const c2HasFailed = c2IntFailed || c2PractFailed || c2EseFailed || (c2Pct < 35);
    const c2GradeInfo = getGtuGradeAndPoints(c2Pct, c2HasFailed);
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
      if (c4HasFailed) {
        el4Grade.textContent = `FF (0 GP) · FAIL`;
        el4Grade.className = 'sim-badge badge-fail';
      } else {
        el4Grade.textContent = `${c4GradeInfo.grade} (${c4GradeInfo.gp} GP)`;
        el4Grade.className = 'sim-badge';
      }
    }
    if (el4Cp) {
      if (c4HasFailed) {
        const fails = [];
        if (c4IntFailed) fails.push(`Internal (${c4Int}/30 < 11)`);
        if (c4PractFailed) fails.push(`Practical (${c4Pract}/50 < 18)`);
        if (c4EseFailed) fails.push(`ESE (${c4Ese}/70 < 25)`);
        if (!fails.length && c4Pct < 35) fails.push(`Aggregate (${c4Pct.toFixed(1)}% < 35%)`);
        el4Cp.innerHTML = `<span style="color:var(--color-danger);font-weight:700;">⚠️ Backlog: ${fails.join(', ')}</span>`;
      } else {
        el4Cp.textContent = `4c × ${c4GradeInfo.gp} = ${c4CreditPoints} pts (All Heads Passed)`;
      }
    }

    if (el2Total) el2Total.textContent = `${c2Total} / 100`;
    if (el2Pct) el2Pct.textContent = `${c2Pct.toFixed(1)}%`;
    if (el2Grade) {
      if (c2HasFailed) {
        el2Grade.textContent = `FF (0 GP) · FAIL`;
        el2Grade.className = 'sim-badge badge-fail';
      } else {
        el2Grade.textContent = `${c2GradeInfo.grade} (${c2GradeInfo.gp} GP)`;
        el2Grade.className = 'sim-badge';
      }
    }
    if (el2Cp) {
      if (c2HasFailed) {
        const fails = [];
        if (c2IntFailed) fails.push(`Internal (${c2Int}/30 < 11)`);
        if (c2PractFailed) fails.push(`Practical (${c2Pract}/20 < 7)`);
        if (c2EseFailed) fails.push(`ESE (${c2Ese}/50 < 18)`);
        if (!fails.length && c2Pct < 35) fails.push(`Aggregate (${c2Pct.toFixed(1)}% < 35%)`);
        el2Cp.innerHTML = `<span style="color:var(--color-danger);font-weight:700;">⚠️ Backlog: ${fails.join(', ')}</span>`;
      } else {
        el2Cp.textContent = `2c × ${c2GradeInfo.gp} = ${c2CreditPoints} pts (All Heads Passed)`;
      }
    }

    if (elSimSpi) {
      elSimSpi.textContent = simSpi.toFixed(2);
    }
    if (elSimFormula) {
      const anyBacklog = c4HasFailed || c2HasFailed;
      elSimFormula.innerHTML = anyBacklog
        ? `<span style="color:var(--color-danger);font-weight:600;">⚠️ Contains Backlogs (FF = 0 GP)</span> · (4 × ${c4CreditPoints} + 2 × ${c2CreditPoints}) ÷ 20 Credits = <strong>${simSpi.toFixed(2)} SPI</strong>`
        : `(4 × ${c4CreditPoints} + 2 × ${c2CreditPoints}) ÷ 20 Credits = <strong>${simSpi.toFixed(2)} SPI</strong>`;
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
    toggleTargetDetails,
    toggleCgpaTable,
    toggleSubjectAdvice,
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
