"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, User, Lock, Star, Package, Pencil } from "lucide-react";
import { BottomNav } from "./_components/BottomNav";
import { TopTabs } from "./_components/TopTabs";
import { CustosTab, useConfiguracoes, calcularCustoHora, calcularTotalTaxPct } from "./_components/CustosTab";
import { MaterialFormModal, Material } from "./_components/MaterialManager";
import { supabase } from "@/lib/supabase";


interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  preco_final: number;
  imagem_url?: string;
  favorito: boolean;
  created_at: string;
  // raw fields for recalculation
  custo_materiais?: number;
  custo_trabalho?: number;
  tempo_trabalho?: number;
  margem_lucro?: number;
  rendimento?: number;
}

export default function PrecificacaoDashboard() {
  const [activeTab, setActiveTab] = useState("produtos");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const { config } = useConfiguracoes();

  useEffect(() => { fetchProdutos(); }, []);
  useEffect(() => {
    if (activeTab === "materiais") fetchMaterials();
    else if (activeTab === "produtos") fetchProdutos();
  }, [activeTab]);

  // Realtime subscriptions
  useEffect(() => {
    const produtosChannel = supabase
      .channel("produtos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "produtos" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setProdutos((prev) => [payload.new as Produto, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setProdutos((prev) => prev.map((p) => p.id === (payload.new as Produto).id ? payload.new as Produto : p));
        } else if (payload.eventType === "DELETE") {
          setProdutos((prev) => prev.filter((p) => p.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    const materiaisChannel = supabase
      .channel("materiais-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "materiais" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setMaterials((prev) => [...prev, payload.new as Material].sort((a, b) => a.nome.localeCompare(b.nome)));
        } else if (payload.eventType === "UPDATE") {
          setMaterials((prev) => prev.map((m) => m.id === (payload.new as Material).id ? payload.new as Material : m));
        } else if (payload.eventType === "DELETE") {
          setMaterials((prev) => prev.filter((m) => m.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(produtosChannel);
      supabase.removeChannel(materiaisChannel);
    };
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("materiais").select("*").order("nome");
      setMaterials(data || []);
    } catch (e) {
    } finally { setLoading(false); }
  };

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("produtos").select("*").order("created_at", { ascending: false });
      setProdutos(data || []);
    } catch (e) {
    } finally { setLoading(false); }
  };

  // Recalculate product price with current global settings
  const calcPrecoAtual = (p: Produto): number => {
    if (!p.tempo_trabalho && !p.custo_materiais) return p.preco_final || 0;
    const custoHora = calcularCustoHora(config);
    const taxPct = calcularTotalTaxPct(config);
    const labor = ((p.tempo_trabalho || 0) / 3600) * custoHora;
    const materiais = p.custo_materiais || 0;
    const total = materiais + labor;
    const lucro = total * ((p.margem_lucro || 0) / 100);
    const base = total + lucro;
    return base * (1 + taxPct / 100);
  };

  const totalEstoque = produtos.reduce((acc, p) => acc + calcPrecoAtual(p), 0);
  const tipoLabel = (tipo: string) => ({ "Comprimento": "/m", "Peso (kg)": "/kg", "Volume (l)": "/l", "Área": "/m²" }[tipo] || "/un");

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-24 font-sans antialiased selection:bg-purple-500/30">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#1e1e1e] border-b border-zinc-800 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <User className="text-purple-400" size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-100 leading-tight">Ateliê da Re</h1>
            <p className="text-[11px] font-medium text-purple-400 uppercase tracking-widest">Aromas e Artes</p>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-400">
          <Search size={20} />
        </button>
      </header>

      <main className="pt-6">
        {/* Welcome */}
        <div className="px-6 mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white">Olá, Regina! 👋</h2>
          <p className="text-zinc-500 mt-1">Pronta para precificar?</p>
        </div>

        {/* Summary Card */}
        <div className="mx-4 mb-6">
          {activeTab === "produtos" ? (
            <div className="p-6 rounded-3xl bg-purple-600 text-white shadow-xl shadow-purple-900/20">
              <p className="text-sm font-medium text-purple-100">Valor Total em Estoque</p>
              <p className="text-2xl font-bold mt-1 tracking-tight">
                R$ {totalEstoque.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-purple-200 mt-1">{produtos.length} produto{produtos.length !== 1 ? "s" : ""}</p>
            </div>
          ) : activeTab === "materiais" ? (
            <div className="p-6 rounded-3xl bg-[#1e1e1e] border border-zinc-800 text-white shadow-lg">
              <p className="text-sm font-medium text-zinc-500">Materiais Cadastrados</p>
              <p className="text-2xl font-bold mt-1 tracking-tight">{materials.length} {materials.length === 1 ? "item" : "itens"}</p>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-[#1e1e1e] border border-zinc-800 text-white shadow-lg">
              <p className="text-sm font-medium text-zinc-500">Configurações de Custos</p>
              <p className="text-2xl font-bold mt-1 tracking-tight">
                R$ {calcularCustoHora(config).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <TopTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === "custos" ? (
          <CustosTab />
        ) : (
          <div className="px-4 space-y-3 pb-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              </div>
            ) : activeTab === "produtos" ? (
              produtos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
                  <div className="w-16 h-16 rounded-full bg-zinc-800/30 flex items-center justify-center mb-4">
                    <Package size={32} />
                  </div>
                  <p className="text-sm font-medium">Nenhum produto cadastrado</p>
                  <p className="text-xs text-zinc-700 mt-1">Toque no + para criar</p>
                </div>
              ) : (
                produtos.map((p) => {
                  const preco = calcPrecoAtual(p);
                  return (
                    <Link key={p.id} href={`/precificacao/novo?id=${p.id}`} className="bg-[#1e1e1e] rounded-2xl p-4 flex items-center gap-4 border border-zinc-800/50 active:bg-zinc-800/50 transition-colors block">
                      <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                        {p.imagem_url ? (
                          <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={22} className="text-zinc-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-100 truncate">{p.nome}</p>
                        {p.descricao && <p className="text-xs text-zinc-500 truncate">{p.descricao}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {p.favorito && <Star size={14} className="text-yellow-400 fill-yellow-400" />}
                        <span className="text-sm font-bold text-sky-400">
                          R$ {preco.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <Pencil size={14} className="text-zinc-600" />
                      </div>
                    </Link>
                  );
                })
              )
            ) : (
              // Materiais tab
              materials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
                  <div className="w-16 h-16 rounded-full bg-zinc-800/30 flex items-center justify-center mb-4">
                    <Plus size={32} />
                  </div>
                  <p className="text-sm font-medium">Nenhum material cadastrado</p>
                </div>
              ) : (
                materials.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setEditingMaterial(m)}
                    style={{ touchAction: "manipulation" }}
                    className="w-full bg-[#1e1e1e] rounded-2xl p-4 flex items-center gap-4 border border-zinc-800/50 text-left active:bg-zinc-800/50 transition-colors"
                  >
                    <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      {m.imagem_url ? (
                        <img src={m.imagem_url} alt={m.nome} className="w-full h-full object-cover" />
                      ) : (
                        <Lock size={20} className="text-zinc-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-100 truncate">{m.nome}</p>
                      <p className="text-xs text-zinc-500">{m.tipo_medida}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-purple-400">
                        R$ {(m.preco_unitario || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{tipoLabel(m.tipo_medida)}
                      </span>
                      <Pencil size={14} className="text-zinc-600" />
                    </div>
                  </button>
                ))
              )
            )}
          </div>
        )}
      </main>

      {/* FAB - hidden on custos tab */}
      {activeTab !== "custos" && (
        activeTab === "materiais" ? (
          <button
            onClick={() => setShowMaterialForm(true)}
            className="fixed right-6 bottom-24 w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-purple-900/40 active:scale-95 transition-transform z-50"
            style={{ touchAction: "manipulation" }}
          >
            <Plus size={28} />
          </button>
        ) : (
          <Link
            href="/precificacao/novo"
            className="fixed right-6 bottom-24 w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-purple-900/40 active:scale-95 transition-transform z-50"
          >
            <Plus size={28} />
          </Link>
        )
      )}

      {/* Material Form Modal (create or edit) */}
      {(showMaterialForm || editingMaterial) && (
        <MaterialFormModal
          material={editingMaterial || undefined}
          onClose={() => { setShowMaterialForm(false); setEditingMaterial(null); }}
          onSave={() => {
            setShowMaterialForm(false);
            setEditingMaterial(null);
            fetchMaterials();
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}
