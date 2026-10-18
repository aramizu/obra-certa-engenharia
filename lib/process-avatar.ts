import { AVATAR_SIZE, AVATAR_TARGET_BYTES, squareCropRect } from "@/lib/avatar";

export type ProcessAvatarResult = { blob: Blob; mime: "image/webp" | "image/jpeg" };

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Falha ao gerar a foto."));
      else resolve(blob);
    }, mime, quality);
  });
}

/** Recorte quadrado central, 96×96, WebP (JPEG se preciso), ~0.6, alvo < 6 KB. */
export async function processAvatarFile(file: File): Promise<ProcessAvatarResult> {
  const image = await loadImage(file);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const crop = squareCropRect(width, height);
  if (crop.side < 1) throw new Error("Imagem inválida.");
  const { sx, sy, side } = crop;

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

  const tryEncode = async (mime: "image/webp" | "image/jpeg") => {
    let quality = 0.6;
    let blob = await canvasToBlob(canvas, mime, quality);
    while (blob.size > AVATAR_TARGET_BYTES && quality > 0.35) {
      quality -= 0.08;
      blob = await canvasToBlob(canvas, mime, quality);
    }
    return blob;
  };

  try {
    const webp = await tryEncode("image/webp");
    if (webp.type === "image/webp" && webp.size > 0) {
      return { blob: webp, mime: "image/webp" };
    }
  } catch {
    // Safari antigo: cai no JPEG
  }

  const jpeg = await tryEncode("image/jpeg");
  return { blob: jpeg, mime: "image/jpeg" };
}
