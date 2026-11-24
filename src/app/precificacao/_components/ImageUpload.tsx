"use client";

import { useRef, useState } from "react";
import { Camera, Image as ImageIcon, Loader2, Sparkles, X } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  onImageChange: (image: string | null, isFile?: boolean) => void;
  onProcessingChange?: (processing: boolean) => void;
  initialImage?: string | null;
}

export function ImageUpload({ onImageChange, onProcessingChange, initialImage }: ImageUploadProps) {
  const [processing, setProcessing] = useState("");
  const [error, setError] = useState("");
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const busy = useRef(false);

  async function process(label: string, action: () => Promise<string>) {
    if (busy.current) return;
    busy.current = true;
    setProcessing(label);
    setError("");
    onProcessingChange?.(true);
    try {
      onImageChange(await action(), true);
    } catch {
      setError("Não foi possível preparar a foto. Tente com outra imagem.");
    } finally {
      busy.current = false;
      setProcessing("");
      onProcessingChange?.(false);
    }
  }

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type) || file.size > 20 * 1024 * 1024) {
      setError("Escolha uma foto JPG, PNG, WebP ou AVIF com até 20 MB.");
      return;
    }

    void process("Preparando foto…", async () => {
      const bitmap = await createImageBitmap(file);
      try {
        const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
        canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
        const context = canvas.getContext("2d");
        if (!context) throw new Error();
        context.imageSmoothingQuality = "high";
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/webp", .82);
      } finally {
        bitmap.close();
      }
    });
  }

  function removeBackground() {
    if (!initialImage) return;
    void process("Removendo fundo…", async () => {
      const { processImageProfessional } = await import("@/lib/image-processor");
      return processImageProfessional(initialImage);
    });
  }

  return (
    <div className="w-full space-y-3">
      {initialImage ? (
        <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl border border-[#e9dcd4] bg-white">
          <Image src={initialImage} alt="Prévia da foto" fill sizes="320px" unoptimized className="object-contain" />
          <button type="button" aria-label="Remover foto" disabled={!!processing} onClick={() => { setError(""); onImageChange(null, false); }}
            className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full bg-white text-[#793751] shadow-md">
            <X size={19} aria-hidden />
          </button>
        </div>
      ) : (
        <div className="grid min-h-28 place-items-center rounded-2xl border border-dashed border-[#ded0c8] bg-[#faf6ef] text-sm text-[#695850]">
          <div className="text-center"><ImageIcon size={23} aria-hidden className="mx-auto mb-2 text-[#793751]" /> Adicionar foto</div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" disabled={!!processing} onClick={() => gallery.current?.click()} className="site-button site-secondary"><ImageIcon size={17} aria-hidden /> Galeria</button>
        <button type="button" disabled={!!processing} onClick={() => camera.current?.click()} className="site-button site-secondary"><Camera size={17} aria-hidden /> Câmera</button>
        {initialImage && <button type="button" disabled={!!processing} onClick={removeBackground} className="site-button site-secondary"><Sparkles size={17} aria-hidden /> Remover fundo</button>}
      </div>
      {processing && <p role="status" className="flex items-center justify-center gap-2 text-sm text-[#793751]"><Loader2 size={17} className="animate-spin" aria-hidden /> {processing}</p>}
      {error && <p role="alert" className="text-center text-sm text-red-800">{error}</p>}
      <input type="file" ref={gallery} onChange={pickFile} accept="image/jpeg,image/png,image/webp,image/avif" hidden />
      <input type="file" ref={camera} onChange={pickFile} accept="image/*" capture="environment" hidden />
    </div>
  );
}
