// ============================================================
//  GTU BBA PDF Tracker — Default Data & Storage Layer
//  Updated with GTU BBA Sem 1 Credit Weights, Marks Caps,
//  and PDF Metadata (File Name & Page Count) storage.
// ============================================================

const STORAGE_KEY = 'gtu_bba_pdf_tracker_v3';

const SUBJECT_SEED = [
  // Semester 1
  {
    name: 'Principles and Practices of Management',
    code: 'S1-PPM',
    sem: 1,
    colorIndex: 0,
    credits: 4,
    maxMarks: 150,
    maxEse: 70,
    maxInternal: 30,
    maxPractical: 50,
    unitNames: [
      'Nature and Functions of Management / History of Management / Planning',
      'Decision-Making / Organization and Organization Structure',
      'Staffing / Direction and Supervision',
      'Controlling / Co-ordination / Motivation / Communication / Social Responsibility / Strategic Management',
      'Practical (SME/MSME visit and report)'
    ]
  },
  {
    name: 'Financial Accounting',
    code: 'S1-FA',
    sem: 1,
    colorIndex: 1,
    credits: 4,
    maxMarks: 150,
    maxEse: 70,
    maxInternal: 30,
    maxPractical: 50,
    unitNames: [
      'Introduction of Accounting',
      'Journals, Subsidiary Books, Ledger & Posting and Trial Balance / Preparation of Final Accounts / Financial Statement Analysis Techniques',
      'Final Accounts of Non-Profit Organization / Cash Flow Statement',
      'Valuation of Inventory / Valuation of Shares',
      'Practical (Financial statements analysis and final accounts assignments)'
    ]
  },
  {
    name: 'Business Statistics and Logic',
    code: 'S1-BSL',
    sem: 1,
    colorIndex: 2,
    credits: 4,
    maxMarks: 150,
    maxEse: 70,
    maxInternal: 30,
    maxPractical: 50,
    unitNames: [
      'Introduction to Business Statistics',
      'Measurement of Central Tendency & Dispersion',
      'Linear Correlation, Regression & Index Numbers',
      'Fundamentals of Logic',
      'Practical (Assignments on tabulation, graphical presentation, and real-life statistical applications)'
    ]
  },
  {
    name: 'General and Communicative English',
    code: 'S1-ENG',
    sem: 1,
    colorIndex: 3,
    credits: 4,
    maxMarks: 150,
    maxEse: 70,
    maxInternal: 30,
    maxPractical: 50,
    unitNames: [
      'Grammar and Usage: Sentence Construction',
      'Listening and Speaking Competence',
      'English Comprehension & Composition',
      'Public Speaking and Presentation',
      'Practical (Reading assignments, short story/paragraph writing, and public announcements)'
    ]
  },
  {
    name: 'Indian Knowledge Systems',
    code: 'S1-IKS',
    sem: 1,
    colorIndex: 4,
    credits: 2,
    maxMarks: 100,
    maxEse: 50,
    maxInternal: 30,
    maxPractical: 20,
    unitNames: [
      'Introduction / Sanskrit Language & Sanskrit Literature',
      'Significant Contributions of Indian Knowledge Systems',
      'Practical (Heritage visits, group discussions, and debates)'
    ]
  },
  {
    name: 'Fundamentals of ESG for Sustainability',
    code: 'S1-ESG',
    sem: 1,
    colorIndex: 5,
    credits: 2,
    maxMarks: 100,
    maxEse: 50,
    maxInternal: 30,
    maxPractical: 20,
    unitNames: [
      'Introduction to Ecosystems / Environmental Issues / Sustainability of Business Enterprise',
      'Sustainable Development Goals (SDGs) / ESG Framework',
      'Practical (Industry initiatives research, tree plantation, clean campus drive)'
    ]
  }
];

