/**
 * Client-side image compression for uploads.
 *
 * Every image uploaded anywhere in the app goes through this before being
 * stored (images are persisted as base64 data URLs in Supabase, so size
 * directly bloats the database and every page load). A phone photo of 5–10MB
 * becomes a ~50–150KB WebP with no visible quality loss, and the conversion
 * runs in the browser in ~100–300ms — imperceptible to the uploader.
 *
 * Rules:
 * - Raster images (JPEG/PNG/WebP/…) → downscaled to MAX_DIM and re-encoded as
 *   WebP (JPEG fallback for browsers that can't encode WebP).
 * - SVG and GIF are returned untouched (conversion would rasterize vectors /
 *   drop animation).
 * - If compression somehow produces a LARGER file, the original is kept.
 */

const MAX_DIM = 1600; // longest side, px
const WEBP_QUALITY = 0.82;
const JPEG_QUALITY = 0.85;

const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });

/**
 * Compress an uploaded image file and return it as a data URL.
 * Falls back to the original file (as a data URL) whenever anything fails,
 * so callers can use it as a drop-in replacement for FileReader.
 */
export async function compressImageFile(file: File): Promise<string> {
    // Vectors and animations pass through untouched.
    if (file.type === "image/svg+xml" || file.type === "image/gif") {
        return blobToDataUrl(file);
    }

    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
        const w = Math.max(1, Math.round(bitmap.width * scale));
        const h = Math.max(1, Math.round(bitmap.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return blobToDataUrl(file);
        ctx.drawImage(bitmap, 0, 0, w, h);
        bitmap.close();

        const toBlob = (type: string, quality: number) =>
            new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

        // Prefer WebP; fall back to JPEG when the browser can't encode WebP.
        let blob = await toBlob("image/webp", WEBP_QUALITY);
        if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", JPEG_QUALITY);
        if (!blob) return blobToDataUrl(file);

        // Never "compress" into something bigger than the original.
        if (blob.size >= file.size) return blobToDataUrl(file);

        return blobToDataUrl(blob);
    } catch {
        // Decode failed (e.g. unsupported format) — store the original.
        return blobToDataUrl(file);
    }
}
