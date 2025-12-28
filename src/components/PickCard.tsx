import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { PickRow } from "../types/picks";

/* =====================
   EV → COLOR LOGIC
===================== */

function evColor(ev: number) {
  if (ev >= 0.05) return "#22c55e";   // green
  if (ev <= -0.05) return "#ef4444"; // red
  return "#f59e0b";                  // yellow
}

function tint(color: string) {
  return `${color}2A`; // ~16% opacity
}

/* =====================
   FORMATTERS
===================== */

function fmtAmerican(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}
function fmtPct(p: number) {
  return `${(p * 100).toFixed(1)}%`;
}
function fmtEv(ev: number) {
  const sign = ev >= 0 ? "+" : "";
  return `${sign}${ev.toFixed(3)}`;
}
function fmtSpread(x: number) {
  return x > 0 ? `+${x}` : `${x}`;
}

/* =====================
   COMPONENT
===================== */

export function PickCard({
  row,
  onPress,
}: {
  row: PickRow;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Text style={styles.matchup}>
        {row.away_team} @ {row.home_team}
      </Text>

      <Text style={styles.time}>
        {new Date(row.commence_time).toLocaleString()} • Snapshot{" "}
        {new Date(row.snapshot_ts).toLocaleTimeString()}
      </Text>

      {/* MONEYLINE */}
      <MarketRow
        title="Moneyline (Home)"
        odds={fmtAmerican(row.odds_ml_home)}
        p={row.p_home_win}
        ev={row.ev_ml_home_per_1u}
      />

      {/* SPREAD */}
      <MarketRow
        title="Spread (Home)"
        odds={`${fmtSpread(row.spread_home_minus)} (${fmtAmerican(
          row.odds_spread_home
        )})`}
        p={row.p_home_covers}
        ev={row.ev_spread_home_per_1u}
      />

      {/* OVER */}
      <MarketRow
        title="Over"
        odds={`O ${row.total_line} (${fmtAmerican(row.odds_over)})`}
        p={row.p_over}
        ev={row.ev_over_per_1u}
      />

      {/* UNDER */}
      <MarketRow
        title="Under"
        odds={`U ${row.total_line} (${fmtAmerican(row.odds_under)})`}
        p={row.p_under}
        ev={row.ev_under_per_1u}
      />
    </Pressable>
  );
}

/* =====================
   MARKET ROW
===================== */

function MarketRow({
  title,
  odds,
  p,
  ev,
}: {
  title: string;
  odds: string;
  p: number;
  ev: number;
}) {
  const color = evColor(ev);

  return (
    <View style={[styles.marketRow, { backgroundColor: tint(color), borderColor: color }]}>
      <View style={[styles.accent, { backgroundColor: color }]} />
      <View style={styles.marketBody}>
        <Text style={styles.h}>{title}</Text>
        <Text style={styles.v}>{odds}</Text>
        <Text style={styles.s}>
          p={fmtPct(p)} • EV={fmtEv(ev)}
        </Text>
      </View>
    </View>
  );
}

/* =====================
   STYLES
===================== */

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#1f2a44",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#0b1220",
    marginBottom: 14,
  },
  matchup: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },
  time: {
    color: "#9ca3af",
    marginTop: 6,
    marginBottom: 10,
    fontSize: 12,
  },
  marketRow: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 10,
  },
  accent: {
    width: 6,
  },
  marketBody: {
    flex: 1,
    padding: 10,
  },
  h: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 2,
  },
  v: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
  },
  s: {
    color: "#e5e7eb",
    fontSize: 12,
    marginTop: 2,
  },
});
