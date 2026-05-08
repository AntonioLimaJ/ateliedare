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
import { ConfirmationModal } from "./ConfirmationModal";


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
    <div className="fixed inset-0 z-[100] bg-[#FAF7F2] flex flex-col text-[#2D2D2D]">
      <header className="p-6 bg-white border-b border-[#F0E6E6]">
        <h2 className="text-xl font-bold text-[#2D2D2D]">Escolher Material</h2>
      </header>

      <div className="px-6 space-y-6 flex-1 overflow-y-auto">
        {/* Search Bar */}
        <div className="relative pt-6">
          <div className="bg-white border border-[#F0E6E6] rounded-2xl flex items-center px-4 py-4 focus-within:border-[#E5989B]/50 transition-colors shadow-sm">
            <Search size={20} className="text-[#9E9E9E] mr-3" />
            <input
              type="text"
              placeholder="Digite alguma coisa aqui..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent w-full text-[#2D2D2D] outline-none placeholder-[#9E9E9E]"
            />
            <Filter size={20} className="text-[#9E9E9E] ml-3" />
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#9E9E9E] space-y-4">
              <div className="w-10 h-10 border-4 border-[#E5989B]/20 border-t-[#E5989B] rounded-full animate-spin" />
              <p className="text-sm">Carregando materiais...</p>
            </div>
          ) : filteredMaterials.length > 0 ? (
            filteredMaterials.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelect(m)}
                className="w-full flex items-center gap-4 p-2 rounded-2xl active:bg-[#F8EDEB] transition-colors group text-left"
              >
                <div className="w-14 h-14 bg-white border border-[#F0E6E6] rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                  {m.imagem_url ? (
                    <img src={m.imagem_url} alt={m.nome} className="w-full h-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <Lock size={20} className="text-[#F0E6E6]" />
                  )}
                </div>
                <span className="text-lg text-[#2D2D2D] font-medium">{m.nome}</span>
              </button>
            ))
          ) : (
            <div className="text-center py-12 text-zinc-600">
              <p className="text-sm italic">Nenhum material cadastrado.</p>
            </div>
          )}
        </div>
      </div>

      <footer className="p-8 flex justify-end items-center gap-8 bg-white border-t border-[#F0E6E6]">
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 text-[#E5989B] font-bold text-lg"
        >
          <Plus size={20} />
          Novo
        </button>
        <button
          onClick={onClose}
          className="text-[#E5989B] font-bold text-lg"
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
  const [largura, setLargura] = useState<number | "">("");
  const [comprimento, setComprimento] = useState<number | "">("");

  // Options based on material.tipo_medida
  const optionsMap: Record<string, string[]> = {
    "Comprimento": ["m", "cm"],
    "Peso (kg)": ["kg", "g"],
    "Volume (l)": ["l", "ml"],
    "Área": ["m", "cm"],
    "Unidade": ["Unidade"]
  };

  const options = optionsMap[material.tipo_medida || "Unidade"] || ["Unidade"];

  useEffect(() => {
    if (!unidade && options.length > 0) {
      setUnidade(options[0]);
    }
  }, [options, unidade]);

  const calculateCost = () => {
    const precoBase = material.preco_unitario || 0;

    if (material.tipo_medida === "Área") {
      if (!largura || !comprimento) return 0;
      let areaM2 = 0;
      if (unidade === "cm") {
        areaM2 = (Number(largura) * Number(comprimento)) / 10000;
      } else {
        areaM2 = Number(largura) * Number(comprimento);
      }
      return areaM2 * precoBase;
    }

    if (!quantidade) return 0;
    let baseQty = Number(quantidade);

    // Convert to base unit price reference
    if (unidade === "cm") baseQty = baseQty / 100;
    if (unidade === "g") baseQty = baseQty / 1000;
    if (unidade === "ml") baseQty = baseQty / 1000;

    return baseQty * precoBase;
  };

  const custo = calculateCost();

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className="bg-white w-full max-w-md rounded-[32px] p-8 space-y-8 shadow-2xl border border-[#F0E6E6]"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#F8EDEB] rounded-xl flex items-center justify-center">
            <Tag className="text-[#E5989B]" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#2D2D2D]">Quanto de "{material.nome}"?</h2>
            <p className="text-sm text-[#6D6D6D]">Preço base: R$ {(material.preco_unitario || 0).toFixed(2)} / {material.tipo_medida === "Comprimento" ? "m" : material.tipo_medida === "Peso (kg)" ? "kg" : material.tipo_medida === "Volume (l)" ? "litro" : material.tipo_medida === "Área" ? "m²" : "un"}</p>
          </div>
        </div>

        <div className="space-y-4">
          {material.tipo_medida === "Área" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="absolute -top-2.5 left-4 bg-white px-1 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">
                  Largura ({unidade})
                </label>
                <div className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4">
                  <input
                    type="number"
                    value={largura}
                    onChange={(e) => setLargura(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                    className="bg-transparent w-full text-[#2D2D2D] font-bold outline-none"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="absolute -top-2.5 left-4 bg-white px-1 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">
                  Comprimento ({unidade})
                </label>
                <div className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4">
                  <input
                    type="number"
                    value={comprimento}
                    onChange={(e) => setComprimento(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                    className="bg-transparent w-full text-[#2D2D2D] font-bold outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="absolute -top-2.5 left-4 bg-white px-1 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">
                  Quantidade
                </label>
                <div className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4">
                  <input
                    type="number"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                    className="bg-transparent w-full text-[#2D2D2D] font-bold outline-none"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="absolute -top-2.5 left-4 bg-white px-1 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">
                  Unidade
                </label>
                <select
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                  className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4 w-full text-[#2D2D2D] font-medium outline-none appearance-none"
                >
                  {options.map(opt => (
                    <option key={opt} value={opt} className="bg-white">{opt}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={16} className="text-[#9E9E9E]" />
                </div>
              </div>
            </div>
          )}

          {material.tipo_medida === "Área" && (
            <div className="relative">
              <label className="absolute -top-2.5 left-4 bg-white px-1 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">
                Unidade de medida
              </label>
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4 w-full text-[#2D2D2D] font-medium outline-none appearance-none"
              >
                <option value="m">Metros (m)</option>
                <option value="cm">Centímetros (cm)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={16} className="text-[#9E9E9E]" />
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#FAF7F2] rounded-2xl p-6 space-y-1 shadow-inner text-center">
          <p className="text-xs font-bold text-[#9E9E9E] uppercase tracking-widest">Custo para este produto</p>
          <p className="text-3xl font-bold text-[#E5989B]">R$ {custo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              let finalQty = Number(quantidade);
              if (material.tipo_medida === "Área") {
                if (unidade === "cm") {
                  finalQty = (Number(largura) * Number(comprimento)) / 10000;
                } else {
                  finalQty = Number(largura) * Number(comprimento);
                }
              }
              onConfirm({ 
                materialId: material.id, 
                nome: material.nome, 
                quantidade: finalQty, 
                unidade: material.tipo_medida === "Área" ? "m²" : unidade, 
                custo 
              });
            }}
            disabled={material.tipo_medida === "Área" ? (!largura || !comprimento) : (!quantidade || Number(quantidade) <= 0)}
            className="w-full py-5 bg-[#E5989B] disabled:bg-[#F0E6E6] disabled:text-[#9E9E9E] text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98]"
          >
            Adicionar ao produto
          </button>
          <button onClick={onClose} className="w-full py-4 text-[#9E9E9E] font-bold">
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
  const [nome, setNome] = useState(material?.nome || "");
  const [observacoes, setObservacoes] = useState(material?.observacoes || "");
  const [tipoMedida, setTipoMedida] = useState(material?.tipo_medida || "Área");
  const [preco, setPreco] = useState<number | "">(material?.preco_unitario ?? "");
  
  // New simplified calculator states
  const [buyQty, setBuyQty] = useState<number | "">("");
  const [buyPrice, setBuyPrice] = useState<number | "">("");
  const [buyWidth, setBuyWidth] = useState<number | "">("");
  const [buyLength, setBuyLength] = useState<number | "">("");
  const [buyUnit, setBuyUnit] = useState("");

  const [imagem, setImagem] = useState<string | null>(material?.imagem_url || null);
  const [imagemNova, setImagemNova] = useState(false);
  const originalImageRef = useRef<string | null>(material?.imagem_url || null);
  const [saving, setSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [dependentItems, setDependentItems] = useState<string[]>([]);

  // Update calculated price
  useEffect(() => {
    if (buyPrice === "" || buyPrice === 0) return;

    if (tipoMedida === "Área") {
      if (buyWidth && buyLength) {
        let areaM2 = 0;
        if (buyUnit === "cm") {
          areaM2 = (Number(buyWidth) * Number(buyLength)) / 10000;
        } else {
          areaM2 = Number(buyWidth) * Number(buyLength);
        }
        if (areaM2 > 0) setPreco(Number(buyPrice) / areaM2);
      }
    } else {
      if (buyQty && buyQty > 0) {
        let baseQty = Number(buyQty);
        if (buyUnit === "cm") baseQty = baseQty / 100;
        if (buyUnit === "g") baseQty = baseQty / 1000;
        if (buyUnit === "ml") baseQty = baseQty / 1000;
        
        setPreco(Number(buyPrice) / baseQty);
      }
    }
  }, [buyPrice, buyQty, buyWidth, buyLength, buyUnit, tipoMedida]);

  useEffect(() => {
    // Set default unit when tipoMedida changes
    const defaults: Record<string, string> = {
      "Comprimento": "m",
      "Peso (kg)": "kg",
      "Volume (l)": "l",
      "Área": "m",
      "Unidade": "un"
    };
    setBuyUnit(defaults[tipoMedida] || "un");
  }, [tipoMedida]);

  const uploadImage = async (base64: string): Promise<string> => {
    const BUCKET = "precificacao";
    const [meta, data] = base64.split(",");
    const mime = meta.match(/:(.*?);/)?.[1] || "image/webp";
    const bstr = atob(data);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    const blob = new Blob([u8arr], { type: mime });

    const extension = mime.split("/")[1] || "webp";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const filePath = `uploads/${fileName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(filePath, blob, { 
      contentType: mime,
      cacheControl: '3600',
      upsert: false
    });
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return publicUrl;
  };

  const handleSave = async () => {
    if (saving) return;
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
        preco_unitario: preco === "" ? 0 : preco,
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
    if (!material?.id) return;

    try {
      setSaving(true);

      // 1. Verificar se o material está em algum produto e pegar os nomes
      const { data: deps, error: checkError } = await supabase
        .from("produto_materiais")
        .select("nome")
        .eq("material_id", material.id);

      if (checkError) throw checkError;

      if (deps && deps.length > 0) {
        setDependentItems(deps.map(d => d.nome));
        setShowConfirmDelete(true);
        return;
      }

      setShowConfirmDelete(true);
    } catch (error: any) {
      console.error("Erro ao preparar deleção:", error.message || error);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!material?.id) return;
    try {
      setSaving(true);
      // Deletar o material
      const { error: deleteError } = await supabase.from("materiais").delete().eq("id", material.id);
      if (deleteError) throw deleteError;

      // Limpar imagem do storage
      if (originalImageRef.current) {
        const BUCKET = "precificacao";
        const filePath = originalImageRef.current.split(`/${BUCKET}/`)[1];
        if (filePath) {
          await supabase.storage.from(BUCKET).remove([filePath]);
        }
      }

      onClose();
    } catch (error: any) {
      alert(`Erro ao deletar material: ${error.message || "Tente novamente"}`);
    } finally {
      setSaving(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#FAF7F2] flex flex-col overflow-y-auto">
      <header className="sticky top-0 z-50 bg-[#E5989B] px-4 py-4 flex items-center justify-between shadow-lg text-white">
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
        <section className="bg-white rounded-[32px] p-6 shadow-xl border border-[#F0E6E6]">
          <ImageUpload
            onImageChange={(img, isNew) => {
              setImagem(img);
              setImagemNova(isNew || false);
            }}
            initialImage={imagem}
          />
        </section>

        {/* Material Group */}
        <section className="bg-white rounded-[32px] p-6 space-y-6 shadow-xl border border-[#F0E6E6]">
          <h2 className="text-xl font-bold text-[#2D2D2D]">Material</h2>

          <div className="space-y-6">
            <div className="relative">
              <label className="absolute -top-2.5 left-4 bg-white px-1 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">
                Nome do material
              </label>
              <div className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4">
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="bg-transparent w-full text-[#2D2D2D] font-medium outline-none"
                />
              </div>
            </div>

            <div className="relative">
              <label className="absolute -top-2.5 left-4 bg-white px-1 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">
                Observações (opcional)
              </label>
              <div className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4">
                <input
                  type="text"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="bg-transparent w-full text-[#2D2D2D] font-medium outline-none"
                />
              </div>
            </div>

            <div className="relative">
              <label className="absolute -top-2.5 left-4 bg-white px-1 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">
                Tipo de medida
              </label>
              <select
                value={tipoMedida}
                onChange={(e) => setTipoMedida(e.target.value)}
                className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4 w-full text-[#2D2D2D] font-medium outline-none appearance-none"
              >
                <option value="Comprimento" className="bg-white">Comprimento</option>
                <option value="Unidade" className="bg-white">Unidade</option>
                <option value="Área" className="bg-white">Área</option>
                <option value="Peso (kg)" className="bg-white">Peso (kg)</option>
                <option value="Volume (l)" className="bg-white">Volume (l)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={20} className="text-[#9E9E9E]" />
              </div>
            </div>

            <div className="bg-[#F8EDEB] border border-[#F0E6E6] rounded-xl p-4 flex gap-4">
              <div className="pt-1">
                <Info size={20} className="text-[#E5989B]" />
              </div>
              <p className="text-xs font-medium text-[#E5989B] leading-relaxed">
                {tipoMedida === "Comprimento" ? "Medida linear em metros (m). Serve para fita, zíper, linha, etc." :
                 tipoMedida === "Área" ? "Medida de superfície em metros quadrados (m²). Serve para tecidos, mantas, etc." :
                 tipoMedida === "Peso (kg)" ? "Medida de peso em quilos (kg). Serve para enchimento, pérolas, etc." :
                 tipoMedida === "Volume (l)" ? "Medida de volume em litros (l). Serve para tintas, colas, etc." :
                 "Medida por unidade simples."}
              </p>
            </div>
          </div>
        </section>

        {/* Preço Group */}
        <section className="bg-white rounded-[32px] p-6 space-y-6 shadow-xl border border-[#F0E6E6]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2D2D2D]">Quanto você pagou?</h2>
          </div>

          <div className="space-y-6">
            {tipoMedida === "Área" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-white px-1 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">
                    Largura ({buyUnit})
                  </label>
                  <div className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4">
                    <input
                      type="number"
                      value={buyWidth}
                      onChange={(e) => setBuyWidth(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0"
                      className="bg-transparent w-full text-[#2D2D2D] font-bold outline-none"
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-white px-1 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">
                    Comprimento ({buyUnit})
                  </label>
                  <div className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4">
                    <input
                      type="number"
                      value={buyLength}
                      onChange={(e) => setBuyLength(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0"
                      className="bg-transparent w-full text-[#2D2D2D] font-bold outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-white px-1 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">
                    Quantidade comprada
                  </label>
                  <div className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4">
                    <input
                      type="number"
                      value={buyQty}
                      onChange={(e) => setBuyQty(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0"
                      className="bg-transparent w-full text-[#2D2D2D] font-bold outline-none"
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-white px-1 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">
                    Unidade
                  </label>
                  <select
                    value={buyUnit}
                    onChange={(e) => setBuyUnit(e.target.value)}
                    className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4 w-full text-[#2D2D2D] font-medium outline-none appearance-none"
                  >
                    {tipoMedida === "Comprimento" && (
                      <>
                        <option value="cm">cm</option>
                        <option value="m">m</option>
                      </>
                    )}
                    {tipoMedida === "Peso (kg)" && (
                      <>
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                      </>
                    )}
                    {tipoMedida === "Volume (l)" && (
                      <>
                        <option value="ml">ml</option>
                        <option value="l">l</option>
                      </>
                    )}
                    {tipoMedida === "Unidade" && <option value="un">un</option>}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown size={16} className="text-[#9E9E9E]" />
                  </div>
                </div>
              </div>
            )}

            {tipoMedida === "Área" && (
              <div className="relative">
                <label className="absolute -top-2.5 left-4 bg-white px-1 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">
                  Unidade de medida
                </label>
                <select
                  value={buyUnit}
                  onChange={(e) => setBuyUnit(e.target.value)}
                  className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4 w-full text-[#2D2D2D] font-medium outline-none appearance-none"
                >
                  <option value="cm">Centímetros (cm)</option>
                  <option value="m">Metros (m)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={16} className="text-[#9E9E9E]" />
                </div>
              </div>
            )}

            <div className="relative">
              <label className="absolute -top-2.5 left-4 bg-white px-1 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">
                Preço total pago
              </label>
              <div className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4 flex items-center">
                <span className="text-[#9E9E9E] mr-1">R$</span>
                <input
                  type="number"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0,00"
                  className="bg-transparent w-full text-[#2D2D2D] font-bold outline-none"
                />
              </div>
            </div>

            <div className="bg-[#FAF7F2] rounded-2xl p-6 space-y-1 shadow-inner text-center border border-[#F0E6E6]">
              <p className="text-xs font-bold text-[#9E9E9E] uppercase tracking-widest">
                Preço por {tipoMedida === "Comprimento" ? "metro" : tipoMedida === "Peso (kg)" ? "kg" : tipoMedida === "Volume (l)" ? "litro" : tipoMedida === "Área" ? "m²" : "unidade"}
              </p>
              <p className="text-3xl font-bold text-[#E5989B]">
                R$ {(preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </section>

        {/* Final Actions */}
        <div className="space-y-3 pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-5 bg-[#E5989B] text-white font-bold rounded-[20px] shadow-lg transition-all ${saving ? "opacity-50" : "active:scale-[0.98]"}`}
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-full py-5 border border-[#F0E6E6] text-[#2D2D2D] font-bold rounded-[20px] active:bg-[#F8EDEB] transition-colors"
          >
            Cancelar
          </button>
          {isEdit && (
            <button
              onClick={onDelete}
              disabled={saving}
              className="w-full py-5 border border-red-200 text-red-400 font-bold rounded-[20px] active:bg-red-50 transition-colors"
            >
              Deletar
            </button>
          )}
        </div>

        <ConfirmationModal
          isOpen={showConfirmDelete}
          onClose={() => { setShowConfirmDelete(false); setDependentItems([]); }}
          onConfirm={() => {
            confirmDelete();
          }}
          title={dependentItems.length > 0 ? "Exclusão Bloqueada" : "Confirmar Exclusão"}
          message={dependentItems.length > 0 
            ? "Este material não pode ser removido porque faz parte da composição dos produtos abaixo. Remova-o deles primeiro."
            : `Tem certeza que deseja excluir o material "${nome}"? Esta ação não pode ser desfeita.`
          }
          items={dependentItems}
          confirmText="Sim, Deletar"
          isLoading={saving}
        />
      </main>
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
