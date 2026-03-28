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
