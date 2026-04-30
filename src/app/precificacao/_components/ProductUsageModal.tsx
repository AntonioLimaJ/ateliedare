"use client";

import { useState } from "react";
import { X, Check, Minus, Plus, StickyNote } from "lucide-react";
import { motion } from "framer-motion";

interface ProductUsageModalProps {
  product: any;
  onClose: () => void;
  onConfirm: (data: { quantidade: number; notas: string; total: number }) => void;
}

export function ProductUsageModal({ product, onClose, onConfirm }: ProductUsageModalProps) {
  const [quantidade, setQuantidade] = useState(1);
  const [notas, setNotas] = useState("");

  const total = product.preco_final * quantidade;

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
      >
        <header className="p-6 border-b border-[#F0E6E6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F8EDEB] flex items-center justify-center">
              <Plus size={20} className="text-[#E5989B]" />
            </div>
            <h2 className="text-xl font-bold text-[#2D2D2D]">Configurar Item</h2>
          </div>
          <button onClick={onClose} className="p-2 text-[#9E9E9E]">
            <X size={24} />
          </button>
        </header>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-[#FAF7F2] rounded-2xl border border-[#F0E6E6]">
            <div className="w-12 h-12 rounded-lg bg-white overflow-hidden border border-[#F0E6E6]">
               {product.imagem_url ? (
                 <img src={product.imagem_url} alt={product.nome} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-white">
                   <Plus size={20} className="text-[#E5989B]/30" />
                 </div>
               )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[#2D2D2D] text-sm">{product.nome}</h3>
              <p className="text-xs text-[#6D6D6D]">Preço unitário: R$ {product.preco_final.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-[#9E9E9E] uppercase tracking-widest">Quantidade</label>
            <div className="flex items-center justify-between bg-[#FAF7F2] border border-[#F0E6E6] rounded-2xl p-2">
              <button
                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#E5989B] shadow-sm active:scale-95 transition-transform"
              >
                <Minus size={20} />
              </button>
              <span className="text-2xl font-bold text-[#2D2D2D]">{quantidade}</span>
              <button
                onClick={() => setQuantidade(quantidade + 1)}
                className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#E5989B] shadow-sm active:scale-95 transition-transform"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-[#9E9E9E] uppercase tracking-widest">Nota/Personalização</label>
            <div className="bg-[#FAF7F2] border border-[#F0E6E6] rounded-2xl p-4 flex gap-3 focus-within:border-[#E5989B] transition-colors">
              <StickyNote size={20} className="text-[#9E9E9E] mt-1" />
              <textarea
                placeholder="Ex: Nome da criança, cor específica..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full bg-transparent outline-none text-[#2D2D2D] font-medium placeholder-[#9E9E9E] min-h-[80px] resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0E6E6] flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#6D6D6D]">Subtotal</span>
              <span className="text-xl font-bold text-[#E5989B]">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <button
              onClick={() => onConfirm({ quantidade, notas, total })}
              className="bg-[#E5989B] text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-[#E5989B]/20 active:scale-95 transition-transform flex items-center gap-2"
            >
              <Check size={20} />
              Confirmar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
