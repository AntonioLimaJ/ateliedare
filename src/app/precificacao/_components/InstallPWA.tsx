"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
};

export function InstallPWA() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    const onInstalled = () => setInstallEvent(null);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!installEvent || dismissed) return null;

  return (
    <aside className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-2xl border border-[#e9dcd4] bg-white p-2 shadow-md">
      <button type="button" className="site-button site-secondary" onClick={async () => {
        setInstallEvent(null);
        try { await installEvent.prompt(); } catch { /* O navegador pode invalidar o convite. */ }
      }}><Download size={17} aria-hidden /> Instalar aplicativo</button>
      <button type="button" aria-label="Dispensar convite de instalação" onClick={() => setDismissed(true)} className="grid h-11 w-11 place-items-center rounded-full text-[#695850]">
        <X size={18} aria-hidden />
      </button>
    </aside>
  );
}
