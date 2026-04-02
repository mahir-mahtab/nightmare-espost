import { Server, Socket } from 'socket.io';
import { logger } from '../services/logger.js';

const clients = new Map<string, string>();
let clientCounter = 0;

export const registerSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    clientCounter += 1;
    const clientId = `client-${clientCounter}`;
    clients.set(socket.id, clientId);

    logger.info(`Client connected: ${clientId} (${clients.size} online)`);

    socket.emit('welcome', { clientId, online: clients.size });
    io.emit('system', { message: `${clientId} joined. Online: ${clients.size}` });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    socket.on('chat', (payload: unknown) => {
      if (typeof payload !== 'string') {
        socket.emit('error', { message: 'Invalid chat payload format.' });
        return;
      }

      const trimmed = payload.trim();
      if (!trimmed) {
        socket.emit('error', { message: 'Chat message cannot be empty.' });
        return;
      }

      io.emit('chat', {
        from: clientId,
        text: trimmed,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      const disconnectedClient = clients.get(socket.id);
      clients.delete(socket.id);

      if (disconnectedClient) {
        logger.info(`Client disconnected: ${disconnectedClient} (${clients.size} online)`);
        io.emit('system', {
          message: `${disconnectedClient} left. Online: ${clients.size}`,
        });
      }
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for ${clientId}`, error);
    });
  });
};
