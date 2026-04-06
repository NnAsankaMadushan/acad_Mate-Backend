const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      default: 'AcadMate Student',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    grade: {
      type: String,
      default: 'A/L',
      trim: true,
    },
    stream: {
      type: String,
      default: 'Science',
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      default: 'password',
      trim: true,
    },
    linkedProviders: {
      type: [String],
      default: [],
    },
    streakDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },
    bookmarkedPapers: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedQuizIds: {
      type: [String],
      default: [],
    },
    quizResults: {
      type: [
        new mongoose.Schema(
          {
            quizId: { type: String, required: true, trim: true },
            score: { type: Number, required: true, min: 0 },
            total: { type: Number, required: true, min: 0 },
            completedAt: { type: Date, required: true, default: Date.now },
            isPerfect: { type: Boolean, required: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    isFirebaseAccount: {
      type: Boolean,
      default: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.statics.upsertFromFirebase = async function upsertFromFirebase(
  firebaseUser,
  updates = {},
) {
  const providerId =
    updates.authProvider ||
    firebaseUser.firebase?.sign_in_provider ||
    'password';

  const linkedProviders = new Set([
    ...(Array.isArray(updates.linkedProviders) ? updates.linkedProviders : []),
    providerId,
  ]);

  const payload = {
    firebaseUid: firebaseUser.uid,
    name:
      updates.name ||
      firebaseUser.name ||
      firebaseUser.email?.split('@')[0] ||
      'AcadMate Student',
    email: updates.email || firebaseUser.email || '',
    grade: updates.grade || 'A/L',
    stream: updates.stream || 'Science',
    avatarUrl: updates.avatarUrl || firebaseUser.picture || null,
    authProvider: providerId,
    linkedProviders: Array.from(linkedProviders).filter(Boolean),
    isFirebaseAccount: true,
    lastSeenAt: new Date(),
  };

  if (Number.isFinite(updates.streakDays)) {
    payload.streakDays = updates.streakDays;
  }
  if (Number.isFinite(updates.completedQuestions)) {
    payload.completedQuestions = updates.completedQuestions;
  }
  if (Number.isFinite(updates.bookmarkedPapers)) {
    payload.bookmarkedPapers = updates.bookmarkedPapers;
  }
  if (Array.isArray(updates.completedQuizIds)) {
    payload.completedQuizIds = updates.completedQuizIds
      .filter((value) => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean);
  }
  if (Array.isArray(updates.quizResults)) {
    payload.quizResults = updates.quizResults;
  }

  return this.findOneAndUpdate(
    { firebaseUid: firebaseUser.uid },
    {
      $set: payload,
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  ).lean();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
