import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface PlayerDetails {
  id: string;
  name: string;
  color: 'white' | 'black';
}

interface PlayersState {
  player1: PlayerDetails;
  player2: PlayerDetails;
}

interface ScoreState {
  white: number;
  black: number;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  matchmakingStatus: 'idle' | 'waiting' | 'matched';
  queueSize: number;
  roomId: string | null;
  players: PlayersState | null;
  currentTurn: string | null; // socketId of the active player
  score: ScoreState;
  queenPocketed: boolean;
  opponentDisconnected: boolean;
  gameResetTrigger: number;
  
  joinQueue: () => void;
  leaveQueue: () => void;
  aimStriker: (x: number, y: number) => void;
  strike: (vx: number, vy: number, sx: number, sy: number) => void;
  pocketPuck: (puckId: number, puckColor: string) => void;
  endTurn: (nextPlayerSocketId: string) => void;
  resetGameRequest: () => void;
  exitGame: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [matchmakingStatus, setMatchmakingStatus] = useState<'idle' | 'waiting' | 'matched'>('idle');
  const [queueSize, setQueueSize] = useState(0);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayersState | null>(null);
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);
  const [score, setScore] = useState<ScoreState>({ white: 0, black: 0 });
  const [queenPocketed, setQueenPocketed] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [gameResetTrigger, setGameResetTrigger] = useState(0);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to server (Port 4000)
    const newSocket = io('http://localhost:4000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to gameplay socket server as ID:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Matchmaking events
    newSocket.on('queueStatus', (data: { status: 'waiting' | 'idle'; queueSize: number }) => {
      if (data.status === 'waiting') {
        setMatchmakingStatus('waiting');
      } else {
        setMatchmakingStatus('idle');
      }
      setQueueSize(data.queueSize);
    });

    newSocket.on('gameStart', (data: { roomId: string; players: PlayersState; currentTurn: string }) => {
      setRoomId(data.roomId);
      setPlayers(data.players);
      setCurrentTurn(data.currentTurn);
      setMatchmakingStatus('matched');
      setScore({ white: 0, black: 0 });
      setQueenPocketed(false);
      setOpponentDisconnected(false);
    });

    // Gameplay sync events
    newSocket.on('scoreUpdated', (data: { score: ScoreState; queenPocketed: boolean }) => {
      setScore(data.score);
      setQueenPocketed(data.queenPocketed);
    });

    newSocket.on('turnChanged', (data: { currentTurn: string }) => {
      setCurrentTurn(data.currentTurn);
    });

    newSocket.on('gameReset', () => {
      setScore({ white: 0, black: 0 });
      setQueenPocketed(false);
      setGameResetTrigger(prev => prev + 1);
    });

    newSocket.on('opponentDisconnected', () => {
      setOpponentDisconnected(true);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, user]);

  const joinQueue = () => {
    if (socketRef.current && user) {
      socketRef.current.emit('joinQueue', { playerName: user.name });
    }
  };

  const leaveQueue = () => {
    if (socketRef.current) {
      socketRef.current.emit('leaveQueue');
    }
  };

  const aimStriker = (x: number, y: number) => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('aimStriker', { roomId, x, y });
    }
  };

  const strike = (vx: number, vy: number, sx: number, sy: number) => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('strike', { roomId, velocityX: vx, velocityY: vy, startX: sx, startY: sy });
    }
  };

  const pocketPuck = (puckId: number, puckColor: string) => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('pocketPuck', { roomId, puckId, puckColor });
    }
  };

  const endTurn = (nextPlayerSocketId: string) => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('endTurn', { roomId, nextPlayerSocketId });
    }
  };

  const resetGameRequest = () => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('resetGameRequest', { roomId });
    }
  };

  const exitGame = () => {
    setRoomId(null);
    setPlayers(null);
    setCurrentTurn(null);
    setMatchmakingStatus('idle');
    setScore({ white: 0, black: 0 });
    setQueenPocketed(false);
    setOpponentDisconnected(false);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        matchmakingStatus,
        queueSize,
        roomId,
        players,
        currentTurn,
        score,
        queenPocketed,
        opponentDisconnected,
        gameResetTrigger,
        
        joinQueue,
        leaveQueue,
        aimStriker,
        strike,
        pocketPuck,
        endTurn,
        resetGameRequest,
        exitGame,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
