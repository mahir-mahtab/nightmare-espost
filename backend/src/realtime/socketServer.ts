import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { authService } from '../services/authService.js';
import { eventService } from '../services/eventService.js';
import { auctionService } from '../services/auctionService.js';
import { logger } from '../utils/logger.js';

const SOCKET_PREFIX = 'event:';
const ADMIN_GLOBAL_ROOM = 'admin:global';
const ADMIN_EVENT_PREFIX = 'admin:event:';

const eventRoom = (eventId: string) => `${SOCKET_PREFIX}${eventId}`;
const adminEventRoom = (eventId: string) => `${ADMIN_EVENT_PREFIX}${eventId}`;

let io: SocketIOServer | null = null;
let timerHandle: NodeJS.Timeout | null = null;
let tickerInFlight = false;

const getSocketEventId = (socket: { data?: any }): string | null => {
  const eventId = socket.data?.eventId;
  return typeof eventId === 'string' ? eventId : null;
};

const computeTimeLeft = (activeLotEndsAt: number | null) => {
  if (!activeLotEndsAt) {
    return 0;
  }

  return Math.max(0, Math.ceil((activeLotEndsAt - Date.now()) / 1000));
};

const emitAuctionState = async (eventId: string) => {
  if (!io) return;
  const state = await auctionService.getAuctionState(eventId);
  io.to(eventRoom(eventId)).emit('auction_state', state);
  io.to(adminEventRoom(eventId)).emit('auction_state', state);
};

const emitLotChanged = async (eventId: string, lotId: string) => {
  if (!io) return;
  const board = await eventService.getAuctionBoard(eventId);
  const lot = board.lots.find((item: any) => item.id === lotId);
  if (lot) {
    io.to(eventRoom(eventId)).emit('lot_status_changed', { eventId, lot });
    io.to(adminEventRoom(eventId)).emit('lot_status_changed', { eventId, lot });
  }
};

const emitActiveLotChanged = (eventId: string, fromLotId: string | null, toLotId: string | null) => {
  if (!io) return;
  io.to(eventRoom(eventId)).emit('active_lot_changed', {
    eventId,
    previousLotId: fromLotId,
    newLotId: toLotId,
  });
  io.to(adminEventRoom(eventId)).emit('active_lot_changed', {
    eventId,
    previousLotId: fromLotId,
    newLotId: toLotId,
  });
};

const runTickerCycle = async () => {
  if (!io || tickerInFlight) {
    return;
  }

  tickerInFlight = true;
  try {
    const sockets = await io.fetchSockets();
    const eventIds = new Set<string>();

    sockets.forEach((socket) => {
      const eventId = getSocketEventId(socket);
      if (eventId) {
        eventIds.add(eventId);
      }
    });

    for (const eventId of eventIds) {
      try {
        const tickResult = await auctionService.tickAuction(eventId);
        io.to(eventRoom(eventId)).emit('timer_tick', {
          eventId,
          timeLeft: computeTimeLeft(tickResult.runtime.activeLotEndsAt),
          activeLotId: tickResult.runtime.activeLotId,
          activeLotEndsAt: tickResult.runtime.activeLotEndsAt || null,
          serverNow: Date.now(),
        });
        io.to(adminEventRoom(eventId)).emit('timer_tick', {
          eventId,
          timeLeft: computeTimeLeft(tickResult.runtime.activeLotEndsAt),
          activeLotId: tickResult.runtime.activeLotId,
          activeLotEndsAt: tickResult.runtime.activeLotEndsAt || null,
          serverNow: Date.now(),
        });

        if (tickResult.progressed) {
          if (tickResult.previousActiveLotId) {
            await emitLotChanged(eventId, tickResult.previousActiveLotId);
          }

          emitActiveLotChanged(
            eventId,
            tickResult.previousActiveLotId,
            tickResult.nextActiveLotId,
          );

          await emitAuctionState(eventId);
        }
      } catch (error: any) {
        logger.warn(`Ticker skipped for event ${eventId}: ${error?.message || 'unknown error'}`);
      }
    }
  } finally {
    tickerInFlight = false;
  }
};

const startGlobalTicker = () => {
  if (timerHandle) {
    return;
  }

  const schedule = () => {
    timerHandle = setTimeout(async () => {
      await runTickerCycle();
      schedule();
    }, 1000);
  };

  schedule();
};

