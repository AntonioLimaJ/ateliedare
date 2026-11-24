import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Package, UserRound } from "lucide-react";
import { formatCurrency, formatDate, type ItemOrcamento } from "@/lib/atelie";
import { getPublicSupabase } from "@/lib/supabase-server";
import { getWhatsAppUrl } from "@/lib/contact";
import { PrintBudget } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Orçamento | Ateliê da Rê",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type PublicBudget = {
  cliente: string | null;
  created_at: string;
  data_entrega: string | null;
  link_expira_em: string;
  total: number;
  itens: Pick<ItemOrcamento, "nome" | "quantidade" | "preco_unitario" | "total" | "notas">[];
};

export default async function ViewOrcamento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) notFound();

  const supabase = getPublicSupabase();
  if (!supabase) return <PublicBudgetUnavailable id={id} />;

  const { data, error } = await supabase.rpc("ateliedare_orcamento_publico", { p_token: id });
  if (error) return <PublicBudgetUnavailable id={id} />;
  const budget = data as PublicBudget | null;
  if (!budget) notFound();

  const whatsapp = getWhatsAppUrl();

  return (
    <main className="min-h-svh bg-[#faf6ef] px-4 py-8 text-[#29201f] sm:py-14 print:bg-white print:p-0">
      <article className="mx-auto max-w-2xl rounded-[2rem] border border-[#e9dcd4] bg-white p-6 sm:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e9dcd4] pb-6">
          <Link href="/" className="flex items-center gap-3 font-semibold text-[#793751]">
            <Image src="/icon-192.png" alt="" width={40} height={40} className="rounded-full" /> Ateliê da Rê
          </Link>
          <PrintBudget />
        </header>

        <h1 className="mt-8 font-serif text-4xl tracking-tight sm:text-5xl">Seu orçamento</h1>
        <p className="mt-2 text-sm text-[#695850]">Emitido em {formatDate(budget.created_at)}</p>
        <dl className="my-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#faf6ef] p-4">
            <dt className="flex items-center gap-2 text-sm text-[#793751]"><UserRound size={16} aria-hidden /> Cliente</dt>
            <dd className="mt-1 break-words font-semibold">{budget.cliente || "Cliente do ateliê"}</dd>
          </div>
          <div className="rounded-2xl bg-[#faf6ef] p-4">
            <dt className="flex items-center gap-2 text-sm text-[#793751]"><CalendarDays size={16} aria-hidden /> Previsão de entrega</dt>
            <dd className="mt-1 font-semibold">{formatDate(budget.data_entrega)}</dd>
          </div>
        </dl>

        {budget.itens.length > 0 && (
          <section aria-labelledby="itens-orcamento">
            <h2 className="font-serif text-2xl" id="itens-orcamento">Itens solicitados</h2>
            <ul className="mt-3 divide-y divide-[#e9dcd4]">
              {budget.itens.map((item, index) => (
                <li key={index} className="flex gap-3 py-4 print:break-inside-avoid">
                  <Package size={19} className="mt-1 shrink-0 text-[#793751]" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-semibold">{item.nome}</p>
                    <p className="text-sm text-[#695850]">{item.quantidade} × {formatCurrency(item.preco_unitario)}</p>
                    {item.notas && <p className="mt-1 break-words text-sm text-[#695850]">{item.notas}</p>}
                  </div>
                  <p className="shrink-0 text-sm font-bold">{formatCurrency(item.total)}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#f6e7e7] p-4">
          <span className="font-semibold">Total do orçamento</span>
          <strong className="text-xl text-[#793751]">{formatCurrency(budget.total)}</strong>
        </div>
        <p className="mt-5 text-sm text-[#695850]">Link válido até {formatDate(budget.link_expira_em)}.</p>
        {whatsapp && <a className="site-button site-secondary mt-5 print:hidden" href={whatsapp}>Falar com o ateliê</a>}
      </article>
    </main>
  );
}

function PublicBudgetUnavailable({ id }: { id: string }) {
  return (
    <main className="grid min-h-svh place-items-center bg-[#faf6ef] p-5 text-[#29201f]">
      <div className="w-full max-w-md rounded-3xl border border-[#e9dcd4] bg-white p-7">
        <h1 className="font-serif text-3xl">Orçamento indisponível</h1>
        <p className="mt-3 text-sm text-[#695850]">Não foi possível consultar o orçamento agora. Tente novamente em instantes.</p>
        <a href={`/view/${id}`} className="site-button site-primary mt-5">Tentar novamente</a>
      </div>
    </main>
  );
}
