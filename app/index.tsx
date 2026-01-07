import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/use-auth';

/**
 * Root index screen - handles auth routing
 * Redirects to auth or main app based on authentication state
 */
export default function Index() {
  const { user, loading, initialized } = useAuth();

  useEffect(() => {
    // Wait for auth to initialize
    if (!initialized) return;

    // Redirect based on auth state
    if (user) {
      // User is authenticated, go to main app
      router.replace('/(tabs)');
    } else {
      // User not authenticated, go to login
      router.replace('/auth/login');
    }
  }, [user, initialized]);

  // Show loading spinner while checking auth state
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060b16',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
