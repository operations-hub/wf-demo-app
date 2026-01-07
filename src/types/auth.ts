import { Session, User } from "@supabase/supabase-js";

/**
 * User profile stored in public.profiles table
 */
export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  profile_data: {
    bio?: string;
    avatar_url?: string;
    preferences?: {
      theme?: "light" | "dark";
      notifications?: boolean;
      [key: string]: any;
    };
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Authentication state
 */
export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

/**
 * Signup form data
 */
export interface SignupData {
  email: string;
  password: string;
  displayName: string;
  additionalData?: {
    bio?: string;
    avatar_url?: string;
    preferences?: any;
    [key: string]: any;
  };
}

/**
 * Login form data
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Auth operation result
 */
export interface AuthResult {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Custom auth error
 */
export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Profile update data
 */
export interface ProfileUpdateData {
  display_name?: string;
  profile_data?: Partial<UserProfile["profile_data"]>;
}
