import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase-server";
import { isAtelieAdmin } from "@/lib/supabase-config";
import { InstallPWA } from "./_components/InstallPWA";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Precificação | Ateliê da Rê",
  description: "Ferramenta profissional de precificação",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Precificação",
  },
};

export const viewport: Viewport = {
  themeColor: "#fdf2f8",
  width: "device-width",
  initialScale: 1,
};

export default async function PrecificacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = await getServerSupabase();
  const session = await client?.auth.getClaims();
  if (session?.error?.name === "AuthRetryableFetchError") {
    return (
      <main className="grid min-h-svh place-items-center bg-[#faf6ef] p-5">
        <div className="w-full max-w-md rounded-3xl border border-[#e9dcd4] bg-white p-7">
          <h1 className="font-serif text-3xl">Conexão indisponível</h1>
          <p className="mt-3 text-sm text-[#695850]">Não foi possível verificar sua sessão agora. Aguarde um instante e tente novamente.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <form action="/precificacao" method="get">
              <button type="submit" className="site-button site-primary">Tentar novamente</button>
            </form>
            <Link href="/" className="site-button site-secondary">Voltar ao site</Link>
          </div>
        </div>
      </main>
    );
  }
  if (!isAtelieAdmin(session?.data?.claims.app_metadata)) redirect("/entrar");

  return (
    <>
      <InstallPWA />
      {children}
    </>
  );
}
