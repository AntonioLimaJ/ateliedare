"use client";

import { X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface ProfitSuggestionsModalProps {
  onClose: () => void;
  onSelect: (value: number) => void;
}

export function ProfitSuggestionsModal({ onClose, onSelect }: ProfitSuggestionsModalProps) {
  const suggestions = [
    { label: "Padrão", value: 50 },
    { label: "Peça Pequena", value: 150 },
    { label: "Peça Média", value: 100 },
    { label: "Peça Grande", value: 60 },
    { label: "Criação Própria", value: 200 },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#1e1e1e] w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl"
      >
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Sugestões de lucro</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Se você não tem certeza de quanto deve lucrar, considere usar um dos valores abaixo.
            </p>
          </div>

          <div className="space-y-1">
            {suggestions.map((s) => (
              <button
                key={s.label}
                onClick={() => onSelect(s.value)}
                className="w-full flex items-center justify-between py-4 border-b border-zinc-800 last:border-0 group"
              >
                <span className="text-sm font-medium text-white group-active:text-purple-400 transition-colors">
                  {s.label}: {s.value}%
                </span>
                <ArrowRight size={18} className="text-zinc-600 group-active:text-purple-400 transition-colors" />
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={onClose}
              className="text-sm font-bold text-purple-400 px-4 py-2 hover:bg-purple-500/10 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface ProfitInputModalProps {
  value: number;
  total: number;
  onClose: () => void;
  onConfirm: (value: number) => void;
  onOpenSuggestions: () => void;
}

export function ProfitInputModal({ value, total, onClose, onConfirm, onOpenSuggestions }: ProfitInputModalProps) {
  const [localValue, setLocalValue] = useState<number | "">(value === 0 ? "" : value);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className="bg-[#1e1e1e] w-full rounded-t-[32px] p-8 pb-12 space-y-8 shadow-2xl"
      >
        <h2 className="text-xl font-bold text-white">Definir Lucro</h2>
        
        <div className="space-y-4">
          <div className="relative">
            <label className="absolute -top-2.5 left-4 bg-[#1e1e1e] px-1 text-[10px] font-bold text-purple-400 uppercase tracking-widest">
              Lucro
            </label>
            <div className="flex items-center bg-transparent border-2 border-purple-500/50 rounded-xl px-4 py-4 focus-within:border-purple-500 transition-colors">
              <input 
                type="number"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0"
                className="bg-transparent w-full text-white font-bold outline-none"
              />
              <span className="text-zinc-500 font-bold">%</span>
            </div>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total</p>
            <p className="text-xl font-bold text-sky-400">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <button 
          onClick={onOpenSuggestions}
          className="w-full text-center text-sm font-bold text-purple-400 py-2"
        >
          Não sei quanto lucrar
        </button>

        <div className="space-y-3 pt-4">
          <button 
            onClick={() => onConfirm(Number(localValue || 0))}
            className={`w-full py-4 font-bold rounded-2xl transition-all ${localValue !== "" ? "bg-purple-500 text-white shadow-lg active:scale-[0.98]" : "bg-zinc-800 text-zinc-600 pointer-events-none"}`}
          >
            Confirmar
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 border border-zinc-700 text-zinc-300 font-bold rounded-2xl hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

