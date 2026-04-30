"use client";

import { useState, useEffect } from "react";
import { X, Search, Package, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface ProductSelectionModalProps {
  onClose: () => void;
  onSelect: (product: any) => void;
}

export function ProductSelectionModal({ onClose, onSelect }: ProductSelectionModalProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await supabase
        .from("produtos")
        .select("*")
        .order("nome");
      setProducts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p => 
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

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
          <button onClick={onClose} className="p-2 hover:bg-[#FAF7F2] rounded-full transition-colors">
            <X size={24} className="text-[#9E9E9E]" />
          </button>
        </header>

        <div className="p-4 bg-white border-b border-[#F0E6E6]">
          <div className="bg-[#FAF7F2] rounded-2xl px-4 py-3 flex items-center gap-3 border border-[#F0E6E6] focus-within:border-[#E5989B] transition-colors">
            <Search size={20} className="text-[#9E9E9E]" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent w-full outline-none text-[#2D2D2D] font-medium placeholder-[#9E9E9E]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#FAF7F2]/30">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#E5989B]/20 border-t-[#E5989B] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[#9E9E9E]">
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
                    <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={24} className="text-[#E5989B]/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#2D2D2D] truncate">{p.nome}</h3>
                  <p className="text-xs text-[#E5989B] font-bold">R$ {p.preco_final.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
                <Plus size={20} className="text-[#9E9E9E] group-hover:text-[#E5989B] transition-colors" />
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
