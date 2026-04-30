"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function InstallPWA() {
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Registro do SW
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // 2. Detecção de iOS
    const isIPad = navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1;
    const isIPhone = /iPhone|iPod/.test(navigator.userAgent);
    if (isIPhone || isIPad) setIsIOS(true);

    // 3. Captura do Evento de Instalação
    const handler = (e: any) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setCanInstall(true);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Mostrar card se for mobile e não estiver instalado
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    
    if (isMobile && !isStandalone) {
      setIsVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const promptEvent = (window as any).deferredPrompt;
    
    if (!promptEvent) {
      // Se o evento não disparou (comum em HTTP/IP local), avisamos o usuário
      alert("Para instalar via botão, o navegador exige uma conexão segura (HTTPS). \n\nComo você está acessando via IP, use a opção 'Instalar Aplicativo' no menu de 3 pontos do Chrome.");
      return;
    }

    // Dispara o prompt
    promptEvent.prompt();
    
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      (window as any).deferredPrompt = null;
      setIsVisible(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-4 right-4 z-[9999] flex justify-center select-none"
        >
          <div className="relative w-full max-w-md bg-white border border-[#F0E6E6] rounded-[28px] p-4 shadow-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-[#E5989B] to-[#D4A5A5] rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Download className="text-white" size={24} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <span className="text-[#2D2D2D] font-bold text-sm">App Apreço</span>
                <Sparkles className="text-yellow-500" size={12} />
              </div>
              <p className="text-[#6D6D6D] text-[10px]">Instale agora no seu celular</p>
            </div>

            <div className="flex items-center gap-2">
              {isIOS ? (
                <div className="bg-[#FAF7F2] px-3 py-2 rounded-xl flex items-center gap-2 border border-[#F0E6E6]">
                  <Share size={14} className="text-[#E5989B]" />
                  <span className="text-[#2D2D2D] text-[10px] font-bold">Compartilhar</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="bg-[#E5989B] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase shadow-lg active:scale-95 transition-all"
                >
                  Instalar
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setIsVisible(false)}
                className="p-2 text-[#9E9E9E] hover:text-[#2D2D2D]"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
