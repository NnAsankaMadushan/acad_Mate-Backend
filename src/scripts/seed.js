require('dotenv').config();
const { connectDatabase } = require('../db');
const QuestionSet = require('../models/QuestionSet');
const PastPaper = require('../models/PastPaper');

const primaryGrades = [
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
];

const primarySubjects = [
  'Mathematics',
  'Science',
  'English',
  'Sinhala',
  'Tamil',
  'Religion',
  'Environmental Studies',
];

const olSubjects = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Geography',
  'ICT',
];

const alStreams = {
  Science: ['Physics', 'Chemistry', 'Biology', 'Combined Maths', 'ICT'],
  Commerce: ['Accounting', 'Business Studies', 'Economics', 'Information Systems', 'ICT'],
  Arts: ['History', 'Geography', 'Political Science', 'Logic', 'Sinhala'],
  Technology: ['Science for Technology', 'Engineering Technology', 'ICT', 'Agriculture'],
};

const accentColors = [
  0xFF1A63E8,
  0xFFFF8A00,
  0xFF31C48D,
  0xFFF59E0B,
  0xFF8B5CF6,
  0xFFEF4444,
  0xFF0EA5E9,
];

const subjectPracticeData = {
  Mathematics: {
    topic: 'Numbers & shapes',
    answer: 'equations',
    tool: 'calculator',
    activity: 'solving problems',
  },
  Science: {
    topic: 'Experiments & observation',
    answer: 'experiments',
    tool: 'laboratory',
    activity: 'reviewing diagrams',
  },
  English: {
    topic: 'Grammar & writing',
    answer: 'sentences',
    tool: 'dictionary',
    activity: 'reading passages',
  },
  Sinhala: {
    topic: 'Language skills',
    answer: 'sentences',
    tool: 'textbook',
    activity: 'reading passages',
  },
  Tamil: {
    topic: 'Language skills',
    answer: 'sentences',
    tool: 'textbook',
    activity: 'reading passages',
  },
  Religion: {
    topic: 'Beliefs & values',
    answer: 'faith',
    tool: 'scripture',
    activity: 'thinking about stories',
  },
  'Environmental Studies': {
    topic: 'Nature & conservation',
    answer: 'ecosystem',
    tool: 'fieldwork',
    activity: 'observing nature',
  },
  History: {
    topic: 'Events & timelines',
    answer: 'independence',
    tool: 'archive',
    activity: 'reviewing dates',
  },
  Geography: {
    topic: 'Maps & places',
    answer: 'maps',
    tool: 'compass',
    activity: 'studying locations',
  },
  Physics: {
    topic: 'Forces & motion',
    answer: 'forces',
    tool: 'meter stick',
    activity: 'solving problems',
  },
  Chemistry: {
    topic: 'Matter & reactions',
    answer: 'atoms',
    tool: 'test tube',
    activity: 'balancing equations',
  },
  Biology: {
    topic: 'Living systems',
    answer: 'cells',
    tool: 'microscope',
    activity: 'labeling parts',
  },
  'Combined Maths': {
    topic: 'Algebra & geometry',
    answer: 'functions',
    tool: 'graph paper',
    activity: 'solving formulas',
  },
  Accounting: {
    topic: 'Ledgers & records',
    answer: 'ledger',
    tool: 'calculator',
    activity: 'recording transactions',
  },
  'Business Studies': {
    topic: 'Business planning',
    answer: 'marketing',
    tool: 'spreadsheet',
    activity: 'reviewing examples',
  },
  Economics: {
    topic: 'Markets & money',
    answer: 'demand',
    tool: 'graph',
    activity: 'studying supply curves',
  },
  'Information Systems': {
    topic: 'Information flow',
    answer: 'database',
    tool: 'computer',
    activity: 'reviewing systems',
  },
  'Political Science': {
    topic: 'Governments & power',
    answer: 'government',
    tool: 'constitution',
    activity: 'studying systems',
  },
  Logic: {
    topic: 'Reasoning & argument',
    answer: 'deduction',
    tool: 'proof',
    activity: 'solving puzzles',
  },
 ICT: {
    topic: 'Networks & coding',
    answer: 'software',
    tool: 'computer',
    activity: 'solving logic puzzles',
  },
  'Science for Technology': {
    topic: 'Applied science',
    answer: 'materials',
    tool: 'measurement tools',
    activity: 'reviewing devices',
  },
  'Engineering Technology': {
    topic: 'Machines & systems',
    answer: 'circuits',
    tool: 'toolkit',
    activity: 'reviewing blueprints',
  },
  Agriculture: {
    topic: 'Farming & growth',
    answer: 'crops',
    tool: 'tractor',
    activity: 'studying soil',
  },
};

function getAccentColor(subject) {
  const index = subject.length % accentColors.length;
  return accentColors[index];
}

