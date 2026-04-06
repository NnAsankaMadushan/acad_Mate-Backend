const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { PDFParse } = require('pdf-parse');
const QuestionSet = require('../models/QuestionSet');
const PastPaper = require('../models/PastPaper');

// Get all question sets with filtering
router.get('/question-sets', async (req, res) => {
  try {
    const { grade, subject, stream, search } = req.query;
    const filter = {};

    if (grade && grade !== 'All') filter.grade = grade;
    if (subject && subject !== 'All') filter.subject = subject;
    if (stream && stream !== 'All') filter.stream = stream;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sets = await QuestionSet.find(filter).sort({ isFeatured: -1, rating: -1 });
    res.json(sets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch question sets' });
  }
});

// Get a single question set by ID
router.get('/question-sets/:id', async (req, res) => {
  try {
    const set = await QuestionSet.findById(req.params.id);
    if (!set) return res.status(404).json({ error: 'Question set not found' });
    res.json(set);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch question set' });
  }
});

function buildGradeFilter(value) {
  const normalized = value.trim();
  const gradeMatch = normalized.match(/Grade\s*(\d{1,2})/i);
  if (gradeMatch) {
    const numeric = gradeMatch[1].padStart(2, '0');
    return { $in: [normalized, numeric, String(parseInt(gradeMatch[1], 10))] };
  }

  if (/^o\/l$/i.test(normalized) || /ordinary\s*level/i.test(normalized)) {
    return { $in: [normalized, 'O/L', 'Ordinary Level'] };
  }

  if (/^a\/l$/i.test(normalized) || /advanced\s*level/i.test(normalized)) {
    return { $in: [normalized, 'A/L', 'Advanced Level'] };
  }

  return normalized;
}

// Get all past papers with filtering
router.get('/past-papers', async (req, res) => {
  try {
    const { grade, subject, stream, search } = req.query;
    const filter = {};

    if (grade && grade !== 'All') filter.grade = buildGradeFilter(String(grade));
    if (subject && subject !== 'All') filter.subject = subject;
    if (stream && stream !== 'All') filter.stream = stream;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { examType: { $regex: search, $options: 'i' } },
      ];
    }

    const papers = await PastPaper.find(filter).sort({ year: -1 });
    res.json(papers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch past papers' });
  }
});

// Get a single past paper by ID
router.get('/past-papers/:id', async (req, res) => {
  try {
    const paper = await PastPaper.findById(req.params.id);
    if (!paper) return res.status(404).json({ error: 'Past paper not found' });
    res.json(paper);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch past paper' });
  }
});

// Get past paper categories and files from directory structure
router.get('/past-paper-files', async (req, res) => {
  try {
    const pastPapersPath = path.join(__dirname, '..', 'Pastpapers');
    
    async function getDirectoryStructure(dirPath) {
      const items = [];
      
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relativePath = path.relative(pastPapersPath, fullPath);
          
          if (entry.isDirectory()) {
            // Check if this directory contains files or subdirectories
            const subEntries = await fs.readdir(fullPath, { withFileTypes: true });
            const hasFiles = subEntries.some(subEntry => subEntry.isFile());
            const hasDirs = subEntries.some(subEntry => subEntry.isDirectory());
            
            const category = {
              name: entry.name,
              path: relativePath,
              type: 'category',
              hasFiles: hasFiles,
              hasSubcategories: hasDirs,
            };
            
            if (hasDirs) {
              category.subcategories = await getDirectoryStructure(fullPath);
            }
            
            if (hasFiles) {
              category.files = subEntries
                .filter(subEntry => subEntry.isFile() && subEntry.name.endsWith('.pdf'))
                .map(subEntry => ({
                  name: subEntry.name,
                  path: path.relative(pastPapersPath, path.join(fullPath, subEntry.name)),
                  type: 'file'
                }));
            }
            
            items.push(category);
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
      }
      
      return items.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    const structure = await getDirectoryStructure(pastPapersPath);
    res.json(structure);
  } catch (err) {
    console.error('Error fetching past paper files:', err);
    res.status(500).json({ error: 'Failed to fetch past paper files' });
  }
});

// Get past papers grouped by category
router.get('/past-papers-by-category', async (req, res) => {
  try {
    const papers = await PastPaper.find().sort({ grade: 1, year: -1 });
    
    const grouped = papers.reduce((acc, paper) => {
      if (!acc[paper.grade]) {
        acc[paper.grade] = [];
      }
      acc[paper.grade].push(paper);
      return acc;
    }, {});

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch past papers by category' });
  }
});

// Get past papers statistics
router.get('/past-papers-stats', async (req, res) => {
  try {
    const total = await PastPaper.countDocuments();
    
    const stats = await PastPaper.aggregate([
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 },
          subjects: { $addToSet: '$subject' },
          years: { $addToSet: '$year' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      total,
      byGrade: stats,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch past papers statistics' });
  }
});

// Admin: Populate database from Pastpapers directory
// In production, this should be protected with authentication
router.post('/admin/populate-past-papers', async (req, res) => {
  try {
    // Note: In production, add proper authentication/authorization middleware
    const adminKey = req.headers['x-admin-key'];
    const expectedKey = process.env.ADMIN_KEY || 'admin-secret';
    
    if (adminKey !== expectedKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Starting past papers population...');
    const pastPapersPath = path.join(__dirname, '..', 'Pastpapers');

    function extractMetadataFromFilename(filename, category) {
      const nameWithoutExt = filename.replace(/\.pdf$/i, '');
      const parts = nameWithoutExt.split('-').map(p => p.trim());
      
      let subject = 'General';
      let year = new Date().getFullYear();
      let examType = 'Mid Term';

      if (parts.length >= 2) {
        subject = parts[1] || 'General';
        if (parts.length >= 3) {
          const yearMatch = parts[2].match(/\d{4}/);
          if (yearMatch) {
            year = parseInt(yearMatch[0]);
            if (parts.length >= 4) {
              examType = parts[3];
            }
          } else {
            examType = parts[2];
          }
        }
      }

      return { subject: subject.trim(), year, examType: examType.trim() };
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
            const { subject, year, examType } = extractMetadataFromFilename(entry.name, currentCategory);
            const { grade, stream } = normalizeGrade(relativeCategory.split('/')[0]);

            const storagePath = path.relative(pastPapersPath, fullPath);
            const stats = await fs.stat(fullPath);
            const fileSize = stats.size;

            // Extract page count
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
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error.message);
      }
      return papers;
    }

    const papers = await scanDirectory(pastPapersPath);
    console.log(`Found ${papers.length} PDF files`);

    if (papers.length === 0) {
      return res.status(400).json({
        error: 'No PDF files found in Pastpapers directory',
        message: 'Please add PDF files to the Pastpapers directory',
      });
    }

    // Delete existing papers
    const deleteResult = await PastPaper.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing papers`);

    // Insert new papers
    const result = await PastPaper.insertMany(papers);
    console.log(`Inserted ${result.length} papers`);

    // Get summary by grade
    const groupedByGrade = papers.reduce((acc, paper) => {
      if (!acc[paper.grade]) acc[paper.grade] = 0;
      acc[paper.grade]++;
      return acc;
    }, {});

    res.json({
      success: true,
      message: `Successfully populated database with ${result.length} papers`,
      inserted: result.length,
      deleted: deleteResult.deletedCount,
      summary: groupedByGrade,
    });
  } catch (err) {
    console.error('Error during population:', err);
    res.status(500).json({ error: 'Failed to populate past papers', details: err.message });
  }
});

module.exports = router;
