import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Migraciones (`migrate deploy`, `migrate dev`): Prisma usa locks que con el *pooler*
 * de Supabase (puerto 6543) suelen bloquearse o colgar. Definí DIRECT_URL en `.env`
 * con la URI de **conexión directa** (puerto 5432) del panel de Supabase.
 * La app (Nest) sigue usando `DATABASE_URL` en código; el CLI usa esta URL.
 */
const rawUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const datasourceUrl = rawUrl
  ? rawUrl.includes('?')
    ? `${rawUrl}&sslmode=require`
    : `${rawUrl}?sslmode=require`
  : undefined;

export default defineConfig({
  datasource: {
    url: datasourceUrl,
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
