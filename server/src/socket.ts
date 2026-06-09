import { Server, Socket } from 'socket.io';
import { userRepository } from './infrastructure/routes/userRoutes';
import { UpdateUserStats } from './use_cases/UpdateUserStats';

// Instantiate stats updater use case injecting the shared repository instance
const updateUserStats = new UpdateUserStats(userRepository);

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

      matchmakingQueue.push({ socketId: socket.id, playerName });

      socket.emit('queueStatus', {
        status: 'waiting',
        queueSize: matchmakingQueue.length,
      });

      // Matchmaking logic: pairs of 2
      if (matchmakingQueue.length >= 2) {
        const player1 = matchmakingQueue.shift()!;
        const player2 = matchmakingQueue.shift()!;

        const roomId = `room_${player1.socketId}_${player2.socketId}`;

        const roomState: RoomState = {
          roomId,
          players: {
            player1: { id: player1.socketId, name: player1.playerName, color: 'white' },
            player2: { id: player2.socketId, name: player2.playerName, color: 'black' },
          },
          currentTurn: player1.socketId,
          score: { white: 0, black: 0 },
          queenPocketed: false,
          boardState: null,
          createdAt: Date.now(),
        };

        rooms.set(roomId, roomState);

        const s1 = io.sockets.sockets.get(player1.socketId);
        const s2 = io.sockets.sockets.get(player2.socketId);

        if (s1) s1.join(roomId);
        if (s2) s2.join(roomId);

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
      matchmakingQueue = matchmakingQueue.filter((p) => p.socketId !== socket.id);
      socket.emit('queueStatus', { status: 'idle' });
    });

    // --- REALTIME GAMEPLAY SYNCS ---

    socket.on('aimStriker', (data: { roomId: string; x: number; y: number }) => {
      const { roomId, x, y } = data;
      socket.to(roomId).emit('opponentAim', { x, y });
    });

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
        socket.to(roomId).emit('opponentStrike', { velocityX, velocityY, startX, startY });
      }
    );

    socket.on('syncBoardState', (data: { roomId: string; pucks: any }) => {
      const { roomId, pucks } = data;
      socket.to(roomId).emit('boardStateSynced', { pucks });
    });

    socket.on(
      'pocketPuck',
      (data: { roomId: string; puckId: number; puckColor: string }) => {
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
            lastPocketed: { puckId, puckColor, playerSocketId: socket.id },
          });
        }
      }
    );

    socket.on('endTurn', (data: { roomId: string; nextPlayerSocketId: string }) => {
      const { roomId, nextPlayerSocketId } = data;
      const room = rooms.get(roomId);
      if (room) {
        room.currentTurn = nextPlayerSocketId;
        io.to(roomId).emit('turnChanged', { currentTurn: room.currentTurn });
        console.log(`Turn changed in ${roomId} to ${nextPlayerSocketId}`);
      }
    });

    socket.on('resetGameRequest', (data: { roomId: string }) => {
      const { roomId } = data;
      io.to(roomId).emit('gameReset');
      console.log(`Reset requested for room ${roomId}`);
    });

    // --- GAME COMPLETION & ELO CALCULATOR ---
    socket.on('gameFinished', async (data) => {
      const { roomId, winnerSocketId, pucksPocketedP1 = 0, pucksPocketedP2 = 0 } = data;
      console.log(`Received gameFinished for room ${roomId}. Winner: ${winnerSocketId}`);

      const room = rooms.get(roomId);
      if (!room) return;

      const p1 = room.players.player1;
      const p2 = room.players.player2;

      try {
        const user1 = await userRepository.findById(p1.id);
        const user2 = await userRepository.findById(p2.id);

        const elo1 = user1 ? user1.eloRating : 1200;
        const elo2 = user2 ? user2.eloRating : 1200;

        const updatedUser1 = await updateUserStats.execute(p1.id, {
          isWin: winnerSocketId === p1.id,
          pucksPocketed: pucksPocketedP1,
          opponentElo: elo2,
        });

        const updatedUser2 = await updateUserStats.execute(p2.id, {
          isWin: winnerSocketId === p2.id,
          pucksPocketed: pucksPocketedP2,
          opponentElo: elo1,
        });

        console.log(`🏆 Match stats saved for room ${roomId}:`);
        console.log(`   - ${p1.name} (P1): ELO ${elo1} -> ${updatedUser1.eloRating}`);
        console.log(`   - ${p2.name} (P2): ELO ${elo2} -> ${updatedUser2.eloRating}`);

        io.to(roomId).emit('gameFinishedAck', {
          winnerSocketId,
          p1Stats: {
            elo: updatedUser1.eloRating,
            winCount: updatedUser1.gamesWon,
            isWin: winnerSocketId === p1.id,
          },
          p2Stats: {
            elo: updatedUser2.eloRating,
            winCount: updatedUser2.gamesWon,
            isWin: winnerSocketId === p2.id,
          },
        });

        rooms.delete(roomId);
      } catch (error: any) {
        console.error(`Error handling gameFinished Elo updates: ${error.message}`);
      }
    });

    // Real-time chat and emoji reactions
    socket.on('chatMessage', (data: { roomId: string; message: string; type: 'emoji' | 'text' }) => {
      const { roomId, message, type } = data;
      socket.to(roomId).emit('opponentChatMessage', { message, type, senderId: socket.id });
    });

    // --- DISCONNECTS ---
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      matchmakingQueue = matchmakingQueue.filter((p) => p.socketId !== socket.id);

      for (const [roomId, room] of rooms.entries()) {
        if (
          room.players.player1.id === socket.id ||
          room.players.player2.id === socket.id
        ) {
          const opponentId =
            room.players.player1.id === socket.id
              ? room.players.player2.id
              : room.players.player1.id;

          io.to(opponentId).emit('opponentDisconnected', {
            message: 'Your opponent has left the match. You win!',
          });

          rooms.delete(roomId);
          console.log(`Room ${roomId} destroyed as player disconnected.`);
        }
      }
    });
  });
}
