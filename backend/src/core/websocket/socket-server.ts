// Socket.IO Server
// WebSocket server for real-time communication
//
// Architecture:
// 1. Socket.IO server attached to Fastify
// 2. Redis adapter for horizontal scaling
// 3. Room-based architecture for match subscriptions
// 4. JWT authentication for secure connections

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisClient as redis } from '../redis/index.js';
import { config } from '../../config/index.js';
import jwt from 'jsonwebtoken';

// ============================================
// TYPES
// ============================================

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface ServerToClientEvents {
  'match:update': (data: MatchEventPayload | MatchStatusPayload) => void;
  'match:score_update': (data: ScoreboardPayload) => void;
  'match:commentary': (data: CommentaryPayload) => void;
  'tournament:update': (data: TournamentUpdatePayload) => void;
  'error': (data: ErrorPayload) => void;
  'connected': (data: ConnectionPayload) => void;
}

interface ClientToServerEvents {
  'join-match': (data: JoinMatchPayload) => void;
  'leave-match': (data: LeaveMatchPayload) => void;
  'join-tournament': (data: JoinTournamentPayload) => void;
  'leave-tournament': (data: LeaveTournamentPayload) => void;
  'subscribe-scoreboard': (data: SubscribePayload) => void;
  'unsubscribe-scoreboard': (data: SubscribePayload) => void;
}

interface MatchEventPayload {
  matchId: string;
  event: unknown;
  sequenceNumber: number;
  timestamp: string;
}

interface ScoreboardPayload {
  matchId: string;
  scorecard: unknown;
  updatedAt: string;
}

interface CommentaryPayload {
  matchId: string;
  commentary: string;
  over: number;
  ball: number;
}

interface MatchStatusPayload {
  matchId: string;
  status: string;
  message?: string;
}

interface TournamentUpdatePayload {
  tournamentId: string;
  type: string;
  data: unknown;
}

interface ErrorPayload {
  code: string;
  message: string;
}

interface ConnectionPayload {
  socketId: string;
  rooms: string[];
}

interface JoinMatchPayload {
  matchId: string;
}

interface LeaveMatchPayload {
  matchId: string;
}

interface JoinTournamentPayload {
  tournamentId: string;
}

interface LeaveTournamentPayload {
  tournamentId: string;
}

interface SubscribePayload {
  matchId: string;
}

// ============================================
// SOCKET SERVER
// ============================================

let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

const ROOMS = {
  MATCH: (matchId: string) => `match:${matchId}`,
  TEAM: (teamId: string) => `team:${teamId}`,
  TOURNAMENT: (tournamentId: string) => `tournament:${tournamentId}`,
} as const;

/**
 * Initialize Socket.IO server
 */
async function initializeSocketServer(httpServer: HttpServer): Promise<Server> {
  if (io) {
    return io;
  }

  // Create Socket.IO server
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
  });

  // Use Redis adapter for horizontal scaling if Redis is available
  if (config.redis.url && redis?.status === 'ready') {
    try {
      const pubClient = redis!;
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.ping(), subClient.ping()]);

      io.adapter(createAdapter(pubClient, subClient));
      console.log('Socket.IO Redis adapter enabled');
    } catch (e) {
      console.warn('Socket.IO Redis adapter failed to attach. Proceeding without it.');
    }
  }



  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication failed: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string, role: string };
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      return next(new Error('Authentication failed: Invalid or expired token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.userId ?? 'anonymous'})`);

    // Send connection confirmation
    socket.emit('connected', {
      socketId: socket.id,
      rooms: Array.from(socket.rooms),
    });

    // Join match room
    socket.on('join-match', (data: JoinMatchPayload) => {
      const room = ROOMS.MATCH(data.matchId);
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    // Leave match room
    socket.on('leave-match', (data: LeaveMatchPayload) => {
      const room = ROOMS.MATCH(data.matchId);
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    });

    // Join tournament room
    socket.on('join-tournament', (data: JoinTournamentPayload) => {
      const room = ROOMS.TOURNAMENT(data.tournamentId);
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    // Leave tournament room
    socket.on('leave-tournament', (data: LeaveTournamentPayload) => {
      const room = ROOMS.TOURNAMENT(data.tournamentId);
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    });

    // Handle generic socket error
    socket.on('error', (err) => {
      console.error(`Socket error on ${socket.id}:`, err.message);
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (reason: ${reason})`);
    });
  });

  console.log('Socket.IO server initialized');
  return io;
}


/**
 * Broadcast match event to all clients in match room
 */
async function broadcastMatchEvent(
  matchId: string,
  event: unknown,
  sequenceNumber: number
): Promise<void> {
  if (!io) return;

  const payload: MatchEventPayload = {
    matchId,
    event,
    sequenceNumber,
    timestamp: new Date().toISOString(),
  };

  // Broadcast to match room (Adapter handles multi-node delivery)
  io.to(ROOMS.MATCH(matchId)).emit('match:update', payload);
}

/**
 * Broadcast scoreboard update to all clients
 */
async function broadcastScoreboardUpdate(
  matchId: string,
  scorecard: unknown
): Promise<void> {
  if (!io) return;

  const payload: ScoreboardPayload = {
    matchId,
    scorecard,
    updatedAt: new Date().toISOString(),
  };

  io.to(ROOMS.MATCH(matchId)).emit('match:score_update', payload);
}

/**
 * Broadcast commentary
 */
async function broadcastCommentary(
  matchId: string,
  commentary: string,
  over: number,
  ball: number
): Promise<void> {
  if (!io) return;

  const payload: CommentaryPayload = {
    matchId,
    commentary,
    over,
    ball,
  };

  io.to(ROOMS.MATCH(matchId)).emit('match:commentary', payload);
}

/**
 * Broadcast match status change
 */
async function broadcastMatchStatus(
  matchId: string,
  status: string,
  message?: string
): Promise<void> {
  if (!io) return;

  const payload: MatchStatusPayload = {
    matchId,
    status,
    message,
  };

  io.to(ROOMS.MATCH(matchId)).emit('match:update', payload);
}

/**
 * Broadcast tournament update
 */
async function broadcastTournamentUpdate(
  tournamentId: string,
  type: string,
  data: unknown
): Promise<void> {
  if (!io) return;

  const payload: TournamentUpdatePayload = {
    tournamentId,
    type,
    data,
  };

  io.to(ROOMS.TOURNAMENT(tournamentId)).emit('tournament:update', payload);
}

/**
 * Get connected socket count
 */
function getConnectedCount(): number {
  if (!io) return 0;
  return io.engine.clientsCount;
}

/**
 * Get rooms count for a match
 */
function getMatchRoomSize(matchId: string): number {
  if (!io) return 0;
  const room = io.sockets.adapter.rooms.get(ROOMS.MATCH(matchId));
  return room?.size ?? 0;
}

/**
 * Disconnect socket server
 */
async function disconnectSocketServer(): Promise<void> {

  if (io) {
    await io.close();
    io = null;
  }
}

export {
  initializeSocketServer,
  broadcastMatchEvent,
  broadcastScoreboardUpdate,
  broadcastCommentary,
  broadcastMatchStatus,
  broadcastTournamentUpdate,
  getConnectedCount,
  getMatchRoomSize,
  disconnectSocketServer,
  ROOMS,
};

export type {
  Server,
  AuthenticatedSocket,
  ServerToClientEvents,
  ClientToServerEvents,
};
