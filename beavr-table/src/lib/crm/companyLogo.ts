import type { SupabaseClient } from "@supabase/supabase-js";

export const LOGO_BUCKET = "logos-empresas";
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

const LOGO_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export function validateLogoFile(file: File): string | null {
  if (!LOGO_EXTENSIONS[file.type]) {
    return "Formato no admitido. Usa una imagen PNG, JPG, WEBP o SVG.";
  }
  if (file.size > LOGO_MAX_BYTES) {
    return "La imagen pesa demasiado. El tamaño máximo es 2 MB.";
  }
  return null;
}

function storagePathFromUrl(url: string) {
  const marker = `/storage/v1/object/public/${LOGO_BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

export async function uploadCompanyLogo(supabase: SupabaseClient, companyId: string, file: File) {
  const path = `${companyId}/${Date.now()}.${LOGO_EXTENSIONS[file.type] ?? "png"}`;
  const { error } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });

  if (error) throw error;

  return supabase.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function deleteCompanyLogo(supabase: SupabaseClient, url: string | null | undefined) {
  const path = url ? storagePathFromUrl(url) : null;
  if (!path) return;
  await supabase.storage.from(LOGO_BUCKET).remove([path]);
}
