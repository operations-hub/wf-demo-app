import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { MatchupCard } from "../../src/components/MatchupCard";
import { supabase } from "../../src/lib/supabase";
import type { PickRow, RiskTier } from "../../src/types/picks";
import type { HighlightMode } from "../../src/types/ui";

const BG = "#060b16";

function riskRank(t: RiskTier) {
  if (t === "low") return 0;
  if (t === "med") return 1;
  return 2;
}

export default function PicksTab() {
  const router = useRouter();
  const [rows, setRows] = useState<PickRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "low" | "med" | "high">("all");

  const [highlightMode, setHighlightMode] = useState<HighlightMode>("edge");

  async function loadLatest() {
    const { data, error } = await supabase
      .from("v_latest_picks") 
      .select("*")
      .order("commence_time", { ascending: true });

    if (!error && data) setRows(data as PickRow[]);
  }

  useEffect(() => {
    loadLatest();
    const id = setInterval(loadLatest, 15000);
    return () => clearInterval(id);
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadLatest();
    setRefreshing(false);
  }

  const filtered = useMemo(() => {
    const f = filter === "all" ? rows : rows.filter((r) => r.risk_tier === filter);
    return [...f].sort((a, b) => {
      if (b.best_ev !== a.best_ev) return b.best_ev - a.best_ev;
      return riskRank(a.risk_tier) - riskRank(b.risk_tier);
    });
  }, [rows, filter]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Latest Picks</Text>

      <View style={styles.toggleRow}>
        {(["edge", "win"] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => setHighlightMode(m)}
            style={[styles.toggleBtn, highlightMode === m && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, highlightMode === m && styles.toggleTextActive]}>
              {m === "edge" ? "EV BASED" : "PROBABILITY BASED"}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.filters}>
        {(["all", "low", "med", "high"] as const).map((k) => (
          <Pressable
            key={k}
            onPress={() => setFilter(k)}
            style={[styles.filterBtn, filter === k && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === k && styles.filterTextActive]}>
              {k.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => (
          <MatchupCard
            row={item}
            highlightMode={highlightMode} 
            onPress={() =>
              router.push({
                pathname: "/game/[event_id]",
                params: {
                  event_id: item.event_id,
                  home_team: item.home_team,
                  away_team: item.away_team,
                },
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
  wrap: { flex: 1, backgroundColor: BG, padding: 14 },
  title: { color: "white", fontSize: 20, fontWeight: "900", marginBottom: 10 },

  toggleRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  toggleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#24304d",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#0b1220",
    alignItems: "center",
  },
  toggleBtnActive: {
    borderColor: "#60a5fa",
    backgroundColor: "#0f1b33",
  },
  toggleText: { color: "#cbd5e1", fontWeight: "900", fontSize: 12 },
  toggleTextActive: { color: "white" },

  filters: { flexDirection: "row", gap: 8, marginBottom: 12 },
  filterBtn: {
    borderWidth: 1,
    borderColor: "#24304d",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#0b1220",
  },
  filterBtnActive: {
    borderColor: "#60a5fa",
    backgroundColor: "#0f1b33",
  },
  filterText: { color: "#cbd5e1", fontWeight: "800", fontSize: 12 },
  filterTextActive: { color: "white" },
});
