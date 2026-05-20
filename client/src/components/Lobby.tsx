import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { LogOut, Trophy, Target, Award, Users, Swords, Loader2, Wifi, WifiOff } from 'lucide-react';

export const Lobby: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected, matchmakingStatus, queueSize, joinQueue, leaveQueue } = useSocket();
  const [searchTime, setSearchTime] = useState(0);

  useEffect(() => {
    let timer: any;
    if (matchmakingStatus === 'waiting') {
      setSearchTime(0);
      timer = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    } else {
      setSearchTime(0);
    }
    return () => clearInterval(timer);
  }, [matchmakingStatus]);

  if (!user) return null;

  // Derive stats
  const gamesPlayed = user.gamesPlayed || 0;
  const wins = user.wins || 0;
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;
  const xp = user.xp || 0;
  const currentLevel = Math.floor(xp / 100) + 1;
  const xpInCurrentLevel = xp % 100;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="container" style={{ maxWidth: '900px', padding: '32px 24px', justifyContent: 'center' }}>
      
      {/* Space stars */}
      <div className="space-bg">
        <div className="star" style={{ top: '10%', left: '30%', width: '2px', height: '2px' }} />
        <div className="star" style={{ top: '40%', left: '70%', width: '3px', height: '3px', animationDelay: '1s' }} />
        <div className="star" style={{ top: '85%', left: '25%', width: '2px', height: '2px', animationDelay: '2s' }} />
        <div className="star" style={{ top: '60%', left: '85%', width: '3px', height: '3px', animationDelay: '0.5s' }} />
      </div>

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#10b981' : '#ef4444',
            boxShadow: isConnected ? '0 0 10px #10b981' : '0 0 10px #ef4444',
            animation: 'pulse 1.5s infinite ease-in-out'
          }} />
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isConnected ? (
              <>
                <Wifi size={14} color="#10b981" /> Connected to Game Server
              </>
            ) : (
              <>
                <WifiOff size={14} color="#ef4444" /> Disconnected
              </>
            )}
          </span>
        </div>

        <button onClick={logout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px', borderRadius: '8px' }}>
          <LogOut size={16} /> Exit Arena
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: matchmakingStatus === 'waiting' ? '1fr' : '1fr 1.2fr', gap: '32px', transition: 'all 0.5s ease' }}>
        
        {/* Profile Stats Card (Shown when not waiting, or side card if waiting) */}
        {matchmakingStatus !== 'waiting' && (
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            
            {/* User Avatar */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <img
                src={user.picture}
                alt={user.name}
                style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  border: '3px solid var(--primary)',
                  boxShadow: '0 0 20px var(--primary-glow)',
                  background: 'rgba(0,0,0,0.2)'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '-5px',
                right: '-5px',
                background: 'linear-gradient(135deg, var(--primary) 0%, #8b1fff 100%)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                LVL {currentLevel}
              </div>
            </div>

            <h2 className="glow-text" style={{ fontSize: '26px', margin: '0 0 4px 0', fontWeight: '700' }}>{user.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--mono)', marginBottom: '24px' }}>{user.email}</p>

            {/* XP progress */}
            <div style={{ width: '100%', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                <span>XP PROGRESS</span>
                <span>{xpInCurrentLevel} / 100</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: `${xpInCurrentLevel}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Micro Dashboard Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', width: '100%' }}>
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <Target size={18} color="var(--secondary)" style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{gamesPlayed}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Played</div>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <Trophy size={18} color="#eab308" style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{wins}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Wins</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <Award size={18} color="#10b981" style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{winRate}%</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Win Rate</div>
              </div>
            </div>

          </div>
        )}

        {/* Action / Search Lobby Panel */}
        <div className="glass-panel" style={{
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          gridColumn: matchmakingStatus === 'waiting' ? '1 / span 2' : 'auto',
          minHeight: '400px'
        }}>

          {matchmakingStatus === 'idle' ? (
            <>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '20px',
                background: 'rgba(0, 240, 255, 0.08)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                color: 'var(--secondary)'
              }}>
                <Swords size={36} />
              </div>

              <h2 className="glow-text-cyan" style={{ fontSize: '32px', marginBottom: '8px', fontWeight: '800' }}>
                MATCHMAKING ARENA
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '360px', marginBottom: '36px', fontSize: '15px' }}>
                Seek multiplayer competition. Enter the global queue to match with live opponents in real-time.
              </p>

              <button
                onClick={joinQueue}
                disabled={!isConnected}
                className="btn-primary"
                style={{
                  width: '100%',
                  maxWidth: '280px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '16px 28px',
                  fontSize: '18px',
                  borderRadius: '16px'
                }}
              >
                <Swords size={20} /> Find Match
              </button>
            </>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              {/* Pulsating Queue Animation */}
              <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
                
                {/* Outward rings */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  border: '2px dashed var(--primary-glow)',
                  borderRadius: '50%',
                  animation: 'spin 20s linear infinite'
                }} />
                
                <div style={{
                  position: 'absolute',
                  width: '80%',
                  height: '80%',
                  border: '2px solid var(--secondary-glow)',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite ease-in-out'
                }} />

                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 30px var(--primary)',
                  zIndex: 2,
                  color: '#fff'
                }}>
                  <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 2s linear infinite' }} />
                </div>
              </div>

              <h2 className="glow-text" style={{ fontSize: '28px', marginBottom: '8px', fontWeight: '800' }}>
                MATCHMAKING ACTIVE
              </h2>
              
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: '36px',
                fontWeight: '700',
                color: 'var(--secondary)',
                marginBottom: '16px',
                textShadow: '0 0 10px var(--secondary-glow)'
              }}>
                {formatTime(searchTime)}
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} /> Seeking opponent in global pool...
              </p>

              {queueSize > 0 && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  marginBottom: '36px',
                  fontWeight: '500'
                }}>
                  Players in Lobby Queue: <span style={{ color: 'var(--secondary)', fontWeight: '700' }}>{queueSize}</span>
                </div>
              )}

              <button
                onClick={leaveQueue}
                className="btn-secondary"
                style={{
                  width: '100%',
                  maxWidth: '240px',
                  padding: '12px 24px',
                  fontSize: '15px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.05)',
                  color: '#ef4444',
                  borderRadius: '12px'
                }}
              >
                Cancel Queue
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Basic Keyframe definitions in JS for queue */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 20px var(--secondary-glow); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};
