import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider, useSocket } from './contexts/SocketContext';
import { Login } from './components/Login';
import { Lobby } from './components/Lobby';
import { GameRoom } from './components/GameRoom';
import { Swords } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { roomId } = useSocket();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '16px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid rgba(170, 59, 255, 0.2)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontFamily: 'var(--mono)' }}>
          Warming up motors...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {/* Decorative stars space background */}
      <div className="space-bg">
        <div className="star" style={{ top: '20%', left: '10%', width: '2px', height: '2px' }} />
        <div className="star" style={{ top: '30%', left: '90%', width: '1px', height: '1px' }} />
        <div className="star" style={{ top: '65%', left: '40%', width: '3px', height: '3px', animationDelay: '1s' }} />
        <div className="star" style={{ top: '80%', left: '80%', width: '2px', height: '2px', animationDelay: '2s' }} />
      </div>

      {/* Premium Header */}
      <header className="glass-panel" style={{
        margin: '16px 24px',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px var(--primary-glow)'
          }}>
            <Swords size={18} color="#fff" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '0.5px' }}>
            QUEEN<span style={{ color: 'var(--secondary)' }}>SHOT</span>
          </span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Beta v1.0.4 • Sandbox Sandbox
        </div>
      </header>

      {/* Screen Router */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {!isAuthenticated ? (
          <Login />
        ) : roomId ? (
          <GameRoom />
        ) : (
          <Lobby />
        )}
      </main>

      {/* Premium Footer */}
      <footer style={{
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.03)',
        marginTop: 'auto'
      }}>
        QueenShot Carrom Physics Board Arena &copy; 2026. Made with passion for high fidelity web gaming.
      </footer>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
