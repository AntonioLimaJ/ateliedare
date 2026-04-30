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
      model: "medium", // Equilíbrio entre qualidade e velocidade
      output: {
        format: "image/png",
        quality: 0.8,
        type: "image/png"
      }
    };

    // 1. Remover o fundo
    const processedBlob = await removeBackground(imageSource, config);

    // 2. Adicionar fundo branco e centralizar
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(processedBlob);

      img.onload = () => {
        const size = 1080; // Tamanho padrão Instagram/E-commerce
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Não foi possível criar o contexto do canvas"));
          return;
        }

        canvas.width = size;
        canvas.height = size;

        // Fundo Branco
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, size, size);

        // Calcular escala com margem de 10%
        const margin = size * 0.1;
        const maxWidth = size - (margin * 2);
        const maxHeight = size - (margin * 2);

        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        const drawWidth = img.width * ratio;
        const drawHeight = img.height * ratio;

        // Centralizar
        const x = (size - drawWidth) / 2;
        const y = (size - drawHeight) / 2;

        ctx.drawImage(img, x, y, drawWidth, drawHeight);

        // Converter para Base64 (JPEG para economizar espaço no banco)
        const finalBase64 = canvas.toDataURL("image/jpeg", 0.9);
        
        // Limpar memória
        URL.revokeObjectURL(img.src);
        
        resolve(finalBase64);
      };

      img.onerror = () => {
        reject(new Error("Erro ao carregar imagem processada"));
      };
    });
  } catch (error) {
    console.error("Erro no processamento da imagem:", error);
    throw error;
  }
}
