// ============================================================
//  GTU BBA PDF Tracker — Default Data & Storage Layer
// ============================================================

const STORAGE_KEY = 'gtu_bba_pdf_tracker_v3';

const SUBJECT_SEED = [
  {
    name: 'Principles and Practices of Management',
    code: 'S1-PPM',
    colorIndex: 0,
    unitNames: [
      'Introduction to Management',
      'Planning and Decision Making',
      'Organizing and Staffing',
      'Directing and Leading',
      'Controlling and Coordination'
    ]
  },
  {
    name: 'Financial Accounting',
    code: 'S1-FA',
    colorIndex: 1,
    unitNames: [
      'Introduction to Accounting',
      'Journal and Ledger',
      'Trial Balance and Rectification',
      'Final Accounts',
      'Depreciation and Provisions'
    ]
  },
  {
    name: 'Business Statistics and Logic',
    code: 'S1-BSL',
    colorIndex: 2,
    unitNames: [
      'Introduction to Statistics',
      'Measures of Central Tendency',
      'Measures of Dispersion',
      'Correlation and Regression',
      'Logical Reasoning'
    ]
  },
  {
    name: 'General and Communicative English',
    code: 'S1-ENG',
    colorIndex: 3,
    unitNames: [
      'Communication Fundamentals',
      'Reading Comprehension',
      'Grammar and Usage',
      'Writing Skills',
      'Spoken English and Presentation'
    ]
  },
  {
    name: 'Indian Knowledge Systems',
    code: 'S1-IKS',
    colorIndex: 4,
    unitNames: [
      'Introduction to IKS',
      'Ancient Indian Sciences',
      'Indian Philosophy',
      'Art and Architecture',
      'Modern Relevance of IKS'
    ]
  },
  {
    name: 'Fundamentals of ESG for Sustainability',
    code: 'S1-ESG',
    colorIndex: 5,
    unitNames: [
      'Introduction to ESG',
      'Environmental Factors',
      'Social Responsibility',
      'Governance Framework',
      'ESG Reporting and Standards'
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
    subjects: SUBJECT_SEED.map(s => ({
      id: uid(),
      name: s.name,
      code: s.code,
      colorIndex: s.colorIndex,
      expanded: false,
      units: buildUnits(s.code, s.unitNames)
    }))
  };
}

// LocalStorage helpers
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { /* corrupted — reset */ }
  return null;
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {
    // storage full edge case
  }
}
