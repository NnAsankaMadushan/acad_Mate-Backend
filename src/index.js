require('dotenv').config();

const cors = require('cors');
const express = require('express');
const path = require('path');

const { connectDatabase } = require('./db');
const { initializeFirebaseAdmin } = require('./firebase_admin');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const academicRouter = require('./routes/academic');

async function main() {
  initializeFirebaseAdmin();
  await connectDatabase();

  const app = express();
  const port = Number(process.env.PORT || 3000);
  const allowedOrigin = process.env.CORS_ORIGIN || '*';

  app.use(
    cors({
      origin: allowedOrigin === '*' ? true : allowedOrigin,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  // Serve static files from Pastpapers directory
  app.use('/pastpapers', express.static(path.join(__dirname, 'Pastpapers')));

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'acad-mate-backend',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/users', usersRouter);
  app.use('/auth', authRouter);
  app.use('/academic', academicRouter);

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({
      message: 'Unexpected server error.',
      error: error.message,
    });
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`AcadMate backend listening on http://0.0.0.0:${port}`);
    console.log(`Access locally: http://localhost:${port}`);
    console.log(`Access from other devices: http://192.168.1.156:${port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
