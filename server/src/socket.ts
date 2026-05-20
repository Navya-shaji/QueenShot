import { Server, Socket } from 'socket.io';

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
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // --- MATCHMAKING EVENT ---
    socket.on('joinQueue', (data?: { playerName?: string }) => {
      const playerName = data?.playerName || 'Player';
      console.log(`${playerName} (${socket.id}) joined matchmaking queue.`);

      // Check if user is already in the queue
      if (matchmakingQueue.some((p) => p.socketId === socket.id)) {
        return;
      }

      // Add player to matchmaking queue
      matchmakingQueue.push({
        socketId: socket.id,
        playerName: playerName,
      });

      socket.emit('queueStatus', {
        status: 'waiting',
        queueSize: matchmakingQueue.length,
      });

      // Matchmaking logic: pairs of 2
      if (matchmakingQueue.length >= 2) {
        const player1 = matchmakingQueue.shift()!;
        const player2 = matchmakingQueue.shift()!;

        const roomId = `room_${player1.socketId}_${player2.socketId}`;

        // Create game room state
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
          },
          currentTurn: player1.socketId,
          score: { white: 0, black: 0 },
          queenPocketed: false,
          boardState: null, // React Native client will handle physics and send sync states
          createdAt: Date.now(),
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

        console.log(
          `Match found! Room ${roomId} created for ${player1.playerName} and ${player2.playerName}`
        );
      }
    });

    // --- LEAVE MATCHMAKING QUEUE ---
    socket.on('leaveQueue', () => {
      console.log(`User ${socket.id} left the matchmaking queue.`);
      matchmakingQueue = matchmakingQueue.filter(
        (p) => p.socketId !== socket.id
      );
      socket.emit('queueStatus', { status: 'idle' });
    });

    // --- REALTIME GAMEPLAY SYNCS ---

    // Striker repositioning sync (before shooting)
    socket.on('aimStriker', (data: { roomId: string; x: number; y: number }) => {
      const { roomId, x, y } = data;
      // Broadcast aiming to opponent only, to save bandwidth
      socket.to(roomId).emit('opponentAim', { x, y });
    });

    // Striker shot event (forces, vectors)
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
      socket.to(roomId).emit('boardStateSynced', { pucks });
    });

    // Puck pocketed event
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
      const { roomId } = data;
      io.to(roomId).emit('gameReset');
      console.log(`Reset requested for room ${roomId}`);
    });

    // Real-time Chat and Emoji Reaction broadcasts
    socket.on('chatMessage', (data: { roomId: string; message: string; type: 'emoji' | 'text' }) => {
      const { roomId, message, type } = data;
      socket.to(roomId).emit('opponentChatMessage', { message, type, senderId: socket.id });
    });

    // --- DISCONNECTS ---
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

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
          });

          // Clean up room
          rooms.delete(roomId);
          console.log(`Room ${roomId} destroyed as player disconnected.`);
        }
      }
    });
  });
}
