import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const extra: any =
  Constants.expoConfig?.extra ??
  (Constants as any).manifest?.extra ??
  (Constants as any).manifest2?.extra ??
  {};

const url =
  extra.SUPABASE_URL ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL;

const anon =
  extra.SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.log("Missing Supabase envs debug:", {
    hasExtra: !!Constants.expoConfig?.extra,
    extraKeys: Object.keys(extra || {}),
    urlPresent: !!url,
    anonPresent: !!anon,
    expoPublicUrl: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
    expoPublicAnon: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  });
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
}

export const supabase = createClient(url, anon);
