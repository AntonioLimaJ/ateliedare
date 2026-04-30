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
    <div className="bg-white rounded-xl p-6 shadow-xl space-y-6 border border-[#F0E6E6]">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#2D2D2D]">Total</h3>
          {isCustom && (
            <span className="text-[10px] font-bold bg-[#F8EDEB] text-[#E5989B] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Editado
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-[#E5989B]">
          R$ {precoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        {isCustom && (
          <p className="text-xs text-[#9E9E9E]">
            Sugerido: R$ {suggestedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        )}
      </div>

      <div className="space-y-4 pt-4">
        {/* Preço Base Node */}
        <div className="flex justify-between items-center text-xs font-bold text-[#2D2D2D] uppercase tracking-tight">
          <div className="flex items-center gap-1">
            <ChevronDown size={14} className="text-[#9E9E9E]" />
            <span>Preço Base</span>
          </div>
          <span className="text-[#E5989B]/80">R$ {(totalCost + profit).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        {/* Custo Total Node */}
        <div className="pl-4 space-y-3 border-l border-[#F0E6E6] ml-1.5">
          <div className="flex justify-between items-center text-xs font-bold text-[#6D6D6D]">
            <div className="flex items-center gap-1">
              <ChevronDown size={14} className="text-[#9E9E9E]" />
              <span>Custo total</span>
            </div>
            <span>R$ {totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          {/* Leaf Nodes */}
          <div className="pl-6 space-y-3">
            <div className="flex justify-between items-center text-xs text-[#9E9E9E]">
              <span>Materiais</span>
              <span>R$ {materialsCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-[#9E9E9E]">
              <span>Trabalho</span>
              <span>R$ {laborValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-bold text-[#6D6D6D]">
            <span>Lucro</span>
            <span>R$ {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Taxas Node */}
        <div className="flex justify-between items-center text-xs font-bold text-[#6D6D6D]">
          <span>Taxas {taxPct > 0 ? <span className="text-[#9E9E9E] font-normal">({taxPct.toFixed(1)}%)</span> : ""}</span>
          <span className={taxValue > 0 ? "text-orange-500" : "text-[#9E9E9E]"}>
            R$ {taxValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <button
        onClick={onEditPrice}
        className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#F0E6E6] text-[#6D6D6D] font-bold text-sm hover:bg-[#F8EDEB] transition-colors active:bg-[#F8EDEB]"
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
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] p-8 space-y-6 shadow-2xl border border-[#F0E6E6]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2D2D2D]">Editar Preço Final</h2>
          <button onClick={onClose} className="p-2 text-[#9E9E9E] hover:text-[#6D6D6D]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-[#9E9E9E] uppercase tracking-widest">Preço sugerido pelo sistema</p>
          <p className="text-lg font-bold text-[#6D6D6D]">
            R$ {suggestedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="relative">
          <label className="absolute -top-2.5 left-4 bg-white px-1 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">
            Novo preço final
          </label>
          <div className="bg-transparent border border-[#F0E6E6] focus-within:border-[#E5989B] rounded-xl px-4 py-4 flex items-center gap-2 transition-colors">
            <span className="text-[#9E9E9E] font-bold">R$</span>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0,00"
              autoFocus
              className="bg-transparent w-full text-[#2D2D2D] font-bold text-xl outline-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => isValid && onConfirm(numVal)}
            disabled={!isValid}
            className="w-full py-5 bg-[#E5989B] disabled:bg-[#F0E6E6] disabled:text-[#9E9E9E] text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              <Check size={18} />
              Confirmar
            </span>
          </button>
          {currentPrice !== null && (
            <button
              onClick={() => onConfirm(null)}
              className="w-full py-3 text-[#9E9E9E] font-bold text-sm"
            >
              Voltar ao preço sugerido
            </button>
          )}
          <button onClick={onClose} className="w-full py-3 border border-[#F0E6E6] text-[#9E9E9E] font-bold rounded-xl">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

