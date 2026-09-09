// ============================================================
//  GTU BBA PDF Tracker — Default Data & Storage Layer
//  Updated with GTU BBA Sem 1 Credit Weights, Marks Caps,
//  and PDF Metadata (File Name & Page Count) storage.
// ============================================================

const STORAGE_KEY = 'gtu_bba_pdf_tracker_v5';

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

const ALL_SEMESTER_CURRICULUM = {
  1: SUBJECT_SEED,
  2: [
    {
      name: 'Human Resource Management',
      code: 'S2-HRM',
      sem: 2,
      colorIndex: 0,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Introduction to HRM & Manpower Planning',
        'Procurement & Recruitment / Selection Process',
        'Human Resource Development & Training Methods',
        'Compensation, Integration & Performance Appraisal',
        'Practical (HR audit report & case study assignments)'
      ]
    },
    {
      name: 'Cost Accounting',
      code: 'S2-COST',
      sem: 2,
      colorIndex: 1,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Introduction to Cost Accounting & Cost Sheet',
        'Material Cost & Inventory Control Techniques',
        'Labour Cost, Wage Systems & Direct Expenses',
        'Overheads Classification, Allocation & Absorption',
        'Practical (Preparation of cost sheets & factory expense allocations)'
      ]
    },
    {
      name: 'Business Mathematics',
      code: 'S2-BM',
      sem: 2,
      colorIndex: 2,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Sets, Functions & Progressions (AP, GP)',
        'Differential Calculus & Marginal Analysis',
        'Matrices & Determinants in Business',
        'Mathematics of Finance (Compounding & Annuities)',
        'Practical (Financial calculations & business math models)'
      ]
    },
    {
      name: 'Business Communication',
      code: 'S2-BC',
      sem: 2,
      colorIndex: 3,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Foundations & Channels of Business Communication',
        'Corporate Correspondence, Memos & Formal Letters',
        'Business Report Writing & Proposal Drafting',
        'Non-verbal Communication, Meetings & Negotiations',
        'Practical (Mock meetings, business presentation & CV drafting)'
      ]
    },
    {
      name: 'Managerial Economics',
      code: 'S2-ME',
      sem: 2,
      colorIndex: 4,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Scope of Managerial Economics & Demand Forecasting',
        'Production Functions & Short/Long-Run Cost Analysis',
        'Market Structures, Monopoly & Oligopoly Pricing',
        'Macroeconomic Indicators, Inflation & Fiscal Policy',
        'Practical (Economic evaluation of local business models)'
      ]
    }
  ],
  3: [
    {
      name: 'Marketing Management',
      code: 'S3-MM',
      sem: 3,
      colorIndex: 0,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Marketing Concept & Consumer Buying Behavior',
        'Market Segmentation, Targeting & Positioning (STP)',
        'Product Strategy, Life Cycle & Pricing Decisions',
        'Integrated Marketing Communication & Distribution',
        'Practical (Marketing plan formulation for new product)'
      ]
    },
    {
      name: 'Financial Management',
      code: 'S3-FM',
      sem: 3,
      colorIndex: 1,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Objectives & Scope of Modern Corporate Finance',
        'Time Value of Money & Capital Budgeting Techniques',
        'Cost of Capital & Capital Structure Theories',
        'Working Capital Management & Dividend Decisions',
        'Practical (Capital appraisal problem sets & ratio study)'
      ]
    },
    {
      name: 'Organizational Behavior',
      code: 'S3-OB',
      sem: 3,
      colorIndex: 2,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Individual Behavior, Personality & Perceptions',
        'Motivation Theories & Workplace Applications',
        'Group Dynamics, Team Leadership & Power',
        'Organizational Culture, Change & Conflict Resolution',
        'Practical (Team behavioral simulation & leadership survey)'
      ]
    },
    {
      name: 'Business Law',
      code: 'S3-BL',
      sem: 3,
      colorIndex: 3,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Indian Contract Act, 1872: Essentials & Breaches',
        'Sale of Goods Act, 1930 & Conditions/Warranties',
        'Partnership Act & Limited Liability Partnerships (LLP)',
        'Negotiable Instruments Act & Consumer Protection Act',
        'Practical (Contract drafting & landmark legal case reviews)'
      ]
    },
    {
      name: 'IT in Management',
      code: 'S3-IT',
      sem: 3,
      colorIndex: 4,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Management Information Systems (MIS) & Enterprise Systems',
        'Database Management & Business Data Analytics',
        'E-Commerce Frameworks & Digital Payment Gateways',
        'Cyber Security, Data Privacy & Emerging Tech in Business',
        'Practical (Database queries & analytical spreadsheet modeling)'
      ]
    }
  ],
  4: [
    {
      name: 'Research Methodology',
      code: 'S4-RM',
      sem: 4,
      colorIndex: 0,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Business Research Process & Problem Formulation',
        'Sampling Designs, Sample Size & Scaling Techniques',
        'Data Collection Tools & Questionnaire Construction',
        'Hypothesis Testing, Statistical Analysis & Report Writing',
        'Practical (Execution of field survey & statistical data analysis)'
      ]
    },
    {
      name: 'Operations Management',
      code: 'S4-OM',
      sem: 4,
      colorIndex: 1,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Operations Strategy, Product Design & Plant Location',
        'Production Planning, Scheduling & Inventory Models',
        'Total Quality Management (TQM) & Six Sigma Concepts',
        'Supply Chain Logistics, Purchasing & Maintenance',
        'Practical (Plant layout evaluation & industrial visit report)'
      ]
    },
    {
      name: 'Direct & Indirect Taxes',
      code: 'S4-TAX',
      sem: 4,
      colorIndex: 2,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Basic Concepts of Income Tax & Residential Status',
        'Heads of Income: Salary, House Property & Business',
        'Capital Gains, Other Sources & Chapter VI-A Deductions',
        'Goods & Services Tax (GST): Structure & Input Tax Credit',
        'Practical (Individual income tax computation & GST return demo)'
      ]
    },
    {
      name: 'Banking & Insurance',
      code: 'S4-BI',
      sem: 4,
      colorIndex: 3,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Indian Financial System, RBI Regulations & Monitory Policy',
        'Commercial Banking Operations, Lending & Digital Banking',
        'Principles of Insurance & Life Insurance Products',
        'General Insurance, Marine/Fire & Claims Processing',
        'Practical (Commercial bank operations study & policy analysis)'
      ]
    },
    {
      name: 'Entrepreneurship Development',
      code: 'S4-ED',
      sem: 4,
      colorIndex: 4,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Entrepreneurial Competencies & Opportunity Identification',
        'Business Plan Formulation & Feasibility Appraisal',
        'Startup Financing, Angel Investors & Government Schemes',
        'Managing Growth, Scaling & Exit Strategies',
        'Practical (Preparation of comprehensive startup pitch deck)'
      ]
    }
  ],
  5: [
    {
      name: 'Strategic Management',
      code: 'S5-SM',
      sem: 5,
      colorIndex: 0,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Strategic Intent, Vision, Mission & Goals',
        'External Environmental Analysis & Porter’s 5 Forces',
        'Strategy Formulation: Corporate, Business & Functional',
        'Strategic Implementation, Structure & Evaluation Controls',
        'Practical (Strategic analysis of an Indian bluechip company)'
      ]
    },
    {
      name: 'Corporate Governance & Ethics',
      code: 'S5-CG',
      sem: 5,
      colorIndex: 1,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Principles & Historical Evolution of Corporate Governance',
        'Board Structure, Independent Directors & Committees',
        'Business Ethics, Morals & Corporate Scandals',
        'CSR Policies, Sustainable Development & Stakeholder Rights',
        'Practical (Governance report review of a listed corporation)'
      ]
    },
    {
      name: 'Specialization Elective I',
      code: 'S5-EL1',
      sem: 5,
      colorIndex: 2,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Fundamentals & Principles of Elective Domain',
        'Strategic Applications in Industry',
        'Contemporary Tools & Analytical Methods',
        'Regulatory Frameworks & Best Practices',
        'Practical (Specialization research assignment)'
      ]
    },
    {
      name: 'Specialization Elective II',
      code: 'S5-EL2',
      sem: 5,
      colorIndex: 3,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Advanced Specialized Concepts & Theories',
        'Industry Case Studies & Real-World Practices',
        'Technology & Analytics in Specialization',
        'Emerging Challenges & Future Horizons',
        'Practical (Field project & empirical analysis)'
      ]
    },
    {
      name: 'Summer Internship Project',
      code: 'S5-SIP',
      sem: 5,
      colorIndex: 4,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Internship Objectives & Organizational Overview',
        'Departmental Operations & Problem Identification',
        'Primary Data Analysis & Practical Findings',
        'Managerial Recommendations & Conclusion',
        'Practical (Summer project thesis preparation & mock viva)'
      ]
    }
  ],
  6: [
    {
      name: 'International Business',
      code: 'S6-IB',
      sem: 6,
      colorIndex: 0,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Globalization, International Trade Theories & WTO',
        'Global Business Environments (Cultural, Political, Legal)',
        'Multinational Corporation (MNC) Entry Strategies',
        'Exim Procedures, Documentation & Forex Management',
        'Practical (Global market entry strategy assignment)'
      ]
    },
    {
      name: 'Project Management',
      code: 'S6-PM',
      sem: 6,
      colorIndex: 1,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Project Identification, Feasibility & Appraisal Stages',
        'Project Planning, Scheduling, PERT & CPM Networks',
        'Resource Allocation, Cost Estimation & Risk Management',
        'Project Monitoring, Quality Audits & Project Termination',
        'Practical (Gantt chart & network planning assignments)'
      ]
    },
    {
      name: 'Specialization Elective III',
      code: 'S6-EL3',
      sem: 6,
      colorIndex: 2,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Domain-Specific Strategic Topics',
        'Global Best Practices in Specialization',
        'Complex Decision-Making Case Studies',
        'Strategic Innovations & Trends',
        'Practical (Specialized case study documentation)'
      ]
    },
    {
      name: 'Specialization Elective IV',
      code: 'S6-EL4',
      sem: 6,
      colorIndex: 3,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Advanced Sectoral Topics & Frameworks',
        'Practical Tools, Metrics & KPIs',
        'Applied Research Methodologies',
        'Contemporary Corporate Practices',
        'Practical (Project seminar & analytical presentation)'
      ]
    },
    {
      name: 'Comprehensive Project & Grand Viva',
      code: 'S6-CP',
      sem: 6,
      colorIndex: 4,
      credits: 4,
      maxMarks: 150,
      maxEse: 70,
      maxInternal: 30,
      maxPractical: 50,
      unitNames: [
        'Project Synopsis, Literature Review & Hypotheses',
        'Empirical Investigation & Rigorous Data Collection',
        'Quantitative/Qualitative Evaluation & Findings',
        'Strategic Implications & Final Thesis Defense',
        'Practical (Comprehensive project defense & grand viva presentation)'
      ]
    }
  ]
};

