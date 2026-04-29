"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  Check,
  ChevronRight,
  HelpCircle,
  LayoutGrid,
  Briefcase,
  DollarSign,
  Square,
  Trash2,
  X
} from "lucide-react";
import { ImageUpload } from "../_components/ImageUpload";
import { PricingTable, PriceEditModal } from "../_components/PricingTable";
import { ProfitInputModal, ProfitSuggestionsModal } from "../_components/ProfitModals";
import { MaterialSelectionModal, MaterialFormModal, MaterialUsageModal } from "../_components/MaterialManager";
import { LaborModal } from "../_components/LaborModal";
import { EtiquetaSelectionModal, EtiquetaFormModal } from "../_components/TagManager";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useConfiguracoes, calcularCustoHora, calcularTotalTaxPct } from "../_components/CustosTab";

export default function NovoProduto() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const originalImageRef = useRef<string | null>(null);

  // State
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [notas, setNotas] = useState("");
  const [imagem, setImagem] = useState<string | null>(null);
  const [imagemNova, setImagemNova] = useState(false);
  const [favorito, setFavorito] = useState(false);
  const [margemLucro, setMargemLucro] = useState(0);
  const [rendimentoAtivo, setRendimentoAtivo] = useState(false);
  const [quantidadeRendimento, setQuantidadeRendimento] = useState<number | "">("");

  // Modals Visibility
  const [showProfitInput, setShowProfitInput] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMaterialSelection, setShowMaterialSelection] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showLaborModal, setShowLaborModal] = useState(false);
  const [showTagSelection, setShowTagSelection] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);
  const [selectedMaterialForUsage, setSelectedMaterialForUsage] = useState<any>(null);

  // Save & Price edit
  const [saving, setSaving] = useState(false);
  const [precoPersonalizado, setPrecoPersonalizado] = useState<number | null>(null);
  const [showPriceEdit, setShowPriceEdit] = useState(false);

  // Global config (salary/taxes)
  const { config } = useConfiguracoes();

  // Load product for editing
  useEffect(() => {
    if (!editId) return;
    supabase.from("produtos").select("*").eq("id", editId).single().then(({ data }) => {
      if (!data) return;
      if (data.nome) setNome(data.nome);
      if (data.descricao) setDescricao(data.descricao);
      if (data.notas) setNotas(data.notas);
      if (data.imagem_url) {
        setImagem(data.imagem_url);
        originalImageRef.current = data.imagem_url;
      }
      setFavorito(data.favorito || false);
      setMargemLucro(data.margem_lucro || 0);
      setTempoTrabalho(data.tempo_trabalho || 0);
      if (data.rendimento > 1) {
        setRendimentoAtivo(true);
        setQuantidadeRendimento(data.rendimento);
      }
      // Restore custom price if it differs from suggested
      if (data.preco_final && data.preco_sugerido && Math.abs(data.preco_final - data.preco_sugerido) > 0.01) {
        setPrecoPersonalizado(data.preco_final);
      }
    });
  }, [editId]);

  // Materials, Labor & Tags State
  const [materiaisAtribuidos, setMateriaisAtribuidos] = useState<any[]>([]);
  const [tempoTrabalho, setTempoTrabalho] = useState(0); // in seconds
  const [etiquetasSelecionadas, setEtiquetasSelecionadas] = useState<any[]>([]);

  // Calculations (using global config)
  const hourlyRate = calcularCustoHora(config);
  const taxPct = calcularTotalTaxPct(config);
  const materialsCost = materiaisAtribuidos.reduce((acc, m) => acc + (m.custo || 0), 0);
  const laborValue = (tempoTrabalho / 3600) * hourlyRate;
  const totalCost = materialsCost + laborValue;
  const profitValue = totalCost * (margemLucro / 100);
  const basePrice = totalCost + profitValue;
  const taxValue = basePrice * (taxPct / 100);
  const suggestedPrice = basePrice + taxValue;
  const precoFinal = precoPersonalizado ?? suggestedPrice;
  const unitPrice = precoFinal / (rendimentoAtivo ? Math.max(1, Number(quantidadeRendimento || 1)) : 1);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCancel = () => {
    if (confirm("Deseja realmente cancelar? Todas as alterações serão perdidas.")) {
      router.back();
    }
  };

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
    if (!nome.trim()) {
      alert("Preencha o nome do produto antes de salvar.");
      return;
    }
    try {
      setSaving(true);

      let finalImageUrl = imagem;
      if (imagemNova && imagem?.startsWith("data:")) {
        finalImageUrl = await uploadImage(imagem);
      }

      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        notas: notas.trim() || null,
        imagem_url: finalImageUrl,
        favorito,
        preco_final: precoFinal,
        preco_sugerido: suggestedPrice,
        margem_lucro: margemLucro,
        tempo_trabalho: tempoTrabalho,
        custo_materiais: materialsCost,
        custo_trabalho: laborValue,
        rendimento: rendimentoAtivo ? Number(quantidadeRendimento || 1) : 1,
      };

      let savedId = editId;
      if (editId) {
        const { error } = await supabase.from("produtos").update(payload).eq("id", editId);
        if (error) throw error;
        
        // Cleanup old image from storage if changed
        if (originalImageRef.current && originalImageRef.current !== finalImageUrl) {
          const BUCKET = "precificacao";
          if (originalImageRef.current.includes(BUCKET)) {
            const path = originalImageRef.current.split(`/${BUCKET}/`)[1];
            if (path) await supabase.storage.from(BUCKET).remove([path]);
          }
        }
      } else {
        const { data, error } = await supabase.from("produtos").insert([payload]).select().single();
        if (error) throw error;
        savedId = data?.id;
      }

      // Salvar materiais associados
      if (savedId && materiaisAtribuidos.length > 0) {
        if (editId) await supabase.from("produto_materiais").delete().eq("produto_id", editId);
        await supabase.from("produto_materiais").insert(
          materiaisAtribuidos.map((m) => ({
            produto_id: savedId,
            material_id: m.materialId,
            nome: m.nome,
            quantidade: m.quantidade,
            unidade: m.unidade,
            custo: m.custo,
          }))
        );
      }

      router.push("/precificacao");
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error.message);
      alert(`Erro ao salvar: ${error.message || "Verifique sua conexão"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-32 font-sans selection:bg-purple-500/30">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#c084fc] px-4 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={handleCancel} className="p-2 -ml-2">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">{editId ? "Editar Produto" : "Novo Produto"}</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="p-2 -mr-2">
          {saving ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check size={24} />}
        </button>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6 mt-4">
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

        {/* Produto Section */}
        <section className="bg-[#1e1e1e] rounded-[32px] p-6 space-y-6 shadow-xl">
          <h2 className="text-xl font-bold">Produto</h2>

          <div className="space-y-4">
            <div className="bg-transparent border border-zinc-700 rounded-2xl px-6 py-5">
              <input
                type="text"
                placeholder="Nome do Produto"
                value={nome}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-transparent outline-none text-zinc-100 placeholder-zinc-500 font-medium"
              />
            </div>

            <div className="bg-transparent border border-zinc-700 rounded-2xl px-6 py-5 flex items-center justify-between">
              <input
                type="text"
                placeholder="Descrição"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full bg-transparent outline-none text-zinc-100 placeholder-zinc-500 font-medium"
              />
              <HelpCircle size={20} className="text-zinc-500" />
            </div>

            <div className="bg-transparent border border-zinc-700 rounded-2xl px-6 py-5 flex items-center justify-between">
              <input
                type="text"
                placeholder="Notas Pessoais"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full bg-transparent outline-none text-zinc-100 placeholder-zinc-500 font-medium"
              />
              <HelpCircle size={20} className="text-zinc-500" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-zinc-100">Marcar como Favorito?</span>
              <button
                onClick={() => setFavorito(!favorito)}
                className={`w-14 h-7 rounded-full transition-all relative ${favorito ? "bg-purple-400" : "bg-zinc-700"}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-[#121212] rounded-full transition-all ${favorito ? "left-8" : "left-1"}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Precificar Section */}
        <section className="bg-[#1e1e1e] rounded-[32px] p-6 space-y-6 shadow-xl relative overflow-hidden">
          <h2 className="text-xl font-bold">Precificar</h2>

          {/* Bloqueio visual quando nome não preenchido */}
          <div
            className="absolute inset-0 bg-[#1e1e1e]/95 z-50 flex items-center justify-center text-center p-6 transition-opacity duration-300"
            style={{ opacity: nome.trim().length > 0 ? 0 : 1, pointerEvents: nome.trim().length > 0 ? "none" : "none" }}
          >
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
              Preencha o nome do produto
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowMaterialSelection(true)}
                className="w-full flex items-center justify-between bg-transparent border border-zinc-700 rounded-2xl px-6 py-5 group active:bg-white/5 transition-colors touch-manipulation"
              >
                <div className="flex items-center gap-4">
                  <LayoutGrid size={20} className="text-purple-400" />
                  <span className="text-zinc-100 font-medium">Adicionar materiais</span>
                </div>
                <ChevronRight size={20} className="text-purple-400" />
              </button>

              {materiaisAtribuidos.length > 0 && (
                <div className="px-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  {materiaisAtribuidos.map((m, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-800/30 p-3 rounded-xl border border-zinc-800/50">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setMateriaisAtribuidos(materiaisAtribuidos.filter((_, idx) => idx !== i))}
                          className="text-red-500/50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="flex flex-col">
                          <span className="text-[13px] text-zinc-100 font-medium">{m.nome}</span>
                          <span className="text-[10px] text-zinc-500">{m.quantidade} {m.unidade}</span>
                        </div>
                      </div>
                      <span className="text-[13px] font-bold text-zinc-300">R$ {m.custo.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShowLaborModal(true)}
                className="w-full flex items-center justify-between bg-transparent border border-zinc-700 rounded-2xl px-6 py-5 group active:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Briefcase size={20} className="text-purple-400" />
                  <span className="text-zinc-100 font-medium">Adicionar trabalho</span>
                </div>
                <ChevronRight size={20} className="text-purple-400" />
              </button>
              {tempoTrabalho > 0 && (
                <div className="px-6 py-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span className="text-xs text-zinc-400 font-medium">Tempo: <span className="text-zinc-100 font-bold">{formatTime(tempoTrabalho)}</span></span>
                  </div>
                  <span className="text-xs font-bold text-sky-400">R$ {laborValue.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShowProfitInput(true)}
                className="w-full flex items-center justify-between bg-transparent border border-zinc-700 rounded-2xl px-6 py-5 group active:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <DollarSign size={20} className="text-purple-400" />
                  <span className="text-zinc-100 font-medium">Adicionar lucro</span>
                </div>
                <ChevronRight size={20} className="text-purple-400" />
              </button>
              {margemLucro > 0 && (
                <div className="px-6 py-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span className="text-xs text-zinc-400 font-medium">Lucro definido em <span className="text-purple-400 font-bold">{margemLucro}%</span></span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShowTagSelection(true)}
                className="w-full flex items-center justify-between bg-transparent border border-zinc-700 rounded-2xl px-6 py-5 group active:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Square size={20} className="text-purple-400" />
                  <span className="text-zinc-100 font-medium">Selecionar Etiquetas</span>
                </div>
                <ChevronRight size={20} className="text-purple-400" />
              </button>
              {etiquetasSelecionadas.length > 0 && (
                <div className="px-6 py-1 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  {etiquetasSelecionadas.map((tag, i) => (
                    <div key={i} className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
                      <span className="text-[11px] font-bold text-purple-400">{tag.nome}</span>
                      <button
                        onClick={() => setEtiquetasSelecionadas(etiquetasSelecionadas.filter((_, idx) => idx !== i))}
                        className="text-purple-400/50 hover:text-purple-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </section>

        {/* Rendimento Section */}
        <section className="bg-[#1e1e1e] rounded-[32px] p-6 space-y-8 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Rendimento</h2>
            <button className="text-zinc-500">
              <HelpCircle size={24} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-100">Rende mais de uma unidade?</span>
            <button
              onClick={() => setRendimentoAtivo(!rendimentoAtivo)}
              className={`w-14 h-7 rounded-full transition-all relative ${rendimentoAtivo ? "bg-purple-400" : "bg-zinc-700"}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-[#121212] rounded-full transition-all ${rendimentoAtivo ? "left-8" : "left-1"}`} />
            </button>
          </div>

          {rendimentoAtivo && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-transparent border border-zinc-700 rounded-2xl px-6 py-5">
                <input
                  type="number"
                  placeholder="0"
                  value={quantidadeRendimento}
                  onChange={(e) => setQuantidadeRendimento(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-transparent outline-none text-zinc-100 placeholder-zinc-500 font-medium"
                />
              </div>

              <div className="bg-[#1e1e1e] p-6 rounded-3xl border border-zinc-800 shadow-inner space-y-1">
                <p className="text-xs font-bold text-zinc-500">Preço unitário</p>
                <p className="text-2xl font-bold text-sky-400">R$ {unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          )}
        </section>

        {/* Preço Final Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold ml-1">Preço final</h2>
          <PricingTable
            laborValue={laborValue}
            materialsCost={materialsCost}
            totalCost={totalCost}
            profit={profitValue}
            taxValue={taxValue}
            taxPct={taxPct}
            suggestedPrice={suggestedPrice}
            precoPersonalizado={precoPersonalizado}
            onEditPrice={() => setShowPriceEdit(true)}
          />
        </section>

        {/* Final Actions */}
        <div className="space-y-3 pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-5 bg-[#c084fc] text-zinc-900 font-bold rounded-[20px] shadow-lg transition-all ${saving ? "opacity-60" : "hover:bg-[#ba68c8] active:scale-[0.98]"}`}
          >
            {saving ? "Salvando..." : "Salvar produto"}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="w-full py-5 border border-zinc-700 hover:bg-white/5 text-zinc-100 font-bold rounded-[20px] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showProfitInput && (
          <ProfitInputModal
            value={margemLucro}
            total={suggestedPrice}
            onClose={() => setShowProfitInput(false)}
            onConfirm={(val) => {
              setMargemLucro(val);
              setShowProfitInput(false);
            }}
            onOpenSuggestions={() => {
              setShowProfitInput(false);
              setShowSuggestions(true);
            }}
          />
        )}
        {showSuggestions && (
          <ProfitSuggestionsModal
            onClose={() => setShowSuggestions(false)}
            onSelect={(val) => {
              setMargemLucro(val);
              setShowSuggestions(false);
            }}
          />
        )}
        {showMaterialSelection && (
          <MaterialSelectionModal
            onClose={() => setShowMaterialSelection(false)}
            onAddNew={() => {
              setShowMaterialSelection(false);
              setShowMaterialForm(true);
            }}
            onSelect={(m) => {
              setSelectedMaterialForUsage(m);
              setShowMaterialSelection(false);
            }}
          />
        )}
        {showMaterialForm && (
          <MaterialFormModal
            onClose={() => setShowMaterialForm(false)}
            onSave={(m) => {
              setSelectedMaterialForUsage(m);
              setShowMaterialForm(false);
            }}
          />
        )}
        {selectedMaterialForUsage && (
          <MaterialUsageModal
            material={selectedMaterialForUsage}
            onClose={() => setSelectedMaterialForUsage(null)}
            onConfirm={(usage) => {
              setMateriaisAtribuidos([...materiaisAtribuidos, usage]);
              setSelectedMaterialForUsage(null);
            }}
          />
        )}
        {showLaborModal && (
          <LaborModal
            onClose={() => setShowLaborModal(false)}
            onConfirm={(seconds) => {
              setTempoTrabalho(seconds);
              setShowLaborModal(false);
            }}
          />
        )}
        {showTagSelection && (
          <EtiquetaSelectionModal
            onClose={() => setShowTagSelection(false)}
            onAddNew={() => {
              setShowTagSelection(false);
              setShowTagForm(true);
            }}
            onSelect={(tag) => {
              if (!etiquetasSelecionadas.find(t => t.id === tag.id)) {
                setEtiquetasSelecionadas([...etiquetasSelecionadas, tag]);
              }
              setShowTagSelection(false);
            }}
          />
        )}
        {showTagForm && (
          <EtiquetaFormModal
            onClose={() => setShowTagForm(false)}
            onSave={(tag) => {
              setEtiquetasSelecionadas([...etiquetasSelecionadas, tag]);
              setShowTagForm(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Price Edit Modal (outside AnimatePresence for simpler rendering) */}
      {showPriceEdit && (
        <PriceEditModal
          suggestedPrice={suggestedPrice}
          currentPrice={precoPersonalizado}
          onClose={() => setShowPriceEdit(false)}
          onConfirm={(val) => {
            setPrecoPersonalizado(val);
            setShowPriceEdit(false);
          }}
        />
      )}
    </div>
  );
}
