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
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-[#1e1e1e] border border-zinc-800 shadow-inner">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized={preview.startsWith("data:")}
          />

          <button
            onClick={handleRemove}
            className="absolute top-4 right-4 w-10 h-10 bg-black/60 backdrop-blur rounded-full flex items-center justify-center text-white shadow-lg"
          >
            <X size={20} />
          </button>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <button
              onClick={() => galleryRef.current?.click()}
              className="flex items-center gap-2 bg-black/60 backdrop-blur text-white text-xs font-bold px-4 py-2 rounded-full"
            >
              <ImageIcon size={14} />
              Galeria
            </button>
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex items-center gap-2 bg-black/60 backdrop-blur text-white text-xs font-bold px-4 py-2 rounded-full"
            >
              <Camera size={14} />
              Câmera
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full aspect-video rounded-[32px] bg-[#1e1e1e] flex flex-col items-center justify-center gap-4 border border-zinc-800">
          <div className="w-16 h-16 border-2 border-zinc-700 border-dashed rounded-2xl flex items-center justify-center">
            <Plus className="text-zinc-700" size={32} />
          </div>
          <p className="text-sm font-medium text-zinc-600">Adicionar foto do produto</p>
          <div className="flex gap-3">
            <button
              onClick={() => galleryRef.current?.click()}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold px-5 py-3 rounded-2xl transition-colors"
            >
              <ImageIcon size={16} />
              Galeria
            </button>
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm font-bold px-5 py-3 rounded-2xl transition-colors"
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
