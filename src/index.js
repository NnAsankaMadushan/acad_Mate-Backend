require('dotenv').config();

const cors = require('cors');
const express = require('express');

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

  app.listen(port, () => {
    console.log(`AcadMate backend listening on http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
