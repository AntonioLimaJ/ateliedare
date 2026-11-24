"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronDown, Download, Link2, Package, Plus, Search, Share2 } from "lucide-react";
import { BottomNav } from "../_components/BottomNav";
import { getSupabase } from "@/lib/supabase";
import { formatCurrency, formatDate, searchText, type Orcamento } from "@/lib/atelie";

const groups = [
  { name: "Em produção", filter: (budget: Orcamento) => !budget.entregue },
  { name: "Pagamento pendente", filter: (budget: Orcamento) => budget.entregue && !budget.pago },
  { name: "Concluídos", filter: (budget: Orcamento) => budget.entregue && budget.pago },
];

const calendarDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" });

function deliveryStatus(date: string | null, today: string) {
  if (!date) return "";
  const days = (Date.parse(date.slice(0, 10)) - Date.parse(today)) / 86400000;
  if (days < 0) return "Entrega atrasada";
  if (days <= 3) return "Entrega próxima";
  return "";
}

function clientName(budget: Orcamento) {
  return budget.clientes?.nome || budget.nome_cliente_manual || "Cliente sem nome";
}

function download(blob: Blob, fileName: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export default function OrcamentosPage() {
  const [budgets, setBudgets] = useState<Orcamento[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [ticket, setTicket] = useState<Orcamento | null>(null);
  const [action, setAction] = useState("");
  const busy = useRef(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let latestRequest: AbortController | undefined;

    async function load() {
      latestRequest?.abort();
      const request = new AbortController();
      latestRequest = request;
      const signal = AbortSignal.any([controller.signal, request.signal, AbortSignal.timeout(10000)]);
      const { data, error } = await getSupabase().from("orcamentos")
        .select("id,total,data_entrega,created_at,entregue,pago,nome_cliente_manual,clientes(nome),orcamento_itens(id,nome,quantidade,preco_unitario,total,notas,produtos(imagem_url))")
        .order("created_at", { ascending: false }).abortSignal(signal);

      if (controller.signal.aborted || request.signal.aborted) return;
      if (error) setLoadError("Não foi possível carregar os orçamentos.");
      else {
        setBudgets((data ?? []) as unknown as Orcamento[]);
        setLoadError("");
      }
      setLoaded(true);
    }

    window.addEventListener("online", load);
    void load();
    return () => {
      controller.abort();
      window.removeEventListener("online", load);
    };
  }, [retry]);

  async function run(label: string, operation: () => Promise<void>) {
    if (busy.current) return;
    busy.current = true;
    setAction(label);
    setActionError("");
    try { await operation(); }
    catch {
      setActionError("Não foi possível concluir a ação. Tente novamente.");
    } finally {
      busy.current = false;
      setAction("");
    }
  }

  function toggleStatus(budget: Orcamento, field: "entregue" | "pago") {
    return run("Atualizando orçamento…", async () => {
      const value = !budget[field];
      const { error } = await getSupabase().from("orcamentos")
        .update({ [field]: value }).eq("id", budget.id).select("id").single();
      if (error) throw error;
      setBudgets(current => current.map(b => b.id === budget.id ? { ...b, [field]: value } : b));
    });
  }

  function shareLink(budget: Orcamento) {
    return run("Preparando link…", async () => {
      const { data, error } = await getSupabase().rpc("ateliedare_compartilhar_orcamento", { p_id: String(budget.id) });
      if (error || typeof data !== "string") throw error ?? new Error();
      const url = new URL("/view/" + data, window.location.origin).href;
      setLink(url);
      setCopied(false);
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch { /* O link ainda pode ser selecionado e copiado manualmente. */ }
    });
  }

  function exportImage(budget: Orcamento, share: boolean) {
    return run("Preparando imagem…", async () => {
      const { toBlob } = await import("html-to-image");
      flushSync(() => setTicket(budget));
      try {
        if (!ticketRef.current) throw new Error();
        const blob = await toBlob(ticketRef.current, { backgroundColor: "#faf6ef", pixelRatio: 2 });
        if (!blob) throw new Error();

        const fileName = "orcamento-" + String(budget.id).slice(0, 8) + ".png";
        const file = new File([blob], fileName, { type: "image/png" });
        if (share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: "Orçamento do Ateliê da Rê" });
            return;
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
          }
        }
        download(blob, fileName);
      } finally {
        setTicket(null);
      }
    });
  }

  const normalizedQuery = searchText(query);
  const today = calendarDate.format(new Date());
  const filtered = budgets.filter(b => searchText(clientName(b)).includes(normalizedQuery)
    || b.orcamento_itens?.some(item => searchText(item.nome).includes(normalizedQuery)));
  const total = filtered.reduce((sum, b) => sum + Number(b.total || 0), 0);
  const received = filtered.reduce((sum, b) => sum + (b.pago ? Number(b.total || 0) : 0), 0);

  return (
    <div className="min-h-svh bg-[#faf6ef] pb-24 text-[#29201f]">
      <main className="mx-auto max-w-5xl px-4 pt-7 sm:px-7 sm:pt-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">Orçamentos</h1>
            <p className="mt-2 text-sm text-[#695850]">Acompanhe pedidos, entregas e pagamentos.</p>
          </div>
          <Link href="/precificacao/orcamentos/novo" prefetch={false} className="site-button site-primary">
            <Plus size={18} aria-hidden /> Novo orçamento
          </Link>
        </header>

        <dl className="my-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#ead9d8] bg-[#f6e7e7] p-4"><dt className="text-sm text-[#6b4352]">Valor orçado</dt><dd className="mt-1 text-xl font-bold text-[#793751]">{loaded ? formatCurrency(total) : "—"}</dd></div>
          <div className="rounded-2xl border border-[#e9dcd4] bg-white p-4"><dt className="text-sm text-[#695850]">Valor recebido</dt><dd className="mt-1 text-xl font-bold">{loaded ? formatCurrency(received) : "—"}</dd></div>
        </dl>

        <label className="relative mb-5 block">
          <span className="sr-only">Buscar por cliente ou produto</span>
          <Search size={18} aria-hidden className="absolute left-3 top-3.5 text-[#695850]" />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por cliente ou produto"
            className="h-11 w-full rounded-xl border border-[#e9dcd4] bg-white pl-10 pr-3 text-sm sm:max-w-sm" />
        </label>

        {loadError && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800">
          {loadError}<button type="button" className="site-button site-secondary" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button>
        </div>}
        {actionError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">{actionError}</p>}
        {action && <p role="status" className="mb-4 text-sm text-[#695850]">{action}</p>}
        {link && <section aria-label="Link para o cliente" className="mb-5 rounded-xl border border-[#ead9d8] bg-white p-4">
          <div className="flex flex-wrap justify-between gap-2">
            <p role="status" className="text-sm font-semibold">{copied ? "Link copiado. Válido por até 7 dias." : "Link para o cliente. Válido por até 7 dias."}</p>
            <button type="button" className="text-sm text-[#793751] underline" onClick={() => setLink("")}>Fechar</button>
          </div>
          <input aria-label="Link do orçamento" value={link} readOnly onFocus={event => event.target.select()} className="login-field" />
        </section>}

        {!loaded ? <p role="status" className="py-10 text-center text-sm text-[#695850]">Carregando orçamentos…</p>
          : filtered.length === 0 && !loadError ? <p className="rounded-xl border border-dashed border-[#ded0c8] bg-white p-8 text-center text-sm text-[#695850]">
            {normalizedQuery ? "Nenhum orçamento corresponde à busca." : "Ainda não há orçamentos cadastrados."}
          </p> : groups.map(group => {
            const members = filtered.filter(group.filter).sort((a, b) => {
              if (a.entregue || b.entregue) return 0;
              const aDelivery = deliveryStatus(a.data_entrega, today);
              const bDelivery = deliveryStatus(b.data_entrega, today);
              if (Boolean(aDelivery) !== Boolean(bDelivery)) return aDelivery ? -1 : 1;
              return aDelivery && bDelivery ? (a.data_entrega ?? "").localeCompare(b.data_entrega ?? "") : 0;
            });
            if (members.length === 0) return null;
            return (
              <section key={group.name} aria-label={group.name} className="mb-7">
                <h2 className="mb-3 font-serif text-2xl">{group.name} <span className="ml-1 font-sans text-sm text-[#695850]">{members.length}</span></h2>
                <div className="space-y-3">
                  {members.map(budget => (
                    <details key={budget.id} className="group rounded-2xl border border-[#e9dcd4] bg-white">
                      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-3 [&::-webkit-details-marker]:hidden">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold">{clientName(budget)}</h3>
                          {!budget.entregue && deliveryStatus(budget.data_entrega, today) && <span className="text-xs font-semibold text-[#883349]">{deliveryStatus(budget.data_entrega, today)}</span>}
                          <p className="mt-1 flex items-center gap-1 text-xs text-[#695850]">
                            <CalendarDays size={14} aria-hidden /> {budget.entregue ? "Emitido em " + formatDate(budget.created_at) : "Entrega: " + formatDate(budget.data_entrega)}
                          </p>
                        </div>
                        <strong className="shrink-0 text-sm text-[#793751]">{formatCurrency(budget.total)}</strong>
                        <ChevronDown size={17} aria-hidden className="shrink-0 text-[#695850] group-open:rotate-180" />
                      </summary>
                      <div className="space-y-4 border-t border-[#e9dcd4] px-4 py-4">
                        <ul className="space-y-2">
                          {budget.orcamento_itens?.map((item, index) => <li key={item.id ?? index} className="flex items-start justify-between gap-3 rounded-lg bg-[#faf6ef] p-3 text-sm">
                            <div className="min-w-0 break-words">
                              <p className="font-semibold">{item.quantidade} × {item.nome}</p>
                              {item.notas && <p className="mt-1 text-xs text-[#695850]">{item.notas}</p>}
                            </div>
                            <span className="shrink-0">{formatCurrency(item.total)}</span>
                          </li>)}
                        </ul>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" disabled={!!action} aria-pressed={budget.entregue} onClick={() => toggleStatus(budget, "entregue")} className="site-button site-secondary">
                            {budget.entregue ? "Marcar como não entregue" : "Marcar como entregue"}
                          </button>
                          <button type="button" disabled={!!action} aria-pressed={budget.pago} onClick={() => toggleStatus(budget, "pago")} className="site-button site-secondary">
                            {budget.pago ? "Marcar como não pago" : "Marcar como pago"}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/precificacao/orcamentos/novo?id=${encodeURIComponent(budget.id)}`} prefetch={false} className="site-button site-secondary">Editar</Link>
                          <button type="button" disabled={!!action} onClick={() => shareLink(budget)} className="site-button site-primary"><Link2 size={16} aria-hidden /> Copiar link</button>
                          <button type="button" disabled={!!action} onClick={() => exportImage(budget, true)} className="site-button site-secondary"><Share2 size={16} aria-hidden /> Compartilhar imagem</button>
                          <button type="button" disabled={!!action} onClick={() => exportImage(budget, false)} className="site-button site-secondary"><Download size={16} aria-hidden /> Baixar PNG</button>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            );
          })}
      </main>
      <BottomNav />

      {ticket && <div className="pointer-events-none fixed left-[-10000px] top-0" aria-hidden>
        <div ref={ticketRef} className="w-[480px] bg-[#faf6ef] p-7 text-[#29201f]">
          <header className="mb-4 border-b border-[#e9dcd4] pb-4">
            <p className="font-semibold text-[#793751]">Ateliê da Rê</p>
            <p className="mt-2 font-serif text-3xl">Orçamento</p>
            <p className="mt-2 break-words text-sm">{clientName(ticket)} · {formatDate(ticket.created_at)}</p>
          </header>
          <ul className="space-y-2">
            {ticket.orcamento_itens?.map((item, index) => (
              <li key={item.id ?? index} className="flex items-center gap-3 rounded-lg bg-white p-3">
                {item.produtos?.imagem_url ? <Image src={item.produtos.imagem_url} alt="" width={44} height={44} unoptimized loading="eager" crossOrigin="anonymous"
                  className="h-11 w-11 shrink-0 rounded-lg object-cover" /> : <Package size={20} className="shrink-0 text-[#793751]" />}
                <div className="min-w-0 flex-1 break-words text-sm">
                  <p className="font-semibold">{item.quantidade} × {item.nome}</p>
                  {item.notas && <p className="text-xs text-[#695850]">{item.notas}</p>}
                </div>
                <p className="shrink-0 text-sm">{formatCurrency(item.total)}</p>
              </li>
            ))}
          </ul>
          <p className="mt-5 flex justify-between rounded-lg bg-[#f6e7e7] p-3 font-bold"><span>Total</span>{formatCurrency(ticket.total)}</p>
          <p className="mt-3 text-sm text-[#695850]">Previsão de entrega: {formatDate(ticket.data_entrega)}</p>
        </div>
      </div>}
    </div>
  );
}
