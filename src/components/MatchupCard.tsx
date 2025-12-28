import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { PickRow } from "../types/picks";

type HighlightMode = "edge" | "win";

function winColor(probAny: any) {
  const p = asNum(probAny);
  if (p === null) return "#64748b";
  if (p >= 0.55) return "#22c55e";   // green
  if (p >= 0.45) return "#f59e0b";   // yellow
  return "#ef4444";                  // red
}

function pickColor(mode: HighlightMode, probAny: any, edgeAny: any) {
  return mode === "win" ? winColor(probAny) : edgeColor(edgeAny);
}


function asNum(v: any): number | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

function fmtAmerican(v: any) {
  const n = asNum(v);
  if (n === null) return "—";
  return n > 0 ? `+${n}` : `${n}`;
}

function fmtPct(v: any) {
  const p = asNum(v);
  if (p === null) return "—";
  return `${(p * 100).toFixed(1)}%`;
}

function fmtEv(v: any) {
  const ev = asNum(v);
  if (ev === null) return "—";
  const sign = ev >= 0 ? "+" : "";
  return `${sign}${ev.toFixed(3)}`;
}

function fmtSpread(v: any) {
  const x = asNum(v);
  if (x === null) return "—";
  return x > 0 ? `+${x}` : `${x}`;
}

function fmtSigma(v: any) {
  const x = asNum(v);
  if (x === null) return "—";
  return x.toFixed(2);
}

// --- Edge % coloring (model prob - implied prob) ---
function impliedProbFromAmerican(oddsAny: any): number | null {
  const odds = asNum(oddsAny);
  if (odds === null || odds === 0) return null;

  if (odds > 0) return 100 / (odds + 100);
  const a = Math.abs(odds);
  return a / (a + 100);
}

function edgePct(modelProbAny: any, oddsAny: any): number | null {
  const p = asNum(modelProbAny);
  const imp = impliedProbFromAmerican(oddsAny);
  if (p === null || imp === null) return null;
  return p - imp; // +0.03 == +3% edge
}

function fmtEdge(edgeAny: any) {
  const e = asNum(edgeAny);
  if (e === null) return "—";
  const sign = e >= 0 ? "+" : "";
  return `${sign}${(e * 100).toFixed(1)}%`;
}

function edgeColor(edgeAny: any) {
  const e = asNum(edgeAny);
  if (e === null) return "#64748b";     // gray
  if (e >= 0.03) return "#22c55e";      // green (>= 3% edge)
  if (e >= 0.01) return "#f59e0b";      // yellow (>= 1% edge)
  return "#ef4444";                     // red
}

function tint(color: string) {
  return `${color}22`;
}

