"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";

export interface LaborModalProps {
  onClose: () => void;
  onConfirm: (totalSeconds: number, hourlyRate: number) => void;
  hourlyRate?: number;
}

export function LaborModal({ onClose, onConfirm, hourlyRate = 6.25 }: LaborModalProps) {
  const [hours, setHours] = useState<number | "">("");
  const [minutes, setMinutes] = useState<number | "">("");
  const [seconds, setSeconds] = useState<number | "">("");

  const totalInSeconds = (Number(hours || 0) * 3600) + (Number(minutes || 0) * 60) + Number(seconds || 0);
  const totalCost = (totalInSeconds / 3600) * hourlyRate;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#1e1e1e] w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-8"
      >
        <h2 className="text-2xl font-bold text-white mb-8 tracking-tight">Tempo gasto</h2>

        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-[#121212] rounded-2xl border border-zinc-800 flex items-center justify-center overflow-hidden">
              <input 
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value === "" ? "" : Math.min(99, Math.max(0, Number(e.target.value))))}
                placeholder="00"
                className="w-full h-full bg-transparent text-center text-2xl font-bold text-white outline-none placeholder:text-zinc-800"
              />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Horas</span>
          </div>
          
          <span className="text-2xl font-bold text-zinc-700 mt-[-24px]">:</span>

          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-[#121212] rounded-2xl border border-zinc-800 flex items-center justify-center overflow-hidden">
              <input 
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value === "" ? "" : Math.min(59, Math.max(0, Number(e.target.value))))}
                placeholder="00"
                className="w-full h-full bg-transparent text-center text-2xl font-bold text-white outline-none placeholder:text-zinc-800"
              />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Minutos</span>
          </div>

          <span className="text-2xl font-bold text-zinc-700 mt-[-24px]">:</span>

          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-[#121212] rounded-2xl border border-zinc-800 flex items-center justify-center overflow-hidden">
              <input 
                type="number"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value === "" ? "" : Math.min(59, Math.max(0, Number(e.target.value))))}
                placeholder="00"
                className="w-full h-full bg-transparent text-center text-2xl font-bold text-white outline-none placeholder:text-zinc-800"
              />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center leading-tight">Segundo<br/>s</span>
          </div>
        </div>

        <div className="bg-[#121212]/50 rounded-2xl p-6 space-y-4 border border-zinc-800/50 mb-8">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Hora de trabalho</span>
            <span className="text-sm font-bold text-zinc-100">R$ {hourlyRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
            <span className="text-base font-bold text-zinc-100">Total</span>
            <span className="text-lg font-bold text-sky-400">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={onClose}
            className="w-full py-4 text-sm font-bold text-purple-400 hover:bg-purple-500/10 rounded-xl transition-colors text-right pr-4"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onConfirm(totalInSeconds, hourlyRate)}
            disabled={totalInSeconds <= 0}
            className="w-full py-4 text-sm font-bold text-purple-400 hover:bg-purple-500/10 rounded-xl transition-colors text-right pr-4 disabled:opacity-30 disabled:pointer-events-none"
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
