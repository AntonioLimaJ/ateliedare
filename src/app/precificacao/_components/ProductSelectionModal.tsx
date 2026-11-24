"use client";

import { useState, useEffect } from "react";
import { X, Search, Package, Plus } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { formatCurrency, getUnitPrice, searchText, type Produto } from "@/lib/atelie";
import { getSupabase } from "@/lib/supabase";

interface ProductSelectionModalProps {
  onClose: () => void;
  onSelect: (product: Produto) => void;
}

export function ProductSelectionModal({ onClose, onSelect }: ProductSelectionModalProps) {
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      const { data, error: loadError } = await getSupabase()
        .from("produtos").select("id,nome,preco_final,rendimento,imagem_url")
        .order("nome").abortSignal(controller.signal);
      if (controller.signal.aborted) return;
      if (loadError) setError("Não foi possível carregar os produtos.");
      else {
        setProducts(data ?? []);
        setError("");
      }
      setLoading(false);
    }

    void load();
    return () => controller.abort();
  }, [retry]);

  const filtered = products.filter(p => searchText(p.nome).includes(searchText(search)));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        <header className="p-6 border-b border-[#F0E6E6] flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-[#2D2D2D]">Selecionar Produto</h2>
            <p className="text-xs text-[#6D6D6D]">Escolha um produto para o orçamento</p>
          </div>
          <button onClick={onClose} aria-label="Fechar seleção de produto" className="p-2 hover:bg-[#FAF7F2] rounded-full transition-colors">
            <X size={24} className="text-[#695850]" />
          </button>
        </header>

        <div className="p-4 bg-white border-b border-[#F0E6E6]">
          <div className="bg-[#FAF7F2] rounded-2xl px-4 py-3 flex items-center gap-3 border border-[#F0E6E6] focus-within:border-[#E5989B] transition-colors">
            <Search size={20} className="text-[#695850]" />
            <input
              type="text"
              placeholder="Buscar produto..."
              aria-label="Buscar produto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent w-full outline-none text-[#2D2D2D] font-medium placeholder-[#695850]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#FAF7F2]/30">
          {error ? <div role="alert" className="p-4 text-sm text-red-800">{error} <button className="underline" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></div> : loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#E5989B]/20 border-t-[#E5989B] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[#695850]">
              <Package size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">Nenhum produto encontrado</p>
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className="w-full bg-white border border-[#F0E6E6] p-4 rounded-2xl flex items-center gap-4 hover:bg-[#F8EDEB] hover:border-[#E5989B]/30 transition-all text-left shadow-sm group active:scale-[0.99]"
              >
                <div className="w-14 h-14 rounded-xl bg-[#FAF7F2] flex items-center justify-center overflow-hidden border border-[#F0E6E6] group-hover:border-[#E5989B]/20 transition-colors">
                  {p.imagem_url ? (
                    <Image src={p.imagem_url} alt="" width={56} height={56} unoptimized className="w-full h-full object-cover" />
                  ) : (
                    <Package size={24} className="text-[#793751]/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#2D2D2D] truncate">{p.nome}</h3>
                  <p className="text-xs text-[#793751] font-bold">{formatCurrency(getUnitPrice(p))} por unidade</p>
                </div>
                <Plus size={20} className="text-[#695850] group-hover:text-[#793751] transition-colors" />
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
