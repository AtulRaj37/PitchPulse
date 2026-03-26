import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private matchListeners: Set<(data: any) => void> = new Set();
  private scoreListeners: Set<(data: any) => void> = new Set();
  private commentaryListeners: Set<(data: any) => void> = new Set();

  public connect(token?: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: token ? { token } : {},
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('🔗 Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('❌ Socket disconnected:', reason);
    });

    this.socket.on('error', (err) => {
      console.error('Socket Error:', err);
    });

    // Register global event listeners that trigger local subscriptions
    this.socket.on('match:update', (data) => {
      this.matchListeners.forEach((listener) => listener(data));
    });

    this.socket.on('match:score_update', (data) => {
      this.scoreListeners.forEach((listener) => listener(data));
    });

    this.socket.on('match:commentary', (data) => {
      this.commentaryListeners.forEach((listener) => listener(data));
    });
  }

  public joinMatch(matchId: string) {
    if (!this.socket) {
      console.warn('Socket not initialized before joinMatch');
      return;
    }
    this.socket.emit('join-match', { matchId });
  }

  public leaveMatch(matchId: string) {
    if (this.socket) {
      this.socket.emit('leave-match', { matchId });
    }
  }

  // --- Subscriptions ---
  public subscribeToMatchUpdates(callback: (data: any) => void) {
    this.matchListeners.add(callback);
    return () => this.matchListeners.delete(callback);
  }

  public subscribeToScoreUpdates(callback: (data: any) => void) {
    this.scoreListeners.add(callback);
    return () => this.scoreListeners.delete(callback);
  }

  public subscribeToCommentary(callback: (data: any) => void) {
    this.commentaryListeners.add(callback);
    return () => this.commentaryListeners.delete(callback);
  }

  public disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();
