require('dotenv').config();
require('express-async-errors');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { setupSocketHandlers } = require('./socket');

const app = express();
const httpServer = http.createServer(app);

// ─── Trust Proxy ─────────────────────────────────────────────────────────────
app.set('trust proxy', false);

// ─── Socket.io ───────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  pingTimeout: 60000,
});

app.set('io', io);
setupSocketHandlers(io);

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// ─── Rate Limiting (skip in dev to avoid IPv6 issues) ────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── General Middleware ───────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan('dev'));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Root health check ────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ message: '🏥 Hospital Queue API', status: 'ok' }));

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
// Force '127.0.0.1' (IPv4) instead of 'localhost' which Windows resolves as ::1 (IPv6)
const PORT = process.env.PORT || 5000;
const HOST = '127.0.0.1';

httpServer.listen(PORT, HOST, () => {
  logger.info(`🏥 Hospital Queue API → http://${HOST}:${PORT} [${process.env.NODE_ENV}]`);
  logger.info(`✅ Health check  → http://${HOST}:${PORT}/api/health`);
  logger.info(`✅ Doctors API   → http://${HOST}:${PORT}/api/doctors`);
});

process.on('SIGTERM', () => {
  httpServer.close(() => process.exit(0));
});

module.exports = { app, httpServer };