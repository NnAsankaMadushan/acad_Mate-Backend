const { admin } = require('../firebase_admin');

async function requireFirebaseAuth(req, res, next) {
  try {
    const authorization = req.get('authorization') || '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return res.status(401).json({ message: 'Missing Firebase ID token.' });
    }

    const decodedToken = await admin.auth().verifyIdToken(match[1]);
    req.firebaseUser = decodedToken;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid Firebase ID token.',
      error: error.message,
    });
  }
}

module.exports = {
  requireFirebaseAuth,
};