export function MatchupCard({
  row,
  onPress,
  highlightMode,
}: {
  row: PickRow;
  onPress: () => void;
  highlightMode: "edge" | "win";
}) {

  // probs
  const pHomeWin = asNum((row as any).p_home_win) ?? 0.5;
  const pAwayWin = 1 - pHomeWin;

  const pHomeCovers = asNum((row as any).p_home_covers) ?? 0.5;
  const pAwayCovers = 1 - pHomeCovers;

  const pUnder = asNum((row as any).p_under);
  const pOver = asNum((row as any).p_over);

  // odds
  const oddsHomeML = (row as any).odds_ml_home;
  const oddsAwayML = (row as any).odds_ml_away;

  const oddsHomeSpread = (row as any).odds_spread_home;
  const oddsAwaySpread = (row as any).odds_spread_away;

  const oddsUnder = (row as any).odds_under;
  const oddsOver = (row as any).odds_over;

  // spread points
  const homeSpread = asNum((row as any).spread_home_minus) ?? 0;
  const awaySpread = Math.abs(homeSpread);

  // edges
  const edgeHomeML = edgePct(pHomeWin, oddsHomeML);
  const edgeAwayML = edgePct(pAwayWin, oddsAwayML);

  const edgeHomeSpread = edgePct(pHomeCovers, oddsHomeSpread);
  const edgeAwaySpread = edgePct(pAwayCovers, oddsAwaySpread);

  const edgeUnder = edgePct(pUnder, oddsUnder);
  const edgeOver = edgePct(pOver, oddsOver);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.teamCol}>
          <Text style={styles.teamLabel}>HOME</Text>
          <Text style={styles.teamName}>{(row as any).home_team}</Text>
        </View>

        <View style={styles.vsPill}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <View style={[styles.teamCol, { alignItems: "flex-end" }]}>
          <Text style={styles.teamLabel}>AWAY</Text>
          <Text style={styles.teamName}>{(row as any).away_team}</Text>
        </View>
      </View>

      <Text style={styles.time}>
        {new Date((row as any).commence_time).toLocaleString()} • Snapshot{" "}
        {new Date((row as any).snapshot_ts).toLocaleTimeString()}
      </Text>

      {/* Sigma */}
      <View style={styles.sigmaRow}>
        <Text style={styles.sigmaText}>σ Margin: {fmtSigma((row as any).sigma_margin)}</Text>
        <Text style={styles.sigmaText}>σ Total: {fmtSigma((row as any).sigma_total)}</Text>
      </View>

      {/* WIN % */}
      <RowLR
        label="Win % (ML)"
        left={{
          main: fmtPct(pHomeWin),
          sub: `${fmtAmerican(oddsHomeML)} • Edge ${fmtEdge(edgeHomeML)} • EV ${fmtEv((row as any).ev_ml_home_per_1u)}`,
          color: pickColor(highlightMode, pHomeWin, edgeHomeML),

        }}
        right={{
          main: fmtPct(pAwayWin),
          sub: `${fmtAmerican(oddsAwayML)} • Edge ${fmtEdge(edgeAwayML)} • EV ${fmtEv((row as any).ev_ml_away_per_1u)}`,
          color: pickColor(highlightMode, pAwayWin, edgeAwayML),

        }}
      />

      {/* SPREAD COVERS */}
      <RowLR
        label="Covers % (Spread)"
        left={{
          main: fmtPct(pHomeCovers),
          sub: `${fmtSpread(homeSpread)} (${fmtAmerican(oddsHomeSpread)}) • Edge ${fmtEdge(edgeHomeSpread)} • EV ${fmtEv(
            (row as any).ev_spread_home_per_1u
          )}`,
          color: pickColor(highlightMode, pHomeCovers, edgeHomeSpread),

        }}
        right={{
          main: fmtPct(pAwayCovers),
          sub: `+${awaySpread} (${fmtAmerican(oddsAwaySpread)}) • Edge ${fmtEdge(edgeAwaySpread)} • EV ${fmtEv(
            (row as any).ev_spread_away_per_1u
          )}`,
        color: pickColor(highlightMode, pAwayCovers, edgeAwaySpread),
        }}
      />

      {/* TOTALS */}
      <RowLR
        label={`Total ${(row as any).total_line ?? "—"}`}
        left={{
          main: fmtPct(pUnder),
          sub: `UNDER ${fmtAmerican(oddsUnder)} • Edge ${fmtEdge(edgeUnder)} • EV ${fmtEv((row as any).ev_under_per_1u)}`,
          color: pickColor(highlightMode, pUnder, edgeUnder),

        }}
        right={{
          main: fmtPct(pOver),
          sub: `OVER ${fmtAmerican(oddsOver)} • Edge ${fmtEdge(edgeOver)} • EV ${fmtEv((row as any).ev_over_per_1u)}`,
          color: pickColor(highlightMode, pOver, edgeOver),

        }}
      />
    </Pressable>
  );
}

function RowLR({
  label,
  left,
  right,
}: {
  label: string;
  left: { main: string; sub: string; color: string };
  right: { main: string; sub: string; color: string };
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.lr}>
        <SideBox align="left" {...left} />
        <SideBox align="right" {...right} />
      </View>
    </View>
  );
}

function SideBox({
  main,
  sub,
  color,
  align,
}: {
  main: string;
  sub: string;
  color: string;
  align: "left" | "right";
}) {
  return (
    <View style={[styles.side, { backgroundColor: tint(color), borderColor: color }]}>
      <Text style={[styles.sideMain, { textAlign: align }]}>{main}</Text>
      <Text style={[styles.sideSub, { textAlign: align }]} numberOfLines={1}>
        {sub}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#1f2a44",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#0b1220",
    marginBottom: 12,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  teamCol: { flex: 1 },
  teamLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "900" },
  teamName: { color: "white", fontSize: 15, fontWeight: "900", marginTop: 2 },
  vsPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#0f1b33",
    borderWidth: 1,
    borderColor: "#24304d",
    marginHorizontal: 10,
  },
  vsText: { color: "#cbd5e1", fontWeight: "900", fontSize: 12 },
  time: { color: "#9ca3af", marginTop: 8, marginBottom: 10, fontSize: 12 },

  sigmaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#0f1b33",
    borderWidth: 1,
    borderColor: "#24304d",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  sigmaText: { color: "#cbd5e1", fontWeight: "900", fontSize: 12 },

  row: { marginBottom: 10 },
  rowLabel: { color: "#9ca3af", fontWeight: "900", marginBottom: 6, fontSize: 12 },
  lr: { flexDirection: "row", gap: 10 },

  side: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 10 },
  sideMain: { color: "white", fontSize: 16, fontWeight: "900" },
  sideSub: { color: "#e5e7eb", fontSize: 12, marginTop: 4 },
});
