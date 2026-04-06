const express = require('express');

const User = require('../models/User');
const { requireFirebaseAuth } = require('../middleware/require_firebase_auth');

const router = express.Router();

router.get('/me', requireFirebaseAuth, async (req, res, next) => {
  try {
    const profile = await User.upsertFromFirebase(req.firebaseUser);
    return res.json(serializeUser(profile));
  } catch (error) {
    return next(error);
  }
});

router.put('/me', requireFirebaseAuth, async (req, res, next) => {
  try {
    const updates = sanitizeProfileUpdates(req.body);
    const profile = await User.upsertFromFirebase(req.firebaseUser, updates);
    return res.json(serializeUser(profile));
  } catch (error) {
    return next(error);
  }
});

router.post('/me/quiz-results', requireFirebaseAuth, async (req, res, next) => {
  try {
    const payload = req.body || {};
    const quizId = asOptionalString(payload.quizId);
    const score = asOptionalNumber(payload.score);
    const total = asOptionalNumber(payload.total);

    if (
      !quizId ||
      score === undefined ||
      total === undefined ||
      total <= 0 ||
      score < 0 ||
      score > total
    ) {
      return res.status(400).json({
        message: 'Invalid quiz result payload.',
      });
    }

    const allCorrect = score === total;
    const quizResult = {
      quizId,
      score,
      total,
      completedAt: payload.completedAt
        ? new Date(payload.completedAt)
        : new Date(),
      isPerfect: allCorrect,
    };

    const updates = {
      $push: { quizResults: quizResult },
      $inc: { completedQuestions: total },
    };
    if (allCorrect) {
      updates.$addToSet = { completedQuizIds: quizId };
    }

    const profile = await User.findOneAndUpdate(
      { firebaseUid: req.firebaseUser.uid },
      updates,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.json(serializeUser(profile));
  } catch (error) {
    return next(error);
  }
});

function sanitizeProfileUpdates(body) {
  const payload = body && typeof body === 'object' ? body : {};

  return {
    name: asOptionalString(payload.name),
    email: asOptionalString(payload.email),
    grade: asOptionalString(payload.grade),
    stream: asOptionalString(payload.stream),
    avatarUrl: asOptionalString(payload.avatarUrl),
    authProvider: asOptionalString(payload.authProvider),
    linkedProviders: Array.isArray(payload.linkedProviders)
      ? payload.linkedProviders
          .map((value) => asOptionalString(value))
          .filter(Boolean)
      : undefined,
    streakDays: asOptionalNumber(payload.streakDays),
    completedQuestions: asOptionalNumber(payload.completedQuestions),
    bookmarkedPapers: asOptionalNumber(payload.bookmarkedPapers),
    completedQuizIds: Array.isArray(payload.completedQuizIds)
      ? payload.completedQuizIds
          .map((value) => asOptionalString(value))
          .filter(Boolean)
      : undefined,
    quizResults: Array.isArray(payload.quizResults)
      ? payload.quizResults
          .map((value) => asOptionalQuizResult(value))
          .filter(Boolean)
      : undefined,
  };
}

function asOptionalQuizResult(value) {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const quizId = asOptionalString(value.quizId);
  const score = asOptionalNumber(value.score);
  const total = asOptionalNumber(value.total);
  if (!quizId || score === undefined || total === undefined) {
    return undefined;
  }

  return {
    quizId,
    score,
    total,
    completedAt: value.completedAt
      ? new Date(value.completedAt)
      : new Date(),
    isPerfect:
      typeof value.isPerfect === 'boolean'
        ? value.isPerfect
        : score === total,
  };
}

function serializeUser(profile) {
  if (!profile) {
    return null;
  }

  return {
    firebaseUid: profile.firebaseUid,
    name: profile.name,
    email: profile.email,
    grade: profile.grade,
    stream: profile.stream,
    avatarUrl: profile.avatarUrl,
    authProvider: profile.authProvider,
    linkedProviders: profile.linkedProviders || [],
    streakDays: profile.streakDays || 0,
    completedQuestions: profile.completedQuestions || 0,
    bookmarkedPapers: profile.bookmarkedPapers || 0,
    completedQuizIds: profile.completedQuizIds || [],
    quizResults: profile.quizResults || [],
    isFirebaseAccount: profile.isFirebaseAccount ?? true,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    lastSeenAt: profile.lastSeenAt,
  };
}

function asOptionalString(value) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const text = value.trim();
  return text.length > 0 ? text : undefined;
}

function asOptionalNumber(value) {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

module.exports = router;
