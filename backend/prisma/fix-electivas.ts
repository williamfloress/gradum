import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Arreglando semestres de electivas...');

  // Buscar todas las materias
  const materias = await prisma.materia.findMany({
    include: {
      prerrequisitosDe: {
        include: {
          materiaPrerrequisito: true
        }
      }
    }
  });

  const electivas = materias.filter(m => m.semestreNumero === 0);

  for (const electiva of electivas) {
    let maxPreSemestre = 0;

    for (const pre of electiva.prerrequisitosDe) {
      if (pre.materiaPrerrequisito.semestreNumero > maxPreSemestre) {
        maxPreSemestre = pre.materiaPrerrequisito.semestreNumero;
      }
    }

    // Por diseño del pensum, las electivas inician en el semestre 7.
    // Si la prelación mayor es menor a 6, se queda en 7. 
    // Si prela con algo de semestre 7, va al semestre 8.
    const nuevoSemestre = Math.max(7, maxPreSemestre + 1);

    await prisma.materia.update({
      where: { id: electiva.id },
      data: { semestreNumero: nuevoSemestre }
    });

    console.log(`Electiva ${electiva.codigo} (${electiva.nombre}): Semestre 0 -> ${nuevoSemestre}`);
  }

  console.log('¡Electivas reordenadas con éxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
