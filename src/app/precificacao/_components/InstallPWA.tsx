"use client";

import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => console.log("SW registered"),
          (err) => console.log("SW registration failed: ", err)
        );
      });
    }

    // 2. Detect iOS
    const isIPad = navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1;
    const isIPhone = /iPhone|iPod/.test(navigator.userAgent);
    if (isIPhone || isIPad) {
      setIsIOS(true);
      // Show iOS prompt if not in standalone mode
      if (!window.matchMedia("(display-mode: standalone)").matches) {
        setIsVisible(true);
      }
    }

    // 3. Listen for install prompt (Android/Chrome/Edge)
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show our custom button
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // 3. Detect if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsVisible(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-[200] animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-[#c084fc] rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-inner">
            <Download className="text-[#c084fc]" size={20} />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Instalar Aplicativo</p>
            <p className="text-white/80 text-[10px]">Acesse mais rápido da sua tela inicial</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isIOS ? (
            <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl">
              <Share size={14} className="text-white" />
              <span className="text-white text-[10px] font-bold">"Add à Tela de Início"</span>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="bg-white text-[#c084fc] px-4 py-2 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-transform"
            >
              Instalar
            </button>
          )}
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 text-white/60 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
