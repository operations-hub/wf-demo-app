import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#060b16" },
          headerTintColor: "white",
          contentStyle: { backgroundColor: "#060b16" },
          headerTitleStyle: { fontWeight: "900" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="game/[event_id]" options={{ title: "Line Movement" }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
