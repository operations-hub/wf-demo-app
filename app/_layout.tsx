import { Tabs } from "expo-router";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerTitle: "WagerFunding Picks",
      }}
    >
      <Tabs.Screen name="low" options={{ title: "Low Risk" }} />
      <Tabs.Screen name="medium" options={{ title: "Medium" }} />
      <Tabs.Screen name="high" options={{ title: "High Risk" }} />
    </Tabs>
  );
}
