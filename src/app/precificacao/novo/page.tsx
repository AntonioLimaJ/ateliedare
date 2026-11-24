"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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
import { MaterialSelectionModal, MaterialFormModal, MaterialUsageModal, type Material } from "../_components/MaterialManager";
import { LaborModal } from "../_components/LaborModal";
import { EtiquetaSelectionModal, EtiquetaFormModal } from "../_components/TagManager";
import { AnimatePresence } from "framer-motion";
import { getSupabase } from "@/lib/supabase";
import { useConfiguracoes, calcularCustoHora, calcularTotalTaxPct } from "@/lib/use-configuracoes";
import { ConfirmationModal } from "../_components/ConfirmationModal";
import { removeAtelieImage, uploadAtelieImage } from "@/lib/atelie-storage";
import { money, type Etiqueta } from "@/lib/atelie";

type MaterialUsado = { materialId: string; nome: string; quantidade: number; unidade: string; custo: number };

// Separate the content to use Suspense
function NovoProdutoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const originalImageRef = useRef<string | null>(null);
  const busy = useRef(false);
  const createOperation = useRef<string | null>(null);
  const pendingUpload = useRef<{ source: string; url: string } | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [error, setError] = useState("");

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
  const [selectedMaterialForUsage, setSelectedMaterialForUsage] = useState<Material | null>(null);

  // Save & Price edit
  const [saving, setSaving] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dependentBudgets, setDependentBudgets] = useState<string[]>([]);
  const [precoPersonalizado, setPrecoPersonalizado] = useState<number | null>(null);
  const [showPriceEdit, setShowPriceEdit] = useState(false);

  // Global config (salary/taxes)
  const { config, loading: configLoading, configError, refetch } = useConfiguracoes();

  // Materials, Labor & Tags State
  const [materiaisAtribuidos, setMateriaisAtribuidos] = useState<MaterialUsado[]>([]);
  const [tempoTrabalho, setTempoTrabalho] = useState(0); // in seconds
  const [etiquetasSelecionadas, setEtiquetasSelecionadas] = useState<Etiqueta[]>([]);

  useEffect(() => {
    if (!editId) return;
    const controller = new AbortController();
    const supabase = getSupabase();

    async function load() {
      const [product, materials] = await Promise.all([
        supabase.from("produtos").select("*").eq("id", editId).abortSignal(controller.signal).single(),
        supabase.from("produto_materiais").select("material_id,nome,quantidade,unidade,custo").eq("produto_id", editId).abortSignal(controller.signal),
      ]);
      if (controller.signal.aborted) return;
      if (product.error || materials.error || !product.data) {
        setError("Não foi possível carregar o produto. Volte à lista e tente novamente.");
        return;
      }

      const data = product.data;
      const tagIds: string[] = Array.isArray(data.etiquetas_ids) ? data.etiquetas_ids : [];
      const tags = tagIds.length ? await supabase.from("etiquetas").select("id,nome").in("id", tagIds).abortSignal(controller.signal) : null;
      if (controller.signal.aborted) return;
      if (tags?.error) {
        setError("Não foi possível carregar as etiquetas. Volte à lista e tente novamente.");
        return;
      }
      setNome(data.nome ?? "");
      setDescricao(data.descricao ?? "");
      setNotas(data.notas ?? "");
      setImagem(data.imagem_url ?? null);
      originalImageRef.current = data.imagem_url ?? null;
      setFavorito(Boolean(data.favorito));
      setMargemLucro(Number(data.margem_lucro || 0));
      setTempoTrabalho(Number(data.tempo_trabalho || 0));
      const yieldCount = Number(data.rendimento || 1);
      setRendimentoAtivo(yieldCount > 1);
      setQuantidadeRendimento(yieldCount > 1 ? yieldCount : "");
      setPrecoPersonalizado(data.preco_final != null && data.preco_sugerido != null
        && Math.abs(Number(data.preco_final) - Number(data.preco_sugerido)) > 0.01
        ? Number(data.preco_final) : null);
      setMateriaisAtribuidos((materials.data ?? []).map(m => ({
        materialId: m.material_id, nome: m.nome, quantidade: Number(m.quantidade), unidade: m.unidade, custo: Number(m.custo),
      })));
      setEtiquetasSelecionadas(tags?.data ?? []);
      setLoadedId(editId);
    }

    void load();
    return () => controller.abort();
  }, [editId]);

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
    setShowCancelModal(true);
  };

  const handleDelete = async () => {
    if (!editId || busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const { data, error: checkError } = await getSupabase()
        .from("orcamento_itens").select("orcamento_id").eq("produto_id", editId).limit(1);
      if (checkError) throw checkError;
      setDependentBudgets(data?.length ? ["Há um orçamento vinculado a este produto."] : []);
      setShowDeleteModal(true);
    } catch {
      setError("Não foi possível verificar os orçamentos vinculados.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!editId || busy.current || dependentBudgets.length > 0) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const { error: deleteError } = await getSupabase().rpc("ateliedare_excluir_produto", { p_id: String(editId) });
      if (deleteError) throw deleteError;
      await removeAtelieImage(originalImageRef.current);
      router.replace("/precificacao");
    } catch {
      setError("Não foi possível excluir o produto. Confira se ele está em algum orçamento e tente novamente.");
    } finally {
      busy.current = false;
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  const handleSave = async () => {
    if (busy.current || processingImage || configLoading || configError || (editId && loadedId !== editId)) return;
    if (!nome.trim() || !Number.isFinite(precoFinal) || precoFinal < 0
      || (rendimentoAtivo && (!Number.isSafeInteger(quantidadeRendimento) || Number(quantidadeRendimento) < 2))) {
      setError("Informe um nome, um preço válido e, se aplicável, um rendimento de pelo menos 2 unidades.");
      return;
    }

    busy.current = true;
    setSaving(true);
    setError("");
    let finalImage = imagem;
    let uploadedImage: string | null = null;
    try {
      if (imagemNova && imagem?.startsWith("data:")) {
        const pending = pendingUpload.current;
        uploadedImage = pending?.source === imagem ? pending.url : await uploadAtelieImage(imagem);
        pendingUpload.current = { source: imagem, url: uploadedImage };
        finalImage = uploadedImage;
      }

      if (!editId) createOperation.current ??= crypto.randomUUID();

      const { error: saveError } = await getSupabase().rpc("ateliedare_salvar_produto", {
        p_id: editId,
        p_operacao: editId ? null : createOperation.current,
        p_produto: {
          nome: nome.trim(), descricao: descricao.trim() || null, notas: notas.trim() || null,
          imagem_url: finalImage, favorito, preco_final: money(precoFinal),
          preco_sugerido: money(suggestedPrice), margem_lucro: margemLucro, tempo_trabalho: tempoTrabalho,
          custo_materiais: materialsCost, custo_trabalho: laborValue,
          rendimento: rendimentoAtivo ? Number(quantidadeRendimento) : 1,
          etiquetas_ids: etiquetasSelecionadas.map(tag => tag.id),
        },
        p_materiais: materiaisAtribuidos.map(m => ({
          material_id: m.materialId, nome: m.nome, quantidade: m.quantidade, unidade: m.unidade, custo: m.custo,
        })),
      });
      if (saveError) {
        // Remover o upload apenas quando o banco confirmou que a operação falhou.
        if (saveError.code && !saveError.code.startsWith("08")) {
          pendingUpload.current = null;
          await removeAtelieImage(uploadedImage);
        }
        throw saveError;
      }
      if (originalImageRef.current !== finalImage) await removeAtelieImage(originalImageRef.current);
      router.replace("/precificacao");
    } catch {
      setError("Não foi possível salvar o produto. Seus dados continuam no formulário. Tente novamente.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D2D2D] pb-32 font-sans selection:bg-[#E5989B]/30">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#793751] px-4 py-4 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center gap-4">
          <button onClick={handleCancel} aria-label="Voltar" className="p-2 -ml-2">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">{editId ? "Editar Produto" : "Novo Produto"}</h1>
        </div>
        <button onClick={handleSave} aria-label="Salvar produto" disabled={saving || processingImage || configLoading || Boolean(configError) || Boolean(editId && loadedId !== editId)} className="p-2 -mr-2">
          {saving ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check size={24} />}
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6 mt-4">
        {configError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{configError} <button onClick={refetch} className="underline">Tentar novamente</button></p>}
        {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {editId && loadedId !== editId && !error && <p role="status" className="p-4 text-sm">Carregando produto…</p>}
        {/* Image Section */}
        <section className="bg-white rounded-[32px] p-6 shadow-xl border border-[#F0E6E6]">
          <ImageUpload
            onProcessingChange={setProcessingImage}
            onImageChange={(img, isNew) => {
              setImagem(img);
              setImagemNova(isNew || false);
            }}
            initialImage={imagem}
          />
        </section>

        {/* Produto Section */}
        <section className="bg-white rounded-[32px] p-6 space-y-6 shadow-xl border border-[#F0E6E6]">
          <h2 className="text-xl font-bold text-[#2D2D2D]">Produto</h2>

          <div className="space-y-4">
            <div className="bg-transparent border border-[#F0E6E6] rounded-2xl px-6 py-5">
              <input
                type="text"
                placeholder="Nome do Produto"
                value={nome}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-transparent outline-none text-[#2D2D2D] placeholder-[#695850] font-medium"
              />
            </div>

            <div className="bg-transparent border border-[#F0E6E6] rounded-2xl px-6 py-5 flex items-center justify-between">
              <input
                type="text"
                placeholder="Descrição"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full bg-transparent outline-none text-[#2D2D2D] placeholder-[#695850] font-medium"
              />
              <HelpCircle size={20} className="text-[#695850]" />
            </div>

            <div className="bg-transparent border border-[#F0E6E6] rounded-2xl px-6 py-5 flex items-center justify-between">
              <input
                type="text"
                placeholder="Notas Pessoais"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full bg-transparent outline-none text-[#2D2D2D] placeholder-[#695850] font-medium"
              />
              <HelpCircle size={20} className="text-[#695850]" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-[#2D2D2D]">Marcar como Favorito?</span>
              <button
                onClick={() => setFavorito(!favorito)}
                className={`w-14 h-7 rounded-full transition-all relative ${favorito ? "bg-[#793751]" : "bg-[#F0E6E6]"}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${favorito ? "left-8" : "left-1 shadow-sm"}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Precificar Section */}
        <section className="bg-white rounded-[32px] p-6 space-y-6 shadow-xl relative overflow-hidden border border-[#F0E6E6]">
          <h2 className="text-xl font-bold text-[#2D2D2D]">Precificar</h2>

          {/* Bloqueio visual quando nome não preenchido */}
          <div
            className="absolute inset-0 bg-white/95 z-50 flex items-center justify-center text-center p-6 transition-opacity duration-300"
            style={{ opacity: nome.trim().length > 0 ? 0 : 1, pointerEvents: nome.trim().length > 0 ? "none" : "none" }}
          >
            <p className="text-sm font-bold text-[#695850] uppercase tracking-widest">
              Preencha o nome do produto
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowMaterialSelection(true)}
                className="w-full flex items-center justify-between bg-transparent border border-[#F0E6E6] rounded-2xl px-6 py-5 group active:bg-[#F8EDEB] transition-colors touch-manipulation"
              >
                <div className="flex items-center gap-4">
                  <LayoutGrid size={20} className="text-[#793751]" />
                  <span className="text-[#2D2D2D] font-medium">Adicionar materiais</span>
                </div>
                <ChevronRight size={20} className="text-[#793751]" />
              </button>

              {materiaisAtribuidos.length > 0 && (
                <div className="px-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  {materiaisAtribuidos.map((m, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#F8EDEB] p-3 rounded-xl border border-[#F0E6E6]">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setMateriaisAtribuidos(materiaisAtribuidos.filter((_, idx) => idx !== i))}
                          className="text-red-400/50 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="flex flex-col">
                          <span className="text-[13px] text-[#2D2D2D] font-medium">{m.nome}</span>
                          <span className="text-[10px] text-[#6D6D6D]">{m.quantidade} {m.unidade}</span>
                        </div>
                      </div>
                      <span className="text-[13px] font-bold text-[#2D2D2D]">R$ {m.custo.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShowLaborModal(true)}
                className="w-full flex items-center justify-between bg-transparent border border-[#F0E6E6] rounded-2xl px-6 py-5 group active:bg-[#F8EDEB] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Briefcase size={20} className="text-[#793751]" />
                  <span className="text-[#2D2D2D] font-medium">Adicionar trabalho</span>
                </div>
                <ChevronRight size={20} className="text-[#793751]" />
              </button>
              {tempoTrabalho > 0 && (
                <div className="px-6 py-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#793751]" />
                    <span className="text-xs text-[#6D6D6D] font-medium">Tempo: <span className="text-[#2D2D2D] font-bold">{formatTime(tempoTrabalho)}</span></span>
                  </div>
                  <span className="text-xs font-bold text-[#793751]">R$ {laborValue.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShowProfitInput(true)}
                className="w-full flex items-center justify-between bg-transparent border border-[#F0E6E6] rounded-2xl px-6 py-5 group active:bg-[#F8EDEB] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <DollarSign size={20} className="text-[#793751]" />
                  <span className="text-[#2D2D2D] font-medium">Adicionar lucro</span>
                </div>
                <ChevronRight size={20} className="text-[#793751]" />
              </button>
              {margemLucro > 0 && (
                <div className="px-6 py-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#793751]" />
                  <span className="text-xs text-[#6D6D6D] font-medium">Lucro definido em <span className="text-[#793751] font-bold">{margemLucro}%</span></span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShowTagSelection(true)}
                className="w-full flex items-center justify-between bg-transparent border border-[#F0E6E6] rounded-2xl px-6 py-5 group active:bg-[#F8EDEB] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Square size={20} className="text-[#793751]" />
                  <span className="text-[#2D2D2D] font-medium">Selecionar Etiquetas</span>
                </div>
                <ChevronRight size={20} className="text-[#793751]" />
              </button>
              {etiquetasSelecionadas.length > 0 && (
                <div className="px-6 py-1 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  {etiquetasSelecionadas.map((tag, i) => (
                    <div key={i} className="flex items-center gap-2 bg-[#F8EDEB] border border-[#F0E6E6] px-3 py-1 rounded-full">
                      <span className="text-[11px] font-bold text-[#793751]">{tag.nome}</span>
                      <button
                        onClick={() => setEtiquetasSelecionadas(etiquetasSelecionadas.filter((_, idx) => idx !== i))}
                        className="text-[#793751]/50 hover:text-[#793751] transition-colors"
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
        <section className="bg-white rounded-[32px] p-6 space-y-8 shadow-xl border border-[#F0E6E6]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2D2D2D]">Rendimento</h2>
            <span title="Divida o preço total pela quantidade produzida." aria-label="Divida o preço total pela quantidade produzida.">
              <HelpCircle size={22} aria-hidden />
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#2D2D2D]">Rende mais de uma unidade?</span>
            <button
              aria-label="Rendimento de várias unidades"
              aria-pressed={rendimentoAtivo}
              onClick={() => setRendimentoAtivo(!rendimentoAtivo)}
              className={`w-14 h-7 rounded-full transition-all relative ${rendimentoAtivo ? "bg-[#793751]" : "bg-[#F0E6E6]"}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${rendimentoAtivo ? "left-8" : "left-1 shadow-sm"}`} />
            </button>
          </div>

          {rendimentoAtivo && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-transparent border border-[#F0E6E6] rounded-2xl px-6 py-5">
                <input
                  type="number"
                  placeholder="2"
                  min={2}
                  step={1}
                  aria-label="Quantidade produzida"
                  value={quantidadeRendimento}
                  onChange={(e) => setQuantidadeRendimento(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-transparent outline-none text-[#2D2D2D] placeholder-[#695850] font-medium"
                />
              </div>

              <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#F0E6E6] shadow-inner space-y-1">
                <p className="text-xs font-bold text-[#6D6D6D]">Preço unitário</p>
                <p className="text-2xl font-bold text-[#793751]">R$ {unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          )}
        </section>

        {/* Preço Final Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold ml-1 text-[#2D2D2D]">Preço final</h2>
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
            disabled={saving || processingImage || configLoading || Boolean(configError) || Boolean(editId && loadedId !== editId)}
            className={`w-full py-5 bg-[#793751] text-white font-bold rounded-[20px] shadow-lg transition-all ${saving ? "opacity-60" : "hover:bg-[#632942] active:scale-[0.98]"}`}
          >
            {saving ? "Salvando..." : "Salvar produto"}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving || processingImage || configLoading || Boolean(configError) || Boolean(editId && loadedId !== editId)}
            className="w-full py-5 border border-[#F0E6E6] hover:bg-[#F8EDEB] text-[#2D2D2D] font-bold rounded-[20px] transition-colors"
          >
            Cancelar
          </button>
          {editId && (
            <button
              onClick={handleDelete}
              disabled={saving || processingImage || configLoading || Boolean(configError) || Boolean(editId && loadedId !== editId)}
              className="w-full py-5 border border-[#F0E6E6] hover:bg-red-50 text-red-400 font-bold rounded-[20px] transition-colors"
            >
              Deletar produto
            </button>
          )}

        </div>

        {/* Modais de Confirmação */}
        <ConfirmationModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={() => {
            setShowCancelModal(false);
            router.push("/precificacao");
          }}
          title="Cancelar Alterações"
          message="Tem certeza que deseja sair? Todas as informações não salvas serão perdidas permanentemente."
          confirmText="Sim, Sair"
          variant="warning"
        />

        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setDependentBudgets([]); }}
          onConfirm={() => {
            confirmDelete();
          }}
          title={dependentBudgets.length > 0 ? "Exclusão Bloqueada" : "Excluir Produto"}
          message={dependentBudgets.length > 0
            ? "Este produto não pode ser excluído porque está vinculado aos orçamentos abaixo. Remova-o dos orçamentos primeiro."
            : `Tem certeza que deseja excluir o produto "${nome}"? Esta ação não pode ser desfeita.`
          }
          items={dependentBudgets}
          confirmText="Sim, Excluir"
          isLoading={saving}
        />
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
            onSelect={(m: Material) => {
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
            onConfirm={(seconds: number) => {
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

export default function NovoProduto() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E5989B]/20 border-t-[#E5989B] rounded-full animate-spin" />
      </div>
    }>
      <NovoProdutoContent />
    </Suspense>
  );
}