// Utility — unique ID
function uid() {
  return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Build units for a subject — 0 parts per unit initially
function buildUnits(code, unitNames) {
  return unitNames.map((name, i) => {
    const uNum = i + 1;
    return {
      id: uid(),
      number: uNum,
      name: name,
      expanded: false,
      parts: []
    };
  });
}

// Utility: Check if a unit is practical/project based
function isPracticalUnit(subject, unit) {
  if (!unit) return false;
  const credits = subject ? (subject.credits || 4) : 4;
  const uNum = unit.number || 1;
  const uName = (unit.name || '').toLowerCase();
  // 4-credit subject: Unit 5 is Practical
  if (credits === 4 && uNum === 5) return true;
  // 2-credit subject: Unit 3 is Practical
  if (credits === 2 && uNum === 3) return true;
  // Explicitly labeled practical
  if (uName.startsWith('practical') || uName.includes('(practical') || uName.includes('practical:')) return true;
  return false;
}

// Subject-specific practical project task suggestions for quick-add
const PRACTICAL_PRESETS = {
  'S1-PPM': [
    'MSME / Enterprise Field Visit Report',
    'Managerial Structure Case Study Analysis',
    'Practical Viva & Presentation Slides'
  ],
  'S1-FA': [
    'Annual Report Financial Statement Analysis',
    'Final Accounts & Balance Sheet Assignment',
    'Financial Ratio Analysis Practical File'
  ],
  'S1-BSL': [
    'Real-World Survey Data Tabulation Project',
    'Statistical Charts & Graphical Presentation',
    'Linear Correlation & Regression Case Analysis'
  ],
  'S1-ENG': [
    'Public Speaking & Speech Delivery Script',
    'Executive Presentation & PPT Deck',
    'Listening Comprehension & Viva Audio Record'
  ],
  'S1-IKS': [
    'Indian Heritage Site / Monument Visit Report',
    'Ancient Indian Knowledge System Research Paper',
    'Group Discussion & Cultural Debate Notes'
  ],
  'S1-ESG': [
    'Corporate Sustainability & ESG Disclosure Review',
    'Green Initiative / Clean Campus Drive Report',
    'SDGs Local Business Impact Case Study'
  ]
};

// Default marks object template (GTU BBA: 20 Mid + 10 Attendance = 30 Internal; 50 College Practical/Internal; 70 GTU Exam)
function createDefaultMarks() {
  return {
    isLumpsum: false,
    internalMid: null,      // Max 20 (GTU Normalized = internalMidRaw / 2)
    internalMidRaw: null,   // Max 40 (College Mid-Sem Exam Score)
    internalAtt: null,      // Max 10 (Attendance)
    internalBeh: null,      // Legacy / optional
    internalLumpsum: null,  // Max 30
    practical: null,        // Max 50 (4c) or 20 (2c) - College Internal Practical / Project
    ese: null               // Max 70 (4c) or 50 (2c) - GTU University Exam
  };
}

// Seed official GTU curriculum subjects for any semester (Sem 1 to 6)
// All newly created units strictly start with 0 parts
function seedSubjectsForSemester(dataObj, semNum) {
  const sem = parseInt(semNum) || 1;
  if (!dataObj || !Array.isArray(dataObj.subjects)) return [];
  const seedList = ALL_SEMESTER_CURRICULUM[sem] || [];
  const created = [];
  seedList.forEach(s => {
    const exists = dataObj.subjects.some(sub => sub.code === s.code || (sub.sem === sem && sub.name.toLowerCase() === s.name.toLowerCase()));
    if (!exists) {
      const newSub = {
        id: uid(),
        name: s.name,
        code: s.code,
        sem: s.sem || sem,
        credits: s.credits,
        maxMarks: s.maxMarks,
        maxEse: s.maxEse,
        maxInternal: s.maxInternal,
        maxPractical: s.maxPractical,
        marks: createDefaultMarks(),
        colorIndex: s.colorIndex || 0,
        expanded: false,
        units: buildUnits(s.code, s.unitNames)
      };
      dataObj.subjects.push(newSub);
      created.push(newSub);
    }
  });
  return created;
}

// Generate default dataset
function getDefaultData() {
  return {
    schemaVersion: 5,
    settings: {
      currentSem: 1,
      visibleSems: [1],
      theme: 'light',
      examDate: '',
      hideReadiness: false,
      activeTab: 'pdf',
      targetSpi: 10.0,
      targetCgpa: 10.0
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

// Detect untouched legacy dummy placeholder parts (e.g. S1-PPM-U1-P1 with no attachments, no notes, and not downloaded/printed)
function isLegacyDummyPart(p) {
  if (!p) return true;
  if (p.downloaded || p.printed) return false;
  if (p.pdfDriveUrl || p.pdfFileName || (typeof p.pdfPageCount === 'number' && p.pdfPageCount > 0)) return false;
  if ((p.note && p.note.trim()) || (p.priority && p.priority !== 'none')) return false;
  const defaultPattern = /^S\d-[A-Z]+-U\d-P\d$/i;
  if (p.name && !defaultPattern.test(p.name.trim())) return false;
  return true;
}

// Sanitize & Migration Helper
function sanitizeData(d) {
  if (!d) return getDefaultData();
  
  d.subjects = ensureArray(d.subjects);
  if (!d.subjects.length) return getDefaultData();

  if (!d.settings || typeof d.settings !== 'object') d.settings = {};
  if (typeof d.settings.currentSem !== 'number' || d.settings.currentSem < 1 || d.settings.currentSem > 6) {
    d.settings.currentSem = 1;
  }
  d.settings.visibleSems = ensureArray(d.settings.visibleSems).map(Number).filter(n => n >= 1 && n <= 6);
  if (!d.settings.visibleSems.length) {
    d.settings.visibleSems = [d.settings.currentSem || 1];
  }
  if (!d.settings.theme) d.settings.theme = 'light';
  if (typeof d.settings.examDate !== 'string') d.settings.examDate = '';
  if (typeof d.settings.hideReadiness !== 'boolean') d.settings.hideReadiness = false;
  if (!d.settings.activeTab) d.settings.activeTab = 'pdf';
  if (typeof d.settings.targetSpi !== 'number') d.settings.targetSpi = 10.0;
  if (typeof d.settings.targetCgpa !== 'number') d.settings.targetCgpa = d.settings.targetSpi;
  
  d.trash = ensureArray(d.trash);

  // Enforce schemaVersion 5:
  // When upgrading from legacy schemas, purge ONLY untouched auto-generated dummy parts,
  // while preserving 100% of real user attachments, files, page counts, notes, and downloaded/printed flags!
  const isV5 = d.schemaVersion === 5;
  if (!isV5) {
    d.subjects.forEach(s => {
      s.units = ensureArray(s.units);
      s.units.forEach(u => {
        if (Array.isArray(u.parts)) {
          u.parts = u.parts.filter(p => !isLegacyDummyPart(p));
        } else {
          u.parts = [];
        }
      });
    });
    d.schemaVersion = 5;
  }

  // Ensure sem property is set for every subject
  d.subjects = d.subjects.filter(s => {
    if (!s) return false;
    if (!s.sem) {
      const m = s.code ? s.code.match(/S(\d)/i) : null;
      s.sem = m ? parseInt(m[1]) : 1;
    }
    return true;
  });

  d.subjects.forEach(s => {
    const semSeedList = ALL_SEMESTER_CURRICULUM[s.sem || 1] || [];
    const seedMatch = semSeedList.find(seed => seed.code === s.code);
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
      ['internalMid', 'internalMidRaw', 'internalAtt', 'internalBeh', 'internalLumpsum', 'practical', 'ese'].forEach(k => {
        if (s.marks[k] !== undefined && s.marks[k] !== null && typeof s.marks[k] !== 'number') {
          const num = parseFloat(s.marks[k]);
          s.marks[k] = isNaN(num) ? null : num;
        }
      });
      // Synchronize internalMidRaw (0-40) and internalMid (0-20) if one is present
      if (typeof s.marks.internalMidRaw === 'number' && (s.marks.internalMid === null || s.marks.internalMid === undefined)) {
        s.marks.internalMid = Math.min(20, Math.round((s.marks.internalMidRaw / 2) * 10) / 10);
      } else if (typeof s.marks.internalMid === 'number' && (s.marks.internalMidRaw === null || s.marks.internalMidRaw === undefined)) {
        s.marks.internalMidRaw = Math.min(40, Math.round(s.marks.internalMid * 2 * 10) / 10);
      }
    }

    s.units = ensureArray(s.units);
    s.units.sort((a, b) => (a.number || 0) - (b.number || 0));
    s.units.forEach((u, uIdx) => {
      if (!u.number) u.number = uIdx + 1;
      u.parts = ensureArray(u.parts);
      u.parts.sort((a, b) => (a.number || 0) - (b.number || 0));
      u.parts.forEach((p, pIdx) => {
        if (!p.number) p.number = pIdx + 1;
        if (!p.priority) p.priority = 'none';
        if (typeof p.note !== 'string') p.note = '';
        if (typeof p.pdfFileName !== 'string') p.pdfFileName = '';
        if (typeof p.pdfDriveUrl !== 'string') p.pdfDriveUrl = '';
        if (typeof p.pdfPageCount !== 'number') p.pdfPageCount = null;
        if (typeof p.showPdfMeta !== 'boolean') p.showPdfMeta = false;
        if (typeof p.projectStatus !== 'string') p.projectStatus = 'not_started';
      });
    });
  });

  return d;
}

// Helper: resets all units across all subjects to 0 parts
function resetAllPartsToZero(dataObj) {
  if (!dataObj || !Array.isArray(dataObj.subjects)) return dataObj;
  dataObj.subjects.forEach(s => {
    if (Array.isArray(s.units)) {
      s.units.forEach(u => {
        u.parts = [];
      });
    }
  });
  return dataObj;
}

// LocalStorage helpers with automatic migration to v5 (zero parts per unit)
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return sanitizeData(JSON.parse(raw));

    // Migrate from v4 or v3 if exists
    for (const legacyKey of ['gtu_bba_pdf_tracker_v4', 'gtu_bba_pdf_tracker_v3']) {
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw);
        if (legacy && Array.isArray(legacy.subjects)) {
          legacy.schemaVersion = 5;
          legacy.subjects.forEach(s => {
            if (Array.isArray(s.units)) {
              s.units.forEach(u => {
                if (Array.isArray(u.parts)) {
                  u.parts = u.parts.filter(p => !isLegacyDummyPart(p));
                } else {
                  u.parts = [];
                }
              });
            }
          });
          const sanitized = sanitizeData(legacy);
          saveData(sanitized);
          try { localStorage.removeItem(legacyKey); } catch (_) {}
          return sanitized;
        }
      }
    }
  } catch (_) { /* corrupted — reset */ }
  const fresh = getDefaultData();
  saveData(fresh);
  return fresh;
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
  window.resetAllPartsToZero = resetAllPartsToZero;
  window.ensureArray = ensureArray;
  window.uid = uid;
  window.buildUnits = buildUnits;
  window.SUBJECT_SEED = SUBJECT_SEED;
}
