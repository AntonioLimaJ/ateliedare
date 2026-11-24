import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfig } from "./supabase-config";

export function getSupabase() {
  if (!supabaseConfig) throw new Error("Supabase não configurado.");
  return createBrowserClient(supabaseConfig.url, supabaseConfig.key);
}
