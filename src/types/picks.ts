export type PickRow = {
  // existing...
  id: number;
  snapshot_ts: string;
  event_id: string;
  commence_time: string;

  home_team_id: number;
  away_team_id: number;
  home_team: string;
  away_team: string;

  spread_home_minus: number;
  total_line: number;

  odds_ml_home: number;
  odds_ml_away: number;          // NEW
  odds_spread_home: number;
  odds_spread_away: number;      // NEW
  odds_over: number;
  odds_under: number;

  p_home_win: number;
  p_home_covers: number;
  p_over: number;
  p_under: number;

  ev_ml_home_per_1u: number;
  ev_ml_away_per_1u: number;     // NEW
  ev_spread_home_per_1u: number;
  ev_spread_away_per_1u: number; // NEW
  ev_over_per_1u: number;
  ev_under_per_1u: number;

  sigma_margin: number;          // NEW
  sigma_total: number;           // NEW

  best_market: "ml" | "spread" | "over" | "under";
  best_ev: number;

  risk_tier: "low" | "med" | "high";
};
