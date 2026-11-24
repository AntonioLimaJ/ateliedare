"use server";

import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";
import { isAtelieAdmin } from "@/lib/supabase-config";

export async function signIn(_previousState: string, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return "Informe seu e-mail e sua senha.";

  const supabase = await getServerSupabase();
  if (!supabase) return "O painel ainda está sendo configurado.";

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return error.status && error.status < 500 && error.status !== 429
      ? "E-mail ou senha incorretos."
      : "Não foi possível entrar agora. Tente novamente em instantes.";
  }

  if (!isAtelieAdmin(data.user?.app_metadata)) {
    await supabase.auth.signOut({ scope: "local" });
    return "Esta conta não tem acesso ao painel.";
  }

  redirect("/precificacao");
}

export async function signOut() {
  const supabase = await getServerSupabase();
  await supabase?.auth.signOut({ scope: "local" });
  redirect("/entrar");
}
