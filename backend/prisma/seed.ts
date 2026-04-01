import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL no está definida en el entorno (.env)');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están definidas en el entorno (.env)',
  );
}

// Cliente con service role para poder crear usuarios en Auth
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@gradum.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

  // 1. Crear (o asegurarse de que existe) el usuario en Supabase Auth
  let supabaseUserId: string;

  // Intentar obtener el usuario existente por email
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
  const existing = listData?.users?.find((u) => u.email === adminEmail);

  if (existing) {
    console.log(`Usuario en Supabase Auth ya existe: ${existing.id}`);
    supabaseUserId = existing.id;

    // Actualizar contraseña por si cambió
    await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
      password: adminPassword,
      email_confirm: true,
    });
    console.log('Contraseña de Supabase Auth actualizada.');
  } else {
    const { data: created, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true, // Confirmar email automáticamente
        user_metadata: { nombre: 'Administrador' },
      });

    if (createError || !created?.user) {
      throw new Error(
        'Error al crear usuario en Supabase Auth: ' + createError?.message,
      );
    }
    supabaseUserId = created.user.id;
    console.log(`Usuario creado en Supabase Auth: ${supabaseUserId}`);
  }

  // 2. Sincronizar con la tabla usuario de Prisma usando el UUID de Supabase
  await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {
      id: supabaseUserId,
      rol: 'admin',
      estado: 'aprobado',
      nombre: 'Administrador',
      passwordHash: '',
    },
    create: {
      id: supabaseUserId,
      email: adminEmail,
      nombre: 'Administrador',
      passwordHash: '',
      rol: 'admin',
      estado: 'aprobado',
    },
  });
  console.log(`Usuario admin sincronizado en Prisma (id: ${supabaseUserId})`);

  // 3. Seed de carrera de ejemplo
  const existente = await prisma.carrera.findFirst({
    where: { codigo: 'GRADUM-SEED-001' },
  });

  if (!existente) {
    await prisma.carrera.create({
      data: {
        nombre: 'Ingeniería de Sistemas (ejemplo)',
        codigo: 'GRADUM-SEED-001',
        activa: true,
      },
    });
    console.log('Carrera de ejemplo creada.');
  }
}

main()
  .then(() => {
    console.log('Seed completado.');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
