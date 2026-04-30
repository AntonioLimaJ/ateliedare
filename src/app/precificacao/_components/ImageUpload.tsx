"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, X, Plus, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  onImageChange: (image: string | null, isFile?: boolean) => void;
  initialImage?: string | null;
}

export function ImageUpload({ onImageChange, initialImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialImage || null);
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
        const MAX = 800;
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
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-white border border-[#F0E6E6] shadow-inner">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized={preview.startsWith("data:")}
          />

          <button
            onClick={handleRemove}
            className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-[#E5989B] shadow-lg"
          >
            <X size={20} />
          </button>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <button
              onClick={() => galleryRef.current?.click()}
              className="flex items-center gap-2 bg-white/80 backdrop-blur text-[#E5989B] text-xs font-bold px-4 py-2 rounded-full"
            >
              <ImageIcon size={14} />
              Galeria
            </button>
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex items-center gap-2 bg-white/80 backdrop-blur text-[#E5989B] text-xs font-bold px-4 py-2 rounded-full"
            >
              <Camera size={14} />
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
