/**
 * Browser-side image compression.
 *
 * Draws the source image onto an offscreen canvas, scaling down so the longest
 * edge fits within `maxDimension`, then exports as WebP at the target quality.
 * Preserves animated GIFs (returns them as-is; canvas would flatten to first frame).
 */
export interface CompressOptions {
  maxDimension?: number; // longest edge in pixels
  quality?: number; // 0..1
  mimeType?: "image/webp" | "image/jpeg";
}

const DEFAULTS: Required<CompressOptions> = {
  maxDimension: 2000,
  quality: 0.85,
  mimeType: "image/webp",
};

export async function compressImage(
  file: File,
  opts: CompressOptions = {}
): Promise<File> {
  // Skip animated GIF — canvas would destroy the animation
  if (file.type === "image/gif") return file;

  const { maxDimension, quality, mimeType } = { ...DEFAULTS, ...opts };

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(targetW, targetH)
      : Object.assign(document.createElement("canvas"), {
          width: targetW,
          height: targetH,
        });

  const ctx = canvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!ctx) {
    bitmap.close?.();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close?.();

  const blob: Blob = await (async () => {
    if ("convertToBlob" in canvas) {
      return canvas.convertToBlob({ type: mimeType, quality });
    }
    return new Promise<Blob>((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        mimeType,
        quality
      );
    });
  })();

  // Only keep compressed version if it actually saves bytes
  if (blob.size >= file.size && file.type === mimeType) {
    return file;
  }

  const extension = mimeType === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
  });
}
