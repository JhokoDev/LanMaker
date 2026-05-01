import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { User as UserProfile } from '../models';
import { AuthController } from '../controllers/AuthController';
import { UserController } from '../controllers/UserController';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string, retries = 3) => {
    try {
      for (let i = 0; i < retries; i++) {
        const data = await UserController.getById(userId);
        console.log(`[useAuth] User profile loaded (attempt ${i + 1}):`, data);
        if (data) {
          setProfile(data);
          return;
        }
        // wait 500ms before retrying to allow trigger to finish
        if (i < retries - 1) {
          await new Promise(res => setTimeout(res, 500));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // Check active session
    AuthController.getSession().then(({ session }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const subscription = AuthController.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await AuthController.signOut();
    if (error) console.error('Error signing out:', error.message);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id, 1);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
