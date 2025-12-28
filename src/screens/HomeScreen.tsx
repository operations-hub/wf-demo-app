import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { PickCard } from "../components/PickCard";
import { supabase } from "../lib/supabase";
import type { PickRow } from "../types/picks";

export function HomeScreen({ navigation }: any) {
  const [rows, setRows] = useState<PickRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadLatest() {
    const { data, error } = await supabase
      .from("latest_picks")
      .select("*")
      .order("commence_time", { ascending: true });

    if (!error && data) setRows(data as PickRow[]);
  }

  useEffect(() => {
    loadLatest();
    const id = setInterval(loadLatest, 15000); // poll faster than your 15m snapshots
    return () => clearInterval(id);
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadLatest();
    setRefreshing(false);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Top Picks (Latest Snapshot)</Text>
      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => (
          <PickCard
            row={item}
            onPress={() =>
              navigation.navigate("Game", {
                event_id: item.event_id,
                home_team: item.home_team,
                away_team: item.away_team,
              })
            }
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#060b16", padding: 14 },
  title: { color: "white", fontSize: 20, fontWeight: "800", marginBottom: 12 },
});
