// WebSocket exports
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
} from './socket-server.js';

export type {
  Server,
  AuthenticatedSocket,
  ServerToClientEvents,
  ClientToServerEvents,
} from './socket-server.js';
