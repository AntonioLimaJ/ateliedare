"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Plus,
  Trash2,
  Check,
  X,
  Clock,
  DollarSign,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";

import { DIAS, calcularCustoHora, calcularTotalTaxPct, type Configuracoes, type Dia, type useConfiguracoes } from "@/lib/use-configuracoes";

interface CustoFixo {
  id: string;
  nome: string;
  valor: number;
}

// ─── Work Config Modal ────────────────────────────────────────────────────────
function TrabalhoModal({
  config,
  onClose,
  onSave,
}: {
  config: Configuracoes;
  onClose: () => void;
  onSave: (c: Configuracoes) => Promise<void>;
}) {
  const [local, setLocal] = useState<Configuracoes>({ ...config });
  const [modoIgual, setModoIgual] = useState(true);
  const [horasIgual, setHorasIgual] = useState(8);
  const [diasAtivos, setDiasAtivos] = useState<Dia[]>(
    DIAS.filter((d) => (config[d.key]) > 0).map((d) => d.key)
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const horasSemana = DIAS.reduce((acc, d) => acc + (local[d.key] || 0), 0);
  const horasMes = horasSemana * (52 / 12);
  const custoHora = horasMes > 0 ? local.salario_mensal / horasMes : 0;

  const toggleDia = (key: Dia) => {
    const isActive = diasAtivos.includes(key);
    const newDias = isActive ? diasAtivos.filter((d) => d !== key) : [...diasAtivos, key];
    setDiasAtivos(newDias);
    if (modoIgual) {
      const newLocal = { ...local };
      DIAS.forEach((d) => {
        newLocal[d.key] = newDias.includes(d.key) ? horasIgual : 0;
      });
      setLocal(newLocal);
    }
  };

  const applyHorasIgual = (h: number) => {
    setHorasIgual(h);
    if (modoIgual) {
      const newLocal = { ...local };
      DIAS.forEach((d) => {
        newLocal[d.key] = diasAtivos.includes(d.key) ? h : 0;
      });
      setLocal(newLocal);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    if (Object.entries(local).some(([key, value]) => key !== "id" && (Number(value) < 0 || !Number.isFinite(Number(value))))) {
      setSaveError("Informe somente valores válidos e não negativos.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try { await onSave(local); onClose(); }
    catch { setSaveError("Não foi possível salvar as configurações. Tente novamente."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#FAF7F2] flex flex-col overflow-y-auto text-[#2D2D2D]">
      <header className="sticky top-0 z-10 bg-[#793751] px-4 py-4 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center gap-3">
          <button onClick={onClose} aria-label="Fechar configuração" className="p-2 -ml-2">
            <X size={24} />
          </button>
          <h1 className="text-xl font-bold">Configurar Trabalho</h1>
        </div>
        <button onClick={handleSave} aria-label="Salvar configuração" disabled={saving} className="p-2 -mr-2">
          {saving ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check size={24} />}
        </button>
      </header>

      <main className="mx-auto w-full max-w-2xl p-4 space-y-6 pb-16">
        {saveError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{saveError}</p>}
        {/* Salário */}
        <section className="bg-white rounded-[28px] p-6 space-y-4 shadow-xl border border-[#F0E6E6]">
          <h2 className="text-lg font-bold">Salário Mensal</h2>
          <div className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4 flex items-center gap-2">
            <span className="text-[#695850] font-bold">R$</span>
            <input
              type="number"
              value={local.salario_mensal || ""}
              onChange={(e) => setLocal({ ...local, salario_mensal: Number(e.target.value) || 0 })}
              placeholder="0,00"
              className="bg-transparent w-full text-[#2D2D2D] font-bold text-xl outline-none"
            />
          </div>
        </section>

        {/* Jornada */}
        <section className="bg-white rounded-[28px] p-6 space-y-6 shadow-xl border border-[#F0E6E6]">
          <h2 className="text-lg font-bold">Jornada de Trabalho</h2>

          {/* Modo */}
          <div className="flex gap-2">
            <button
              onClick={() => setModoIgual(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${modoIgual ? "bg-[#793751] text-white" : "bg-[#F0E6E6] text-[#695850]"}`}
            >
              Mesmo horário
            </button>
            <button
              onClick={() => setModoIgual(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${!modoIgual ? "bg-[#793751] text-white" : "bg-[#F0E6E6] text-[#695850]"}`}
            >
              Personalizado
            </button>
          </div>

          {/* Dias */}
          <div className="flex gap-2 flex-wrap">
            {DIAS.map((d) => {
              const active = modoIgual ? diasAtivos.includes(d.key) : (local[d.key]) > 0;
              return (
                <button
                  key={d.key}
                  aria-pressed={active}
                  onClick={() => { if (modoIgual) toggleDia(d.key); }}
                  style={{ touchAction: "manipulation" }}
                  className={`w-11 h-11 rounded-xl text-sm font-bold transition-colors ${active ? "bg-[#793751] text-white" : "bg-[#F0E6E6] text-[#695850]"}`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          {modoIgual ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#695850] uppercase tracking-widest">Horas por dia</label>
              <div className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4 flex items-center gap-2">
                <Clock size={16} className="text-[#695850]" />
                <input
                  type="number"
                  value={horasIgual || ""}
                  onChange={(e) => applyHorasIgual(Number(e.target.value) || 0)}
                  placeholder="8"
                  className="bg-transparent w-full text-[#2D2D2D] font-bold outline-none"
                />
                <span className="text-[#695850] text-sm">h/dia</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {DIAS.map((d) => (
                <div key={d.key} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#695850] w-8">{d.label}</span>
                  <div className="flex-1 bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-3 flex items-center gap-2">
                    <input
                      type="number"
                      value={(local[d.key]) || ""}
                      onChange={(e) => setLocal({ ...local, [d.key]: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="bg-transparent w-full text-[#2D2D2D] font-bold outline-none"
                    />
                    <span className="text-[#695850] text-xs">h</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Resultado */}
        <section className="bg-white rounded-[28px] p-6 space-y-4 shadow-xl border border-[#F0E6E6]">
          <h2 className="text-lg font-bold">Resultado</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6D6D6D]">Horas por semana</span>
              <span className="text-sm font-bold text-[#2D2D2D]">{horasSemana.toFixed(1)}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6D6D6D]">Horas por mês</span>
              <span className="text-sm font-bold text-[#2D2D2D]">{horasMes.toFixed(1)}h</span>
            </div>
            <div className="border-t border-[#F0E6E6] pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-[#2D2D2D]">Custo por hora</span>
              <span className="text-lg font-bold text-[#793751]">
                R$ {custoHora.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// ─── Taxes Config Modal ───────────────────────────────────────────────────────
function TaxasModal({
  config,
  onClose,
  onSave,
}: {
  config: Configuracoes;
  onClose: () => void;
  onSave: (c: Configuracoes) => Promise<void>;
}) {
  const [local, setLocal] = useState<Configuracoes>({ ...config });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const totalPct = (local.imposto_pct || 0) + (local.cartao_pct || 0) + (local.comissao_pct || 0);

  const handleSave = async () => {
    if (saving) return;
    if (Object.entries(local).some(([key, value]) => key !== "id" && (Number(value) < 0 || !Number.isFinite(Number(value))))) {
      setSaveError("Informe somente valores válidos e não negativos.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try { await onSave(local); onClose(); }
    catch { setSaveError("Não foi possível salvar as configurações. Tente novamente."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#FAF7F2] flex flex-col overflow-y-auto text-[#2D2D2D]">
      <header className="sticky top-0 z-10 bg-[#793751] px-4 py-4 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center gap-3">
          <button onClick={onClose} aria-label="Fechar configuração" className="p-2 -ml-2"><X size={24} /></button>
          <h1 className="text-xl font-bold">Configurar Taxas</h1>
        </div>
        <button onClick={handleSave} aria-label="Salvar configuração" disabled={saving} className="p-2 -mr-2">
          {saving ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check size={24} />}
        </button>
      </header>

      <main className="mx-auto w-full max-w-2xl p-4 space-y-6 pb-16">
        {saveError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{saveError}</p>}
        <section className="bg-white rounded-[28px] p-6 space-y-6 shadow-xl border border-[#F0E6E6]">
          <h2 className="text-lg font-bold">Taxas (%)</h2>
          <p className="text-xs text-[#6D6D6D]">Coloque o percentual de cada taxa. Use o maior valor que você paga.</p>

          {([
            { key: "imposto_pct", label: "Impostos", desc: "Soma de todos os impostos" },
            { key: "cartao_pct", label: "Cartão", desc: "Taxa mais cara cobrada por venda" },
            { key: "comissao_pct", label: "Comissão", desc: "Maior comissão que você paga" },
          ] as const).map(({ key, label, desc }) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#2D2D2D]">{label}</label>
                <span className="text-xs text-[#695850]">{desc}</span>
              </div>
              <div className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4 flex items-center gap-2">
                <input
                  type="number"
                  value={local[key] || ""}
                  onChange={(e) => setLocal({ ...local, [key]: Number(e.target.value) || 0 })}
                  placeholder="0"
                  className="bg-transparent w-full text-[#2D2D2D] font-bold outline-none"
                />
                <span className="text-[#695850] font-bold">%</span>
              </div>
            </div>
          ))}

          <div className="border-t border-[#F0E6E6] pt-4 flex justify-between items-center">
            <span className="text-sm font-bold text-[#2D2D2D]">Total de taxas</span>
            <span className="text-lg font-bold text-[#793751]">{totalPct.toFixed(2)}%</span>
          </div>
        </section>
      </main>
    </div>
  );
}

// ─── Add Custo Fixo Modal ─────────────────────────────────────────────────────
function AddCustoModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (nome: string, valor: number) => Promise<void>;
}) {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState<number | "">("");
  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState("");
  const valid = nome.trim() && valor !== "" && Number.isFinite(valor) && valor >= 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] p-6 space-y-6 shadow-2xl border border-[#F0E6E6] text-[#2D2D2D]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Novo Custo Fixo</h2>
          <button onClick={onClose} className="text-[#695850]"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4">
            <input
              type="text"
              placeholder="Nome (ex: Aluguel, Luz...)"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
              className="bg-transparent w-full text-[#2D2D2D] font-medium outline-none"
            />
          </div>
          <div className="bg-transparent border border-[#F0E6E6] rounded-xl px-4 py-4 flex items-center gap-2">
            <span className="text-[#695850] font-bold">R$</span>
            <input
              type="number"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value === "" ? "" : Number(e.target.value))}
              className="bg-transparent w-full text-[#2D2D2D] font-bold outline-none"
            />
          </div>
        </div>
        <div className="space-y-2">
          <button
            onClick={async () => {
              if (!valid || pending) return;
              setPending(true);
              setSaveError("");
              try { await onSave(nome.trim(), Number(valor)); }
              catch { setSaveError("Não foi possível salvar o custo. Tente novamente."); }
              finally { setPending(false); }
            }}
            disabled={!valid || pending}
            className="w-full py-4 bg-[#793751] disabled:bg-[#F0E6E6] disabled:text-[#695850] text-white font-bold rounded-2xl shadow-lg"
          >
            {pending ? "Salvando…" : "Adicionar"}
          </button>
          {saveError && <p role="alert" className="text-sm text-red-800">{saveError}</p>}
          <button onClick={onClose} className="w-full py-3 text-[#695850] font-bold">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main CustosTab Component ─────────────────────────────────────────────────
export function CustosTab({ config, loading, saveConfig, configError, refetch }: ReturnType<typeof useConfiguracoes>) {
  const [custosFixos, setCustosFixos] = useState<CustoFixo[]>([]);
  const [loadingCustos, setLoadingCustos] = useState(true);
  const [showTrabalho, setShowTrabalho] = useState(false);
  const [showTaxas, setShowTaxas] = useState(false);
  const [showAddCusto, setShowAddCusto] = useState(false);

  const [costError, setCostError] = useState("");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const { data, error } = await getSupabase().from("custos_fixos").select("id,nome,valor")
        .order("created_at").abortSignal(controller.signal);
      if (controller.signal.aborted) return;
      if (error) setCostError("Não foi possível carregar os custos fixos.");
      else {
        setCustosFixos(data ?? []);
        setCostError("");
      }
      setLoadingCustos(false);
    }
    void load();
    return () => controller.abort();
  }, [attempts]);

  const handleAddCusto = async (nome: string, valor: number) => {
    const { data, error } = await getSupabase().from("custos_fixos").insert({ nome, valor }).select().single();
    if (error) throw error;
    setCustosFixos(current => [...current, data]);
    setShowAddCusto(false);
  };

  const handleDeleteCusto = async (id: string) => {
    if (!confirm("Excluir este custo fixo?")) return;
    const { error } = await getSupabase().from("custos_fixos").delete().eq("id", id);
    if (error) setCostError("Não foi possível excluir o custo fixo.");
    else setCustosFixos(current => current.filter(cost => cost.id !== id));
  };

  const custoHora = calcularCustoHora(config);
  const totalTax = calcularTotalTaxPct(config);
  const totalCustosFixos = custosFixos.reduce((acc, c) => acc + Number(c.valor), 0);
  const horasSemana = DIAS.reduce((acc, d) => acc + (config[d.key] || 0), 0);
  const horasMes = horasSemana * (52 / 12);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-[#E5989B]/20 border-t-[#E5989B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 pb-4">
        {(configError || costError) && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
          {configError || costError} <button className="underline" onClick={() => { refetch(); setAttempts(value => value + 1); }}>Tentar novamente</button>
        </div>}
        {/* ── Trabalho ──────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-[#695850] uppercase tracking-widest">Trabalho</h3>
            <button
              disabled={!!configError} onClick={() => setShowTrabalho(true)}
              style={{ touchAction: "manipulation" }}
              className="flex items-center gap-1.5 text-[#793751] text-xs font-bold active:opacity-70"
            >
              <Settings size={14} />
              Editar
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#F0E6E6] space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-[#6D6D6D]">
                <DollarSign size={16} className="text-[#793751]" />
                <span className="text-sm">Salário mensal</span>
              </div>
              <span className="text-sm font-bold text-[#2D2D2D]">
                R$ {config.salario_mensal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-[#6D6D6D]">
                <Clock size={16} className="text-[#793751]" />
                <span className="text-sm">Horas por mês</span>
              </div>
              <span className="text-sm font-bold text-[#2D2D2D]">{horasMes.toFixed(1)}h</span>
            </div>
            <div className="border-t border-[#F0E6E6] pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-[#2D2D2D]">Custo / hora</span>
              <span className="text-base font-bold text-[#793751]">
                R$ {custoHora.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* ── Taxas ─────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-[#695850] uppercase tracking-widest">Taxas</h3>
            <button
              disabled={!!configError} onClick={() => setShowTaxas(true)}
              style={{ touchAction: "manipulation" }}
              className="flex items-center gap-1.5 text-[#793751] text-xs font-bold active:opacity-70"
            >
              <Settings size={14} />
              Editar
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#F0E6E6] space-y-3 shadow-sm">
            {[
              { label: "Impostos", value: config.imposto_pct },
              { label: "Cartão", value: config.cartao_pct },
              { label: "Comissão", value: config.comissao_pct },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-sm text-[#6D6D6D]">{label}</span>
                <span className="text-sm font-bold text-[#2D2D2D]">{value.toFixed(2)}%</span>
              </div>
            ))}
            <div className="border-t border-[#F0E6E6] pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-[#2D2D2D]">Total de taxas</span>
              <span className="text-base font-bold text-[#793751]">{totalTax.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* ── Custos Fixos ──────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-[#695850] uppercase tracking-widest">Custos Fixos Mensais</h3>
            <button
              onClick={() => setShowAddCusto(true)}
              style={{ touchAction: "manipulation" }}
              className="flex items-center gap-1.5 text-[#793751] text-xs font-bold active:opacity-70"
            >
              <Plus size={14} />
              Adicionar
            </button>
          </div>

          {loadingCustos ? (
            <div className="py-4 flex justify-center">
              <div className="w-6 h-6 border-2 border-[#E5989B]/30 border-t-[#E5989B] rounded-full animate-spin" />
            </div>
          ) : custosFixos.length === 0 ? (
            <div className="bg-white rounded-2xl p-5 border border-[#F0E6E6] text-center shadow-sm">
              <p className="text-sm text-[#695850]">Nenhum custo fixo cadastrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {custosFixos.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl p-4 border border-[#F0E6E6] flex items-center justify-between shadow-sm">
                  <span className="text-sm font-medium text-[#2D2D2D]">{c.nome}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#6D6D6D]">
                      R$ {c.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => handleDeleteCusto(c.id)}
                      className="text-red-400/40 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="bg-[#FAF7F2] rounded-2xl p-4 flex justify-between items-center border border-[#F0E6E6]">
                <span className="text-sm font-bold text-[#6D6D6D]">Total mensal</span>
                <span className="text-sm font-bold text-[#793751]">
                  R$ {totalCustosFixos.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showTrabalho && (
        <TrabalhoModal
          config={config}
          onClose={() => setShowTrabalho(false)}
          onSave={saveConfig}
        />
      )}
      {showTaxas && (
        <TaxasModal
          config={config}
          onClose={() => setShowTaxas(false)}
          onSave={saveConfig}
        />
      )}
      {showAddCusto && (
        <AddCustoModal
          onClose={() => setShowAddCusto(false)}
          onSave={handleAddCusto}
        />
      )}
    </>
  );
}

