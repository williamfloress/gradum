import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Sube un archivo al bucket y devuelve la URL pública/firmada.
 * path: ej. `${userId}/${evaluacionId}/${filename}`
 */
export async function uploadEvaluacionFile(
  userId: string,
  evaluacionId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}.${ext}`;
  const path = `${userId}/${evaluacionId}/${filename}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw new Error(error.message);

  // URL firmada válida por 1 hora (para bucket privado)
  const { data, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);

  if (signError || !data) throw new Error(signError?.message ?? 'Error al firmar URL');

  return data.signedUrl;
}

export async function deleteEvaluacionFile(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
