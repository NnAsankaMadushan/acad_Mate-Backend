const admin = require('firebase-admin');

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson && serviceAccountJson.trim().length > 0) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
    });
    return admin.app();
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
  return admin.app();
}

module.exports = {
  admin,
  initializeFirebaseAdmin,
};
