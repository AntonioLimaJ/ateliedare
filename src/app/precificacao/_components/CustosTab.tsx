"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Plus,
  Trash2,
  Check,
  X,
  ChevronRight,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface Configuracoes {
  id: string;
  salario_mensal: number;
  horas_seg: number;
  horas_ter: number;
  horas_qua: number;
  horas_qui: number;
  horas_sex: number;
  horas_sab: number;
  horas_dom: number;
  imposto_pct: number;
  cartao_pct: number;
  comissao_pct: number;
}

interface CustoFixo {
  id: string;
  nome: string;
  valor: number;
}

const DIAS = [
  { key: "horas_seg", label: "Seg" },
  { key: "horas_ter", label: "Ter" },
  { key: "horas_qua", label: "Qua" },
  { key: "horas_qui", label: "Qui" },
  { key: "horas_sex", label: "Sex" },
  { key: "horas_sab", label: "Sáb" },
  { key: "horas_dom", label: "Dom" },
];

const CONFIG_DEFAULT: Configuracoes = {
  id: "global",
  salario_mensal: 0,
  horas_seg: 8, horas_ter: 8, horas_qua: 8, horas_qui: 8, horas_sex: 8,
  horas_sab: 0, horas_dom: 0,
  imposto_pct: 0, cartao_pct: 0, comissao_pct: 0,
};

export function calcularCustoHora(config: Configuracoes): number {
  const horasSemana = DIAS.reduce((acc, d) => acc + (config[d.key as keyof Configuracoes] as number || 0), 0);
  const horasMes = horasSemana * (52 / 12);
  if (horasMes === 0) return 0;
  return config.salario_mensal / horasMes;
}

export function calcularTotalTaxPct(config: Configuracoes): number {
  return (config.imposto_pct || 0) + (config.cartao_pct || 0) + (config.comissao_pct || 0);
}

