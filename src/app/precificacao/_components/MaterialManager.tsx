"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  Filter,
  Plus,
  ChevronRight,
  Check,
  ChevronLeft,
  Info,
  Tag,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageUpload } from "./ImageUpload";
import { supabase } from "@/lib/supabase";


export interface Material {
  id: string;
  nome: string;
  preco_unitario: number;
  unidade: string;
  tipo_medida: string;
  imagem_url?: string;
  observacoes?: string;
}

export interface MaterialSelectionModalProps {
  onClose: () => void;
  onSelect: (material: Material) => void;
  onAddNew: () => void;
}

export function MaterialSelectionModal({ onClose, onSelect, onAddNew }: MaterialSelectionModalProps) {
  const [search, setSearch] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("materiais")
        .select("*")
        .order("nome");

      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar materiais:", error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(m =>
    m.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] bg-[#121212] flex flex-col">
      <header className="p-6">
        <h2 className="text-xl font-bold text-white">Escolher Material</h2>
      </header>

      <div className="px-6 space-y-6 flex-1 overflow-y-auto">
        {/* Search Bar */}
        <div className="relative">
          <div className="bg-transparent border border-zinc-800 rounded-2xl flex items-center px-4 py-4 focus-within:border-zinc-700 transition-colors">
            <Search size={20} className="text-zinc-500 mr-3" />
            <input
              type="text"
              placeholder="Digite alguma coisa aqui..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent w-full text-white outline-none placeholder-zinc-500"
            />
            <Filter size={20} className="text-zinc-500 ml-3" />
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-600 space-y-4">
              <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              <p className="text-sm">Carregando materiais...</p>
            </div>
          ) : filteredMaterials.length > 0 ? (
            filteredMaterials.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelect(m)}
                className="w-full flex items-center gap-4 p-2 rounded-2xl active:bg-white/5 transition-colors group text-left"
              >
                <div className="w-14 h-14 bg-[#1e1e1e] border border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden">
                  {m.imagem_url ? (
                    <img src={m.imagem_url} alt={m.nome} className="w-full h-full object-cover" />
                  ) : (
                    <Lock size={20} className="text-zinc-700" />
                  )}
                </div>
                <span className="text-lg text-zinc-100 font-medium">{m.nome}</span>
              </button>
            ))
          ) : (
            <div className="text-center py-12 text-zinc-600">
              <p className="text-sm italic">Nenhum material cadastrado.</p>
            </div>
          )}
        </div>
      </div>

      <footer className="p-8 flex justify-end items-center gap-8">
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 text-purple-400 font-bold text-lg"
        >
          <Plus size={20} />
          Novo
        </button>
        <button
          onClick={onClose}
          className="text-purple-400 font-bold text-lg"
        >
          Fechar
        </button>
      </footer>
    </div>
  );
}

interface MaterialUsageModalProps {
  material: Material;
  onClose: () => void;
  onConfirm: (usage: { materialId: string; nome: string; quantidade: number; unidade: string; custo: number }) => void;
}

