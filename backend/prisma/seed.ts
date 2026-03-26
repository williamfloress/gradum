import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL no está definida en el entorno (.env)');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@gradum.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      rol: 'admin',
      estado: 'aprobado',
      nombre: 'Administrador',
    },
    create: {
      email: adminEmail,
      nombre: 'Administrador',
      passwordHash,
      rol: 'admin',
      estado: 'aprobado',
    },
  });

  const nombreCarrera = 'Ingeniería de Sistemas (ejemplo)';
  const existente = await prisma.carrera.findFirst({
    where: { codigo: 'GRADUM-SEED-001' },
  });

  if (!existente) {
    await prisma.carrera.create({
      data: {
        nombre: nombreCarrera,
        codigo: 'GRADUM-SEED-001',
        activa: true,
      },
    });
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
