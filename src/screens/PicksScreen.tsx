import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";

type PickRow = {
  commence_time: string | null;
  home_team: string | null;
  away_team: string | null;

  provider_event_id: string;
  market: string;
  side: string; // could be HOME/AWAY or a team name
  line: number | null;
  odds_american: number | null;
  p_win: number | null;
  ev_per_1u: number | null;
  mu: number | null;
  sigma: number | null;

  snapshot_time?: string | null; // optional: only if your view includes it
};

function fmtPct(x?: number | null) {
  if (x === null || x === undefined) return "—";
  return `${(x * 100).toFixed(1)}%`;
}

function fmtNum(x?: number | null, d = 2) {
  if (x === null || x === undefined) return "—";
  return Number(x).toFixed(d);
}

function fmtOdds(x?: number | null) {
  if (x === null || x === undefined) return "—";
  const n = Number(x);
  // keep + for positive american odds
  return n > 0 ? `+${n}` : `${n}`;
}

function safeDateStr(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function PicksScreen({
  title,
  viewName,
}: {
  title: string;
  viewName: string;
}) {
  const [rows, setRows] = useState<PickRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);

    // NOTE: if your view doesn't include snapshot_time, this select will still work
    // because snapshot_time is optional in the type, but Supabase will error if the
    // column truly doesn't exist. If you *know* it doesn't exist, remove it below.
    const { data, error } = await supabase
      .from(viewName)
      .select(
        "commence_time, home_team, away_team, provider_event_id, market, side, line, odds_american, p_win, ev_per_1u, mu, sigma, snapshot_time"
      )
      .order("ev_per_1u", { ascending: false })
      .limit(25);

    if (error) {
      setError(error.message);
      setRows([]);
      return;
    }

    setRows((data as PickRow[]) ?? []);
  }, [viewName]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const latestSnap = useMemo(() => {
    // if view includes snapshot_time, show it. if not, just show "—"
    const s = rows?.[0]?.snapshot_time;
    return s ? safeDateStr(s) : null;
  }, [rows]);

  return (
    <View style={{ flex: 1, padding: 16, gap: 10 }}>
      {/* Header */}
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 22, fontWeight: "800" }}>{title}</Text>
        <Text style={{ opacity: 0.7 }}>
          {latestSnap ? `Snapshot: ${latestSnap}` : "Snapshot: —"}
        </Text>
      </View>

      {/* Body */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}>
          <Text style={{ fontWeight: "800" }}>Error</Text>
          <Text style={{ marginTop: 6 }}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, idx) =>
            `${item.provider_event_id}-${item.market}-${item.side}-${idx}`
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const away = item.away_team ?? "Away";
            const home = item.home_team ?? "Home";
            const gameTitle = `${away} @ ${home}`;

            const sidePretty =
              item.side === "HOME"
                ? home
                : item.side === "AWAY"
                ? away
                : item.side;

            const lineText =
              item.line === null || item.line === undefined
                ? ""
                : ` ${item.line > 0 ? "+" : ""}${item.line}`;

            const pickLabel = `${sidePretty ?? "—"}${lineText}`;

            return (
              <View style={{ padding: 12, borderWidth: 1, borderRadius: 14 }}>
                {/* Game */}
                <Text style={{ fontWeight: "900", fontSize: 16 }}>
                  {gameTitle}
                </Text>

                {/* Pick */}
                <Text style={{ marginTop: 6, fontSize: 15, fontWeight: "800" }}>
                  Pick: {pickLabel} • {item.market}
                </Text>

                {/* Time */}
                <Text style={{ marginTop: 6, opacity: 0.75 }}>
                  Start: {safeDateStr(item.commence_time)}
                </Text>

                {/* Stats */}
                <View style={{ marginTop: 10, gap: 4 }}>
                  <Text>Odds: {fmtOdds(item.odds_american)}</Text>
                  <Text>P(win): {fmtPct(item.p_win)}</Text>
                  <Text>EV / 1u: {fmtNum(item.ev_per_1u, 4)}</Text>
                  <Text>
                    μ: {fmtNum(item.mu, 4)} • σ: {fmtNum(item.sigma, 4)}
                  </Text>
                </View>

                {/* Footer */}
                <Text style={{ marginTop: 8, opacity: 0.6 }}>
                  Event: {item.provider_event_id}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}>
              <Text style={{ fontWeight: "800" }}>No picks</Text>
              <Text style={{ marginTop: 6, opacity: 0.75 }}>
                This view returned 0 rows.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
