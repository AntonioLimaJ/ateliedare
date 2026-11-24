import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPublicSupabase, getServerSupabase } from "@/lib/supabase-server";
import { isAtelieAdmin } from "@/lib/supabase-config";

export const metadata: Metadata = {
  title: "Acesso à equipe | Ateliê da Rê",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const validToken = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{24,256}$/.test(value);

const validActivation = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{64}$/.test(value);

async function acceptInvite(form: FormData) {
  "use server";

  const tokenHash = form.get("token_hash");
  const activation = form.get("activation");
  const supabase = await getServerSupabase();
  if (!supabase) redirect("/convite");

  let session;
  if (validActivation(activation)) {
    const result = await getPublicSupabase()?.rpc("ateliedare_resgatar_convite", { p_token: activation });
    const invite = result?.data?.[0];
    if (result?.error || typeof invite?.email !== "string" || typeof invite?.senha !== "string") redirect("/convite");
    session = await supabase.auth.signInWithPassword({ email: invite.email, password: invite.senha });
  } else {
    if (!validToken(tokenHash)) redirect("/convite");
    session = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "invite" });
  }

  if (session.error || !session.data.session) redirect("/convite");
  if (!isAtelieAdmin(session.data.user?.app_metadata)) {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/convite");
  }

  redirect("/definir-senha");
}

export default async function Convite({ searchParams }: {
  searchParams: Promise<{ token_hash?: string | string[]; activation?: string | string[] }>;
}) {
  const { token_hash, activation } = await searchParams;
  const valid = validToken(token_hash) || validActivation(activation);
  return (
    <main className="grid min-h-svh place-items-center bg-[#faf6ef] p-5 text-[#29201f]">
      <div className="w-full max-w-md rounded-[2rem] border border-[#e9dcd4] bg-white p-7 sm:p-10">
        <h1 className="font-serif text-4xl tracking-tight">{valid ? "Convite para a equipe" : "Convite indisponível"}</h1>
        <p className="mt-3 text-sm text-[#695850]">
          {valid
            ? "Confirme o convite para definir a senha do seu acesso ao painel."
            : "Se o link expirou ou já foi usado, peça um novo convite ao ateliê."}
        </p>
        {valid ? (
          <form action={acceptInvite} className="mt-7">
            {validActivation(activation)
              ? <input type="hidden" name="activation" value={activation} />
              : <input type="hidden" name="token_hash" value={token_hash} />}
            <button type="submit" className="site-button site-primary w-full">Aceitar convite</button>
          </form>
        ) : <Link href="/entrar" className="site-button site-secondary mt-7">Voltar ao login</Link>}
      </div>
    </main>
  );
}