// Utility — unique ID
function uid() {
  return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Build units for a subject — 1 part per unit by default
function buildUnits(code, unitNames) {
  return unitNames.map((name, i) => {
    const uNum = i + 1;
    return {
      id: uid(),
      number: uNum,
      name: name,
      expanded: false,
      parts: [
        {
          id: uid(),
          number: 1,
          name: `${code}-U${uNum}-P1`,
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
  });
}

// Default marks object template
function createDefaultMarks() {
  return {
    isLumpsum: false,
    internalMid: null,      // Max 20
    internalAtt: null,      // Max 5
    internalBeh: null,      // Max 5
    internalLumpsum: null,  // Max 30
    practical: null,        // Max 50 (4c) or 20 (2c)
    ese: null               // Max 70 (4c) or 50 (2c)
  };
}

// Generate default dataset
function getDefaultData() {
  return {
    settings: {
      visibleSems: [1, 2, 3, 4, 5, 6],
      theme: 'light',
      examDate: '',
      hideReadiness: false,
      activeTab: 'pdf',
      targetSpi: 8.5
    },
    trash: [],
    subjects: SUBJECT_SEED.map(s => ({
      id: uid(),
      name: s.name,
      code: s.code,
      sem: s.sem || 1,
      credits: s.credits,
      maxMarks: s.maxMarks,
      maxEse: s.maxEse,
      maxInternal: s.maxInternal,
      maxPractical: s.maxPractical,
      marks: createDefaultMarks(),
      colorIndex: s.colorIndex,
      expanded: false,
      units: buildUnits(s.code, s.unitNames)
    }))
  };
}

// Helper: converts arrays or Firebase object maps { "0": {...}, "1": {...} } to standard Array
function ensureArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') {
    return Object.keys(val).sort((a, b) => {
      const na = parseInt(a), nb = parseInt(b);
      return (!isNaN(na) && !isNaN(nb)) ? na - nb : a.localeCompare(b);
    }).map(k => val[k]).filter(Boolean);
  }
  return [];
}

// Sanitize & Migration Helper
function sanitizeData(d) {
  if (!d) return getDefaultData();
  
  d.subjects = ensureArray(d.subjects);
  if (!d.subjects.length) return getDefaultData();

  if (!d.settings || typeof d.settings !== 'object') d.settings = {};
  d.settings.visibleSems = ensureArray(d.settings.visibleSems);
  if (!d.settings.visibleSems.length) {
    d.settings.visibleSems = [1, 2, 3, 4, 5, 6];
  }
  if (!d.settings.theme) d.settings.theme = 'light';
  if (typeof d.settings.examDate !== 'string') d.settings.examDate = '';
  if (typeof d.settings.hideReadiness !== 'boolean') d.settings.hideReadiness = false;
  if (!d.settings.activeTab) d.settings.activeTab = 'pdf';
  if (typeof d.settings.targetSpi !== 'number') d.settings.targetSpi = 8.5;
  if (typeof d.settings.targetCgpa !== 'number') d.settings.targetCgpa = d.settings.targetSpi;
  
  d.trash = ensureArray(d.trash);

  // Purge legacy pre-seeded placeholder subjects for Sem 2-6
  d.subjects = d.subjects.filter(s => {
    if (!s) return false;
    if (!s.sem) {
      const m = s.code ? s.code.match(/S(\d)/i) : null;
      s.sem = m ? parseInt(m[1]) : 1;
    }
    if (s.sem > 1 && ['S2-AFA', 'S2-OB', 'S3-CA', 'S3-HRM', 'S4-COST', 'S5-SM', 'S6-GBE'].includes(s.code)) {
      return false;
    }
    return true;
  });

  d.subjects.forEach(s => {
    const seedMatch = SUBJECT_SEED.find(seed => seed.code === s.code);
    if (seedMatch) {
      s.credits = s.credits || seedMatch.credits;
      s.maxMarks = s.maxMarks || seedMatch.maxMarks;
      s.maxEse = s.maxEse || seedMatch.maxEse;
      s.maxInternal = s.maxInternal || seedMatch.maxInternal;
      s.maxPractical = s.maxPractical || seedMatch.maxPractical;
      s.units = ensureArray(s.units);
      if (s.units.length > seedMatch.unitNames.length && (s.code === 'S1-IKS' || s.code === 'S1-ESG')) {
        s.units = s.units.slice(0, seedMatch.unitNames.length);
      }
      if (s.sem === 1) {
        s.units.forEach((u, idx) => {
          if (seedMatch.unitNames[idx]) {
            if (u.name.startsWith('Unit ') ||
              u.name.includes('Introduction to Management') ||
              u.name.includes('Introduction to Accounting') ||
              u.name.includes('Introduction to Statistics') ||
              u.name.includes('Communication Fundamentals') ||
              u.name.includes('Introduction to IKS') ||
              u.name.includes('Introduction to ESG') ||
              u.name.includes('Environmental Factors') ||
              u.name.includes('Ancient Indian Sciences') ||
              u.name.includes('Modern Relevance')) {
              u.name = seedMatch.unitNames[idx];
            }
          }
        });
      }
    } else {
      if (!s.credits) s.credits = 4;
      if (!s.maxInternal) s.maxInternal = 30;
      if (!s.maxEse) s.maxEse = 70;
      if (!s.maxPractical) s.maxPractical = 50;
      s.maxMarks = s.maxEse + s.maxInternal + s.maxPractical;
    }

    // Ensure marks object exists & structure is valid
    if (!s.marks || typeof s.marks !== 'object') {
      s.marks = createDefaultMarks();
    } else {
      if (typeof s.marks.isLumpsum !== 'boolean') s.marks.isLumpsum = false;
      ['internalMid', 'internalAtt', 'internalBeh', 'internalLumpsum', 'practical', 'ese'].forEach(k => {
        if (s.marks[k] !== undefined && s.marks[k] !== null && typeof s.marks[k] !== 'number') {
          const num = parseFloat(s.marks[k]);
          s.marks[k] = isNaN(num) ? null : num;
        }
      });
    }

    s.units = ensureArray(s.units);
    s.units.forEach(u => {
      u.parts = ensureArray(u.parts);
      u.parts.forEach(p => {
        if (!p.priority) p.priority = 'none';
        if (typeof p.note !== 'string') p.note = '';
        if (typeof p.pdfFileName !== 'string') p.pdfFileName = '';
        if (typeof p.pdfPageCount !== 'number') p.pdfPageCount = null;
        if (typeof p.showPdfMeta !== 'boolean') p.showPdfMeta = false;
      });
    });
  });

  return d;
}

// LocalStorage helpers
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return sanitizeData(JSON.parse(raw));
  } catch (_) { /* corrupted — reset */ }
  return sanitizeData(null);
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {
    // storage full edge case
  }
}

if (typeof window !== 'undefined') {
  window.loadData = loadData;
  window.saveData = saveData;
  window.sanitizeData = sanitizeData;
  window.getDefaultData = getDefaultData;
  window.createDefaultMarks = createDefaultMarks;
  window.ensureArray = ensureArray;
  window.uid = uid;
  window.buildUnits = buildUnits;
  window.SUBJECT_SEED = SUBJECT_SEED;
}
