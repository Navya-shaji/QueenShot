import { Server, Socket } from 'socket.io';
<<<<<<< HEAD
import { userRepository } from './infrastructure/routes/userRoutes';
import { UpdateUserStats } from './use_cases/UpdateUserStats';

// Instantiate stats updater usecase injecting the shared repository instance (DIP)
const updateUserStats = new UpdateUserStats(userRepository);

// Simple in-memory game state tracking
const rooms = new Map<string, any>();
let matchmakingQueue: any[] = [];

export default (io: Server) => {
=======

/**
 * Socket.io Game Coordinator for Carrom Board
 * Manages matchmaking, rooms, and real-time game state synchronization.
 */

interface Player {
  socketId: string;
  playerName: string;
}

interface RoomState {
  roomId: string;
  players: {
    player1: { id: string; name: string; color: string };
    player2: { id: string; name: string; color: string };
  };
  currentTurn: string;
  score: { white: number; black: number };
  queenPocketed: boolean;
  boardState: any;
  createdAt: number;
}

const rooms = new Map<string, RoomState>();
let matchmakingQueue: Player[] = [];

export default function setupSocketHandlers(io: Server) {
>>>>>>> 9f82b8c0e53b0f2014d47253831c17a089815697
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // --- MATCHMAKING EVENT ---
<<<<<<< HEAD
    socket.on('joinQueue', (data) => {
=======
    socket.on('joinQueue', (data?: { playerName?: string }) => {
>>>>>>> 9f82b8c0e53b0f2014d47253831c17a089815697
      const playerName = data?.playerName || 'Player';
      console.log(`${playerName} (${socket.id}) joined matchmaking queue.`);

      // Check if user is already in the queue
<<<<<<< HEAD
      if (matchmakingQueue.some(p => p.socketId === socket.id)) {
=======
      if (matchmakingQueue.some((p) => p.socketId === socket.id)) {
>>>>>>> 9f82b8c0e53b0f2014d47253831c17a089815697
        return;
      }

      // Add player to matchmaking queue
      matchmakingQueue.push({
        socketId: socket.id,
        playerName: playerName,
      });

<<<<<<< HEAD
      socket.emit('queueStatus', { status: 'waiting', queueSize: matchmakingQueue.length });

      // Matchmaking logic: pairs of 2
      if (matchmakingQueue.length >= 2) {
        const player1 = matchmakingQueue.shift();
        const player2 = matchmakingQueue.shift();
=======
      socket.emit('queueStatus', {
        status: 'waiting',
        queueSize: matchmakingQueue.length,
      });

      // Matchmaking logic: pairs of 2
      if (matchmakingQueue.length >= 2) {
        const player1 = matchmakingQueue.shift()!;
        const player2 = matchmakingQueue.shift()!;
>>>>>>> 9f82b8c0e53b0f2014d47253831c17a089815697

        const roomId = `room_${player1.socketId}_${player2.socketId}`;

        // Create game room state
<<<<<<< HEAD
        const roomState = {
          roomId,
          players: {
            player1: { id: player1.socketId, name: player1.playerName, color: 'white' },
            player2: { id: player2.socketId, name: player2.playerName, color: 'black' },
=======
        const roomState: RoomState = {
          roomId,
          players: {
            player1: {
              id: player1.socketId,
              name: player1.playerName,
              color: 'white',
            },
            player2: {
              id: player2.socketId,
              name: player2.playerName,
              color: 'black',
            },
>>>>>>> 9f82b8c0e53b0f2014d47253831c17a089815697
          },
          currentTurn: player1.socketId,
          score: { white: 0, black: 0 },
          queenPocketed: false,
<<<<<<< HEAD
          boardState: null,
          createdAt: Date.now()
=======
          boardState: null, // React Native client will handle physics and send sync states
          createdAt: Date.now(),
>>>>>>> 9f82b8c0e53b0f2014d47253831c17a089815697
        };

        rooms.set(roomId, roomState);

        // Connect both sockets to the rooms
        const s1 = io.sockets.sockets.get(player1.socketId);
        const s2 = io.sockets.sockets.get(player2.socketId);

        if (s1) s1.join(roomId);
        if (s2) s2.join(roomId);

        // Notify both players that the game has started
        io.to(roomId).emit('gameStart', {
          roomId,
          players: roomState.players,
          currentTurn: roomState.currentTurn,
        });

<<<<<<< HEAD
        console.log(`Match found! Room ${roomId} created for ${player1.playerName} and ${player2.playerName}`);
=======
        console.log(
          `Match found! Room ${roomId} created for ${player1.playerName} and ${player2.playerName}`
        );
>>>>>>> 9f82b8c0e53b0f2014d47253831c17a089815697
      }
    });

    // --- LEAVE MATCHMAKING QUEUE ---
    socket.on('leaveQueue', () => {
      console.log(`User ${socket.id} left the matchmaking queue.`);
<<<<<<< HEAD
      matchmakingQueue = matchmakingQueue.filter(p => p.socketId !== socket.id);
=======
      matchmakingQueue = matchmakingQueue.filter(
        (p) => p.socketId !== socket.id
      );
>>>>>>> 9f82b8c0e53b0f2014d47253831c17a089815697
      socket.emit('queueStatus', { status: 'idle' });
    });

    // --- REALTIME GAMEPLAY SYNCS ---

    // Striker repositioning sync (before shooting)
<<<<<<< HEAD
    socket.on('aimStriker', (data) => {
      const { roomId, x, y } = data;
=======
    socket.on('aimStriker', (data: { roomId: string; x: number; y: number }) => {
      const { roomId, x, y } = data;
      // Broadcast aiming to opponent only, to save bandwidth
>>>>>>> 9f82b8c0e53b0f2014d47253831c17a089815697
      socket.to(roomId).emit('opponentAim', { x, y });
    });

    // Striker shot event (forces, vectors)
<<<<<<< HEAD
    socket.on('strike', (data) => {
      const { roomId, velocityX, velocityY, startX, startY } = data;
      console.log(`Striker fired in room ${roomId} by ${socket.id}`);
      socket.to(roomId).emit('opponentStrike', { velocityX, velocityY, startX, startY });
    });

    // Sync whole board state
    socket.on('syncBoardState', (data) => {
      const { roomId, pucks } = data;
=======
    socket.on(
      'strike',
      (data: {
        roomId: string;
        velocityX: number;
        velocityY: number;
        startX: number;
        startY: number;
      }) => {
        const { roomId, velocityX, velocityY, startX, startY } = data;
        console.log(`Striker fired in room ${roomId} by ${socket.id}`);
        // Broadcast physics parameters so the opponent runs the local simulation in sync
        socket
          .to(roomId)
          .emit('opponentStrike', { velocityX, velocityY, startX, startY });
      }
    );

    // Sync whole board state (puck coordinates) if synchronization drift occurs
    socket.on('syncBoardState', (data: { roomId: string; pucks: any }) => {
      const { roomId, pucks } = data;
      // Broadcast authoritative state or let other clients reconcile
>>>>>>> 9f82b8c0e53b0f2014d47253831c17a089815697
      socket.to(roomId).emit('boardStateSynced', { pucks });
    });

    // Puck pocketed event
<<<<<<< HEAD
    socket.on('pocketPuck', (data) => {
      const { roomId, puckId, puckColor } = data;
      console.log(`Puck pocketed in room ${roomId}: ${puckColor} puck (#${puckId})`);

      const room = rooms.get(roomId);
      if (room) {
        if (puckColor === 'white') room.score.white += 1;
        if (puckColor === 'black') room.score.black += 1;
        if (puckColor === 'queen') room.queenPocketed = true;

        io.to(roomId).emit('scoreUpdated', {
          score: room.score,
          queenPocketed: room.queenPocketed,
          lastPocketed: { puckId, puckColor, playerSocketId: socket.id }
        });
      }
    });

    // Player turn toggle
    socket.on('endTurn', (data) => {
      const { roomId, nextPlayerSocketId } = data;
      const room = rooms.get(roomId);
      if (room) {
        room.currentTurn = nextPlayerSocketId;
        io.to(roomId).emit('turnChanged', { currentTurn: room.currentTurn });
        console.log(`Turn changed in ${roomId} to ${nextPlayerSocketId}`);
      }
    });

    // Reset game state
    socket.on('resetGameRequest', (data) => {
=======
    socket.on(
      'pocketPuck',
      (data: { roomId: string; puckId: number; puckColor: string }) => {
        const { roomId, puckId, puckColor } = data;
        console.log(
          `Puck pocketed in room ${roomId}: ${puckColor} puck (#${puckId})`
        );

        const room = rooms.get(roomId);
        if (room) {
          if (puckColor === 'white') room.score.white += 1;
          if (puckColor === 'black') room.score.black += 1;
          if (puckColor === 'queen') room.queenPocketed = true;

          io.to(roomId).emit('scoreUpdated', {
            score: room.score,
            queenPocketed: room.queenPocketed,
            lastPocketed: { puckId, puckColor, playerSocketId: socket.id },
          });
        }
      }
    );

    // Player turn toggle
    socket.on(
      'endTurn',
      (data: { roomId: string; nextPlayerSocketId: string }) => {
        const { roomId, nextPlayerSocketId } = data;
        const room = rooms.get(roomId);
        if (room) {
          room.currentTurn = nextPlayerSocketId;
          io.to(roomId).emit('turnChanged', { currentTurn: room.currentTurn });
          console.log(`Turn changed in ${roomId} to ${nextPlayerSocketId}`);
        }
      }
    );

    // Reset game state
    socket.on('resetGameRequest', (data: { roomId: string }) => {
>>>>>>> 9f82b8c0e53b0f2014d47253831c17a089815697
      const { roomId } = data;
      io.to(roomId).emit('gameReset');
      console.log(`Reset requested for room ${roomId}`);
    });

<<<<<<< HEAD
    // --- GAME COMPLETION & ELO CALCULATOR ---
    socket.on('gameFinished', async (data) => {
      const { roomId, winnerSocketId, pucksPocketedP1 = 0, pucksPocketedP2 = 0 } = data;
      console.log(`Received gameFinished for room ${roomId}. Winner: ${winnerSocketId}`);

      const room = rooms.get(roomId);
      if (!room) return;

      const p1 = room.players.player1;
      const p2 = room.players.player2;

      try {
        // 1. Fetch current domain entities from MongoDB (to get actual Elo values)
        const user1 = await userRepository.findById(p1.id);
        const user2 = await userRepository.findById(p2.id);

        const elo1 = user1 ? user1.eloRating : 1200;
        const elo2 = user2 ? user2.eloRating : 1200;

        // 2. Perform the Elo calculations & persist via the Use Case (Dependency Injection)
        const updatedUser1 = await updateUserStats.execute(p1.id, {
          isWin: winnerSocketId === p1.id,
          pucksPocketed: pucksPocketedP1,
          opponentElo: elo2
        });

        const updatedUser2 = await updateUserStats.execute(p2.id, {
          isWin: winnerSocketId === p2.id,
          pucksPocketed: pucksPocketedP2,
          opponentElo: elo1
        });

        console.log(`🏆 Match stats saved for room ${roomId}:`);
        console.log(`   - ${p1.name} (P1): ELO ${elo1} -> ${updatedUser1.eloRating} (${winnerSocketId === p1.id ? 'WON' : 'LOST'})`);
        console.log(`   - ${p2.name} (P2): ELO ${elo2} -> ${updatedUser2.eloRating} (${winnerSocketId === p2.id ? 'WON' : 'LOST'})`);

        // 3. Acknowledge game finish to clients with updated ELO rating values
        io.to(roomId).emit('gameFinishedAck', {
          winnerSocketId,
          p1Stats: {
            elo: updatedUser1.eloRating,
            winCount: updatedUser1.gamesWon,
            isWin: winnerSocketId === p1.id
          },
          p2Stats: {
            elo: updatedUser2.eloRating,
            winCount: updatedUser2.gamesWon,
            isWin: winnerSocketId === p2.id
          }
        });

        // 4. Destroy active room state
        rooms.delete(roomId);
      } catch (error: any) {
        console.error(`Error handling gameFinished Elo updates: ${error.message}`);
      }
=======
    // Real-time Chat and Emoji Reaction broadcasts
    socket.on('chatMessage', (data: { roomId: string; message: string; type: 'emoji' | 'text' }) => {
      const { roomId, message, type } = data;
      socket.to(roomId).emit('opponentChatMessage', { message, type, senderId: socket.id });
>>>>>>> 9f82b8c0e53b0f2014d47253831c17a089815697
    });

    // --- DISCONNECTS ---
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
<<<<<<< HEAD
      
      // Remove from matchmaking queue if present
      matchmakingQueue = matchmakingQueue.filter(p => p.socketId !== socket.id);

      // Check all active rooms
      for (const [roomId, room] of Array.from(rooms.entries())) {
        if (room.players.player1.id === socket.id || room.players.player2.id === socket.id) {
          const opponentId = room.players.player1.id === socket.id 
            ? room.players.player2.id 
            : room.players.player1.id;

          // Notify the remaining opponent
          io.to(opponentId).emit('opponentDisconnected', {
            message: 'Your opponent has left the match. You win!'
=======

      // Remove from matchmaking queue if present
      matchmakingQueue = matchmakingQueue.filter(
        (p) => p.socketId !== socket.id
      );

      // Check all active rooms
      for (const [roomId, room] of rooms.entries()) {
        if (
          room.players.player1.id === socket.id ||
          room.players.player2.id === socket.id
        ) {
          const opponentId =
            room.players.player1.id === socket.id
              ? room.players.player2.id
              : room.players.player1.id;

          // Notify the remaining opponent
          io.to(opponentId).emit('opponentDisconnected', {
            message: 'Your opponent has left the match. You win!',
>>>>>>> 9f82b8c0e53b0f2014d47253831c17a089815697
          });

          // Clean up room
          rooms.delete(roomId);
          console.log(`Room ${roomId} destroyed as player disconnected.`);
        }
      }
    });
  });
<<<<<<< HEAD
};
=======
}
>>>>>>> 9f82b8c0e53b0f2014d47253831c17a089815697
