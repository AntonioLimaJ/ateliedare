"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Package, Pencil, Plus, Search, Star } from "lucide-react";
import { BottomNav } from "./_components/BottomNav";
import { TopTabs } from "./_components/TopTabs";
import { useConfiguracoes, calcularCustoHora, calcularTotalTaxPct } from "@/lib/use-configuracoes";
import type { Material } from "./_components/MaterialManager";
import { getSupabase } from "@/lib/supabase";
import { formatCurrency, searchText, type Produto } from "@/lib/atelie";
import { signOut } from "@/app/entrar/actions";

const MaterialFormModal = dynamic(() => import("./_components/MaterialManager").then(m => m.MaterialFormModal));
const CustosTab = dynamic(() => import("./_components/CustosTab").then(m => m.CustosTab));

export default function PrecificacaoDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("produtos");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadedTab, setLoadedTab] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [materialForm, setMaterialForm] = useState<Material | "new" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const costSettings = useConfiguracoes();
  const { config } = costSettings;

  useEffect(() => {
    if (activeTab === "custos") return;

    const supabase = getSupabase();
    const isMaterials = activeTab === "materiais";
    const table = isMaterials ? "materiais" : "produtos";
    let controller: AbortController | undefined;
    let stale = false;
    let subscribed = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    async function refresh() {
      controller?.abort();
      const current = new AbortController();
      controller = current;
      const { data, error: responseError } = await supabase
        .from(table).select("*")
        .order(isMaterials ? "nome" : "created_at", { ascending: isMaterials })
        .abortSignal(AbortSignal.any([current.signal, AbortSignal.timeout(10000)]));

      if (stale || current.signal.aborted) return;
      if (responseError) {
        setError("Não foi possível atualizar os dados. Confira a conexão e tente novamente.");
      } else {
        if (isMaterials) setMaterials(data ?? []);
        else setProdutos(data ?? []);
        setError("");
      }
      setLoadedTab(table);
    }

    function scheduleRefresh() {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => { void refresh(); }, 120);
    }

    const channel = supabase.channel(`atelie-${table}-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, scheduleRefresh)
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        if (subscribed) scheduleRefresh();
        subscribed = true;
      });

    const onVisible = () => { if (document.visibilityState === "visible") scheduleRefresh(); };
    const onOffline = () => setError("Você está sem internet. Os dados serão atualizados quando a conexão voltar.");
    window.addEventListener("online", scheduleRefresh);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);
    void refresh();

    return () => {
      stale = true;
      controller?.abort();
      clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
      window.removeEventListener("online", scheduleRefresh);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [activeTab, retry]);

  const changeTab = useCallback((tab: string) => {
    setActiveTab(tab);
    setSearchQuery("");
    setError("");
  }, []);

  const materialTab = activeTab === "materiais";
  const costTab = activeTab === "custos";
  const loading = !costTab && loadedTab !== activeTab;
  const search = searchText(searchQuery);
  const materialsFound = materials.filter(item => searchText(item.nome).includes(search));
  const productsFound = produtos.filter(item => searchText(item.nome).includes(search));
  const count = materialTab ? materialsFound.length : productsFound.length;
  const hourlyRate = calcularCustoHora(config);
  const taxRate = calcularTotalTaxPct(config);

  const currentPrice = (product: Produto) => {
    if (costSettings.loading || costSettings.configError || (!product.tempo_trabalho && !product.custo_materiais)) return Number(product.preco_final || 0);
    const labor = Number(product.tempo_trabalho || 0) / 3600 * hourlyRate;
    const suggested = (Number(product.custo_materiais || 0) + labor)
      * (1 + Number(product.margem_lucro || 0) / 100) * (1 + taxRate / 100);
    const original = Number(product.preco_sugerido || 0);
    const final = Number(product.preco_final || 0);
    return original > 0 && Math.abs(final - original) > 0.01 ? suggested * final / original : suggested;
  };

  const addItem = () => {
    if (materialTab) setMaterialForm("new");
    else router.push("/precificacao/novo");
  };

  return (
    <div className="min-h-svh bg-[#faf6ef] pb-24 text-[#29201f]">
      <header className="sticky top-0 z-40 border-b border-[#e9dcd4] bg-[#fffdf9]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-7">
          <Link href="/" className="flex min-h-11 items-center gap-3 font-semibold">
            <Image src="/icon-192.png" alt="" width={39} height={39} className="rounded-full" />
            Ateliê da Rê
          </Link>
          <form action={signOut}>
            <button type="submit" className="site-button site-secondary"><LogOut size={16} aria-hidden /> Sair</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-7 sm:px-7 sm:pt-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">Precificação</h1>
            <p className="mt-2 text-sm text-[#695850]">Gerencie produtos, materiais e custos do ateliê.</p>
          </div>
          {!costTab && <button onClick={addItem} className="site-button site-primary">
            <Plus size={19} aria-hidden /> {materialTab ? "Novo material" : "Novo produto"}
          </button>}
        </div>

        <div className="mt-6">
          <TopTabs activeTab={activeTab} onTabChange={changeTab} />
        </div>

        {costTab ? <CustosTab {...costSettings} /> : (
          <section aria-label={materialTab ? "Materiais cadastrados" : "Produtos cadastrados"}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ead9d8] bg-[#f6e7e7] p-4 sm:p-5">
              <div>
                <p className="text-sm text-[#6b4352]">{materialTab ? "Materiais cadastrados" : "Valor dos produtos listados"}</p>
                <p className="mt-1 text-2xl font-bold text-[#793751]">
                  {loading ? "—" : materialTab ? count : formatCurrency(productsFound.reduce((sum, item) => sum + currentPrice(item), 0))}
                </p>
              </div>
              <label className="relative w-full sm:w-64">
                <span className="sr-only">{materialTab ? "Pesquisar materiais" : "Pesquisar produtos"}</span>
                <Search size={17} aria-hidden className="pointer-events-none absolute left-3 top-3.5 text-[#695850]" />
                <input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder={materialTab ? "Pesquisar materiais" : "Pesquisar produtos"}
                  className="h-11 w-full rounded-xl border border-[#e9dcd4] bg-white pl-9 pr-3 text-sm" />
              </label>
            </div>

            {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e8bdc9] bg-[#fff5f7] p-4 text-sm text-[#883349]">
              <span>{error}</span>
              <button onClick={() => setRetry(value => value + 1)} className="site-button site-secondary">Tentar novamente</button>
            </div>}

            {loading ? <p role="status" className="py-12 text-center text-sm text-[#695850]">Carregando…</p>
              : count === 0 && !error ? (
              <div className="rounded-2xl border border-dashed border-[#ded0c8] bg-[#fffdf9] px-5 py-12 text-center">
                <Package size={30} className="mx-auto text-[#793751]" aria-hidden />
                <p className="mt-3 font-semibold">{search ? "Nenhum resultado encontrado" : materialTab ? "Nenhum material cadastrado" : "Nenhum produto cadastrado"}</p>
                {!search && <button className="site-button site-secondary mt-4" onClick={addItem}>{materialTab ? "Cadastrar material" : "Cadastrar produto"}</button>}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {materialTab ? materialsFound.map(material => (
                  <button key={material.id} onClick={() => setMaterialForm(material)} className="panel-item text-left">
                    <ItemImage url={material.imagem_url} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{material.nome}</p>
                      <p className="text-xs text-[#695850]">{material.tipo_medida}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-[#793751]">{formatCurrency(material.preco_unitario)}</span>
                    <Pencil size={15} className="shrink-0 text-[#695850]" aria-hidden />
                  </button>
                )) : productsFound.map(product => (
                  <Link key={product.id} href={`/precificacao/novo?id=${encodeURIComponent(product.id)}`} prefetch={false} className="panel-item">
                    <ItemImage url={product.imagem_url} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 text-sm font-bold">
                        <span className="truncate">{product.nome}</span>
                        {product.favorito && <Star size={13} fill="currentColor" className="shrink-0 text-amber-700" aria-label="Favorito" />}
                      </p>
                      {product.descricao && <p className="truncate text-xs text-[#695850]">{product.descricao}</p>}
                    </div>
                    <span className="shrink-0 text-sm font-bold text-[#793751]">{formatCurrency(currentPrice(product))}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {materialForm && <MaterialFormModal material={materialForm === "new" ? undefined : materialForm}
        onClose={() => setMaterialForm(null)} onDeleteSuccess={() => {
          setMaterialForm(null);
          setRetry(value => value + 1);
        }} onSave={() => {
          setMaterialForm(null);
          setRetry(value => value + 1);
        }} />}
      <BottomNav />
    </div>
  );
}

function ItemImage({ url }: { url?: string | null }) {
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f6e7e7] text-[#793751]">
      {url ? <Image src={url} alt="" width={48} height={48} unoptimized className="h-full w-full object-cover" />
        : <Package size={21} aria-hidden />}
    </div>
  );
}
