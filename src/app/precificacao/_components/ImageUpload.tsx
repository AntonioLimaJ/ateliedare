"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, X, Plus, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import Image from "next/image";
import { processImageProfessional } from "@/lib/image-processor";

interface ImageUploadProps {
  onImageChange: (image: string | null, isFile?: boolean) => void;
  initialImage?: string | null;
}

export function ImageUpload({ onImageChange, initialImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialImage || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(initialImage || null);
  }, [initialImage]);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new (window as any).Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 1200; // Increased for better quality
        let { width, height } = img;
        if (width > height) {
          if (width > MAX) { height *= MAX / width; width = MAX; }
        } else {
          if (height > MAX) { width *= MAX / height; height = MAX; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);
        }

        // Return the WebP data URL to the parent
        const webpDataUrl = canvas.toDataURL("image/webp", 0.8);
        setPreview(webpDataUrl);
        // isFile=true indicates this is a new image that needs uploading later
        onImageChange(webpDataUrl, true);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleProfessionalTreatment = async () => {
    if (!preview || isProcessing) return;

    try {
      setIsProcessing(true);
      const processedImage = await processImageProfessional(preview);
      setPreview(processedImage);
      onImageChange(processedImage, true);
    } catch (error) {
      console.error("Erro ao tratar imagem:", error);
      alert("Não foi possível remover o fundo. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleRemove = () => {
    setPreview(null);
    onImageChange(null, false);
  };

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative w-full aspect-square max-w-[320px] mx-auto rounded-3xl overflow-hidden bg-white border border-[#F0E6E6] shadow-xl group">
          <Image
            src={preview}
            alt="Preview"
            fill
            className={`object-contain transition-all duration-500 ${isProcessing ? 'scale-90 blur-sm opacity-50' : 'scale-100 opacity-100'}`}
            unoptimized={preview.startsWith("data:")}
          />

          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/20 backdrop-blur-[2px] z-10">
              <Loader2 className="w-8 h-8 text-[#E5989B] animate-spin" />
              <p className="text-[10px] font-bold text-[#E5989B] mt-2 uppercase tracking-tighter">Removendo fundo...</p>
            </div>
          )}

          <button
            onClick={handleRemove}
            disabled={isProcessing}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#E5989B] shadow-md active:scale-90 transition-transform z-20"
          >
            <X size={16} />
          </button>

          {/* Professional Treatment Button */}
          {!isProcessing && (
            <button
              onClick={handleProfessionalTreatment}
              className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#E5989B] text-white text-[10px] font-bold px-3 py-2 rounded-full shadow-lg hover:bg-[#D4A5A5] active:scale-95 transition-all z-20 animate-pulse"
            >
              <Sparkles size={12} />
              PROFISSIONAL
            </button>
          )}

          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <button
              onClick={() => galleryRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-1.5 bg-white/90 backdrop-blur text-[#6D6D6D] text-[10px] font-bold px-3 py-2 rounded-full shadow-md"
            >
              <ImageIcon size={12} />
              Galeria
            </button>
            <button
              onClick={() => cameraRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-1.5 bg-white/90 backdrop-blur text-[#6D6D6D] text-[10px] font-bold px-3 py-2 rounded-full shadow-md"
            >
              <Camera size={12} />
              Câmera
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full aspect-video rounded-[32px] bg-white flex flex-col items-center justify-center gap-4 border border-[#F0E6E6]">
          <div className="w-16 h-16 border-2 border-[#F0E6E6] border-dashed rounded-2xl flex items-center justify-center">
            <Plus className="text-[#9E9E9E]" size={32} />
          </div>
          <p className="text-sm font-medium text-[#6D6D6D]">Adicionar foto do produto</p>
          <div className="flex gap-3">
            <button
              onClick={() => galleryRef.current?.click()}
              className="flex items-center gap-2 bg-[#FAF7F2] hover:bg-[#F8EDEB] text-[#6D6D6D] text-sm font-bold px-5 py-3 rounded-2xl transition-colors border border-[#F0E6E6]"
            >
              <ImageIcon size={16} />
              Galeria
            </button>
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex items-center gap-2 bg-[#F8EDEB] hover:bg-[#E5989B]/10 text-[#E5989B] text-sm font-bold px-5 py-3 rounded-2xl transition-colors border border-[#F0E6E6]"
            >
              <Camera size={16} />
              Câmera
            </button>
          </div>
        </div>
      )}

      <input type="file" ref={galleryRef} onChange={handleChange} accept="image/*" className="hidden" />
      <input type="file" ref={cameraRef} onChange={handleChange} accept="image/*" capture="environment" className="hidden" />
    </div>
  );
}
