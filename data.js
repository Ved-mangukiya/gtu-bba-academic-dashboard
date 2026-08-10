// ============================================================
//  GTU BBA PDF Tracker — Default Data & Storage Layer
// ============================================================

const STORAGE_KEY = 'gtu_bba_pdf_tracker_v3';

const SUBJECT_SEED = [
  // Semester 1
  {
    name: 'Principles and Practices of Management',
    code: 'S1-PPM',
    sem: 1,
    colorIndex: 0,
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
          printed: false
        }
      ]
    };
  });
}

// Generate default dataset
function getDefaultData() {
  return {
    settings: {
      visibleSems: [1, 2, 3, 4, 5, 6]
    },
    trash: [],
    subjects: SUBJECT_SEED.map(s => ({
      id: uid(),
      name: s.name,
      code: s.code,
      sem: s.sem || 1,
      colorIndex: s.colorIndex,
      expanded: false,
      units: buildUnits(s.code, s.unitNames)
    }))
  };
}

// Sanitize & Migration Helper
function sanitizeData(d) {
  if (!d || !Array.isArray(d.subjects) || !d.subjects.length) return getDefaultData();
  if (!d.settings || !Array.isArray(d.settings.visibleSems) || !d.settings.visibleSems.length) {
    d.settings = { visibleSems: [1, 2, 3, 4, 5, 6] };
  }
  if (!Array.isArray(d.trash)) {
    d.trash = [];
  }
  if (Array.isArray(d.subjects)) {
    // Purge legacy pre-seeded placeholder subjects for Sem 2-6
    d.subjects = d.subjects.filter(s => {
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
      }
    });
  }
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