export function MaterialUsageModal({ material, onClose, onConfirm }: MaterialUsageModalProps) {
  const [unidade, setUnidade] = useState("");
  const [quantidade, setQuantidade] = useState<number | "">("");

  // Options based on material.tipo_medida
  const optionsMap: Record<string, string[]> = {
    "Comprimento": ["cm", "m"],
    "Peso (kg)": ["g", "kg"],
    "Volume (l)": ["ml", "l"],
    "Área": ["cm²", "m²"],
    "Unidade": ["Unidade"]
  };

  const options = optionsMap[material.tipo_medida || "Unidade"] || ["Unidade"];

  useEffect(() => {
    if (!unidade && options.length > 0) {
      setUnidade(options[0]);
    }
  }, [options, unidade]);

  const calculateCost = () => {
    if (!quantidade) return 0;

    let baseQty = Number(quantidade);
    const precoBase = material.preco_unitario || 0;

    // Convert to base unit price reference
    if (unidade === "cm") baseQty = baseQty / 100;
    if (unidade === "g") baseQty = baseQty / 1000;
    if (unidade === "ml") baseQty = baseQty / 1000;
    if (unidade === "cm²") baseQty = baseQty / 10000;

    return baseQty * precoBase;
  };

  const custo = calculateCost();

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className="bg-[#1e1e1e] w-full max-w-md rounded-[32px] p-8 space-y-8 shadow-2xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Tag className="text-purple-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Quanto de "{material.nome}"?</h2>
            <p className="text-sm text-zinc-400">Preço base: R$ {material.preco_unitario?.toFixed(2)} / {material.tipo_medida === "Comprimento" ? "m" : material.tipo_medida === "Peso (kg)" ? "kg" : material.tipo_medida === "Volume (l)" ? "litro" : material.tipo_medida === "Área" ? "m²" : "un"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <label className="absolute -top-2.5 left-4 bg-[#1e1e1e] px-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Quantidade
            </label>
            <div className="bg-transparent border border-zinc-700 rounded-xl px-4 py-4">
              <input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0"
                className="bg-transparent w-full text-white font-bold outline-none"
              />
            </div>
          </div>

          <div className="relative">
            <label className="absolute -top-2.5 left-4 bg-[#1e1e1e] px-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Unidade
            </label>
            <select
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              className="bg-transparent border border-zinc-700 rounded-xl px-4 py-4 w-full text-white font-medium outline-none appearance-none"
            >
              {options.map(opt => (
                <option key={opt} value={opt} className="bg-[#1e1e1e]">{opt}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown size={16} className="text-zinc-500" />
            </div>
          </div>
        </div>

        <div className="bg-[#121212] rounded-2xl p-6 space-y-1 shadow-inner text-center">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Custo para este produto</p>
          <p className="text-3xl font-bold text-sky-400">R$ {custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onConfirm({ materialId: material.id, nome: material.nome, quantidade: Number(quantidade), unidade, custo })}
            disabled={!quantidade || Number(quantidade) <= 0}
            className="w-full py-5 bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98]"
          >
            Adicionar ao produto
          </button>
          <button onClick={onClose} className="w-full py-4 text-zinc-500 font-bold">
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface MaterialFormModalProps {
  onClose: () => void;
  onSave: (material: any) => void;
  material?: Material; // if provided = edit mode
}

export function MaterialFormModal({ onClose, onSave, material }: MaterialFormModalProps) {
  const isEdit = !!material;
  const [showCalculator, setShowCalculator] = useState(false);
  const [nome, setNome] = useState(material?.nome || "");
  const [observacoes, setObservacoes] = useState(material?.observacoes || "");
  const [tipoMedida, setTipoMedida] = useState(material?.tipo_medida || "Comprimento");
  const [preco, setPreco] = useState<number | "">(material?.preco_unitario ?? "");
  const [imagem, setImagem] = useState<string | null>(material?.imagem_url || null);
  const [imagemNova, setImagemNova] = useState(false);
  const originalImageRef = useRef<string | null>(material?.imagem_url || null);
  const [saving, setSaving] = useState(false);

  const uploadImage = async (base64: string): Promise<string> => {
    const BUCKET = "precificacao";
    const [meta, data] = base64.split(",");
    const mime = meta.match(/:(.*?);/)?.[1] || "image/webp";
    const bstr = atob(data);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    const blob = new Blob([u8arr], { type: mime });

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const filePath = `uploads/${fileName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(filePath, blob, { contentType: mime });
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return publicUrl;
  };

  const handleSave = async () => {
    if (!nome) return alert("O nome do material é obrigatório.");

    try {
      setSaving(true);

      let finalImageUrl = imagem;
      if (imagemNova && imagem?.startsWith("data:")) {
        finalImageUrl = await uploadImage(imagem);
      }

      const payload = {
        nome,
        observacoes,
        tipo_medida: tipoMedida,
        preco_unitario: preco,
        imagem_url: finalImageUrl
      };

      let data: any, error: any;
      if (isEdit && material?.id) {
        ({ data, error } = await supabase
          .from("materiais")
          .update(payload)
          .eq("id", material.id)
          .select()
          .single());

        // Cleanup old image if changed
        if (originalImageRef.current && originalImageRef.current !== finalImageUrl) {
          const BUCKET = "precificacao";
          if (originalImageRef.current.includes(BUCKET)) {
            const path = originalImageRef.current.split(`/${BUCKET}/`)[1];
            if (path) await supabase.storage.from(BUCKET).remove([path]);
          }
        }
      } else {
        ({ data, error } = await supabase
          .from("materiais")
          .insert([payload])
          .select()
          .single());
      }
      if (error) throw error;
      onSave(data);
    } catch (error: any) {
      console.error("Erro ao salvar material:", error.message || error);
      alert(`Erro ao salvar material: ${error.message || "Verifique sua conexão"}`);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (confirm("Deseja realmente deletar o material?")) {
      const { error } = await supabase.from("materiais").delete().eq("id", material?.id);
      if (error) {
        console.error("Erro ao deletar material:", error.message || error);
        return;
      }
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[110] bg-[#121212] flex flex-col overflow-y-auto">
      <header className="sticky top-0 z-50 bg-[#c084fc] px-4 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 -ml-2" disabled={saving}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">{isEdit ? "Editar Material" : "Novo Material"}</h1>
        </div>
        <button
          onClick={handleSave}
          className={`p-2 -mr-2 ${saving ? "opacity-50 animate-pulse" : "hover:bg-black/10 rounded-full transition-colors"}`}
          disabled={saving}
        >
          {saving ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check size={24} />}
        </button>
      </header>

      <main className="p-4 space-y-6 pb-32">
        {/* Image Section */}
        <section className="bg-[#1e1e1e] rounded-[32px] p-6 shadow-xl">
          <ImageUpload
            onImageChange={(img, isNew) => {
              setImagem(img);
              setImagemNova(isNew || false);
            }}
            initialImage={imagem}
          />
        </section>

        {/* Material Group */}
        <section className="bg-[#1e1e1e] rounded-[32px] p-6 space-y-6 shadow-xl">
          <h2 className="text-xl font-bold">Material</h2>

          <div className="space-y-6">
            <div className="relative">
              <label className="absolute -top-2.5 left-4 bg-[#1e1e1e] px-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Nome do material
              </label>
              <div className="bg-transparent border border-zinc-700 rounded-xl px-4 py-4">
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="bg-transparent w-full text-white font-medium outline-none"
                />
              </div>
            </div>

            <div className="relative">
              <label className="absolute -top-2.5 left-4 bg-[#1e1e1e] px-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Observações (opcional)
              </label>
              <div className="bg-transparent border border-zinc-700 rounded-xl px-4 py-4">
                <input
                  type="text"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="bg-transparent w-full text-white font-medium outline-none"
                />
              </div>
            </div>

            <div className="relative">
              <label className="absolute -top-2.5 left-4 bg-[#1e1e1e] px-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Tipo de medida
              </label>
              <select
                value={tipoMedida}
                onChange={(e) => setTipoMedida(e.target.value)}
                className="bg-transparent border border-zinc-700 rounded-xl px-4 py-4 w-full text-white font-medium outline-none appearance-none"
              >
                <option value="Comprimento" className="bg-[#1e1e1e]">Comprimento</option>
                <option value="Unidade" className="bg-[#1e1e1e]">Unidade</option>
                <option value="Área" className="bg-[#1e1e1e]">Área</option>
                <option value="Peso (kg)" className="bg-[#1e1e1e]">Peso (kg)</option>
                <option value="Volume (l)" className="bg-[#1e1e1e]">Volume (l)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={20} className="text-zinc-500" />
              </div>
            </div>

            <div className="bg-sky-900/20 border border-sky-500/20 rounded-xl p-4 flex gap-4">
              <div className="pt-1">
                <Info size={20} className="text-sky-400" />
              </div>
              <p className="text-xs font-medium text-sky-400/80 leading-relaxed">
                Medida linear em centímetros (cm). Serve para fita, zíper, linha, etc.
              </p>
            </div>
          </div>
        </section>

        {/* Preço Group */}
        <section className="bg-[#1e1e1e] rounded-[32px] p-6 space-y-6 shadow-xl">
          <h2 className="text-xl font-bold">Preço</h2>

          <div className="space-y-4">
            <div className="relative">
              <label className="absolute -top-2.5 left-4 bg-[#1e1e1e] px-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Preço por {tipoMedida === "Comprimento" ? "metro" : tipoMedida === "Peso (kg)" ? "kg" : tipoMedida === "Volume (l)" ? "litro" : tipoMedida === "Área" ? "m²" : "unidade"}
              </label>
              <div className="bg-transparent border border-zinc-700 rounded-xl px-4 py-4 flex items-center">
                <span className="text-zinc-500 mr-1">R$</span>
                <input
                  type="number"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0"
                  className="bg-transparent w-full text-white font-bold outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => setShowCalculator(true)}
              className="w-full flex items-center justify-between bg-transparent border border-zinc-700 rounded-2xl px-6 py-5 group active:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Tag size={20} className="text-purple-400" />
                <span className="text-zinc-100 font-medium">Descobrir preço por {tipoMedida === "Comprimento" ? "metro" : tipoMedida === "Peso (kg)" ? "kg" : tipoMedida === "Volume (l)" ? "litro" : tipoMedida === "Área" ? "m²" : "unidade"}</span>
              </div>
              <ChevronRight size={20} className="text-purple-400" />
            </button>
          </div>
        </section>

        {/* Fornecedor Group */}
        <section className="bg-[#1e1e1e] rounded-[32px] p-6 space-y-6 shadow-xl">
          <h2 className="text-xl font-bold text-zinc-800">Fornecedor</h2>
          <div className="relative opacity-50 pointer-events-none">
            <div className="bg-transparent border border-zinc-800 rounded-xl px-4 py-4 flex items-center justify-between">
              <span className="text-zinc-600 font-medium">Clique para escolher</span>
              <ChevronDown size={20} className="text-zinc-800" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock size={32} className="text-white" />
            </div>
          </div>
        </section>

        {/* Final Actions */}
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
          {isEdit && (
            <button
              onClick={onDelete}
              disabled={saving}
              className="w-full py-5 border border-red-500 text-red-500 font-bold rounded-[20px] active:bg-red-900/10 transition-colors"
            >
              Deletar
            </button>
          )}
        </div>
      </main>

      {/* Calculator Modal */}
      <AnimatePresence>
        {showCalculator && (
          <MaterialCalculatorModal
            tipoMedida={tipoMedida}
            onClose={() => setShowCalculator(false)}
            onUse={(val) => {
              setPreco(val);
              setShowCalculator(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MaterialCalculatorModal({ onClose, onUse, tipoMedida }: { onClose: () => void, onUse: (val: number) => void, tipoMedida: string }) {
  const [compraEm, setCompraEm] = useState("");
  const [quantidade, setQuantidade] = useState<number | "">("");
  const [precoPago, setPrecoPago] = useState<number | "">("");

  // Define options based on tipoMedida
  const optionsMap: Record<string, string[]> = {
    "Comprimento": ["Centímetros (cm)", "Metros (m)"],
    "Peso (kg)": ["Gramas (g)", "Quilos (kg)"],
    "Volume (l)": ["Mililitros (ml)", "Litros (l)"],
    "Área": ["Centímetros quadrados (cm²)", "Metros quadrados (m²)"],
    "Unidade": ["Unidade"]
  };

  const options = optionsMap[tipoMedida] || ["Unidade"];

  // Default selection
  useEffect(() => {
    if (!compraEm && options.length > 0) {
      setCompraEm(options[0]);
    }
  }, [options, compraEm]);

  const calculateResult = () => {
    if (!quantidade || !precoPago) return 0;

    let baseQty = Number(quantidade);

    // Convert to base unit (m, kg, l, etc)
    if (compraEm.includes("(cm)") || compraEm.includes("(g)") || compraEm.includes("(ml)")) {
      baseQty = baseQty / 1000;
      if (compraEm.includes("(cm)")) baseQty = Number(quantidade) / 100; // cm to m is 100
    } else if (compraEm.includes("(cm²)")) {
      baseQty = baseQty / 10000;
    }

    return Number(precoPago) / baseQty;
  };

  const result = calculateResult();
  const canUse = result > 0 && result !== Infinity;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className="bg-[#1e1e1e] w-full rounded-[32px] p-8 space-y-8 shadow-2xl"
      >
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Calcular preço por {tipoMedida === "Unidade" ? "unidade" : tipoMedida === "Comprimento" ? "m" : tipoMedida.split(" ")[1]?.replace("(", "").replace(")", "") || "un"}</h2>
          <p className="text-sm text-zinc-400">Preencha os campos abaixo</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <label className="absolute -top-2.5 left-4 bg-[#1e1e1e] px-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Você compra em
            </label>
            <select
              value={compraEm}
              onChange={(e) => setCompraEm(e.target.value)}
              className="bg-transparent border border-zinc-700 rounded-xl px-4 py-4 w-full text-white font-medium outline-none appearance-none"
            >
              {options.map(opt => (
                <option key={opt} value={opt} className="bg-[#1e1e1e]">{opt}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown size={20} className="text-zinc-500" />
            </div>
          </div>

          <div className="relative">
            <label className="absolute -top-2.5 left-4 bg-[#1e1e1e] px-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Quantidade
            </label>
            <div className="bg-transparent border border-zinc-700 rounded-xl px-4 py-4">
              <input
                type="number"
                placeholder="Ex: 50"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value === "" ? "" : Number(e.target.value))}
                className="bg-transparent w-full text-white outline-none font-medium"
              />
            </div>
          </div>

          <div className="relative">
            <label className="absolute -top-2.5 left-4 bg-[#1e1e1e] px-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Quanto você paga?
            </label>
            <div className="bg-transparent border border-zinc-700 rounded-xl px-4 py-4 flex items-center">
              <span className="text-zinc-500 mr-1">R$</span>
              <input
                type="number"
                placeholder="0,00"
                value={precoPago}
                onChange={(e) => setPrecoPago(e.target.value === "" ? "" : Number(e.target.value))}
                className="bg-transparent w-full text-white font-bold outline-none"
              />
            </div>
          </div>

          <div className="bg-[#121212] rounded-2xl p-6 space-y-1 shadow-inner">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Preço final calculado</p>
            <p className="text-2xl font-bold text-sky-400">R$ {canUse ? result.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00"}</p>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <button
            onClick={() => onUse(result)}
            disabled={!canUse}
            className={`w-full py-4 font-bold rounded-2xl transition-all ${canUse ? "bg-purple-500 text-white shadow-lg active:scale-[0.98]" : "bg-zinc-800 text-zinc-600 pointer-events-none"}`}
          >
            Usar esse valor
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 border border-zinc-700 text-zinc-300 font-bold rounded-2xl active:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ChevronDown({ size, className }: { size: number, className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
