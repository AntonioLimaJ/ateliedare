"use client";

import { useState } from "react";
import { Edit2, ChevronDown, X, Check } from "lucide-react";

interface PricingTableProps {
  laborValue: number;
  materialsCost: number;
  totalCost: number;
  profit: number;
  taxValue: number;
  taxPct: number;
  suggestedPrice: number;
  precoPersonalizado: number | null;
  onEditPrice: () => void;
}

export function PricingTable({
  laborValue,
  materialsCost,
  totalCost,
  profit,
  taxValue,
  taxPct,
  suggestedPrice,
  precoPersonalizado,
  onEditPrice,
}: PricingTableProps) {
  const precoFinal = precoPersonalizado ?? suggestedPrice;
  const isCustom = precoPersonalizado !== null;

  return (
    <div className="bg-[#1e1e1e] rounded-xl p-6 shadow-xl space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-zinc-100">Total</h3>
          {isCustom && (
            <span className="text-[10px] font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Editado
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-sky-400">
          R$ {precoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        {isCustom && (
          <p className="text-xs text-zinc-500">
            Sugerido: R$ {suggestedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        )}
      </div>

      <div className="space-y-4 pt-4">
        {/* Preço Base Node */}
        <div className="flex justify-between items-center text-xs font-bold text-zinc-100 uppercase tracking-tight">
          <div className="flex items-center gap-1">
            <ChevronDown size={14} className="text-zinc-500" />
            <span>Preço Base</span>
          </div>
          <span className="text-sky-400/80">R$ {(totalCost + profit).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        {/* Custo Total Node */}
        <div className="pl-4 space-y-3 border-l border-zinc-800 ml-1.5">
          <div className="flex justify-between items-center text-xs font-bold text-zinc-300">
            <div className="flex items-center gap-1">
              <ChevronDown size={14} className="text-zinc-600" />
              <span>Custo total</span>
            </div>
            <span>R$ {totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          {/* Leaf Nodes */}
          <div className="pl-6 space-y-3">
            <div className="flex justify-between items-center text-xs text-zinc-400">
              <span>Materiais</span>
              <span>R$ {materialsCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-zinc-400">
              <span>Trabalho</span>
              <span>R$ {laborValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-bold text-zinc-300">
            <span>Lucro</span>
            <span>R$ {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Taxas Node */}
        <div className="flex justify-between items-center text-xs font-bold text-zinc-300">
          <span>Taxas {taxPct > 0 ? <span className="text-zinc-500 font-normal">({taxPct.toFixed(1)}%)</span> : ""}</span>
          <span className={taxValue > 0 ? "text-orange-400" : "text-zinc-400"}>
            R$ {taxValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <button
        onClick={onEditPrice}
        className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-bold text-sm hover:bg-white/5 transition-colors active:bg-white/5"
        style={{ touchAction: "manipulation" }}
      >
        <Edit2 size={16} />
        {isCustom ? "Alterar preço final" : "Editar preço final"}
      </button>
    </div>
  );
}

interface PriceEditModalProps {
  suggestedPrice: number;
  currentPrice: number | null;
  onClose: () => void;
  onConfirm: (value: number | null) => void;
}

export function PriceEditModal({ suggestedPrice, currentPrice, onClose, onConfirm }: PriceEditModalProps) {
  const [value, setValue] = useState<string>(
    currentPrice !== null ? currentPrice.toString() : suggestedPrice.toFixed(2)
  );

  const numVal = parseFloat(value.replace(",", "."));
  const isValid = !isNaN(numVal) && numVal > 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 p-4">
      <div className="bg-[#1e1e1e] w-full max-w-md rounded-[32px] p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Editar Preço Final</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Preço sugerido pelo sistema</p>
          <p className="text-lg font-bold text-zinc-400">
            R$ {suggestedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="relative">
          <label className="absolute -top-2.5 left-4 bg-[#1e1e1e] px-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Novo preço final
          </label>
          <div className="bg-transparent border border-zinc-700 focus-within:border-purple-500 rounded-xl px-4 py-4 flex items-center gap-2 transition-colors">
            <span className="text-zinc-500 font-bold">R$</span>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0,00"
              autoFocus
              className="bg-transparent w-full text-white font-bold text-xl outline-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => isValid && onConfirm(numVal)}
            disabled={!isValid}
            className="w-full py-5 bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              <Check size={18} />
              Confirmar
            </span>
          </button>
          {currentPrice !== null && (
            <button
              onClick={() => onConfirm(null)}
              className="w-full py-3 text-zinc-500 font-bold text-sm"
            >
              Voltar ao preço sugerido
            </button>
          )}
          <button onClick={onClose} className="w-full py-3 border border-zinc-800 text-zinc-500 font-bold rounded-xl">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

