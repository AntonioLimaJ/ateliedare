"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Check, Plus, Trash2, User, Package, Calendar, StickyNote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { ProductSelectionModal } from "../../_components/ProductSelectionModal";
import { ProductUsageModal } from "../../_components/ProductUsageModal";

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
  const [cliente, setCliente] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [dataEntrega, setDataEntrega] = useState("");
  const [itens, setItens] = useState<any[]>([]);

  // Modais de Itens
  const [showProductSelection, setShowProductSelection] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const totalSugerido = itens.reduce((acc, item) => acc + item.total, 0);
  const [totalPersonalizado, setTotalPersonalizado] = useState<number | null>(null);
  const totalFinal = totalPersonalizado ?? totalSugerido;
  const descontoValor = Math.max(0, totalSugerido - totalFinal);
  const descontoPct = totalSugerido > 0 ? (descontoValor / totalSugerido) * 100 : 0;

  // Carregar dados se for edição
  useEffect(() => {
    if (!editId) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: orc, error: orcError } = await supabase
          .from("orcamentos")
          .select("*, orcamento_itens(*, produtos(imagem_url))")
          .eq("id", editId)
          .single();

        if (orcError) throw orcError;

        if (orc) {
          setCliente(orc.cliente_id ? "" : (orc.nome_cliente_manual || ""));
          setClienteId(orc.cliente_id);
          setDataEntrega(orc.data_entrega || "");
          setTotalPersonalizado(orc.total);
          
          if (orc.orcamento_itens) {
            setItens(orc.orcamento_itens.map((item: any) => ({
              produto_id: item.produto_id,
              nome: item.nome,
              imagem_url: item.imagem_url || item.produtos?.imagem_url,
              quantidade: item.quantidade,
              preco_unitario: item.preco_unitario,
              total: item.total,
              notas: item.notas
            })));
          }

          // Se tiver cliente_id, buscar o nome do cliente
          if (orc.cliente_id) {
            const { data: cli } = await supabase.from("clientes").select("nome").eq("id", orc.cliente_id).single();
            if (cli) setCliente(cli.nome);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar orçamento:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [editId]);

  const handleSave = async () => {
    console.log("Iniciando salvamento...", { cliente, clienteId, itens, totalFinal });
    
    if (!cliente.trim() && itens.length === 0) {
      alert("Adicione pelo menos um cliente ou um item ao orçamento.");
      return;
    }

    setLoading(true);
    try {
      let finalClienteId = clienteId;

      // Se não selecionou um cliente da lista, tentar encontrar ou criar um novo
      if (!finalClienteId && cliente.trim()) {
        console.log("Verificando/Criando cliente:", cliente.trim());
        const { data: existingCli } = await supabase
          .from("clientes")
          .select("id")
          .ilike("nome", cliente.trim())
          .maybeSingle();

        if (existingCli) {
          finalClienteId = existingCli.id;
          console.log("Cliente encontrado:", finalClienteId);
        } else {
          const { data: newCli, error: cliError } = await supabase
            .from("clientes")
            .insert([{ nome: cliente.trim() }])
            .select()
            .single();
          
          if (cliError) throw cliError;
          finalClienteId = newCli.id;
          console.log("Novo cliente criado:", finalClienteId);
        }
      }

      const payload = {
        cliente_id: finalClienteId,
        nome_cliente_manual: finalClienteId ? null : cliente.trim(),
        total: totalFinal,
        data_entrega: dataEntrega || null,
        status: 'Pendente'
      };

      console.log("Enviando payload do orçamento:", payload);

      let orcamentoId = editId;

      if (editId) {
        const { error: orcError } = await supabase
          .from("orcamentos")
          .update(payload)
          .eq("id", editId);
        if (orcError) throw orcError;
      } else {
        const { data: orcamento, error: orcError } = await supabase
          .from("orcamentos")
          .insert([payload])
          .select()
          .single();
        if (orcError) throw orcError;
        orcamentoId = orcamento.id;
      }

      // 2. Inserir os itens do orçamento
      if (orcamentoId && itens.length > 0) {
        console.log("Inserindo itens para o orçamento:", orcamentoId);
        // Se for edição, remover itens antigos primeiro
        if (editId) {
          const { error: delError } = await supabase.from("orcamento_itens").delete().eq("orcamento_id", editId);
          if (delError) throw delError;
        }

        const itemsPayload = itens.map(item => ({
          orcamento_id: orcamentoId,
          produto_id: item.produto_id,
          nome: item.nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          total: item.total,
          notas: item.notas
        }));

        console.log("Enviando payload de itens:", itemsPayload);

        const { error: itensError } = await supabase
          .from("orcamento_itens")
          .insert(itemsPayload);

        if (itensError) throw itensError;
      }

      console.log("Orçamento salvo com sucesso!");
      router.push("/precificacao/orcamentos");
    } catch (error: any) {
      console.error("Erro ao salvar orçamento:", error);
      alert(`Erro ao salvar: ${error.message || "Tente novamente"}`);
    } finally {
      setLoading(false);
    }
  };

  const buscarClientes = async (term: string) => {
    setCliente(term);
    if (term.length < 2) {
      setSugestoes([]);
      setMostrarSugestoes(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("clientes")
        .select("id, nome")
        .ilike("nome", `%${term}%`)
        .limit(5);

      setSugestoes(data || []);
      setMostrarSugestoes(true);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  const selecionarCliente = (c: any) => {
    setCliente(c.nome);
    setClienteId(c.id);
    setMostrarSugestoes(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D2D2D] pb-32 font-sans">
      <header className="sticky top-0 z-50 bg-[#E5989B] px-4 py-4 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Novo Orçamento</h1>
        </div>
        <button onClick={handleSave} disabled={loading} className="p-2 -mr-2">
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Check size={24} />
          )}
        </button>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6 mt-4">
        {/* Seção Cliente */}
        <section className="bg-white rounded-[32px] p-6 shadow-xl border border-[#F0E6E6] relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#F8EDEB] flex items-center justify-center">
              <User size={20} className="text-[#E5989B]" />
            </div>
            <h2 className="text-lg font-bold">Cliente</h2>
          </div>

          <div className="relative">
            <div className="bg-transparent border border-[#F0E6E6] rounded-2xl px-6 py-4 flex items-center gap-3 focus-within:border-[#E5989B] transition-colors">
              <input
                type="text"
                placeholder="Nome do cliente"
                value={cliente}
                onChange={(e) => {
                  buscarClientes(e.target.value);
                  if (clienteId) setClienteId(null);
                }}
                onFocus={() => cliente.length >= 2 && setMostrarSugestoes(true)}
                className="w-full bg-transparent outline-none text-[#2D2D2D] placeholder-[#9E9E9E] font-medium"
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
                        <User size={14} className="text-[#E5989B]" />
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
                <Package size={20} className="text-[#E5989B]" />
              </div>
              <h2 className="text-lg font-bold">Itens</h2>
            </div>
            <button
              onClick={() => setShowProductSelection(true)}
              className="bg-[#F8EDEB] text-[#E5989B] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 active:scale-95 transition-transform"
            >
              <Plus size={16} />
              Adicionar
            </button>
          </div>

          {itens.length === 0 ? (
            <div className="text-center py-10 bg-[#FAF7F2] rounded-3xl border border-dashed border-[#F0E6E6]">
              <p className="text-sm font-medium text-[#9E9E9E]">Nenhum item adicionado</p>
              <p className="text-xs text-[#9E9E9E] mt-1">Selecione produtos para orçar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {itens.map((item, index) => (
                <div key={index} className="flex flex-col bg-white rounded-2xl border border-[#F0E6E6] shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#FAF7F2] overflow-hidden border border-[#F0E6E6] flex-shrink-0">
                      {item.imagem_url ? (
                        <img src={item.imagem_url} alt={item.nome} className="w-full h-full object-cover" crossOrigin="anonymous" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={18} className="text-[#E5989B]/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-[#2D2D2D] text-sm truncate">{item.nome}</h3>
                        <button
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
                      <StickyNote size={14} className="text-[#E5989B] mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-[#6D6D6D] leading-relaxed italic">"{item.notas}"</p>
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
              <label className="text-xs font-bold text-[#9E9E9E] uppercase tracking-widest">Valor com Reajuste</label>
              <div className="bg-[#FAF7F2] border border-[#F0E6E6] rounded-2xl px-6 py-4 flex items-center gap-3 focus-within:border-[#E5989B] transition-colors">
                <span className="text-[#9E9E9E] font-bold">R$</span>
                <input
                  type="number"
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
              <span className="text-2xl font-black text-[#E5989B]">R$ {totalFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </section>

        {/* Seção Data de Entrega */}
        <section className="bg-white rounded-[32px] p-6 shadow-xl border border-[#F0E6E6]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#F8EDEB] flex items-center justify-center">
              <Calendar size={20} className="text-[#E5989B]" />
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
            disabled={loading}
            className={`w-full py-5 bg-[#E5989B] text-white font-bold rounded-[20px] shadow-lg transition-all ${loading ? "opacity-60" : "hover:bg-[#D4A5A5] active:scale-[0.98]"}`}
          >
            {loading ? "Salvando..." : (editId ? "Salvar alterações" : "Salvar orçamento")}
          </button>
          <button
            onClick={() => router.back()}
            disabled={loading}
            className="w-full py-5 border border-[#F0E6E6] hover:bg-[#F8EDEB] text-[#2D2D2D] font-bold rounded-[20px] transition-colors"
          >
            Cancelar
          </button>
          {editId && (
            <button
              onClick={async () => {
                if (confirm("Deseja realmente deletar este orçamento?")) {
                  const { error } = await supabase.from("orcamentos").delete().eq("id", editId);
                  if (error) alert("Erro ao deletar");
                  else router.push("/precificacao/orcamentos");
                }
              }}
              disabled={loading}
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
                preco_unitario: selectedProduct.preco_final,
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
