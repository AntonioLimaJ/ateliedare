"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Search, 
  Plus, 
  ChevronLeft, 
  Check, 
  Tag as TagIcon,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface Etiqueta {
  id: string;
  nome: string;
}

interface EtiquetaSelectionModalProps {
  onClose: () => void;
  onSelect: (etiqueta: Etiqueta) => void;
  onAddNew: () => void;
}

export function EtiquetaSelectionModal({ onClose, onSelect, onAddNew }: EtiquetaSelectionModalProps) {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEtiquetas();
  }, []);

  const fetchEtiquetas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("etiquetas")
        .select("*")
        .order("nome");
      
      if (error) throw error;
      setEtiquetas(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar etiquetas:", error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = etiquetas.filter(e => 
    e.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] bg-[#121212] flex flex-col">
      <header className="sticky top-0 z-50 bg-[#c084fc] px-4 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 -ml-2">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Escolher Etiquetas</h1>
        </div>
        <button onClick={onAddNew} className="p-2 -mr-2">
          <Plus size={24} />
        </button>
      </header>

      <div className="p-6">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <input 
            type="text" 
            placeholder="Procurar etiquetas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1e1e1e] border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-500 outline-none focus:border-purple-500 transition-colors shadow-inner"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium">Carregando etiquetas...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-1 text-center">
             <div className="w-16 h-16 bg-zinc-800/30 rounded-full flex items-center justify-center mb-4">
               <TagIcon size={32} className="text-zinc-700" />
             </div>
             <p className="text-zinc-100 font-bold">Nenhuma etiqueta encontrada</p>
             <p className="text-sm text-zinc-500 max-w-[200px]">Crie uma nova etiqueta no botão "+" acima.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((e) => (
              <button 
                key={e.id}
                onClick={() => onSelect(e)}
                className="flex items-center justify-between bg-[#1e1e1e] p-5 rounded-2xl border border-zinc-800 hover:border-purple-500/50 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                    <TagIcon className="text-purple-400" size={20} />
                  </div>
                  <span className="text-zinc-100 font-bold">{e.nome}</span>
                </div>
                <ChevronRight size={20} className="text-zinc-600 group-hover:text-purple-400 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface EtiquetaFormModalProps {
  onClose: () => void;
  onSave: (etiqueta: Etiqueta) => void;
}

export function EtiquetaFormModal({ onClose, onSave }: EtiquetaFormModalProps) {
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nome) return alert("O nome da etiqueta é obrigatório.");
    
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from("etiquetas")
        .insert([{ nome }])
        .select()
        .single();

      if (error) throw error;
      onSave(data);
    } catch (error: any) {
      console.error("Erro ao salvar etiqueta:", error.message || error);
      alert(`Erro ao salvar etiqueta: ${error.message || "Verifique sua conexão"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#121212] flex flex-col overflow-y-auto">
      <header className="sticky top-0 z-50 bg-[#c084fc] px-4 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 -ml-2" disabled={saving}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Nova Etiqueta</h1>
        </div>
        <button 
          onClick={handleSave} 
          className={`p-2 -mr-2 ${saving ? "opacity-50 animate-pulse" : "hover:bg-black/10 rounded-full transition-colors"}`}
          disabled={saving}
        >
          {saving ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check size={24} />}
        </button>
      </header>

      <main className="max-w-md mx-auto w-full p-6 space-y-8 mt-4">
        {/* Breadcrumb replicate */}
        <div className="bg-[#1e1e1e] border border-zinc-800 rounded-2xl p-4">
           <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
             Editar Produto &gt; Escolher Etiquetas &gt; <br/>
             <span className="text-sky-400">Nova Etiqueta</span>
           </p>
        </div>

        <section className="bg-[#1e1e1e] rounded-[32px] p-8 space-y-8 shadow-xl">
          <h2 className="text-2xl font-bold text-white">Etiqueta</h2>
          
          <div className="space-y-4">
            <div className="relative">
              <label className="absolute -top-2.5 left-4 bg-[#1e1e1e] px-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Nome
              </label>
              <div className="bg-transparent border border-zinc-700 rounded-xl px-4 py-5">
                <input 
                  type="text" 
                  placeholder="Nome da etiqueta"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="bg-transparent w-full text-white font-bold outline-none" 
                  autoFocus
                />
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-3 pt-6">
           <button 
            onClick={handleSave} 
            disabled={saving}
            className={`w-full py-5 bg-[#c084fc] text-zinc-900 font-bold rounded-[20px] shadow-lg transition-all ${saving ? "opacity-50" : "active:scale-[0.98]"}`}
           >
              {saving ? "Salvando..." : "Salvar alterações"}
           </button>
           <button 
            onClick={onClose} 
            disabled={saving}
            className="w-full py-5 border border-zinc-700 text-zinc-100 font-bold rounded-[20px] active:bg-white/5 transition-colors"
           >
              Cancelar
           </button>
        </div>
      </main>
    </div>
  );
}
