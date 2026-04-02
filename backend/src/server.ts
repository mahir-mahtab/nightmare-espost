import { createServer } from 'node:http';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';
import { config } from './config/index.js';
import { db } from './services/database.js';
import { cache } from './services/redis.js';
import { logger } from './services/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { registerSocketHandlers } from './sockets/handlers.js';
import routes from './routes/index.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: config.FRONTEND_ORIGIN },
  path: '/socket.io',
});

// Middleware
app.use(cors({ origin: config.FRONTEND_ORIGIN }));
app.use(express.json());

// Routes
app.use(routes);

// Socket.IO
registerSocketHandlers(io);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  httpServer.close();
  io.close();
  await db.close();
  await cache.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
const start = async () => {
  try {
    const dbConnected = await db.connect();
    const cacheConnected = await cache.connect();

    if (!dbConnected || !cacheConnected) {
      logger.warn('Starting with degraded dependencies');
    }

    httpServer.listen(config.PORT, () => {
      logger.info(`Server running on http://localhost:${config.PORT}`);
      logger.info(`Socket.IO endpoint: http://localhost:${config.PORT}/socket.io`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

start();
