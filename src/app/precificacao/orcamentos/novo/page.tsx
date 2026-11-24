"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Check, Plus, Trash2, User, Package, Calendar, StickyNote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSupabase } from "@/lib/supabase";
import { ProductSelectionModal } from "../../_components/ProductSelectionModal";
import { ProductUsageModal } from "../../_components/ProductUsageModal";
import Image from "next/image";
import { getUnitPrice, money, type Cliente, type ItemOrcamento, type Orcamento, type Produto } from "@/lib/atelie";

export default function NovoOrcamento() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E5989B]/20 border-t-[#E5989B] rounded-full animate-spin" />
      </div>
    }>
      <NovoOrcamentoContent />
    </Suspense>
  );
}

function NovoOrcamentoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  const createOperation = useRef<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [cliente, setCliente] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ query: string; values: Cliente[] }>({ query: "", values: [] });
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [dataEntrega, setDataEntrega] = useState("");
  const [itens, setItens] = useState<ItemOrcamento[]>([]);

  // Modais de Itens
  const [showProductSelection, setShowProductSelection] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);

  const totalSugerido = money(itens.reduce((acc, item) => acc + Number(item.total || 0), 0));
  const [totalPersonalizado, setTotalPersonalizado] = useState<number | null>(null);
  const totalFinal = totalPersonalizado ?? totalSugerido;
  const descontoValor = Math.max(0, totalSugerido - totalFinal);
  const descontoPct = totalSugerido > 0 ? (descontoValor / totalSugerido) * 100 : 0;

  useEffect(() => {
    if (!editId) return;
    const controller = new AbortController();

    async function load() {
      const { data, error: loadError } = await getSupabase().from("orcamentos")
        .select("*, clientes(nome), orcamento_itens(*, produtos(imagem_url))")
        .eq("id", editId).abortSignal(controller.signal).single();
      if (controller.signal.aborted) return;
      if (loadError || !data) {
        setError("Não foi possível carregar o orçamento. Volte à lista e tente novamente.");
        return;
      }

      const budget = data as Orcamento;
      setCliente(budget.clientes?.nome || budget.nome_cliente_manual || "");
      setClienteId(budget.cliente_id);
      setDataEntrega(budget.data_entrega?.slice(0, 10) || "");
      const items = budget.orcamento_itens ?? [];
      setItens(items.map(item => ({
        ...item, imagem_url: item.imagem_url || item.produtos?.imagem_url,
        total: Number(item.total), preco_unitario: Number(item.preco_unitario),
      })));
      const itemTotal = money(items.reduce((sum, item) => sum + Number(item.total || 0), 0));
      const storedTotal = Number(budget.total || 0);
      setTotalPersonalizado(Math.abs(storedTotal - itemTotal) >= 0.01 ? storedTotal : null);
      setLoadedId(editId);
    }

    void load();
    return () => controller.abort();
  }, [editId]);

  useEffect(() => {
    const query = cliente.trim();
    if (!mostrarSugestoes || clienteId || query.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const escaped = query.replace(/[\\%_]/g, char => "\\" + char);
      const { data } = await getSupabase().from("clientes").select("id,nome")
        .ilike("nome", "%" + escaped + "%").order("nome").limit(5).abortSignal(controller.signal);
      if (!controller.signal.aborted) setSuggestions({ query, values: data ?? [] });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [cliente, clienteId, mostrarSugestoes]);

  const sugestoes = suggestions.query === cliente.trim() ? suggestions.values : [];
  const ready = !editId || loadedId === editId;

  const handleSave = async () => {
    if (busy.current || !ready) return;
    if ((!cliente.trim() && itens.length === 0) || !Number.isFinite(totalFinal) || totalFinal < 0) {
      setError("Adicione um cliente ou pelo menos um item e informe um valor válido.");
      return;
    }

    busy.current = true;
    setLoading(true);
    setError("");
    try {
      if (!editId) createOperation.current ??= crypto.randomUUID();
      const { error: saveError } = await getSupabase().rpc("ateliedare_salvar_orcamento", {
        p_id: editId,
        p_operacao: editId ? null : createOperation.current,
        p_orcamento: {
          cliente_id: clienteId, nome_cliente_manual: cliente.trim(), total: money(totalFinal), data_entrega: dataEntrega || null,
        },
        p_itens: itens.map(item => ({
          produto_id: item.produto_id, nome: item.nome, quantidade: item.quantidade,
          preco_unitario: item.preco_unitario, total: item.total, notas: item.notas ?? null,
        })),
      });
      if (saveError) throw saveError;
      router.replace("/precificacao/orcamentos");
    } catch {
      setError("Não foi possível salvar o orçamento. Seus dados continuam no formulário. Tente novamente.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (busy.current || !editId || !ready || !confirm("Deseja excluir este orçamento e seus itens?")) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      const { error: deleteError } = await getSupabase().rpc("ateliedare_excluir_orcamento", { p_id: editId });
      if (deleteError) throw deleteError;
      router.replace("/precificacao/orcamentos");
    } catch {
      setError("Não foi possível excluir o orçamento. Tente novamente.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  const selecionarCliente = (client: Cliente) => {
    setCliente(client.nome);
    setClienteId(client.id);
    setMostrarSugestoes(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D2D2D] pb-32 font-sans">
      <header className="sticky top-0 z-50 bg-[#793751] px-4 py-4 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/precificacao/orcamentos")} aria-label="Voltar aos orçamentos" className="p-2 -ml-2">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">{editId ? "Editar orçamento" : "Novo orçamento"}</h1>
        </div>
        <button onClick={handleSave} aria-label="Salvar orçamento" disabled={loading || !ready} className="p-2 -mr-2">
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Check size={24} />
          )}
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6 mt-4">
        {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {!ready && !error && <p role="status" className="p-4 text-sm">Carregando orçamento…</p>}
        {/* Seção Cliente */}
        <section className="bg-white rounded-[32px] p-6 shadow-xl border border-[#F0E6E6] relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#F8EDEB] flex items-center justify-center">
              <User size={20} className="text-[#793751]" />
            </div>
            <h2 className="text-lg font-bold">Cliente</h2>
          </div>

          <div className="relative">
            <div className="bg-transparent border border-[#F0E6E6] rounded-2xl px-6 py-4 flex items-center gap-3 focus-within:border-[#E5989B] transition-colors">
              <input
                type="text"
                aria-label="Nome do cliente"
                placeholder="Nome do cliente"
                value={cliente}
                onChange={(e) => {
                  setCliente(e.target.value);
                  setClienteId(null);
                  setMostrarSugestoes(true);
                }}
                onFocus={() => setMostrarSugestoes(true)}
                onKeyDown={event => { if (event.key === "Escape") setMostrarSugestoes(false); }}
                className="w-full bg-transparent outline-none text-[#2D2D2D] placeholder-[#695850] font-medium"
              />
            </div>

            {/* Dropdown de Sugestões */}
            <AnimatePresence>
              {mostrarSugestoes && sugestoes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-[#F0E6E6] shadow-2xl z-[100] overflow-hidden"
                >
                  {sugestoes.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selecionarCliente(c)}
                      className="w-full px-6 py-4 text-left hover:bg-[#FAF7F2] flex items-center gap-3 transition-colors border-b border-[#F0E6E6] last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#F8EDEB] flex items-center justify-center">
                        <User size={14} className="text-[#793751]" />
                      </div>
                      <span className="font-medium text-[#2D2D2D]">{c.nome}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Seção Itens */}
        <section className="bg-white rounded-[32px] p-6 shadow-xl border border-[#F0E6E6]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-[#F8EDEB] flex items-center justify-center">
                <Package size={20} className="text-[#793751]" />
              </div>
              <h2 className="text-lg font-bold">Itens</h2>
            </div>
            <button
              onClick={() => setShowProductSelection(true)}
              className="bg-[#F8EDEB] text-[#793751] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 active:scale-95 transition-transform"
            >
              <Plus size={16} />
              Adicionar
            </button>
          </div>

          {itens.length === 0 ? (
            <div className="text-center py-10 bg-[#FAF7F2] rounded-3xl border border-dashed border-[#F0E6E6]">
              <p className="text-sm font-medium text-[#695850]">Nenhum item adicionado</p>
              <p className="text-xs text-[#695850] mt-1">Selecione produtos para orçar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {itens.map((item, index) => (
                <div key={index} className="flex flex-col bg-white rounded-2xl border border-[#F0E6E6] shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#FAF7F2] overflow-hidden border border-[#F0E6E6] flex-shrink-0">
                      {item.imagem_url ? (
                        <Image src={item.imagem_url} alt="" width={48} height={48} unoptimized className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={18} className="text-[#793751]/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-[#2D2D2D] text-sm truncate">{item.nome}</h3>
                        <button
                          aria-label={"Remover " + item.nome}
                          onClick={() => setItens(itens.filter((_, i) => i !== index))}
                          className="p-1 text-red-400/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-[#6D6D6D]">{item.quantidade}x R$ {item.preco_unitario.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-sm font-bold text-[#2D2D2D]">R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                  {item.notas && (
                    <div className="px-4 pb-4 flex gap-2 items-start">
                      <StickyNote size={14} className="text-[#793751] mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-[#6D6D6D] leading-relaxed italic">{item.notas}</p>
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-2 border-t border-[#F0E6E6] flex justify-between items-center">
                <span className="text-sm font-bold text-[#2D2D2D]">Preço Total</span>
                <span className="text-lg font-bold text-[#6D6D6D]">R$ {totalSugerido.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
        </section>

        {/* Resumo Financeiro */}
        <section className="bg-white rounded-[32px] p-6 space-y-6 shadow-xl border border-[#F0E6E6]">
          <h2 className="text-xl font-bold text-[#2D2D2D]">Resumo Financeiro</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#6D6D6D] font-medium">Preço Total</span>
              <span className="text-[#2D2D2D] font-bold">R$ {totalSugerido.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="space-y-2">
              <label htmlFor="valor-reajuste" className="text-xs font-bold text-[#695850] uppercase tracking-widest">Valor com reajuste</label>
              <div className="bg-[#FAF7F2] border border-[#F0E6E6] rounded-2xl px-6 py-4 flex items-center gap-3 focus-within:border-[#E5989B] transition-colors">
                <span className="text-[#695850] font-bold">R$</span>
                <input
                  type="number"
                  id="valor-reajuste"
                  min="0"
                  step="0.01"
                  placeholder={totalSugerido.toFixed(2)}
                  value={totalPersonalizado ?? ""}
                  onChange={(e) => setTotalPersonalizado(e.target.value === "" ? null : Number(e.target.value))}
                  className="w-full bg-transparent outline-none text-[#2D2D2D] font-bold text-xl"
                />
              </div>
            </div>

            <AnimatePresence>
              {descontoValor > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Desconto Aplicado</span>
                    <span className="text-sm font-bold text-green-700">- R$ {descontoValor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-black">
                    {descontoPct.toFixed(0)}% OFF
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-4 border-t border-[#F0E6E6] flex justify-between items-center">
              <span className="text-base font-bold text-[#2D2D2D]">Total a Pagar</span>
              <span className="text-2xl font-black text-[#793751]">R$ {totalFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </section>

        {/* Seção Data de Entrega */}
        <section className="bg-white rounded-[32px] p-6 shadow-xl border border-[#F0E6E6]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#F8EDEB] flex items-center justify-center">
              <Calendar size={20} className="text-[#793751]" />
            </div>
            <h2 className="text-lg font-bold">Data de Entrega</h2>
          </div>
          <div className="bg-transparent border border-[#F0E6E6] rounded-2xl px-6 py-4">
            <input
              type="date"
              value={dataEntrega}
              onChange={(e) => setDataEntrega(e.target.value)}
              className="w-full bg-transparent outline-none text-[#2D2D2D] font-medium"
            />
          </div>
        </section>

        {/* Ações Finais */}
        <div className="space-y-3 pt-6">
          <button
            onClick={handleSave}
            disabled={loading || !ready}
            className={`w-full py-5 bg-[#793751] text-white font-bold rounded-[20px] shadow-lg transition-all ${loading ? "opacity-60" : "hover:bg-[#632942] active:scale-[0.98]"}`}
          >
            {loading ? "Salvando..." : (editId ? "Salvar alterações" : "Salvar orçamento")}
          </button>
          <button
            onClick={() => router.back()}
            disabled={loading || !ready}
            className="w-full py-5 border border-[#F0E6E6] hover:bg-[#F8EDEB] text-[#2D2D2D] font-bold rounded-[20px] transition-colors"
          >
            Cancelar
          </button>
          {editId && (
            <button
              onClick={handleDelete}
              disabled={loading || !ready}
              className="w-full py-5 border border-[#F0E6E6] hover:bg-red-50 text-red-400 font-bold rounded-[20px] transition-colors"
            >
              Deletar orçamento
            </button>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showProductSelection && (
          <ProductSelectionModal
            onClose={() => setShowProductSelection(false)}
            onSelect={(p) => {
              setSelectedProduct(p);
              setShowProductSelection(false);
            }}
          />
        )}
        {selectedProduct && (
          <ProductUsageModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onConfirm={(data) => {
              setItens([...itens, {
                produto_id: selectedProduct.id,
                nome: selectedProduct.nome,
                imagem_url: selectedProduct.imagem_url,
                preco_unitario: getUnitPrice(selectedProduct),
                ...data
              }]);
              setSelectedProduct(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
