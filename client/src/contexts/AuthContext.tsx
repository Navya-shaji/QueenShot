import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
  role: string;
  xp?: number;
  gamesPlayed?: number;
  wins?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogleToken: (idToken: string) => Promise<void>;
  logout: () => void;
  updateStats: (win: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('qs_user');
      const storedToken = localStorage.getItem('qs_token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (e) {
      console.error('Failed to load auth from storage:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogleToken = async (idToken: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to authenticate with backend.');
      }

      const { user: userData, token: userToken } = resData.data;

      // Add default stats to user data if not set
      const completeUser: UserProfile = {
        ...userData,
        xp: userData.xp ?? 0,
        gamesPlayed: userData.gamesPlayed ?? 0,
        wins: userData.wins ?? 0,
      };

      setUser(completeUser);
      setToken(userToken);
      localStorage.setItem('qs_user', JSON.stringify(completeUser));
      localStorage.setItem('qs_token', userToken);
    } catch (error) {
      console.error('Google Sign-In backend verification failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('qs_user');
    localStorage.removeItem('qs_token');
  };

  const updateStats = async (win: boolean) => {
    if (!user || !token) return;
    try {
      const response = await fetch('http://localhost:4000/api/auth/update-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ win }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to update stats in database.');
      }

      const completeUser = {
        ...user,
        ...resData.data.user,
      };

      setUser(completeUser);
      localStorage.setItem('qs_user', JSON.stringify(completeUser));
    } catch (err) {
      console.error('Failed to sync game stats with database:', err);
      // Fallback: update locally if network request fails so UX is still smooth
      const localUpdated = {
        ...user,
        gamesPlayed: (user.gamesPlayed || 0) + 1,
        wins: (user.wins || 0) + (win ? 1 : 0),
        xp: (user.xp || 0) + (win ? 50 : 15),
      };
      setUser(localUpdated);
      localStorage.setItem('qs_user', JSON.stringify(localUpdated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        loginWithGoogleToken,
        logout,
        updateStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
