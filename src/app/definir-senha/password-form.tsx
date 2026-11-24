"use client";

import { useActionState } from "react";
import { definePassword } from "./actions";

export function PasswordForm() {
  const [error, action, pending] = useActionState(definePassword, "");

  return (
    <form action={action} className="mt-7 space-y-4">
      <label className="block text-sm font-semibold">
        Nova senha
        <input className="login-field" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={72} required />
      </label>
      <label className="block text-sm font-semibold">
        Confirme a senha
        <input className="login-field" name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={72} required />
      </label>
      {error && <p role="alert" className="text-sm text-[#9b2947]">{error}</p>}
      <button disabled={pending} className="site-button site-primary w-full disabled:opacity-60">
        {pending ? "Salvando…" : "Salvar senha e entrar"}
      </button>
    </form>
  );
}
