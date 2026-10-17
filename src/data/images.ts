/** Largest photo we keep, in data-URL characters (about 90 KB of JPEG). */
export const MAX_PHOTO_CHARS = 120_000;

/** Browsers allow roughly 5 million characters of local storage; keep headroom below that. */
export const STORAGE_LIMIT_CHARS = 4_800_000;

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Not an image"));
    };
    image.src = url;
  });
}

/** Shrink a photo to a JPEG data URL under MAX_PHOTO_CHARS, stepping down size and quality until it fits. */
export async function shrinkPhoto(file: File) {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  let side = 720;
  let quality = 0.72;
  let data = "";
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, side / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    data = canvas.toDataURL("image/jpeg", quality);
    if (data.length <= MAX_PHOTO_CHARS) break;
    side *= 0.8;
    quality = Math.max(0.45, quality - 0.07);
  }
  return data;
}
