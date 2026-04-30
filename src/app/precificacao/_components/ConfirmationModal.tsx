"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X, AlertCircle, Info } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  items?: string[]; // List of dependent items (names)
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  items = [],
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false
}: ConfirmationModalProps) {
  const isBlocking = items.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-[#F0E6E6]"
          >
            <div className="p-8 text-center space-y-4">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                isBlocking ? 'bg-amber-50 text-amber-500' :
                variant === "danger" ? 'bg-red-50 text-red-500' :
                variant === "warning" ? 'bg-amber-50 text-amber-500' :
                'bg-blue-50 text-blue-500'
              }`}>
                {isBlocking ? <AlertCircle size={32} /> :
                 variant === "danger" ? <Trash2 size={32} /> :
                 variant === "warning" ? <AlertTriangle size={32} /> :
                 <Info size={32} />}
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-[#2D2D2D]">{title}</h2>
                <p className="text-sm text-[#6D6D6D] leading-relaxed">
                  {message}
                </p>
              </div>

              {items.length > 0 && (
                <div className="bg-[#FAF7F2] rounded-2xl p-4 text-left border border-[#F0E6E6] max-h-40 overflow-y-auto">
                  <p className="text-[10px] font-black text-[#9E9E9E] uppercase tracking-widest mb-2">Itens Relacionados:</p>
                  <ul className="space-y-1">
                    {items.map((item, i) => (
                      <li key={i} className="text-xs font-bold text-[#2D2D2D] flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-[#E5989B]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-6 bg-[#FAF7F2]/50 border-t border-[#F0E6E6] flex gap-3">
              {isBlocking ? (
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-[#2D2D2D] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
                >
                  Entendi
                </button>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 py-4 border border-[#F0E6E6] text-[#6D6D6D] font-bold rounded-2xl active:bg-white transition-colors disabled:opacity-50"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`flex-[1.5] py-4 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                      variant === "danger" ? 'bg-red-500 shadow-red-500/20' :
                      variant === "warning" ? 'bg-amber-500 shadow-amber-500/20' :
                      'bg-[#E5989B] shadow-[#E5989B]/20'
                    }`}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      confirmText
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
