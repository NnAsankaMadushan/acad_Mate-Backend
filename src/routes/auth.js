const express = require('express');
const crypto = require('crypto');
const { sendOtpEmail, sendPasswordEmail } = require('../services/brevo');
const { admin } = require('../firebase_admin');

const router = express.Router();
const OTP_SECRET = process.env.OTP_SECRET || 'acadmate_default_otp_secret';

function generateOtp(email, type) {
  const timeStep = Math.floor(Date.now() / (10 * 60 * 1000)); // 10-minute window
  const hmac = crypto
    .createHmac('sha256', OTP_SECRET)
    .update(`${email}:${type}:${timeStep}`)
    .digest('hex');

  return (BigInt(`0x${hmac}`) % 1000000n).toString().padStart(6, '0');
}

function verifyOtp(email, type, code) {
  const now = Date.now();
  const windows = [
    Math.floor(now / (10 * 60 * 1000)),
    Math.floor((now - 1 * 60 * 1000) / (10 * 60 * 1000)),
  ];

  return windows.some((window) => {
    const hmac = crypto
      .createHmac('sha256', OTP_SECRET)
      .update(`${email}:${type}:${window}`)
      .digest('hex');

    const expected = (BigInt(`0x${hmac}`) % 1000000n).toString().padStart(6, '0');
    return expected === code;
  });
}

// Generate a random password
function generatePassword() {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Signup - Create account and send password and OTP
 * Body: { email, name? }
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Generate password
    const password = generatePassword();

    // Create Firebase user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name || 'AcadMate Student',
    });

    // Send password email
    await sendPasswordEmail(email, password);

    // Generate and send OTP
    const otp = generateOtp(email, 'signup');
    await sendOtpEmail(email, otp, 'signup');

    res.json({ message: 'Account created. Password and OTP sent to email.', firebaseUid: userRecord.uid });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ message: 'Email already exists.' });
    }
    next(error);
  }
});

/**
 * Send OTP to email
 * Body: { email, type: 'signup' | 'password_reset' }
 */
router.post('/send-otp', async (req, res, next) => {
  try {
    const { email, type } = req.body;
    if (!email || !type) {
      return res.status(400).json({ message: 'Email and type are required.' });
    }

    // Generate and send OTP
    const code = generateOtp(email, type);
    await sendOtpEmail(email, code, type);

    res.json({ message: 'OTP sent successfully.' });
  } catch (error) {
    next(error);
  }
});

/**
 * Verify OTP
 * Body: { email, code, type }
 */
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, code, type } = req.body;
    if (!email || !code || !type) {
      return res.status(400).json({ message: 'Email, code, and type are required.' });
    }

    if (!verifyOtp(email, type, code)) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    res.json({ message: 'OTP verified successfully.', verified: true });
  } catch (error) {
    next(error);
  }
});

/**
 * Reset password (use after OTP verification) 
 * Body: { email, code, newPassword }
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Double check OTP
    if (!verifyOtp(email, 'password_reset', code)) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Finalize password reset via Firebase Admin
    try {
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(user.uid, {
        password: newPassword,
      });

      res.json({ message: 'Password has been reset successfully.' });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({ message: 'User not found.' });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
