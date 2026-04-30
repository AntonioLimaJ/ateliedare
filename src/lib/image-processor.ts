import { removeBackground, Config } from "@imgly/background-removal";

/**
 * Processa uma imagem: remove o fundo e coloca em um canvas branco 1080x1080
 * centralizado e com margens profissionais.
 */
export async function processImageProfessional(imageSource: string | File | Blob): Promise<string> {
  // Garantir que estamos no navegador
  if (typeof window === "undefined") return "";
  try {
    const config: Config = {
      progress: (key: string, current: number, total: number) => {
        console.log(`IA Processing: ${key} (${current}/${total})`);
      },
      model: "isnet", // Modelo padrão de alta qualidade
      output: {
        format: "image/png",
        quality: 0.8
      }
    };

    // 1. Remover o fundo
    const processedBlob = await removeBackground(imageSource, config);

    // 2. Adicionar fundo branco, recortar sobras e centralizar (Zoom Inteligente)
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(processedBlob);

      img.onload = () => {
        const size = 2000; // Aumentado para 2K para máxima nitidez
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (!ctx) {
          reject(new Error("Não foi possível criar o contexto do canvas"));
          return;
        }

        // Ativar suavização de alta qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Criamos um canvas temporário para detectar os limites do objeto
        const tempCanvas = document.createElement("canvas");
        const tCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
        if (!tCtx) return reject(new Error("Erro no canvas temporário"));

        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        tCtx.drawImage(img, 0, 0);

        // Detectar limites do objeto (pixels não transparentes)
        const imageData = tCtx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;
        let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
        let found = false;

        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const alpha = data[(y * img.width + x) * 4 + 3];
            if (alpha > 8) { // Sensibilidade aumentada
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
              found = true;
            }
          }
        }

        if (!found) {
          minX = 0; minY = 0; maxX = img.width; maxY = img.height;
        }

        const cropWidth = maxX - minX;
        const cropHeight = maxY - minY;

        canvas.width = size;
        canvas.height = size;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, size, size);

        const margin = size * 0.10; // Margem levemente menor
        const maxWidth = size - (margin * 2);
        const maxHeight = size - (margin * 2);

        const ratio = Math.min(maxWidth / cropWidth, maxHeight / cropHeight);
        const drawWidth = cropWidth * ratio;
        const drawHeight = cropHeight * ratio;

        const x = (size - drawWidth) / 2;
        const y = (size - drawHeight) / 2;

        ctx.drawImage(
          img,
          minX, minY, cropWidth, cropHeight,
          x, y, drawWidth, drawHeight
        );

        // Qualidade 0.95 para evitar artefatos de compressão
        const finalBase64 = canvas.toDataURL("image/jpeg", 0.95);
        URL.revokeObjectURL(img.src);
        resolve(finalBase64);
      };

      img.onerror = () => reject(new Error("Erro ao carregar imagem"));
    });
  } catch (error) {
    console.error("Erro no processamento da imagem:", error);
    throw error;
  }
}
