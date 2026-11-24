const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfig = url && key ? { url, key } : null;

export function isAtelieAdmin(appMetadata: unknown): boolean {
  return typeof appMetadata === "object" && appMetadata !== null
    && "ateliedare_admin" in appMetadata && appMetadata.ateliedare_admin === true;
}
