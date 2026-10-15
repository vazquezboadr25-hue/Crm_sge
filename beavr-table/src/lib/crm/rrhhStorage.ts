import type { SupabaseClient } from "@supabase/supabase-js";

export const RRHH_BUCKET = "rrhh-archivos";
export const RRHH_MAX_BYTES = 10 * 1024 * 1024;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const PDF_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
};

export function validatePhotoFile(file: File): string | null {
  if (!IMAGE_EXTENSIONS[file.type]) {
    return "Formato no admitido. Usa una imagen PNG, JPG o WEBP.";
  }
  if (file.size > RRHH_MAX_BYTES) {
    return "La imagen pesa demasiado. El tamaño máximo es 10 MB.";
  }
  return null;
}

export function validatePdfFile(file: File): string | null {
  if (!PDF_EXTENSIONS[file.type]) {
    return "Solo se admiten archivos PDF.";
  }
  if (file.size > RRHH_MAX_BYTES) {
    return "El PDF pesa demasiado. El tamaño máximo es 10 MB.";
  }
  return null;
}

async function uploadRrhhFile(
  supabase: SupabaseClient,
  folder: string,
  file: File,
  extensions: Record<string, string>,
) {
  const ext = extensions[file.type] ?? "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(RRHH_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });

  if (error) throw error;

  return supabase.storage.from(RRHH_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadStaffPhoto(supabase: SupabaseClient, personaId: string, file: File) {
  return uploadRrhhFile(supabase, `fotos/${personaId}`, file, IMAGE_EXTENSIONS);
}

export async function uploadCv(supabase: SupabaseClient, admisionId: string, file: File) {
  return uploadRrhhFile(supabase, `cv/${admisionId}`, file, { ...PDF_EXTENSIONS, ...IMAGE_EXTENSIONS });
}

export async function uploadNominaPdf(supabase: SupabaseClient, personaId: string, file: File) {
  return uploadRrhhFile(supabase, `nominas/${personaId}`, file, PDF_EXTENSIONS);
}
