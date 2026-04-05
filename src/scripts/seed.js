require('dotenv').config();
const { connectDatabase } = require('../db');
const QuestionSet = require('../models/QuestionSet');
const PastPaper = require('../models/PastPaper');

const sampleQuestionSets = [
  {
    title: 'O/L Mathematics - Linear Equations',
    grade: 'O/L',
    subject: 'Mathematics',
    stream: 'All',
    topic: 'Algebra Basics',
    description:
      'Build confidence with short, exam-style questions on linear equations and number operations.',
    estimatedMinutes: 8,
    rating: 4.8,
    badge: 'Popular',
    accentColorValue: 0xFF1A63E8,
    isFeatured: true,
    questions: [
      {
        id: 'q1',
        prompt: 'Solve 2x + 5 = 13.',
        options: ['x = 2', 'x = 4', 'x = 6', 'x = 8'],
        correctIndex: 1,
        explanation: '2x = 8, so x = 4.',
      },
      {
        id: 'q2',
        prompt: 'What is 10% of 200?',
        options: ['10', '15', '20', '25'],
        correctIndex: 2,
        explanation: '10% of 200 is 20.',
      },
      {
        id: 'q3',
        prompt: 'Area of a rectangle with length 8 and width 3?',
        options: ['11', '21', '24', '27'],
        correctIndex: 2,
        explanation: 'Area = 8 × 3 = 24.',
      },
      {
        id: 'q4',
        prompt: 'If x = -3, what is x2?',
        options: ['-9', '0', '3', '9'],
        correctIndex: 3,
        explanation: '(-3)² = 9.',
      },
    ],
  },
  {
    title: 'O/L English - Grammar Sprint',
    grade: 'O/L',
    subject: 'English',
    stream: 'All',
    topic: 'Grammar',
    description:
      'Sharpen verb forms, prepositions, and sentence structure with fast-paced practice.',
    estimatedMinutes: 7,
    rating: 4.6,
    badge: 'New',
    accentColorValue: 0xFFFF8A00,
    questions: [
      {
        id: 'q1',
        prompt: 'Choose the correct sentence.',
        options: [
          'She go to school every day.',
          'She goes to school every day.',
          'She going to school every day.',
          'She gone to school every day.',
        ],
        correctIndex: 1,
        explanation: 'Third person singular needs "goes".',
      },
      {
        id: 'q2',
        prompt: 'Select the correct preposition: The book is ___ the table.',
        options: ['on', 'in', 'at', 'by'],
        correctIndex: 0,
        explanation: 'Use "on" for surface placement.',
      },
      {
        id: 'q3',
        prompt: 'Identify the adjective.',
        options: ['quickly', 'blue', 'run', 'beyond'],
        correctIndex: 1,
        explanation: '"Blue" describes a noun, so it is an adjective.',
      },
      {
        id: 'q4',
        prompt: 'Choose the correct plural form of "child".',
        options: ['childs', 'childes', 'children', 'childrens'],
        correctIndex: 2,
        explanation: 'The irregular plural is children.',
      },
    ],
  },
  {
    title: 'A/L Physics - Mechanics Focus',
    grade: 'A/L',
    subject: 'Physics',
    stream: 'Science',
    topic: 'Mechanics',
    description:
      'Practice motion, forces, and energy with targeted science-stream questions.',
    estimatedMinutes: 12,
    rating: 4.9,
    badge: 'Top Pick',
    accentColorValue: 0xFF31C48D,
    isFeatured: true,
    questions: [
      {
        id: 'q1',
        prompt: 'A force of 10 N acts on a 2 kg mass. Acceleration?',
        options: ['2 m/s²', '5 m/s²', '10 m/s²', '20 m/s²'],
        correctIndex: 1,
        explanation: 'a = F / m = 10 / 2 = 5 m/s².',
      },
      {
        id: 'q2',
        prompt: 'The unit of work is:',
        options: ['Watt', 'Newton', 'Joule', 'Pascal'],
        correctIndex: 2,
        explanation: 'Work is measured in joules.',
      },
      {
        id: 'q3',
        prompt: 'Which quantity is a vector?',
        options: ['Speed', 'Mass', 'Distance', 'Velocity'],
        correctIndex: 3,
        explanation: 'Velocity has magnitude and direction.',
      },
      {
        id: 'q4',
        prompt: 'Momentum equals:',
        options: ['m × v', 'F × t', 'm ÷ v', 'v ÷ t'],
        correctIndex: 0,
        explanation: 'Momentum = mass × velocity.',
      },
    ],
  },
  {
    title: 'A/L Accounting - Ledgers & Books',
    grade: 'A/L',
    subject: 'Accounting',
    stream: 'Commerce',
    topic: 'Bookkeeping',
    description:
      'Reinforce double-entry bookkeeping, ledgers, and trial balance logic.',
    estimatedMinutes: 10,
    rating: 4.7,
    badge: 'Trending',
    accentColorValue: 0xFFF59E0B,
    questions: [
      {
        id: 'q1',
        prompt: 'A debit balance in cash book means:',
        options: [
          'Overdraft',
          'Cash at bank',
          'Suspense item',
          'Credit note',
        ],
        correctIndex: 1,
        explanation: 'A debit cash balance is cash at bank or in hand.',
      },
      {
        id: 'q2',
        prompt: 'The accounting equation is:',
        options: [
          'Assets = Liabilities + Equity',
          'Assets = Income + Expenses',
          'Revenue = Assets - Liabilities',
          'Capital = Revenue + Expenses',
        ],
        correctIndex: 0,
        explanation: 'Assets equal liabilities plus equity.',
      },
      {
        id: 'q3',
        prompt: 'Which book records credit sales?',
        options: [
          'Sales day book',
          'Purchases day book',
          'Cash book',
          'General journal',
        ],
        correctIndex: 0,
        explanation: 'Credit sales are recorded in the sales day book.',
      },
      {
        id: 'q4',
        prompt: 'Trial balance is prepared to check:',
        options: [
          'Only profits',
          'Arithmetic accuracy',
          'Tax liability',
          'Cash flow',
        ],
        correctIndex: 1,
        explanation: 'It checks the arithmetic accuracy of ledger balances.',
      },
    ],
  },
  {
    title: 'A/L History - Nation Building',
    grade: 'A/L',
    subject: 'History',
    stream: 'Arts',
    topic: 'Sri Lanka',
    description:
      'A focused set on social change, independence, and post-colonial developments.',
    estimatedMinutes: 11,
    rating: 4.5,
    badge: 'Study',
    accentColorValue: 0xFF8B5CF6,
    questions: [
      {
        id: 'q1',
        prompt: 'Sri Lanka gained independence in:',
        options: ['1945', '1948', '1956', '1972'],
        correctIndex: 1,
        explanation: 'Sri Lanka became independent in 1948.',
      },
      {
        id: 'q2',
        prompt: 'The Mahavamsa is primarily a:',
        options: [
          'Trade manual',
          'Chronicle',
          'Law code',
          'Travel diary',
        ],
        correctIndex: 1,
        explanation: 'Mahavamsa is an ancient chronicle of Sri Lankan history.',
      },
      {
        id: 'q3',
        prompt: 'A major theme after independence was:',
        options: [
          'Colonial expansion',
          'Nation building',
          'Industrial abolition',
          'Monarchy restoration',
        ],
        correctIndex: 1,
        explanation: 'The country focused on nation building and reform.',
      },
      {
        id: 'q4',
        prompt: 'The official language policy changed notably in:',
        options: ['1931', '1948', '1956', '1978'],
        correctIndex: 2,
        explanation: 'The 1956 policy shift is a major milestone.',
      },
    ],
  },
  {
    title: 'A/L ICT - Networks & Security',
    grade: 'A/L',
    subject: 'ICT',
    stream: 'Technology',
    topic: 'Networks',
    description:
      'Cover protocols, security, and internet basics in a clean, exam-focused format.',
    estimatedMinutes: 9,
    rating: 4.8,
    badge: 'Hot',
    accentColorValue: 0xFF1A63E8,
    questions: [
      {
        id: 'q1',
        prompt: 'Which device forwards packets between networks?',
        options: ['Switch', 'Router', 'Printer', 'Hub'],
        correctIndex: 1,
        explanation: 'Routers forward packets between networks.',
      },
      {
        id: 'q2',
        prompt: 'HTTPS primarily uses which protocol for security?',
        options: ['TLS', 'FTP', 'SMTP', 'SNMP'],
        correctIndex: 0,
        explanation: 'HTTPS is secured with TLS.',
      },
      {
        id: 'q3',
        prompt: 'What does DNS do?',
        options: [
          'Compresses files',
          'Maps domain names to IP addresses',
          'Encrypts emails',
          'Stores user photos',
        ],
        correctIndex: 1,
        explanation: 'DNS resolves domain names into IP addresses.',
      },
      {
        id: 'q4',
        prompt: 'A strong password should include:',
        options: [
          'Only letters',
          'Only numbers',
          'A mix of characters',
          'Your name',
        ],
        correctIndex: 2,
        explanation: 'A mix of letters, numbers, and symbols is stronger.',
      },
    ],
  },
];

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
