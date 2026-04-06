/**
 * Script to scan Pastpapers directory and populate MongoDB with past paper entries
 * Run with: node src/scripts/populatePastPapers.js
 */

require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const { PDFParse } = require('pdf-parse');
const PastPaper = require('../models/PastPaper');
const { connectDatabase } = require('../db');

const PASTPAPERS_DIR = path.join(__dirname, '..', 'Pastpapers');

// Extract metadata from filename and directory path
function extractMetadataFromFilename(filename, categoryPath, defaultSubject = 'General') {
  const nameWithoutExt = filename.replace(/\.pdf$/i, '');
  
  let subject = defaultSubject || 'General';
  let year = new Date().getFullYear();
  let examType = 'Test Paper';

  // Try to extract year (4 digit number)
  const yearMatch = nameWithoutExt.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[0]);
  }

  // Try to extract exam type (term, test, exam, etc.)
  if (nameWithoutExt.includes('1st-term') || nameWithoutExt.includes('1st term')) {
    examType = '1st Term';
  } else if (nameWithoutExt.includes('2nd-term') || nameWithoutExt.includes('2nd term')) {
    examType = '2nd Term';
  } else if (nameWithoutExt.includes('3rd-term') || nameWithoutExt.includes('3rd term')) {
    examType = '3rd Term';
  } else if (nameWithoutExt.toLowerCase().includes('final')) {
    examType = 'Final Exam';
  } else if (nameWithoutExt.toLowerCase().includes('test')) {
    examType = 'Test Paper';
  }

  if (subject === 'General') {
    const subjectKeywords = [
      'buddhism',
      'english',
      'mathematics',
      'science',
      'history',
      'geography',
      'chemistry',
      'physics',
      'biology',
      'sinhala',
      'tamil',
      'civics',
      'economics',
      'commerce',
    ];

    for (const keyword of subjectKeywords) {
      if (nameWithoutExt.toLowerCase().includes(keyword)) {
        subject = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        break;
      }
    }
  }

  return {
    subject: subject.trim(),
    year,
    examType: examType.trim(),
  };
}

function normalizeStream(streamName) {
  const raw = String(streamName ? streamName : '').trim();
  if (!raw) return 'All';

  const cleaned = raw.replace(/\s*Stream$/i, '').trim();

  if (/^science$/i.test(cleaned)) return 'Science';
  if (/^commerce$/i.test(cleaned)) return 'Commerce';
  if (/^arts$/i.test(cleaned)) return 'Arts';
  if (/^technology$/i.test(cleaned)) return 'Technology';
  if (/^tech$/i.test(cleaned)) return 'Technology';

  return cleaned;
}

function normalizeGrade(categoryName) {
  const raw = categoryName.trim();
  const lower = raw.toLowerCase();
  let grade = raw;
  let stream = 'All';

  const gradeMatch = lower.match(/grade\s*0*(\d{1,2})/);
  if (gradeMatch) {
    grade = `Grade ${parseInt(gradeMatch[1], 10)}`;
  } else if (/ordinary\s*level|o\/l|ol/.test(lower)) {
    grade = 'O/L';
  } else if (/advanced\s*level|a\/l|al/.test(lower)) {
    grade = 'A/L';
  }

  return { grade, stream };
}

function extractPathMetadata(categoryPath) {
  const parts = String(categoryPath ? categoryPath : '').split(/[\\/]/).filter(Boolean);
  const metadata = {
    grade: 'All',
    stream: 'All',
    subject: 'General',
  };

  if (parts.length === 0) {
    return metadata;
  }

  metadata.grade = normalizeGrade(parts[0]).grade;

  if (parts.length === 2) {
    metadata.subject = parts[1];
    return metadata;
  }

  if (parts.length >= 3) {
    metadata.stream = normalizeStream(parts[1]);
    metadata.subject = parts[parts.length - 1];
    return metadata;
  }

  return metadata;
}

async function scanDirectory(dirPath, relativeCategory = '') {
  const papers = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const currentCategory = relativeCategory ? `${relativeCategory}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        const subPapers = await scanDirectory(fullPath, currentCategory);
        papers.push(...subPapers);
      } else if (entry.isFile() && entry.name.endsWith('.pdf')) {
        const pathMetadata = extractPathMetadata(relativeCategory);
        const { subject, year, examType } = extractMetadataFromFilename(entry.name, currentCategory, pathMetadata.subject);
        const { grade, stream } = pathMetadata;
        const storagePath = path.relative(PASTPAPERS_DIR, fullPath);

        try {
          const stats = await fs.stat(fullPath);
          const fileSize = stats.size;

          let pageCount = 0;
          try {
            const dataBuffer = await fs.readFile(fullPath);
            const parser = new PDFParse(new Uint8Array(dataBuffer));
            const info = await parser.getInfo();
            pageCount = info.total || 0;
            await parser.destroy();
          } catch (pdfErr) {
            console.warn(`Could not parse PDF pages for ${entry.name}:`, pdfErr.message);
          }

          papers.push({
            title: entry.name.replace(/\.pdf$/i, ''),
            grade,
            subject,
            stream,
            year,
            examType,
            pdfUrl: encodeURI(`/pastpapers/${storagePath.replace(/\\/g, '/')}`),
            storagePath: storagePath.replace(/\\/g, '/'),
            pages: pageCount,
            fileSize: (fileSize / 1024 / 1024).toFixed(2) + ' MB',
          });
        } catch (err) {
          console.error(`Error processing file ${entry.name}:`, err.message);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }

  return papers;
}

async function main() {
  try {
    console.log('Connecting to database...');
    await connectDatabase();

    console.log('Scanning Pastpapers directory...');
    const papers = await scanDirectory(PASTPAPERS_DIR);
    console.log(`Found ${papers.length} PDF files`);

    if (papers.length === 0) {
      console.warn('No PDF files found in Pastpapers directory');
      console.log('Please add PDF files to the Pastpapers directory and try again');
      process.exit(0);
    }

    console.log('\nFirst 3 papers that will be imported:');
    papers.slice(0, 3).forEach((paper, index) => {
      console.log(`${index + 1}. ${paper.subject} (${paper.grade}, ${paper.year}) - ${paper.examType}`);
    });

    console.log('\nClearing existing past papers from database...');
    const deleteResult = await PastPaper.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing papers`);

    console.log(`\nInserting ${papers.length} papers into database...`);
    const result = await PastPaper.insertMany(papers);
    console.log(`✓ Successfully inserted ${result.length} papers`);

    console.log('\n📊 Summary by Grade:');
    const groupedByGrade = papers.reduce((acc, paper) => {
      if (!acc[paper.grade]) acc[paper.grade] = 0;
      acc[paper.grade]++;
      return acc;
    }, {});

    Object.entries(groupedByGrade).forEach(([grade, count]) => {
      console.log(`  ${grade}: ${count} papers`);
    });

    console.log('\n📚 Summary by Subject:');
    const groupedBySubject = papers.reduce((acc, paper) => {
      if (!acc[paper.subject]) acc[paper.subject] = 0;
      acc[paper.subject]++;
      return acc;
    }, {});

    Object.entries(groupedBySubject).forEach(([subject, count]) => {
      console.log(`  ${subject}: ${count} papers`);
    });

    console.log('\n✅ Population complete! Past papers are now available in the app.');
  } catch (error) {
    console.error('Error during population:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

main();
