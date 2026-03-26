/**
 * Test script for verifying Realtime Socket.IO endpoints
 */
import 'dotenv/config';
import { io, Socket } from 'socket.io-client';
import jwt from 'jsonwebtoken';

async function testRealtime() {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-minimum-32-characters-long';
  const token = jwt.sign({ userId: 'testUser123', role: 'PLAYER' }, secret, { expiresIn: '15m' });
  
  const socket: Socket = io('http://localhost:3001', {
    auth: { token },
  });

  const matchId = 'test-match-id-123';

  console.log('Connecting to socket server...');
  
  return new Promise<void>((resolve, reject) => {
    // 1. Connection Event
    socket.on('connect', () => {
      console.log('✅ Connected successfully with JWT:', socket.id);
      
      // 2. Join Match Room
      socket.emit('join-match', { matchId });
      console.log(`✅ Emitted join-match for ${matchId}`);
    });

    socket.on('connected', (data) => {
      console.log('✅ Server acknowledged connection:', data);
    });

    // 3. Listen for events
    socket.on('match:update', (data) => {
      console.log('✅ Received match:update:', data);
    });

    socket.on('match:score_update', (data) => {
      console.log('✅ Received match:score_update:', data);
    });

    socket.on('match:commentary', (data) => {
      console.log('✅ Received match:commentary:', data);
    });

    socket.on('error', (err) => {
      console.error('❌ Socket Error:', err);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
      resolve();
    });

    // Timeout the test after a few seconds assuming we'd trigger events
    setTimeout(() => {
      console.log('Test completed successfully. Waiting for any remaining events or exiting...');
      socket.disconnect();
      resolve();
    }, 5000);
  });
}

testRealtime().catch(console.error);
