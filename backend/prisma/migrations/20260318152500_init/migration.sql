-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('admin', 'estudiante');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('pendiente_aprobacion', 'aprobado', 'rechazado');

-- CreateEnum
CREATE TYPE "TipoIngreso" AS ENUM ('primer_semestre', 'avanzado');

-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('en_curso', 'aprobada', 'reprobada');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('tarea', 'examen', 'evaluacion');

-- CreateEnum
CREATE TYPE "AccionAprobacion" AS ENUM ('aprobado', 'rechazado');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'estudiante',
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'pendiente_aprobacion',
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carreras" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carreras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pensums" (
    "id" TEXT NOT NULL,
    "carrera_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "version" TEXT,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pensums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materias" (
    "id" TEXT NOT NULL,
    "pensum_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "semestre_numero" INTEGER NOT NULL,
    "creditos" INTEGER,
    "orden" INTEGER,

    CONSTRAINT "materias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prerrequisitos" (
    "id" TEXT NOT NULL,
    "materia_id" TEXT NOT NULL,
    "materia_prerrequisito_id" TEXT NOT NULL,

    CONSTRAINT "prerrequisitos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfiles_estudiante" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "carrera_id" TEXT NOT NULL,
    "pensum_id" TEXT NOT NULL,
    "tipo_ingreso" "TipoIngreso" NOT NULL,
    "semestre_actual" TEXT NOT NULL,

    CONSTRAINT "perfiles_estudiante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscripciones_semestre" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "materia_id" TEXT NOT NULL,
    "semestre_etiqueta" TEXT NOT NULL,
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'en_curso',
    "nota_definitiva" DECIMAL(4,2),
    "promedio_semestre" DECIMAL(4,2),

    CONSTRAINT "inscripciones_semestre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes_evaluacion" (
    "id" TEXT NOT NULL,
    "inscripcion_semestre_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "porcentaje" DECIMAL(5,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "planes_evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones" (
    "id" TEXT NOT NULL,
    "plan_evaluacion_id" TEXT NOT NULL,
    "fecha_limite" DATE,
    "observacion" TEXT,
    "nota_esperada" DECIMAL(4,2),
    "nota_real" DECIMAL(4,2),
    "archivos" JSONB,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_calendario" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "fecha" DATE NOT NULL,
    "descripcion" TEXT,
    "evaluacion_id" TEXT,
    "inscripcion_semestre_id" TEXT,

    CONSTRAINT "eventos_calendario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_aprobacion" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "accion" "AccionAprobacion" NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_aprobacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "prerrequisitos_materia_id_materia_prerrequisito_id_key" ON "prerrequisitos"("materia_id", "materia_prerrequisito_id");

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_estudiante_usuario_id_key" ON "perfiles_estudiante"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "inscripciones_semestre_usuario_id_materia_id_semestre_etiqu_key" ON "inscripciones_semestre"("usuario_id", "materia_id", "semestre_etiqueta");

-- AddForeignKey
ALTER TABLE "pensums" ADD CONSTRAINT "pensums_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carreras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materias" ADD CONSTRAINT "materias_pensum_id_fkey" FOREIGN KEY ("pensum_id") REFERENCES "pensums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prerrequisitos" ADD CONSTRAINT "prerrequisitos_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prerrequisitos" ADD CONSTRAINT "prerrequisitos_materia_prerrequisito_id_fkey" FOREIGN KEY ("materia_prerrequisito_id") REFERENCES "materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_estudiante" ADD CONSTRAINT "perfiles_estudiante_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_estudiante" ADD CONSTRAINT "perfiles_estudiante_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carreras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_estudiante" ADD CONSTRAINT "perfiles_estudiante_pensum_id_fkey" FOREIGN KEY ("pensum_id") REFERENCES "pensums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones_semestre" ADD CONSTRAINT "inscripciones_semestre_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones_semestre" ADD CONSTRAINT "inscripciones_semestre_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_evaluacion" ADD CONSTRAINT "planes_evaluacion_inscripcion_semestre_id_fkey" FOREIGN KEY ("inscripcion_semestre_id") REFERENCES "inscripciones_semestre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_plan_evaluacion_id_fkey" FOREIGN KEY ("plan_evaluacion_id") REFERENCES "planes_evaluacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_calendario" ADD CONSTRAINT "eventos_calendario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_calendario" ADD CONSTRAINT "eventos_calendario_evaluacion_id_fkey" FOREIGN KEY ("evaluacion_id") REFERENCES "evaluaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_calendario" ADD CONSTRAINT "eventos_calendario_inscripcion_semestre_id_fkey" FOREIGN KEY ("inscripcion_semestre_id") REFERENCES "inscripciones_semestre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_aprobacion" ADD CONSTRAINT "historial_aprobacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_aprobacion" ADD CONSTRAINT "historial_aprobacion_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
