import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL no está definida en el entorno (.env)');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando carga del pensum...');

  // 1. Leer el archivo JSON
  const jsonPath = path.join(__dirname, '../../../../documentacion/pensum.json');
  const fileData = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(fileData);

  // 2. Crear o buscar la Carrera
  let carrera = await prisma.carrera.findFirst({
    where: { codigo: 'LIC-INF-UDO' },
  });

  if (!carrera) {
    carrera = await prisma.carrera.create({
      data: {
        codigo: 'LIC-INF-UDO',
        nombre: data.pensum,
        activa: true,
      },
    });
    console.log('Carrera creada:', carrera.nombre);
  } else {
    console.log('Carrera encontrada:', carrera.nombre);
  }

  // 3. Crear el Pensum
  let pensum = await prisma.pensum.findFirst({
    where: {
      carreraId: carrera.id,
      nombre: 'Pensum Vigente',
    },
  });

  if (!pensum) {
    pensum = await prisma.pensum.create({
      data: {
        carreraId: carrera.id,
        nombre: 'Pensum Vigente',
        vigente: true,
      },
    });
    console.log('Pensum creado:', pensum.nombre);
  } else {
    console.log('Pensum encontrado:', pensum.nombre);
  }

  // 4. Crear Materias
  // Creamos un mapa para acceder rápidamente a los IDs para las prelaciones
  const materiasMap = new Map<string, string>();

  for (const m of data.materias) {
    // Si semestre es null (electivas), le asignamos 0 para representarlo
    const semestre = m.semestre === null ? 0 : m.semestre;

    let materia = await prisma.materia.findFirst({
      where: {
        pensumId: pensum.id,
        codigo: m.codigo,
      },
    });

    if (!materia) {
      materia = await prisma.materia.create({
        data: {
          pensumId: pensum.id,
          codigo: m.codigo,
          nombre: m.nombre,
          semestreNumero: semestre,
          // No tenemos creditos en el PDF, lo dejamos como null (o agregar luego)
        },
      });
      console.log(`Materia creada: ${m.codigo} - ${m.nombre} (Semestre: ${semestre})`);
    } else {
      console.log(`Materia existente: ${m.codigo}`);
    }

    materiasMap.set(m.codigo, materia.id);
  }

  // 5. Crear Prerrequisitos (Prelaciones)
  console.log('Configurando prelaciones...');
  for (const m of data.materias) {
    const materiaId = materiasMap.get(m.codigo);
    if (!materiaId) continue;

    for (const preCod of m.prelaciones) {
      const preId = materiasMap.get(preCod);
      if (!preId) {
        console.warn(`Advertencia: Prelación ${preCod} no encontrada para ${m.codigo}`);
        continue;
      }

      // Verificamos si ya existe el prerrequisito
      const existePre = await prisma.prerrequisito.findUnique({
        where: {
          materiaId_materiaPrerrequisitoId: {
            materiaId: materiaId,
            materiaPrerrequisitoId: preId,
          },
        },
      });

      if (!existePre) {
        await prisma.prerrequisito.create({
          data: {
            materiaId: materiaId,
            materiaPrerrequisitoId: preId,
          },
        });
        console.log(`Prelación agregada: ${preCod} prela a ${m.codigo}`);
      }
    }
  }

  console.log('¡Carga de pensum completada con éxito!');
}

main()
  .catch((e) => {
    console.error('Error durante la carga:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
