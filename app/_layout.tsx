import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/src/contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#060b16" },
          headerTintColor: "white",
          contentStyle: { backgroundColor: "#060b16" },
          headerTitleStyle: { fontWeight: "900" },
        }}
      >
        {/* Root index - handles auth routing */}
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Auth screens */}
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />

        {/* Main app screens */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="game/[event_id]" options={{ title: "Line Movement" }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </AuthProvider>
  );
}