export const socketServer = {
  init(httpServer: HttpServer, corsOrigin: string) {
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOrigin,
        credentials: true,
      },
    });

    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.toString().replace('Bearer ', '');
        if (!token) {
          return next(new Error('Socket auth token required'));
        }

        const adminPayload = authService.verifyAdminToken(token);
        if (adminPayload) {
          socket.data.admin = adminPayload;
          socket.data.isAdmin = true;
          return next();
        }

        const payload = authService.verifyEventSessionToken(token);
        if (!payload) {
          return next(new Error('Invalid or expired socket session token'));
        }

        socket.data.session = payload;
        socket.data.eventId = payload.eventId;
        next();
      } catch (error) {
        next(new Error('Socket auth failed'));
      }
    });

    io.on('connection', (socket) => {
      if (socket.data?.isAdmin) {
        socket.join(ADMIN_GLOBAL_ROOM);

        socket.on('join_admin_event', async (payload: { eventId?: string }) => {
          try {
            if (!payload?.eventId) {
              socket.emit('auction_error', { message: 'Event id is required', code: 'ADMIN_EVENT_ID_REQUIRED' });
              return;
            }

            const event = await eventService.getEvent(payload.eventId);
            socket.join(adminEventRoom(event.id));
            await emitAuctionState(event.id);
            socket.emit('joined_admin_event', { eventId: event.id });
          } catch (error: any) {
            socket.emit('auction_error', {
              message: error?.message || 'Failed to join admin event room',
              code: 'ADMIN_JOIN_EVENT_FAILED',
            });
          }
        });

        socket.on('leave_admin_event', async (payload: { eventId?: string }) => {
          if (!payload?.eventId) {
            return;
          }

          try {
            const event = await eventService.getEvent(payload.eventId);
            socket.leave(adminEventRoom(event.id));
          } catch {
            // no-op
          }
        });

        socket.on('disconnect', () => {
          logger.debug(`Admin socket disconnected: ${socket.id}`);
        });

        return;
      }

      const eventId = getSocketEventId(socket);
      if (!eventId) {
        socket.emit('auction_error', { message: 'Missing event context', code: 'SOCKET_EVENT_CONTEXT_MISSING' });
        socket.disconnect(true);
        return;
      }

      socket.join(eventRoom(eventId));
      emitAuctionState(eventId).catch(() => {});

      socket.on('join_event', async (payload: { eventId?: string }) => {
        try {
          const requestedEvent = payload?.eventId;
          if (requestedEvent && requestedEvent !== eventId) {
            socket.emit('auction_error', { message: 'Session does not match event', code: 'SOCKET_EVENT_MISMATCH' });
            return;
          }

          socket.join(eventRoom(eventId));
          await emitAuctionState(eventId);
          socket.emit('joined_event', { eventId });
        } catch (error: any) {
          socket.emit('auction_error', {
            message: error?.message || 'Failed to join event room',
            code: 'SOCKET_JOIN_FAILED',
          });
        }
      });

      socket.on('disconnect', () => {
        logger.debug(`Socket disconnected: ${socket.id}`);
      });
    });

    startGlobalTicker();
    logger.info('Socket.io server initialized');
    return io;
  },

  getIO() {
    return io;
  },

  emitNewBid(eventId: string, payload: any) {
    if (!io) return;
    io.to(eventRoom(eventId)).emit('new_bid', payload);
    io.to(adminEventRoom(eventId)).emit('new_bid', payload);
  },

  emitLotStatusChanged(eventId: string, payload: any) {
    if (!io) return;
    io.to(eventRoom(eventId)).emit('lot_status_changed', payload);
    io.to(adminEventRoom(eventId)).emit('lot_status_changed', payload);
  },

  emitActiveLotChanged(eventId: string, payload: any) {
    if (!io) return;
    io.to(eventRoom(eventId)).emit('active_lot_changed', payload);
    io.to(adminEventRoom(eventId)).emit('active_lot_changed', payload);
  },

  emitAuctionStarted(eventId: string, payload: any) {
    if (!io) return;
    io.to(eventRoom(eventId)).emit('auction_started', payload);
    io.to(adminEventRoom(eventId)).emit('auction_started', payload);
  },

  emitAuctionStopped(eventId: string, payload: any) {
    if (!io) return;
    io.to(eventRoom(eventId)).emit('auction_stopped', payload);
    io.to(adminEventRoom(eventId)).emit('auction_stopped', payload);
  },

  async emitFullAuctionState(eventId: string) {
    await emitAuctionState(eventId);
  },
};
