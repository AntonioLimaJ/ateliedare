import Link from "next/link";

export default function BudgetNotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-[#faf6ef] p-5 text-[#29201f]">
      <div className="w-full max-w-md rounded-3xl border border-[#e9dcd4] bg-white p-7">
        <h1 className="font-serif text-3xl">Orçamento não encontrado</h1>
        <p className="mt-3 text-sm text-[#695850]">O link expirou ou está incorreto. Peça um novo link ao ateliê.</p>
        <Link href="/" className="site-button site-secondary mt-5">Voltar ao início</Link>
      </div>
    </main>
  );
}
