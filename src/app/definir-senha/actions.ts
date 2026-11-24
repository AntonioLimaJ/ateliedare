"use server";

import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";
import { isAtelieAdmin } from "@/lib/supabase-config";

export async function definePassword(_previousState: string, form: FormData) {
  const password = String(form.get("password") ?? "");
  const confirmation = String(form.get("confirmation") ?? "");
  if (password.length < 12 || password.length > 72) return "Use uma senha de 12 a 72 caracteres.";
  if (password !== confirmation) return "As duas senhas precisam ser iguais.";

  const supabase = await getServerSupabase();
  const session = await supabase?.auth.getUser();
  if (!supabase || !isAtelieAdmin(session?.data.user?.app_metadata)) redirect("/entrar");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return "Não foi possível salvar a senha. Escolha outra senha ou abra um novo convite.";

  redirect("/precificacao");
}
