import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { CarromCanvas } from './CarromCanvas';
import { MessageSquare, Crown, AlertTriangle, RefreshCw } from 'lucide-react';

interface FloatingReaction {
  id: string;
  senderId: string;
  text: string;
}

export const GameRoom: React.FC = () => {
  const { updateStats } = useAuth();
  const {
    socket,
    roomId,
    players,
    currentTurn,
    score,
    queenPocketed,
    opponentDisconnected,
    resetGameRequest,
    exitGame
  } = useSocket();

  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [showWinModal, setShowWinModal] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState('');
  const [isWinner, setIsWinner] = useState(false);
  const [hasStatsUpdated, setHasStatsUpdated] = useState(false);

  // Quick reaction trigger helper
  const sendReaction = (message: string, type: 'emoji' | 'text') => {
    if (!socket || !roomId) return;
    
    // Play local floating effect
    const id = Math.random().toString();
    setReactions(prev => [...prev, { id, senderId: socket.id || 'me', text: message }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 1800);

    // Sync to opponent
    socket.emit('chatMessage', { roomId, message, type });
  };

  // Listen to incoming chat/emojis from opponent
  useEffect(() => {
    if (!socket) return;

    socket.on('opponentChatMessage', (data: { message: string; type: 'emoji' | 'text'; senderId: string }) => {
      const id = Math.random().toString();
      setReactions(prev => [...prev, { id, senderId: data.senderId, text: data.message }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 1800);
    });

    return () => {
      socket.off('opponentChatMessage');
    };
  }, [socket]);

  // Monitor score to declare game over
  useEffect(() => {
    if (!players || !socket) return;
    
    const maxPucks = 9;
    let gameOver = false;
    let winningColor: 'white' | 'black' | null = null;

    if (score.white >= maxPucks) {
      gameOver = true;
      winningColor = 'white';
    } else if (score.black >= maxPucks) {
      gameOver = true;
      winningColor = 'black';
    }

    if (gameOver && winningColor) {
      const myColor = players.player1.id === socket.id ? 'white' : 'black';
      const playerWin = myColor === winningColor;
      
      setIsWinner(playerWin);
      setWinnerMessage(playerWin ? 'VICTORY IN THE ARENA!' : 'DEFEAT! BETTER LUCK NEXT MATCH');
      setShowWinModal(true);

      // Save stats to AuthContext
      if (!hasStatsUpdated) {
        updateStats(playerWin);
        setHasStatsUpdated(true);
      }
    }
  }, [score, players, socket, hasStatsUpdated]);

  // Reset local state if game resets
  useEffect(() => {
    setShowWinModal(false);
    setHasStatsUpdated(false);
  }, [roomId]);

  if (!players || !socket) return null;

  // Identify roles
  const p1 = players.player1;
  const p2 = players.player2;
  const isP1 = socket.id === p1.id;
  
  const myDetails = isP1 ? p1 : p2;
  const oppDetails = isP1 ? p2 : p1;

  const myTurn = currentTurn === socket.id;
  const oppTurn = currentTurn === oppDetails.id;

  const reactionEmojis = ['🔥', '😂', '😮', '👑', '👍', '😢'];
  const quickChats = ['Nice shot!', 'Calculated!', 'Close one!', 'Oops!', 'Good Game!'];

  return (
    <div className="container" style={{ maxWidth: '1100px', padding: '24px' }}>
      
      {/* Stars space bg */}
      <div className="space-bg">
        <div className="star" style={{ top: '8%', left: '15%', width: '2px', height: '2px' }} />
        <div className="star" style={{ top: '45%', left: '85%', width: '3px', height: '3px', animationDelay: '1.2s' }} />
        <div className="star" style={{ top: '75%', left: '20%', width: '2px', height: '2px', animationDelay: '2.5s' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '32px' }}>
        
        {/* Playfield Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Opponent Card Header */}
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '600px',
            padding: '12px 20px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: oppTurn ? '1.5px solid rgba(0, 240, 255, 0.4)' : '1px solid var(--border)',
            boxShadow: oppTurn ? '0 0 15px rgba(0, 240, 255, 0.15)' : 'none',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  border: `2px solid ${oppDetails.color === 'white' ? '#22d3ee' : '#a78bfa'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  color: '#fff'
                }}>
                  {oppDetails.name[0].toUpperCase()}
                </div>
                {oppTurn && (
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#00f0ff',
                    border: '2px solid #000',
                    animation: 'pulse 1.2s infinite'
                  }} />
                )}
              </div>
              <div>
                <h4 style={{ margin: '0', fontSize: '15px', fontWeight: '700' }}>{oppDetails.name}</h4>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: oppDetails.color === 'white' ? '#fff' : '#000',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'inline-block'
                  }} />
                  Playing as {oppDetails.color.toUpperCase()} Pucks
                </div>
              </div>
            </div>

            {/* Score HUD */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Pocketed</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: oppDetails.color === 'white' ? '#fff' : 'var(--primary)' }}>
                {oppDetails.color === 'white' ? score.white : score.black} / 9
              </div>
            </div>

            {/* Floating reaction bubble placeholder */}
            {reactions.filter(r => r.senderId === oppDetails.id).map(r => (
              <div key={r.id} className="emoji-bubble" style={{ top: '-10px', left: '44px' }}>
                {r.text}
              </div>
            ))}
          </div>

          {/* Interactive Carrom Board Canvas */}
          <CarromCanvas />

          {/* Local User Card Header */}
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '600px',
            padding: '12px 20px',
            marginTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: myTurn ? '1.5px solid rgba(170, 59, 255, 0.4)' : '1px solid var(--border)',
            boxShadow: myTurn ? '0 0 15px rgba(170, 59, 255, 0.15)' : 'none',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  border: `2px solid ${myDetails.color === 'white' ? '#22d3ee' : '#a78bfa'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  color: '#fff'
                }}>
                  {myDetails.name[0].toUpperCase()}
                </div>
                {myTurn && (
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#aa3bff',
                    border: '2px solid #000',
                    animation: 'pulse 1.2s infinite'
                  }} />
                )}
              </div>
              <div>
                <h4 style={{ margin: '0', fontSize: '15px', fontWeight: '700' }}>{myDetails.name} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(You)</span></h4>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: myDetails.color === 'white' ? '#fff' : '#000',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'inline-block'
                  }} />
                  Playing as {myDetails.color.toUpperCase()} Pucks
                </div>
              </div>
            </div>

            {/* Score HUD */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Pocketed</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: myDetails.color === 'white' ? '#fff' : 'var(--primary)' }}>
                {myDetails.color === 'white' ? score.white : score.black} / 9
              </div>
            </div>

            {/* Floating reaction bubble placeholder */}
            {reactions.filter(r => r.senderId === (socket.id || 'me')).map(r => (
              <div key={r.id} className="emoji-bubble" style={{ top: '-10px', left: '44px' }}>
                {r.text}
              </div>
            ))}
          </div>

        </div>

        {/* Sidebar Controls and Emote Wheel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Dashboard Info Panel */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              ARENA GAMEPLAY
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Queen Pucked:</span>
                <span style={{ fontWeight: '700', color: queenPocketed ? '#ef4444' : 'var(--text-muted)' }}>
                  {queenPocketed ? 'YES' : 'NO'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Score Weight:</span>
                <span style={{ fontWeight: '700' }}>1x Ratio</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Board state:</span>
                <span style={{ color: '#10b981', fontWeight: '600' }}>Synchronized</span>
              </div>
            </div>

            <button onClick={exitGame} className="btn-secondary" style={{
              width: '100%',
              marginTop: '20px',
              padding: '10px',
              fontSize: '13px',
              borderRadius: '8px',
              color: '#ef4444',
              borderColor: 'rgba(239, 68, 68, 0.2)'
            }}>
              Forfeit & Exit
            </button>
          </div>

          {/* Emote Reaction Panel */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={16} /> EMOTE HUB
            </h3>

            {/* Emoji Wheel */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {reactionEmojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji, 'emoji')}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    fontSize: '24px',
                    padding: '8px 0',
                    borderRadius: '10px',
                    transition: 'all 0.2s'
                  }}
                  className="btn-secondary"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Quick text chat messages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Quick Chats</div>
              {quickChats.map(txt => (
                <button
                  key={txt}
                  onClick={() => sendReaction(txt, 'text')}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                    padding: '6px 12px',
                    textAlign: 'left',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)'
                  }}
                  className="btn-secondary"
                >
                  {txt}
                </button>
              ))}
            </div>

          </div>

        </div>

      </div>

      {/* Opponent Disconnected Modal */}
      {opponentDisconnected && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel" style={{ padding: '36px', maxWidth: '400px', width: '100%', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              margin: '0 auto 20px auto'
            }}>
              <Crown size={32} />
            </div>
            
            <h2 className="glow-text" style={{ fontSize: '24px', color: '#10b981', marginBottom: '12px', fontWeight: '800' }}>
              OPPONENT DISCONNECTED
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
              Your opponent has left the match. You have been declared the default winner of this arena!
            </p>

            <button onClick={exitGame} className="btn-primary" style={{ width: '100%' }}>
              Exit Game
            </button>
          </div>
        </div>
      )}

      {/* Game Over Victory/Defeat Modal */}
      {showWinModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.85)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="glass-panel" style={{
            padding: '40px',
            maxWidth: '450px',
            width: '100%',
            textAlign: 'center',
            border: isWinner ? '1.5px solid rgba(16, 185, 129, 0.5)' : '1.5px solid rgba(239, 68, 68, 0.5)',
            boxShadow: isWinner ? '0 0 30px rgba(16, 185, 129, 0.2)' : '0 0 30px rgba(239, 68, 68, 0.2)'
          }}>
            
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: isWinner ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isWinner ? '#10b981' : '#ef4444',
              margin: '0 auto 24px auto',
              boxShadow: isWinner ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none'
            }}>
              {isWinner ? <Crown size={36} /> : <AlertTriangle size={36} />}
            </div>

            <h1 className="glow-text" style={{ fontSize: '28px', color: isWinner ? '#10b981' : '#ef4444', marginBottom: '16px', fontWeight: '800' }}>
              {winnerMessage}
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
              {isWinner
                ? 'Excellent shots! You cleared the board and pocketed all 9 pucks successfully.'
                : 'Your opponent cleared their pucks first. Reorganize your aim and request a rematch!'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={resetGameRequest} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <RefreshCw size={16} /> Request Rematch
              </button>
              <button onClick={exitGame} className="btn-secondary">
                Return to Lobby
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

    </div>
  );
};
