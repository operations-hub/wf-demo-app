import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/auth';
import type { AuthState, UserProfile } from '../types/auth';
import { User, Session } from '@supabase/supabase-js';

/**
 * Auth Context Type
 */
interface AuthContextType extends AuthState {
  // Auth operations
  signup: (email: string, password: string, displayName: string, additionalData?: any) => Promise<{ error: any | null }>;
  login: (email: string, password: string) => Promise<{ error: any | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  // OAuth operations
  signInWithGoogle: () => Promise<{ error: any | null; url?: string }>;
  signInWithApple: () => Promise<{ error: any | null; url?: string }>;
}

/**
 * Create Auth Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 * Wraps the app and provides auth state to all components
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    initialized: false
  });

  /**
   * Initialize auth state on mount
   * Checks for existing session and loads user data
   */
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // Get current session
        const session = await authService.getSession();

        if (session && session.user && mounted) {
          // Fetch user profile
          const profile = await authService.getProfile(session.user.id);

          setAuthState({
            user: session.user,
            profile,
            session,
            loading: false,
            initialized: true
          });
        } else if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            initialized: true
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            initialized: true
          });
        }
      }
    }

    initAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' && session && mounted) {
        const profile = await authService.getProfile(session.user.id);
        setAuthState({
          user: session.user,
          profile,
          session,
          loading: false,
          initialized: true
        });
      } else if (event === 'SIGNED_OUT' && mounted) {
        setAuthState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          initialized: true
        });
      } else if (event === 'TOKEN_REFRESHED' && session && mounted) {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session.user
        }));
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  /**
   * Signup function
   */
  const signup = async (
    email: string,
    password: string,
    displayName: string,
    additionalData?: any
  ) => {
    setAuthState(prev => ({ ...prev, loading: true }));

    const result = await authService.signup({
      email,
      password,
      displayName,
      additionalData
    });

    if (result.error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      return { error: result.error };
    }

    // Auth state will be updated by onAuthStateChange listener
    return { error: null };
  };

  /**
   * Login function
   */
  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true }));

    const result = await authService.login({ email, password });

    if (result.error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      return { error: result.error };
    }

    // Auth state will be updated by onAuthStateChange listener
    return { error: null };
  };

  /**
   * Logout function
   */
  const logout = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    await authService.logout();
    // Auth state will be updated by onAuthStateChange listener
  };

  /**
   * Refresh profile data
   */
  const refreshProfile = async () => {
    if (authState.user) {
      const profile = await authService.getProfile(authState.user.id);
      setAuthState(prev => ({ ...prev, profile }));
    }
  };

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));

    const result = await authService.signInWithGoogle();

    if (result.error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      return { error: result.error };
    }

    // Auth state will be updated by onAuthStateChange listener
    // Return the OAuth URL for mobile apps to open
    return { error: null, url: result.url };
  };

  /**
   * Sign in with Apple OAuth
   */
  const signInWithApple = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));

    const result = await authService.signInWithApple();

    if (result.error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      return { error: result.error };
    }

    // Auth state will be updated by onAuthStateChange listener
    // Return the OAuth URL for mobile apps to open
    return { error: null, url: result.url };
  };

  const value: AuthContextType = {
    ...authState,
    signup,
    login,
    logout,
    refreshProfile,
    signInWithGoogle,
    signInWithApple
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
