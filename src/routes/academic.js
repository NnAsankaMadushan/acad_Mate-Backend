const express = require('express');
const router = express.Router();
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

// Get all past papers with filtering
router.get('/past-papers', async (req, res) => {
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

module.exports = router;
