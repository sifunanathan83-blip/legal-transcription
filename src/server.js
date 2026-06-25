import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import logger from './config/logger.js';
import { initDatabase } from './config/database.js';
import wsHandlers from './ws/handlers.js';
import transcriptionRoutes from './routes/transcription.js';
import casesRoutes from './routes/cases.js';
import speakersRoutes from './routes/speakers.js';
import exportRoutes from './routes/export.js';
import errorHandler from './middleware/error-handler.js';

const app = express();
const httpServer = http.createServer(app);

// Initialize database
try {
  await initDatabase();
} catch (error) {
  logger.error('Failed to initialize database:', error);
  process.exit(1);
}

// WebSocket Server
const wss = new WebSocket.Server({ server: httpServer, path: '/transcribe' });

wss.on('connection', (ws, req) => {
  logger.info(`🔌 New WebSocket connection from ${req.socket.remoteAddress}`);
  wsHandlers.handleConnection(ws, req);
});

wss.on('error', (error) => {
  logger.error('WebSocket server error:', error);
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'legal-transcription-app',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/transcriptions', transcriptionRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/speakers', speakersRoutes);
app.use('/api/export', exportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default httpServer;