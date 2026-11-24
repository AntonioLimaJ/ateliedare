"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(signIn, "");

  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block text-sm font-semibold">
        E-mail
        <input className="login-field" name="email" type="email" autoComplete="username" required />
      </label>
      <label className="block text-sm font-semibold">
        Senha
        <input className="login-field" name="password" type="password" autoComplete="current-password" required />
      </label>
      {error && <p role="alert" className="text-sm text-[#9b2947]">{error}</p>}
      <button disabled={pending} className="site-button site-primary mt-2 w-full disabled:opacity-60">
        {pending ? "Entrando…" : "Entrar no painel"}
      </button>
    </form>
  );
}
