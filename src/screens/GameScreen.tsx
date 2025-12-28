import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LineMiniChart } from "../components/LineMiniChart";
import { supabase } from "../lib/supabase";
import type { PickRow } from "../types/picks";

export function GameScreen({ route }: any) {
  const { event_id, home_team, away_team } = route.params;
  const [history, setHistory] = useState<PickRow[]>([]);

  async function loadHistory() {
    const { data } = await supabase
      .from("picks_snapshot")
      .select("*")
      .eq("event_id", event_id)
      .order("snapshot_ts", { ascending: true })
      .limit(200); // last ~50 hours if every 15 mins

    setHistory((data as PickRow[]) ?? []);
  }

  useEffect(() => {
    loadHistory();
    const id = setInterval(loadHistory, 30000);
    return () => clearInterval(id);
  }, [event_id]);

  const totals = useMemo(() => history.map((h) => Number(h.total_line)), [history]);
  const spreads = useMemo(() => history.map((h) => Number(h.spread_home_minus)), [history]);
  const ml = useMemo(() => history.map((h) => Number(h.odds_ml_home)), [history]);
  const latest = history.length ? history[history.length - 1] : null;

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={styles.title}>{away_team} @ {home_team}</Text>
      <Text style={styles.sub}>Event: {event_id}</Text>

      <View style={styles.section}>
        <Text style={styles.h}>Most recent</Text>
        {latest ? (
          <Text style={styles.v}>
            Total {latest.total_line} • Spread {latest.spread_home_minus} • ML {latest.odds_ml_home}{"\n"}
            Snapshot {new Date(latest.snapshot_ts).toLocaleString()}
          </Text>
        ) : (
          <Text style={styles.v}>No history yet.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.h}>Total line movement</Text>
        <LineMiniChart values={totals} />
      </View>

      <View style={styles.section}>
        <Text style={styles.h}>Spread movement (home line)</Text>
        <LineMiniChart values={spreads} />
      </View>

      <View style={styles.section}>
        <Text style={styles.h}>Moneyline movement (home odds)</Text>
        <LineMiniChart values={ml} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#060b16", padding: 14 },
  title: { color: "white", fontSize: 20, fontWeight: "900", marginBottom: 6 },
  sub: { color: "#94a3b8", marginBottom: 16 },
  section: { backgroundColor: "#0f1b33", padding: 12, borderRadius: 12, marginBottom: 12 },
  h: { color: "#9ca3af", fontSize: 12, marginBottom: 6, fontWeight: "700" },
  v: { color: "white", fontSize: 14 },
});
