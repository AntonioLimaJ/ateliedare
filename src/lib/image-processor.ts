import type { Config } from "@imgly/background-removal";

export async function processImageProfessional(source: string) {
  const { removeBackground } = await import("@imgly/background-removal");
  const config: Config = { model: "isnet_fp16", output: { format: "image/png" } };
  const result = await removeBackground(source, config);
  const image = await createImageBitmap(result);

  try {
    const temp = document.createElement("canvas");
    temp.width = image.width;
    temp.height = image.height;
    const pixels = temp.getContext("2d", { willReadFrequently: true });
    if (!pixels) throw new Error("Não foi possível abrir a imagem.");

    pixels.drawImage(image, 0, 0);
    const { data } = pixels.getImageData(0, 0, image.width, image.height);
    let left = image.width, top = image.height, right = -1, bottom = -1;
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        if (data[(y * image.width + x) * 4 + 3] <= 10) continue;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
    if (right < 0 || bottom < 0) throw new Error("Nenhum objeto identificado.");

    const canvas = document.createElement("canvas");
    const size = 1080;
    const width = right - left + 1;
    const height = bottom - top + 1;
    const scale = (size * .76) / Math.max(width, height);
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a imagem.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, size, size);
    context.imageSmoothingQuality = "high";
    context.drawImage(image, left, top, width, height, (size - width * scale) / 2, (size - height * scale) / 2, width * scale, height * scale);
    return canvas.toDataURL("image/webp", .82);
  } finally {
    image.close();
  }
}
