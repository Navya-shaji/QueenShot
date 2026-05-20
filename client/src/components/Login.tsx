import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginWithGoogleToken } = useAuth();
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const CLIENT_ID = '333665382648-d5gr0dqqhmbfsmeleoherv9jgict17nv.apps.googleusercontent.com';

  // Load Google Identity Services script
  useEffect(() => {
    // Check if script is already present
    if ((window as any).google?.accounts?.id) {
      setGoogleScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleScriptLoaded(true);
    };
    script.onerror = () => {
      console.warn('Google GSI script failed to load. Using Dev Bypass fallback.');
    };
    document.body.appendChild(script);

    return () => {
      // Keep script loaded for simplicity, no cleanup needed
    };
  }, []);

  // Initialize Google Sign-In button
  useEffect(() => {
    if (!googleScriptLoaded || !googleBtnRef.current) return;

    try {
      const { google } = window as any;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response: any) => {
            setAuthError(null);
            try {
              await loginWithGoogleToken(response.credential);
            } catch (err: any) {
              setAuthError(err.message || 'Google Auth Verification failed in backend.');
            }
          },
          auto_select: false,
        });

        google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_blue',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 280,
        });
      }
    } catch (e) {
      console.error('Error rendering Google GSI button:', e);
    }
  }, [googleScriptLoaded]);

  return (
    <div className="container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '90vh' }}>
      
      {/* Decorative stars */}
      <div className="space-bg">
        <div className="star" style={{ top: '15%', left: '20%', width: '3px', height: '3px' }} />
        <div className="star" style={{ top: '25%', left: '80%', width: '2px', height: '2px' }} />
        <div className="star" style={{ top: '70%', left: '15%', width: '4px', height: '4px', animationDelay: '1.5s' }} />
        <div className="star" style={{ top: '80%', left: '75%', width: '2px', height: '2px', animationDelay: '3s' }} />
        <div className="star" style={{ top: '45%', left: '85%', width: '3px', height: '3px', animationDelay: '0.8s' }} />
      </div>

      <div className="glass-panel animated-float" style={{ padding: '48px', maxWidth: '450px', width: '100%', textAlign: 'center' }}>
        
        {/* Title Logo */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            boxShadow: '0 8px 30px var(--primary-glow)',
            marginBottom: '16px'
          }}>
            <Sparkles size={40} color="#fff" />
          </div>
          <h1 className="glow-text" style={{ fontSize: '42px', margin: '0', fontWeight: '800', letterSpacing: '1px' }}>
            QUEEN<span style={{ color: 'var(--secondary)' }}>SHOT</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '15px' }}>
            Multiplayer Carrom Physics Arena
          </p>
        </div>

        {authError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            padding: '12px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {authError}
          </div>
        )}

        {/* Google Authentication Method */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600' }}>
            Secure Authentication
          </p>
          
          <div ref={googleBtnRef} style={{ minHeight: '44px', display: 'flex', justifyContent: 'center' }}>
            {!googleScriptLoaded && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>
                Connecting Google Identity...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