export function useConfiguracoes() {
  const [config, setConfig] = useState<Configuracoes>(CONFIG_DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await supabase
        .from("configuracoes")
        .select("*")
        .eq("id", "global")
        .single();
      if (data) setConfig(data);
    } catch (e) {
      // Use defaults if table doesn't exist
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (updated: Configuracoes) => {
    setConfig(updated);
    await supabase
      .from("configuracoes")
      .upsert({ ...updated, id: "global", updated_at: new Date().toISOString() });
  };

  return { config, loading, saveConfig, refetch: fetchConfig };
}

// ─── Work Config Modal ────────────────────────────────────────────────────────
function TrabalhoModal({
  config,
  onClose,
  onSave,
}: {
  config: Configuracoes;
  onClose: () => void;
  onSave: (c: Configuracoes) => void;
}) {
  const [local, setLocal] = useState<Configuracoes>({ ...config });
  const [modoIgual, setModoIgual] = useState(true);
  const [horasIgual, setHorasIgual] = useState(8);
  const [diasAtivos, setDiasAtivos] = useState<string[]>(
    DIAS.filter((d) => (config[d.key as keyof Configuracoes] as number) > 0).map((d) => d.key)
  );
  const [saving, setSaving] = useState(false);

  const horasSemana = DIAS.reduce((acc, d) => acc + (local[d.key as keyof Configuracoes] as number || 0), 0);
  const horasMes = horasSemana * (52 / 12);
  const custoHora = horasMes > 0 ? local.salario_mensal / horasMes : 0;

  const toggleDia = (key: string) => {
    const isActive = diasAtivos.includes(key);
    const newDias = isActive ? diasAtivos.filter((d) => d !== key) : [...diasAtivos, key];
    setDiasAtivos(newDias);
    if (modoIgual) {
      const newLocal = { ...local };
      DIAS.forEach((d) => {
        (newLocal as any)[d.key] = newDias.includes(d.key) ? horasIgual : 0;
      });
      setLocal(newLocal);
    }
  };

  const applyHorasIgual = (h: number) => {
    setHorasIgual(h);
    if (modoIgual) {
      const newLocal = { ...local };
      DIAS.forEach((d) => {
        (newLocal as any)[d.key] = diasAtivos.includes(d.key) ? h : 0;
      });
      setLocal(newLocal);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(local);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#121212] flex flex-col overflow-y-auto">
      <header className="sticky top-0 z-10 bg-[#c084fc] px-4 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2">
            <X size={24} />
          </button>
          <h1 className="text-xl font-bold">Configurar Trabalho</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="p-2 -mr-2">
          {saving ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check size={24} />}
        </button>
      </header>

      <main className="p-4 space-y-6 pb-16">
        {/* Salário */}
        <section className="bg-[#1e1e1e] rounded-[28px] p-6 space-y-4 shadow-xl">
          <h2 className="text-lg font-bold">Salário Mensal</h2>
          <div className="bg-transparent border border-zinc-700 rounded-xl px-4 py-4 flex items-center gap-2">
            <span className="text-zinc-500 font-bold">R$</span>
            <input
              type="number"
              value={local.salario_mensal || ""}
              onChange={(e) => setLocal({ ...local, salario_mensal: Number(e.target.value) || 0 })}
              placeholder="0,00"
              className="bg-transparent w-full text-white font-bold text-xl outline-none"
            />
          </div>
        </section>

        {/* Jornada */}
        <section className="bg-[#1e1e1e] rounded-[28px] p-6 space-y-6 shadow-xl">
          <h2 className="text-lg font-bold">Jornada de Trabalho</h2>

          {/* Modo */}
          <div className="flex gap-2">
            <button
              onClick={() => setModoIgual(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${modoIgual ? "bg-purple-500 text-white" : "bg-zinc-800 text-zinc-400"}`}
            >
              Mesmo horário
            </button>
            <button
              onClick={() => setModoIgual(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${!modoIgual ? "bg-purple-500 text-white" : "bg-zinc-800 text-zinc-400"}`}
            >
              Personalizado
            </button>
          </div>

          {/* Dias */}
          <div className="flex gap-2 flex-wrap">
            {DIAS.map((d) => {
              const active = modoIgual ? diasAtivos.includes(d.key) : (local[d.key as keyof Configuracoes] as number) > 0;
              return (
                <button
                  key={d.key}
                  onTouchEnd={(e) => { e.stopPropagation(); modoIgual ? toggleDia(d.key) : null; }}
                  onClick={() => modoIgual ? toggleDia(d.key) : null}
                  style={{ touchAction: "manipulation" }}
                  className={`w-11 h-11 rounded-xl text-sm font-bold transition-colors ${active ? "bg-purple-500 text-white" : "bg-zinc-800 text-zinc-500"}`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          {modoIgual ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Horas por dia</label>
              <div className="bg-transparent border border-zinc-700 rounded-xl px-4 py-4 flex items-center gap-2">
                <Clock size={16} className="text-zinc-500" />
                <input
                  type="number"
                  value={horasIgual || ""}
                  onChange={(e) => applyHorasIgual(Number(e.target.value) || 0)}
                  placeholder="8"
                  className="bg-transparent w-full text-white font-bold outline-none"
                />
                <span className="text-zinc-500 text-sm">h/dia</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {DIAS.map((d) => (
                <div key={d.key} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-zinc-400 w-8">{d.label}</span>
                  <div className="flex-1 bg-transparent border border-zinc-700 rounded-xl px-4 py-3 flex items-center gap-2">
                    <input
                      type="number"
                      value={(local[d.key as keyof Configuracoes] as number) || ""}
                      onChange={(e) => setLocal({ ...local, [d.key]: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="bg-transparent w-full text-white font-bold outline-none"
                    />
                    <span className="text-zinc-500 text-xs">h</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Resultado */}
        <section className="bg-[#1e1e1e] rounded-[28px] p-6 space-y-4 shadow-xl">
          <h2 className="text-lg font-bold">Resultado</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Horas por semana</span>
              <span className="text-sm font-bold text-zinc-100">{horasSemana.toFixed(1)}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Horas por mês</span>
              <span className="text-sm font-bold text-zinc-100">{horasMes.toFixed(1)}h</span>
            </div>
            <div className="border-t border-zinc-800 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-zinc-100">Custo por hora</span>
              <span className="text-lg font-bold text-purple-400">
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
  onSave: (c: Configuracoes) => void;
}) {
  const [local, setLocal] = useState<Configuracoes>({ ...config });
  const [saving, setSaving] = useState(false);
  const totalPct = (local.imposto_pct || 0) + (local.cartao_pct || 0) + (local.comissao_pct || 0);

  const handleSave = async () => {
    setSaving(true);
    await onSave(local);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#121212] flex flex-col overflow-y-auto">
      <header className="sticky top-0 z-10 bg-[#c084fc] px-4 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2"><X size={24} /></button>
          <h1 className="text-xl font-bold">Configurar Taxas</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="p-2 -mr-2">
          {saving ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check size={24} />}
        </button>
      </header>

      <main className="p-4 space-y-6 pb-16">
        <section className="bg-[#1e1e1e] rounded-[28px] p-6 space-y-6 shadow-xl">
          <h2 className="text-lg font-bold">Taxas (%)</h2>
          <p className="text-xs text-zinc-500">Coloque o percentual de cada taxa. Use o maior valor que você paga.</p>

          {[
            { key: "imposto_pct", label: "Impostos", desc: "Soma de todos os impostos" },
            { key: "cartao_pct", label: "Cartão", desc: "Taxa mais cara cobrada por venda" },
            { key: "comissao_pct", label: "Comissão", desc: "Maior comissão que você paga" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-zinc-100">{label}</label>
                <span className="text-xs text-zinc-500">{desc}</span>
              </div>
              <div className="bg-transparent border border-zinc-700 rounded-xl px-4 py-4 flex items-center gap-2">
                <input
                  type="number"
                  value={(local[key as keyof Configuracoes] as number) || ""}
                  onChange={(e) => setLocal({ ...local, [key]: Number(e.target.value) || 0 })}
                  placeholder="0"
                  className="bg-transparent w-full text-white font-bold outline-none"
                />
                <span className="text-zinc-500 font-bold">%</span>
              </div>
            </div>
          ))}

          <div className="border-t border-zinc-800 pt-4 flex justify-between items-center">
            <span className="text-sm font-bold text-zinc-100">Total de taxas</span>
            <span className="text-lg font-bold text-sky-400">{totalPct.toFixed(2)}%</span>
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
  onSave: (nome: string, valor: number) => void;
}) {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState<number | "">("");

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 p-4">
      <div className="bg-[#1e1e1e] w-full max-w-md rounded-[32px] p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Novo Custo Fixo</h2>
          <button onClick={onClose} className="text-zinc-500"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div className="bg-transparent border border-zinc-700 rounded-xl px-4 py-4">
            <input
              type="text"
              placeholder="Nome (ex: Aluguel, Luz...)"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
              className="bg-transparent w-full text-white font-medium outline-none"
            />
          </div>
          <div className="bg-transparent border border-zinc-700 rounded-xl px-4 py-4 flex items-center gap-2">
            <span className="text-zinc-500 font-bold">R$</span>
            <input
              type="number"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value === "" ? "" : Number(e.target.value))}
              className="bg-transparent w-full text-white font-bold outline-none"
            />
          </div>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => nome && valor && onSave(nome, Number(valor))}
            disabled={!nome || !valor}
            className="w-full py-4 bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-2xl"
          >
            Adicionar
          </button>
          <button onClick={onClose} className="w-full py-3 text-zinc-500 font-bold">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main CustosTab Component ─────────────────────────────────────────────────
export function CustosTab() {
  const { config, loading, saveConfig } = useConfiguracoes();
  const [custosFixos, setCustosFixos] = useState<CustoFixo[]>([]);
  const [loadingCustos, setLoadingCustos] = useState(true);
  const [showTrabalho, setShowTrabalho] = useState(false);
  const [showTaxas, setShowTaxas] = useState(false);
  const [showAddCusto, setShowAddCusto] = useState(false);

  useEffect(() => {
    fetchCustosFixos();
  }, []);

  const fetchCustosFixos = async () => {
    setLoadingCustos(true);
    try {
      const { data } = await supabase.from("custos_fixos").select("*").order("created_at");
      setCustosFixos(data || []);
    } catch (e) {
    } finally {
      setLoadingCustos(false);
    }
  };

  const handleAddCusto = async (nome: string, valor: number) => {
    const { data } = await supabase.from("custos_fixos").insert([{ nome, valor }]).select().single();
    if (data) setCustosFixos([...custosFixos, data]);
    setShowAddCusto(false);
  };

  const handleDeleteCusto = async (id: string) => {
    await supabase.from("custos_fixos").delete().eq("id", id);
    setCustosFixos(custosFixos.filter((c) => c.id !== id));
  };

  const custoHora = calcularCustoHora(config);
  const totalTax = calcularTotalTaxPct(config);
  const totalCustosFixos = custosFixos.reduce((acc, c) => acc + c.valor, 0);
  const horasSemana = DIAS.reduce((acc, d) => acc + (config[d.key as keyof Configuracoes] as number || 0), 0);
  const horasMes = horasSemana * (52 / 12);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="px-4 space-y-4 pb-4">
        {/* ── Trabalho ──────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Trabalho</h3>
            <button
              onClick={() => setShowTrabalho(true)}
              style={{ touchAction: "manipulation" }}
              className="flex items-center gap-1.5 text-purple-400 text-xs font-bold active:opacity-70"
            >
              <Settings size={14} />
              Editar
            </button>
          </div>

          <div className="bg-[#1e1e1e] rounded-2xl p-5 border border-zinc-800/50 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-zinc-400">
                <DollarSign size={16} className="text-purple-400" />
                <span className="text-sm">Salário mensal</span>
              </div>
              <span className="text-sm font-bold text-zinc-100">
                R$ {config.salario_mensal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-zinc-400">
                <Clock size={16} className="text-purple-400" />
                <span className="text-sm">Horas por mês</span>
              </div>
              <span className="text-sm font-bold text-zinc-100">{horasMes.toFixed(1)}h</span>
            </div>
            <div className="border-t border-zinc-800 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-zinc-100">Custo / hora</span>
              <span className="text-base font-bold text-purple-400">
                R$ {custoHora.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* ── Taxas ─────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Taxas</h3>
            <button
              onClick={() => setShowTaxas(true)}
              style={{ touchAction: "manipulation" }}
              className="flex items-center gap-1.5 text-purple-400 text-xs font-bold active:opacity-70"
            >
              <Settings size={14} />
              Editar
            </button>
          </div>

          <div className="bg-[#1e1e1e] rounded-2xl p-5 border border-zinc-800/50 space-y-3">
            {[
              { label: "Impostos", value: config.imposto_pct },
              { label: "Cartão", value: config.cartao_pct },
              { label: "Comissão", value: config.comissao_pct },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">{label}</span>
                <span className="text-sm font-bold text-zinc-100">{value.toFixed(2)}%</span>
              </div>
            ))}
            <div className="border-t border-zinc-800 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-zinc-100">Total de taxas</span>
              <span className="text-base font-bold text-sky-400">{totalTax.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* ── Custos Fixos ──────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Custos Fixos Mensais</h3>
            <button
              onClick={() => setShowAddCusto(true)}
              style={{ touchAction: "manipulation" }}
              className="flex items-center gap-1.5 text-purple-400 text-xs font-bold active:opacity-70"
            >
              <Plus size={14} />
              Adicionar
            </button>
          </div>

          {loadingCustos ? (
            <div className="py-4 flex justify-center">
              <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : custosFixos.length === 0 ? (
            <div className="bg-[#1e1e1e] rounded-2xl p-5 border border-zinc-800/50 text-center">
              <p className="text-sm text-zinc-600">Nenhum custo fixo cadastrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {custosFixos.map((c) => (
                <div key={c.id} className="bg-[#1e1e1e] rounded-2xl p-4 border border-zinc-800/50 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-100">{c.nome}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-zinc-300">
                      R$ {c.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => handleDeleteCusto(c.id)}
                      className="text-red-500/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="bg-zinc-800/30 rounded-2xl p-4 flex justify-between items-center">
                <span className="text-sm font-bold text-zinc-400">Total mensal</span>
                <span className="text-sm font-bold text-sky-400">
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

