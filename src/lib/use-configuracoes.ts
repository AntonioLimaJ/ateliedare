"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "./supabase";

export const DIAS = [
  { key: "horas_seg", label: "Seg" },
  { key: "horas_ter", label: "Ter" },
  { key: "horas_qua", label: "Qua" },
  { key: "horas_qui", label: "Qui" },
  { key: "horas_sex", label: "Sex" },
  { key: "horas_sab", label: "Sáb" },
  { key: "horas_dom", label: "Dom" },
] as const;

export type Dia = (typeof DIAS)[number]["key"];

export type Configuracoes = Record<Dia, number> & {
  id: string;
  salario_mensal: number;
  imposto_pct: number;
  cartao_pct: number;
  comissao_pct: number;
};

const defaultConfig: Configuracoes = {
  id: "global", salario_mensal: 0,
  horas_seg: 8, horas_ter: 8, horas_qua: 8, horas_qui: 8, horas_sex: 8, horas_sab: 0, horas_dom: 0,
  imposto_pct: 0, cartao_pct: 0, comissao_pct: 0,
};

export function calcularCustoHora(config: Configuracoes) {
  const hours = DIAS.reduce((sum, day) => sum + Number(config[day.key] || 0), 0) * (52 / 12);
  return hours > 0 ? Number(config.salario_mensal || 0) / hours : 0;
}

export function calcularTotalTaxPct(config: Configuracoes) {
  return Number(config.imposto_pct || 0) + Number(config.cartao_pct || 0) + Number(config.comissao_pct || 0);
}

export function useConfiguracoes() {
  const [config, setConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState("");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const { data, error } = await getSupabase().from("configuracoes").select("*").eq("id", "global")
        .abortSignal(AbortSignal.any([controller.signal, AbortSignal.timeout(10000)])).maybeSingle();
      if (controller.signal.aborted) return;
      if (error) setConfigError("Não foi possível carregar as configurações de custo.");
      else {
        setConfigError("");
        if (data) setConfig({ ...defaultConfig, ...data });
      }
      setLoading(false);
    }
    window.addEventListener("online", load);
    void load();
    return () => {
      controller.abort();
      window.removeEventListener("online", load);
    };
  }, [attempts]);

  async function saveConfig(updated: Configuracoes) {
    const { error } = await getSupabase().from("configuracoes").upsert({
      ...updated, id: "global", updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    setConfig(updated);
  }

  return { config, loading, configError, saveConfig, refetch: () => setAttempts(value => value + 1) };
}
