import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";
import { isAtelieAdmin } from "@/lib/supabase-config";
import { PasswordForm } from "./password-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Definir senha | Ateliê da Rê",
  robots: { index: false, follow: false },
};

export default async function DefinirSenha() {
  const supabase = await getServerSupabase();
  const session = await supabase?.auth.getUser();
  if (!isAtelieAdmin(session?.data.user?.app_metadata)) redirect("/entrar");

  return (
    <main className="grid min-h-svh place-items-center bg-[#faf6ef] p-5 text-[#29201f]">
      <div className="w-full max-w-md rounded-[2rem] border border-[#e9dcd4] bg-white p-7 sm:p-10">
        <h1 className="font-serif text-4xl tracking-tight">Defina sua senha</h1>
        <p className="mt-3 text-sm text-[#695850]">Use pelo menos 12 caracteres para proteger seu acesso ao painel.</p>
        <PasswordForm />
      </div>
    </main>
  );
}
