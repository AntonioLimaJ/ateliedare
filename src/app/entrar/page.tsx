import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { supabaseConfig } from "@/lib/supabase-config";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar no painel | Ateliê da Rê",
  robots: { index: false, follow: false },
};

export default function Entrar() {
  return (
    <main className="grid min-h-svh place-items-center bg-[#faf6ef] p-5 text-[#29201f]">
      <div className="w-full max-w-md rounded-[2rem] border border-[#e9dcd4] bg-white p-7 shadow-sm sm:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#794056]">
          <ArrowLeft size={16} aria-hidden /> Ateliê da Rê
        </Link>
        <div className="mb-5 mt-9 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6e7e7] text-[#794056]">
          <LockKeyhole size={22} aria-hidden />
        </div>
        <h1 className="font-serif text-4xl tracking-tight">Painel do Ateliê</h1>
        <p className="mt-3 text-sm text-[#60514d]">Acesse seus produtos, custos e orçamentos.</p>
        {supabaseConfig
          ? <LoginForm />
          : <p className="mt-7 rounded-xl bg-[#faf6ef] p-4 text-sm" role="status">O painel ainda está sendo configurado. Volte mais tarde.</p>}
      </div>
    </main>
  );
}
