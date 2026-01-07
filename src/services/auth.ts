import { supabase } from '../lib/supabase';
import type {
  SignupData,
  LoginData,
  AuthResult,
  UserProfile,
  ProfileUpdateData,
  AuthError
} from '../types/auth';

/**
 * Authentication Service
 * Handles all auth operations: signup, login, logout, session management
 */
class AuthService {

  /**
   * Sign up a new user with email/password
   * Creates both auth user and profile record
   */
  async signup(data: SignupData): Promise<AuthResult> {
    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          // Store display_name and additional data in user metadata
          // This will be accessible in the trigger or for manual profile creation
          data: {
            display_name: data.displayName,
            profile_data: data.additionalData || {}
          },
          // Email verification is disabled in Supabase settings
          emailRedirectTo: undefined
        }
      });

      if (authError) {
        return {
          user: null,
          profile: null,
          session: null,
          error: this.mapError(authError)
        };
      }

      if (!authData.user) {
        return {
          user: null,
          profile: null,
          session: null,
          error: {
            code: 'signup_failed',
            message: 'User creation failed'
          }
        };
      }

      // Step 2: Fetch the profile (created by trigger or manually create)
      // Wait a bit for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const profile = await this.getOrCreateProfile(
        authData.user.id,
        data.email,
        data.displayName,
        data.additionalData || {}
      );

      return {
        user: authData.user,
        profile,
        session: authData.session,
        error: null
      };

    } catch (error) {
      console.error('Signup error:', error);
      return {
        user: null,
        profile: null,
        session: null,
        error: this.mapError(error)
      };
    }
  }

  /**
   * Log in an existing user
   */
  async login(data: LoginData): Promise<AuthResult> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (authError) {
        return {
          user: null,
          profile: null,
          session: null,
          error: this.mapError(authError)
        };
      }

      if (!authData.user) {
        return {
          user: null,
          profile: null,
          session: null,
          error: {
            code: 'login_failed',
            message: 'Login failed'
          }
        };
      }

      // Fetch user profile
      const profile = await this.getProfile(authData.user.id);

      return {
        user: authData.user,
        profile,
        session: authData.session,
        error: null
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        user: null,
        profile: null,
        session: null,
        error: this.mapError(error)
      };
    }
  }

  /**
   * Log out the current user
   */
  async logout(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: this.mapError(error) };
      }

      return { error: null };
    } catch (error) {
      console.error('Logout error:', error);
      return { error: this.mapError(error) };
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Fetch user profile from database
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Get profile error:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  /**
   * Get or create profile (fallback if trigger fails)
   */
  private async getOrCreateProfile(
    userId: string,
    email: string,
    displayName: string,
    additionalData: any
  ): Promise<UserProfile | null> {
    try {
      // Try to fetch existing profile (created by trigger)
      let profile = await this.getProfile(userId);

      // If profile doesn't exist, create it manually
      if (!profile) {
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            email,
            display_name: displayName,
            profile_data: additionalData
          })
          .select()
          .single();

        if (error) {
          console.error('Profile creation error:', error);
          // Log this error - may need manual intervention
          return null;
        }

        profile = data as UserProfile;
      }

      return profile;
    } catch (error) {
      console.error('Get or create profile error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: ProfileUpdateData): Promise<{ error: AuthError | null }> {
    try {
      const updateData: any = {};

      if (updates.display_name) {
        updateData.display_name = updates.display_name;
      }

      if (updates.profile_data) {
        // Merge with existing profile_data
        const currentProfile = await this.getProfile(userId);
        if (currentProfile) {
          updateData.profile_data = {
            ...currentProfile.profile_data,
            ...updates.profile_data
          };
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId);

      if (error) {
        return { error: this.mapError(error) };
      }

      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error: this.mapError(error) };
    }
  }

  /**
   * Map Supabase errors to custom AuthError
   */
  private mapError(error: any): AuthError {
    const errorMessage = error?.message || 'An unknown error occurred';

    // Map common Supabase auth errors
    if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
      return {
        code: 'email_already_exists',
        message: 'This email is already registered',
        details: error
      };
    }

    if (errorMessage.includes('Invalid login credentials')) {
      return {
        code: 'invalid_credentials',
        message: 'Invalid email or password',
        details: error
      };
    }

    if (errorMessage.includes('Email not confirmed')) {
      return {
        code: 'email_not_confirmed',
        message: 'Please confirm your email address',
        details: error
      };
    }

    if (errorMessage.includes('password')) {
      return {
        code: 'weak_password',
        message: 'Password is too weak. Must be at least 8 characters.',
        details: error
      };
    }

    if (errorMessage.includes('email')) {
      return {
        code: 'invalid_email',
        message: 'Invalid email format',
        details: error
      };
    }

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        code: 'network_error',
        message: 'Network error. Please check your connection.',
        details: error
      };
    }

    return {
      code: 'unknown_error',
      message: errorMessage,
      details: error
    };
  }

  /**
   * Sign in with Google OAuth
   * Opens Google OAuth flow in browser/webview
   */
  async signInWithGoogle(): Promise<{ error: AuthError | null; url?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redirect URL will be configured in Supabase Dashboard
          // For Expo, use deep linking: exp://your-app-scheme
          redirectTo: undefined, // Uses default from Supabase settings
          // Skip browser redirect on web, let the app handle it
          skipBrowserRedirect: false
        }
      });

      if (error) {
        return { error: this.mapError(error) };
      }

      // For mobile, you'll need to open data.url in a browser
      // and handle the redirect back to your app
      return { error: null, url: data.url };
    } catch (error) {
      console.error('Google OAuth error:', error);
      return { error: this.mapError(error) };
    }
  }

  /**
   * Sign in with Apple OAuth
   * Opens Apple OAuth flow in browser/webview
   */
  async signInWithApple(): Promise<{ error: AuthError | null; url?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: undefined, // Uses default from Supabase settings
          skipBrowserRedirect: false
        }
      });

      if (error) {
        return { error: this.mapError(error) };
      }

      return { error: null, url: data.url };
    } catch (error) {
      console.error('Apple OAuth error:', error);
      return { error: this.mapError(error) };
    }
  }

  /**
   * Handle OAuth redirect/callback
   * Call this when your app receives a deep link redirect from OAuth provider
   */
  async handleOAuthCallback(url: string): Promise<AuthResult> {
    try {
      // Extract the session from the URL
      const { data, error } = await supabase.auth.getSessionFromUrl({
        url,
        storeSession: true
      });

      if (error) {
        return {
          user: null,
          profile: null,
          session: null,
          error: this.mapError(error)
        };
      }

      if (!data.session || !data.user) {
        return {
          user: null,
          profile: null,
          session: null,
          error: {
            code: 'oauth_failed',
            message: 'OAuth authentication failed'
          }
        };
      }

      // Fetch or create profile for OAuth user
      const profile = await this.getOrCreateProfile(
        data.user.id,
        data.user.email || '',
        data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'User',
        data.user.user_metadata || {}
      );

      return {
        user: data.user,
        profile,
        session: data.session,
        error: null
      };
    } catch (error) {
      console.error('OAuth callback error:', error);
      return {
        user: null,
        profile: null,
        session: null,
        error: this.mapError(error)
      };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

// Export singleton instance
export const authService = new AuthService();
