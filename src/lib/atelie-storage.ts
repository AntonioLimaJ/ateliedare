import { getSupabase } from "./supabase";
import { supabaseConfig } from "./supabase-config";

const bucket = "precificacao";

export async function uploadAtelieImage(source: string) {
  const match = /^data:(image\/(?:webp|png|jpeg));base64,/.exec(source);
  if (!match) throw new Error("Formato de imagem inválido.");

  const blob = await (await fetch(source)).blob();
  if (blob.size === 0 || blob.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter até 5 MB.");

  const storage = getSupabase().storage.from(bucket);
  const path = `uploads/${crypto.randomUUID()}.${match[1].split("/")[1]}`;
  const { error } = await storage.upload(path, blob, {
    contentType: match[1],
    cacheControl: "86400",
  });
  if (error) throw error;
  return storage.getPublicUrl(path).data.publicUrl;
}

export async function removeAtelieImage(source: string | null | undefined) {
  if (!source || !supabaseConfig) return;
  try {
    const url = new URL(source);
    const origin = new URL(supabaseConfig.url).origin;
    const prefix = `/storage/v1/object/public/${bucket}/`;
    if (url.origin !== origin || !url.pathname.startsWith(prefix)) return;

    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    const { error } = await getSupabase().storage.from(bucket).remove([path]);
    if (error) console.warn("Não foi possível limpar a imagem antiga do armazenamento.");
  } catch {
    // Links antigos ou externos não são administrados pelo bucket do ateliê.
  }
}