function buildPracticeQuestions(subject) {
  const details = subjectPracticeData[subject] || {
    topic: 'Core concepts',
    answer: 'principles',
    tool: 'study materials',
    activity: 'practicing examples',
  };

  return [
    {
      id: 'q1',
      prompt: `Which term is most related to ${subject}?`,
      options: [
        details.answer,
        'sentence',
        'graph',
        'balance sheet',
      ],
      correctIndex: 0,
      explanation: `${details.answer} is a key idea in ${subject}.`, 
    },
    {
      id: 'q2',
      prompt: `${subject} practice often includes questions about:`,
      options: [
        details.topic,
        'poetry',
        'elections',
        'accounts',
      ],
      correctIndex: 0,
      explanation: `${details.topic} is a core ${subject} theme.`, 
    },
    {
      id: 'q3',
      prompt: `Which tool is commonly used in ${subject}?`,
      options: [
        details.tool,
        'brush',
        'ruler',
        'notebook',
      ],
      correctIndex: 0,
      explanation: `${details.tool} is closely associated with ${subject}.`, 
    },
    {
      id: 'q4',
      prompt: `To improve in ${subject}, you should practice:`,
      options: [
        details.activity,
        'drawing',
        'memorizing dates',
        'cooking',
      ],
      correctIndex: 0,
      explanation: `${details.activity} helps strengthen ${subject} skills.`, 
    },
  ];
}

function buildQuestionSet(grade, subject, stream) {
  const details = subjectPracticeData[subject] || {
    topic: 'Practice',
    answer: 'concepts',
    tool: 'materials',
    activity: 'working examples',
  };

  return {
    title: `${grade} ${subject} - Quick Practice`,
    grade,
    subject,
    stream,
    topic: details.topic,
    description: `Practice the fundamentals of ${subject} for ${grade}${stream !== 'All' ? ` (${stream})` : ''}.`,
    estimatedMinutes: 8,
    rating: 4.5,
    badge: grade === 'A/L' ? 'Top Pick' : grade === 'O/L' ? 'Practice' : 'Starter',
    accentColorValue: getAccentColor(subject),
    isFeatured: grade === 'A/L',
    questions: buildPracticeQuestions(subject),
  };
}

function generateQuestionSets() {
  const sets = [];

  for (const grade of primaryGrades) {
    for (const subject of primarySubjects) {
      sets.push(buildQuestionSet(grade, subject, 'All'));
    }
  }

  for (const subject of olSubjects) {
    sets.push(buildQuestionSet('O/L', subject, 'All'));
  }

  for (const stream of Object.keys(alStreams)) {
    for (const subject of alStreams[stream]) {
      sets.push(buildQuestionSet('A/L', subject, stream));
    }
  }

  return sets;
}

const sampleQuestionSets = generateQuestionSets();

const samplePastPapers = [
  {
    title: 'O/L Mathematics - Past Paper',
    grade: 'O/L',
    subject: 'Mathematics',
    stream: 'All',
    year: 2024,
    examType: 'Annual Exam',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: 16,
    fileSize: '4.2 MB',
  },
  {
    title: 'O/L English - Past Paper',
    grade: 'O/L',
    subject: 'English',
    stream: 'All',
    year: 2023,
    examType: 'Annual Exam',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: 12,
    fileSize: '3.1 MB',
  },
  {
    title: 'A/L Physics - Past Paper',
    grade: 'A/L',
    subject: 'Physics',
    stream: 'Science',
    year: 2024,
    examType: 'Theory Paper',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: 20,
    fileSize: '5.4 MB',
  },
  {
    title: 'A/L Accounting - Past Paper',
    grade: 'A/L',
    subject: 'Accounting',
    stream: 'Commerce',
    year: 2023,
    examType: 'Theory Paper',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: 18,
    fileSize: '4.8 MB',
  },
  {
    title: 'A/L History - Past Paper',
    grade: 'A/L',
    subject: 'History',
    stream: 'Arts',
    year: 2022,
    examType: 'Theory Paper',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: 15,
    fileSize: '3.7 MB',
  },
  {
    title: 'A/L ICT - Past Paper',
    grade: 'A/L',
    subject: 'ICT',
    stream: 'Technology',
    year: 2024,
    examType: 'Theory Paper',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: 14,
    fileSize: '3.9 MB',
  },
];

async function seedData() {
  try {
    await connectDatabase();
    console.log('Connected to MongoDB');

    // Seed QuestionSets
    console.log('Seeding QuestionSets...');
    for (const set of sampleQuestionSets) {
      await QuestionSet.findOneAndUpdate(
        { title: set.title },
        set,
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
    console.log(`Successfully seeded ${sampleQuestionSets.length} QuestionSets`);

    // Seed PastPapers
    console.log('Seeding PastPapers...');
    for (const paper of samplePastPapers) {
      await PastPaper.findOneAndUpdate(
        { title: paper.title },
        paper,
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
    console.log(`Successfully seeded ${samplePastPapers.length} PastPapers`);

    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seedData();
