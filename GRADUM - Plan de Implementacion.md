# Plan de Implementación — Gradum v1

Documento detallado de implementación para el MVP de Gradum. Incluye fases de trabajo, pasos concretos, sugerencias de código y justificación de cada decisión.

**Stack:** React + NestJS + PostgreSQL (Supabase)

---

## 1. Contexto y decisiones clave

### 1.1 Resumen del proyecto

Gradum es un diario universitario que permite a los estudiantes:
- Seguir el progreso de su carrera (pensum visual con colores)
- Registrar materias del semestre actual
- Definir planes de evaluación y registrar notas
- Ver balance métrico en tiempo real
- Gestionar calendario de evaluaciones

Los administradores gestionan carreras, pensums, materias y aprueban usuarios.

### 1.2 Decisión: Pensum compartido (no por usuario)

**El Pensum es una plantilla compartida por carrera.** No se guarda un pensum por cada usuario.

| Entidad | Alcance | Razón |
|---------|---------|-------|
| Pensum | Por carrera (compartido) | Define la estructura del plan de estudios |
| Materia | Por pensum | Parte de la plantilla |
| Perfil estudiante | Por usuario | Referencia `pensum_id` al pensum asignado |
| Inscripción semestre | Por usuario | Progreso individual (aprobada/reprobada/en curso) |

**Beneficio:** Evita duplicación de datos, mantiene consistencia y simplifica la lógica.

### 1.3 Fórmula de nota definitiva

Para calcular la nota definitiva de una materia en un semestre:

```
nota_definitiva = Σ (nota_real_i × porcentaje_i / 100)
```

- Solo se consideran evaluaciones con `nota_real` registrada.
- Si faltan evaluaciones, la nota es parcial (o se puede mostrar "En curso" hasta completar el 100%).
- Los porcentajes del Plan de evaluación deben sumar 100.

---

## 2. Stack tecnológico

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Frontend** | React (Vite) | Rápido, ecosistema maduro, componentes reutilizables |
| **Backend** | NestJS | Arquitectura modular, TypeScript nativo, integración con TypeORM/Prisma |
| **Base de datos** | PostgreSQL (Supabase) | Relacional, Supabase añade Auth, Storage y Realtime |
| **ORM** | Prisma | Tipado fuerte, migraciones claras, buen DX |
| **Auth** | NestJS + JWT + bcrypt | Control total del flujo (aprobación de usuarios) |

**Supabase:** Se usa como PostgreSQL hospedado. Auth y Storage de Supabase son opcionales; en v1 se recomienda auth propio en NestJS para el flujo de aprobación.

---

## 3. Estructura del proyecto

```
gradum/
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── contexts/
│   │   └── types/
│   └── package.json
│
├── backend/                  # NestJS
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── carreras/
│   │   ├── pensums/
│   │   ├── materias/
│   │   ├── prerrequisitos/
│   │   ├── perfiles/
│   │   ├── inscripciones/
│   │   ├── planes-evaluacion/
│   │   ├── evaluaciones/
│   │   └── eventos/
│   └── prisma/
│       └── schema.prisma
│
└── documentacion/
```

---

## 4. Fases de implementación

---

## FASE 0: Fundamentos (1–2 semanas)

**Objetivo:** Proyecto inicializado, base de datos creada, auth básico funcionando.

### Paso 0.1 — Crear proyecto monorepo

**Qué hacer:**
- Crear carpeta `gradum` con `frontend/` y `backend/`
- Inicializar React con Vite: `npm create vite@latest frontend -- --template react-ts`
- Inicializar NestJS: `nest new backend`

**Por qué:** Separar frontend y backend desde el inicio facilita el desarrollo y el despliegue independiente.

**Beneficio:** Estructura clara y escalable.

---

### Paso 0.2 — Configurar Supabase y Prisma

**Qué hacer:**
1. Crear proyecto en [Supabase](https://supabase.com)
2. Obtener `DATABASE_URL` (Connection string)
3. Instalar Prisma: `cd backend && npm i prisma @prisma/client`
4. Inicializar: `npx prisma init`
5. Configurar `prisma/schema.prisma` con la URL de Supabase

**Sugerencia de código — `backend/prisma/schema.prisma` (inicial):**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Por qué:** Prisma permite definir el esquema en código, generar migraciones y tener tipado automático.

**Beneficio:** Migraciones versionadas, sin SQL manual para el esquema.

---

### Paso 0.3 — Definir esquema completo de la base de datos

**Qué hacer:**
- Traducir el modelo de datos (ver GRADUM - Modelo de datos) a Prisma schema
- Crear todas las entidades: Usuario, Carrera, Pensum, Materia, Prerrequisito, PerfilEstudiante, InscripcionSemestre, PlanEvaluacion, Evaluacion, EventoCalendario, HistorialAprobacion

**Sugerencia de código — `backend/prisma/schema.prisma` (entidades principales):**

```prisma
model Usuario {
  id              String   @id @default(uuid())
  nombre          String
  email           String   @unique
  passwordHash    String   @map("password_hash")
  rol             Rol      @default(estudiante)
  estado          EstadoUsuario @default(pendiente_aprobacion)
  fechaRegistro   DateTime @default(now()) @map("fecha_registro")
  actualizadoEn   DateTime @updatedAt @map("actualizado_en")

  perfilEstudiante PerfilEstudiante?
  inscripciones    InscripcionSemestre[]
  eventos         EventoCalendario[]
  historialAprobaciones HistorialAprobacion[] @relation("usuarioAprobado")
  aprobacionesRealizadas HistorialAprobacion[] @relation("adminQueAprueba")

  @@map("usuarios")
}

enum Rol { admin estudiante }
enum EstadoUsuario { pendiente_aprobacion aprobado rechazado }

model Carrera {
  id        String   @id @default(uuid())
  nombre    String
  codigo    String?
  activa    Boolean  @default(true)
  creadoEn  DateTime @default(now()) @map("creado_en")

  pensums   Pensum[]
  perfiles  PerfilEstudiante[]

  @@map("carreras")
}

model Pensum {
  id        String   @id @default(uuid())
  carreraId String   @map("carrera_id")
  nombre    String
  version   String?
  vigente   Boolean  @default(true)
  creadoEn  DateTime @default(now()) @map("creado_en")

  carrera   Carrera  @relation(fields: [carreraId], references: [id], onDelete: Cascade)
  materias  Materia[]
  perfiles  PerfilEstudiante[]

  @@map("pensums")
}

model Materia {
  id              String   @id @default(uuid())
  pensumId        String   @map("pensum_id")
  nombre          String
  codigo          String?
  semestreNumero  Int      @map("semestre_numero")
  creditos        Int?
  orden           Int?

  pensum          Pensum   @relation(fields: [pensumId], references: [id], onDelete: Cascade)
  prerrequisitosDe Prerrequisito[] @relation("materiaQueRequiere")
  esPrerrequisitoDe Prerrequisito[] @relation("materiaPrerrequisito")
  inscripciones   InscripcionSemestre[]

  @@map("materias")
}

model Prerrequisito {
  id                    String   @id @default(uuid())
  materiaId             String   @map("materia_id")
  materiaPrerrequisitoId String   @map("materia_prerrequisito_id")

  materia               Materia   @relation("materiaQueRequiere", fields: [materiaId], references: [id], onDelete: Cascade)
  materiaPrerrequisito  Materia   @relation("materiaPrerrequisito", fields: [materiaPrerrequisitoId], references: [id], onDelete: Cascade)

  @@unique([materiaId, materiaPrerrequisitoId])
  @@map("prerrequisitos")
}

model PerfilEstudiante {
  id             String        @id @default(uuid())
  usuarioId      String        @unique @map("usuario_id")
  carreraId      String        @map("carrera_id")
  pensumId       String        @map("pensum_id")
  tipoIngreso    TipoIngreso   @map("tipo_ingreso")
  semestreActual String        @map("semestre_actual")

  usuario        Usuario       @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  carrera        Carrera       @relation(fields: [carreraId], references: [id])
  pensum         Pensum        @relation(fields: [pensumId], references: [id])

  @@map("perfiles_estudiante")
}

enum TipoIngreso { primer_semestre avanzado }

model InscripcionSemestre {
  id               String     @id @default(uuid())
  usuarioId        String     @map("usuario_id")
  materiaId        String     @map("materia_id")
  semestreEtiqueta String     @map("semestre_etiqueta")
  estado           EstadoInscripcion @default(en_curso)
  notaDefinitiva   Decimal?   @map("nota_definitiva") @db.Decimal(4, 2)
  promedioSemestre Decimal?   @map("promedio_semestre") @db.Decimal(4, 2)

  usuario          Usuario    @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  materia          Materia    @relation(fields: [materiaId], references: [id], onDelete: Cascade)
  planesEvaluacion PlanEvaluacion[]
  eventos          EventoCalendario[]

  @@unique([usuarioId, materiaId, semestreEtiqueta])
  @@map("inscripciones_semestre")
}

enum EstadoInscripcion { en_curso aprobada reprobada }

model PlanEvaluacion {
  id                    String    @id @default(uuid())
  inscripcionSemestreId String    @map("inscripcion_semestre_id")
  nombre                String
  porcentaje            Decimal   @db.Decimal(5, 2)
  orden                 Int       @default(0)

  inscripcionSemestre   InscripcionSemestre @relation(fields: [inscripcionSemestreId], references: [id], onDelete: Cascade)
  evaluaciones         Evaluacion[]

  @@map("planes_evaluacion")
}

model Evaluacion {
  id                 String    @id @default(uuid())
  planEvaluacionId   String    @map("plan_evaluacion_id")
  fechaLimite        DateTime? @map("fecha_limite") @db.Date
  observacion        String?   @db.Text
  notaEsperada       Decimal?  @map("nota_esperada") @db.Decimal(4, 2)
  notaReal           Decimal?  @map("nota_real") @db.Decimal(4, 2)
  archivos           Json?     // Array de URLs o paths
  creadoEn           DateTime @default(now()) @map("creado_en")

  planEvaluacion     PlanEvaluacion @relation(fields: [planEvaluacionId], references: [id], onDelete: Cascade)
  eventos            EventoCalendario[]

  @@map("evaluaciones")
}

model EventoCalendario {
  id                    String    @id @default(uuid())
  usuarioId              String    @map("usuario_id")
  titulo                 String
  tipo                   TipoEvento
  fecha                  DateTime  @db.Date
  descripcion            String?   @db.Text
  evaluacionId           String?   @map("evaluacion_id")
  inscripcionSemestreId  String?   @map("inscripcion_semestre_id")

  usuario                Usuario   @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  evaluacion             Evaluacion? @relation(fields: [evaluacionId], references: [id])
  inscripcionSemestre    InscripcionSemestre? @relation(fields: [inscripcionSemestreId], references: [id])

  @@map("eventos_calendario")
}

enum TipoEvento { tarea examen evaluacion }

model HistorialAprobacion {
  id        String   @id @default(uuid())
  usuarioId String   @map("usuario_id")
  adminId   String   @map("admin_id")
  accion    AccionAprobacion
  creadoEn  DateTime @default(now()) @map("creado_en")

  usuario   Usuario  @relation("usuarioAprobado", fields: [usuarioId], references: [id], onDelete: Cascade)
  admin     Usuario  @relation("adminQueAprueba", fields: [adminId], references: [id], onDelete: Cascade)

  @@map("historial_aprobacion")
}

enum AccionAprobacion { aprobado rechazado }
```

**Por qué:** El esquema es la base de todo. Definirlo completo evita cambios costosos después.

**Beneficio:** Tipado end-to-end, migraciones reproducibles.

---

### Paso 0.4 — Ejecutar migración inicial

**Qué hacer:**
```bash
cd backend && npx prisma migrate dev --name init
```

**Por qué:** Crea las tablas en Supabase según el schema.

**Beneficio:** Base de datos lista para desarrollo.

---

### Paso 0.5 — Módulo Auth en NestJS

**Qué hacer:**
1. Instalar: `npm i @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt`
2. Crear módulo `AuthModule` con:
   - `AuthService`: registro, login, hash de contraseñas
   - `AuthController`: POST `/auth/register`, POST `/auth/login`
   - `JwtStrategy`: validación de token
   - `@UseGuards(JwtAuthGuard)` para rutas protegidas

**Sugerencia de código — `backend/src/auth/auth.service.ts` (registro):**

```typescript
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email ya registrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        email: dto.email,
        passwordHash,
        rol: 'estudiante',
        estado: 'pendiente_aprobacion',
      },
    });
    return { id: usuario.id, email: usuario.email, estado: usuario.estado };
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (!usuario || !(await bcrypt.compare(dto.password, usuario.passwordHash)))
      throw new UnauthorizedException('Credenciales inválidas');

    if (usuario.estado !== 'aprobado' && usuario.rol !== 'admin')
      throw new ForbiddenException('Usuario pendiente de aprobación');

    const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };
    return { access_token: this.jwtService.sign(payload) };
  }
}
```

**Por qué:** Auth centralizado permite controlar el flujo de aprobación (estudiantes no pueden usar el dashboard hasta ser aprobados).

**Beneficio:** Seguridad y control de acceso desde el inicio.

---

### Paso 0.6 — Guards por rol

**Qué hacer:**
- Crear `RolesGuard` que verifique `user.rol` en el decorador `@Roles('admin')`
- Aplicar a rutas de admin (ej. aprobar usuarios, CRUD carreras)

**Por qué:** Separar claramente qué puede hacer cada rol.

**Beneficio:** Evita que un estudiante acceda a endpoints de admin.

---

### Paso 0.7 — Seed de datos (opcional)

**Qué hacer:**
- Crear `prisma/seed.ts` con usuario admin y una carrera de ejemplo
- Ejecutar: `npx prisma db seed`

**Por qué:** Tener datos de prueba facilita el desarrollo del frontend.

**Beneficio:** No depender de crear datos manualmente cada vez.

---

## FASE 1: Flujo Admin — Carreras, Pensums, Materias (1–2 semanas)

**Objetivo:** El admin puede crear carreras, pensums y materias con prerrequisitos.

### Paso 1.1 — CRUD Carreras

**Qué hacer:**
- Módulo `CarrerasModule` con `CarrerasService` y `CarrerasController`
- Endpoints: GET, POST, PATCH, DELETE `/carreras`
- Proteger con `@Roles('admin')`

**Sugerencia — `backend/src/carreras/carreras.controller.ts`:**

```typescript
@Controller('carreras')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CarrerasController {
  constructor(private readonly carrerasService: CarrerasService) {}

  @Get()
  findAll() {
    return this.carrerasService.findAll();
  }

  @Post()
  create(@Body() dto: CreateCarreraDto) {
    return this.carrerasService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCarreraDto) {
    return this.carrerasService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.carrerasService.remove(id);
  }
}
```

**Por qué:** Las carreras son la raíz de la jerarquía. Sin carreras no hay pensums ni materias.

**Beneficio:** Base para todo el contenido académico.

---

### Paso 1.2 — CRUD Pensums (por carrera)

**Qué hacer:**
- Módulo `PensumsModule`
- Endpoints: GET `/carreras/:carreraId/pensums`, POST, PATCH, DELETE
- Validar que `carreraId` exista

**Por qué:** Un pensum pertenece a una carrera. El admin crea pensums para cada carrera.

**Beneficio:** Permite versionar planes de estudio (Pensum 2020, 2024, etc.).

---

### Paso 1.3 — CRUD Materias (por pensum)

**Qué hacer:**
- Módulo `MateriasModule`
- Endpoints: GET `/pensums/:pensumId/materias`, POST, PATCH, DELETE
- Campos: nombre, codigo, semestreNumero, creditos, orden

**Por qué:** Las materias son el contenido del pensum. Sin materias el pensum está vacío.

**Beneficio:** Construcción del plan de estudios completo.

---

### Paso 1.4 — CRUD Prerrequisitos

**Qué hacer:**
- Módulo `PrerrequisitosModule` o integrado en Materias
- Endpoints: POST `/materias/:materiaId/prerrequisitos` con `{ materiaPrerrequisitoId }`
- Validar que ambas materias pertenezcan al mismo pensum
- Evitar ciclos (A → B → A)

**Sugerencia — validación de ciclo:**

```typescript
async addPrerrequisito(materiaId: string, materiaPrerrequisitoId: string) {
  if (materiaId === materiaPrerrequisitoId)
    throw new BadRequestException('Una materia no puede ser prerrequisito de sí misma');

  // Verificar que no exista ciclo (BFS/DFS desde materiaPrerrequisitoId)
  const formariaCiclo = await this.wouldCreateCycle(materiaId, materiaPrerrequisitoId);
  if (formariaCiclo)
    throw new BadRequestException('Crearía un ciclo en los prerrequisitos');

  return this.prisma.prerrequisito.create({
    data: { materiaId, materiaPrerrequisitoId },
  });
}
```

**Por qué:** Los prerrequisitos definen el árbol del pensum. Ciclos romperían la lógica.

**Beneficio:** Pensum coherente y visualizable como árbol.

---

### Paso 1.5 — UI Admin: Carreras y Pensums

**Qué hacer:**
- Página `/admin/carreras` con lista y formulario crear/editar
- Página `/admin/carreras/:id/pensums` para gestionar pensums
- Página `/admin/pensums/:id/materias` para gestionar materias y prerrequisitos

**Por qué:** El admin necesita una interfaz para poblar el sistema.

**Beneficio:** Flujo completo Admin → Carrera → Pensum → Materias.

---

## FASE 2: Aprobación de usuarios (≈1 semana)

**Objetivo:** Admin aprueba/rechaza estudiantes; estudiantes pendientes ven mensaje de espera.

### Paso 2.1 — Endpoints de aprobación

**Qué hacer:**
- En `UsersModule` o nuevo `AdminModule`:
  - GET `/admin/usuarios/pendientes` — lista de usuarios con estado `pendiente_aprobacion`
  - PATCH `/admin/usuarios/:id/aprobar` — cambia estado a `aprobado`
  - PATCH `/admin/usuarios/:id/rechazar` — cambia estado a `rechazado`
  - Opcional: registrar en `HistorialAprobacion`

**Por qué:** El flujo de negocio exige que un admin valide a los nuevos estudiantes.

**Beneficio:** Control de acceso y trazabilidad.

---

### Paso 2.2 — UI Admin: Panel de aprobación

**Qué hacer:**
- Página `/admin/usuarios` con tabs o filtros: Pendientes, Aprobados, Rechazados
- Botones Aprobar / Rechazar por usuario
- Mostrar nombre, email, fecha de registro

**Por qué:** El admin necesita ver y actuar sobre las solicitudes.

**Beneficio:** Proceso de onboarding claro.

---

### Paso 2.3 — UI Estudiante: Pantalla de espera

**Qué hacer:**
- Si el estudiante está `pendiente_aprobacion`, redirigir a `/pendiente-aprobacion`
- Mostrar mensaje: "Tu cuenta está pendiente de aprobación. Te notificaremos cuando un administrador la revise."

**Por qué:** Evitar que el estudiante intente acceder al dashboard sin estar aprobado.

**Beneficio:** UX clara y sin errores 403 en rutas internas.

---

## FASE 3: Perfil estudiante (≈1 semana)

**Objetivo:** Estudiante aprobado elige carrera y pensum; se crea PerfilEstudiante.

### Paso 3.1 — Flujo de registro extendido

**Qué hacer:**
- En el registro, añadir campos: `tipoIngreso` (primer_semestre | avanzado)
- La selección de carrera y pensum ocurre **después** de aprobación (no en registro)

**Por qué:** El estudiante no puede elegir carrera hasta ser aprobado. El registro solo pide datos básicos + tipo de ingreso.

**Beneficio:** Flujo coherente con la aprobación.

---

### Paso 3.2 — Endpoint crear Perfil

**Qué hacer:**
- POST `/perfiles` con `{ carreraId, pensumId, tipoIngreso, semestreActual }`
- Validar: usuario aprobado, no tiene perfil previo, carrera y pensum existen
- Obtener pensum vigente de la carrera si solo se envía `carreraId` (asignación automática)

**Sugerencia — asignación automática de pensum:**

```typescript
async create(userId: string, dto: CreatePerfilDto) {
  const pensumId = dto.pensumId ?? await this.getPensumVigente(dto.carreraId);
  if (!pensumId) throw new BadRequestException('La carrera no tiene pensum vigente');

  return this.prisma.perfilEstudiante.create({
    data: {
      usuarioId: userId,
      carreraId: dto.carreraId,
      pensumId,
      tipoIngreso: dto.tipoIngreso,
      semestreActual: dto.semestreActual,
    },
  });
}
```

**Por qué:** El pensum se asigna automáticamente al elegir carrera (como indica el MVP).

**Beneficio:** Menos pasos para el usuario, menos errores.

---

### Paso 3.3 — Lógica primer semestre: inscripciones automáticas

**Qué hacer:**
- Al crear perfil con `tipoIngreso = primer_semestre`:
  - Obtener materias del pensum con `semestreNumero === 1`
  - Crear `InscripcionSemestre` por cada materia con `semestre_etiqueta = semestreActual`, `estado = en_curso`

**Sugerencia:**

```typescript
if (dto.tipoIngreso === 'primer_semestre') {
  const materiasSemestre1 = await this.prisma.materia.findMany({
    where: { pensumId, semestreNumero: 1 },
  });
  await this.prisma.inscripcionSemestre.createMany({
    data: materiasSemestre1.map(m => ({
      usuarioId: userId,
      materiaId: m.id,
      semestreEtiqueta: dto.semestreActual,
      estado: 'en_curso',
    })),
  });
}
```

**Por qué:** El MVP especifica que primer semestre tiene materias auto-registradas y no editables.

**Beneficio:** El estudiante ve su semestre listo sin configurar nada.

---

### Paso 3.4 — UI: Selección de carrera y creación de perfil

**Qué hacer:**
- Página `/onboarding` (o `/completar-perfil`) mostrada solo si usuario aprobado sin perfil
- Formulario: seleccionar carrera (dropdown) → se asigna pensum automáticamente
- Campos: tipo ingreso (ya viene del registro), semestre actual (ej. "2025-1")
- Botón "Continuar" → POST `/perfiles` → redirigir a dashboard

**Por qué:** El estudiante debe completar su perfil una vez aprobado.

**Beneficio:** Datos completos para el resto del flujo.

---

## FASE 4: Inscripciones semestre (avanzados) (1–2 semanas)

**Objetivo:** Estudiante avanzado añade materias del semestre actual con drag & drop.

### Paso 4.1 — Endpoints inscripciones

**Qué hacer:**
- GET `/inscripciones?semestre=2025-1` — inscripciones del usuario en ese semestre
- POST `/inscripciones` — crear inscripción (materia, semestre)
- DELETE `/inscripciones/:id` — eliminar (solo si `estado === en_curso` y no es primer semestre)
- Validar: materia pertenece al pensum del usuario
- Validar prerrequisitos: si la materia tiene prerrequisitos, el usuario debe tenerlos aprobados (o al menos en curso, según regla de negocio)

**Por qué:** El estudiante avanzado elige qué materias cursa. Las validaciones evitan datos incoherentes.

**Beneficio:** Inscripciones correctas y alineadas con el pensum.

---

### Paso 4.2 — Endpoint materias disponibles para inscribir

**Qué hacer:**
- GET `/perfiles/mi-pensum/materias-disponibles?semestre=2025-1`
- Retornar materias del pensum que:
  - Aún no están inscritas en ese semestre
  - Tienen prerrequisitos cumplidos (aprobados por el usuario)
  - Opcional: filtrar por `semestreNumero` si se quiere limitar

**Por qué:** El drag & drop necesita una lista de materias que el usuario puede añadir.

**Beneficio:** UI con opciones válidas únicamente.

---

### Paso 4.3 — UI: Drag & drop para añadir materias

**Qué hacer:**
- Usar `@dnd-kit/core` o `react-beautiful-dnd`
- Dos columnas: "Materias disponibles" y "Mis materias del semestre"
- Arrastrar de disponible → inscritas crea POST `/inscripciones`
- Arrastrar de inscritas → disponible (o botón quitar) hace DELETE
- Para primer semestre: ocultar o deshabilitar la opción de quitar

**Por qué:** El MVP pide drag & drop para dar interactividad.

**Beneficio:** UX moderna y clara.

---

### Paso 4.4 — Alertas de semestres anteriores faltantes

**Qué hacer:**
- Endpoint o lógica en frontend: comparar materias del pensum (semestres 1..N) con inscripciones del usuario
- Si hay materias de semestres anteriores sin inscripción aprobada, mostrar alerta: "Tienes materias pendientes de semestres anteriores. Registra tu historial para un mejor seguimiento."

**Por qué:** El MVP indica avisos si faltan semestres anteriores.

**Beneficio:** Guía al estudiante a completar su historial.

---

## FASE 5: Plan de evaluación y evaluaciones (1–2 semanas)

**Objetivo:** Estudiante define porcentajes por materia y registra notas.

### Paso 5.1 — CRUD Plan de evaluación

**Qué hacer:**
- Endpoints: GET, POST, PATCH, DELETE `/inscripciones/:id/planes-evaluacion`
- Validar que la suma de `porcentaje` sea 100 (o permitir < 100 si hay evaluaciones pendientes)
- Campos: nombre (Parcial 1, Lab, Final), porcentaje, orden

**Sugerencia — validación de porcentajes:**

```typescript
async create(inscripcionId: string, dto: CreatePlanEvaluacionDto) {
  const planes = await this.prisma.planEvaluacion.findMany({ where: { inscripcionSemestreId: inscripcionId } });
  const totalActual = planes.reduce((s, p) => s + Number(p.porcentaje), 0);
  const nuevoTotal = totalActual + dto.porcentaje;
  if (nuevoTotal > 100) throw new BadRequestException('La suma de porcentajes no puede superar 100');
  // ...
}
```

**Por qué:** El plan de evaluación define cómo se calcula la nota definitiva.

**Beneficio:** Cálculos correctos y predecibles.

---

### Paso 5.2 — CRUD Evaluaciones

**Qué hacer:**
- Endpoints: GET, POST, PATCH, DELETE `/planes-evaluacion/:id/evaluaciones`
- Campos: fechaLimite, observacion, notaEsperada, notaReal, archivos
- Para archivos: usar Supabase Storage, guardar URLs en `archivos` (JSON array)

**Por qué:** Las evaluaciones son las notas reales que alimentan el balance métrico.

**Beneficio:** Registro completo del desempeño.

---

### Paso 5.3 — Cálculo de nota definitiva

**Qué hacer:**
- Servicio o método que calcule: `Σ (nota_real_i × porcentaje_i / 100)`
- Ejecutar al guardar/actualizar una Evaluación
- Actualizar `InscripcionSemestre.notaDefinitiva`
- Si la nota definitiva ≥ umbral (ej. 3.0 o 6.0), actualizar `estado` a `aprobada`; si no, `reprobada` (o dejar en `en_curso` hasta que el usuario marque como cerrada)

**Por qué:** La nota definitiva y el estado son centrales para el árbol de colores y las métricas.

**Beneficio:** Datos consistentes y automáticos.

---

### Paso 5.4 — Integración Supabase Storage (archivos)

**Qué hacer:**
- Crear bucket en Supabase para evaluaciones
- Endpoint POST `/evaluaciones/:id/archivos` que suba a Storage y actualice el JSON `archivos`
- Políticas RLS para que solo el dueño pueda subir/ver

**Por qué:** El MVP pide archivos (imágenes, PDF) en las evaluaciones.

**Beneficio:** Evidencia y respaldo de las notas.

---

## FASE 6: Dashboard Pensum (árbol visual) (≈1 semana)

**Objetivo:** Mostrar el pensum como árbol con colores según estado.

### Paso 6.1 — Endpoint pensum con estado por materia

**Qué hacer:**
- GET `/perfiles/mi-pensum` o GET `/pensums/:id?usuarioId=...`
- Retornar materias agrupadas por semestre, con:
  - Datos de la materia
  - Estado de inscripción (aprobada, reprobada, en_curso, pendiente)
  - Nota definitiva si aplica
  - Promedio del semestre si aplica
  - Prerrequisitos para construir el árbol

**Sugerencia — estructura de respuesta:**

```typescript
{
  semestres: [
    {
      numero: 1,
      materias: [
        {
          id, nombre, codigo,
          estado: 'aprobada' | 'reprobada' | 'en_curso' | 'pendiente',
          notaDefinitiva: 4.2,
          prerrequisitos: [{ id, nombre }]
        }
      ],
      promedioSemestre: 4.0
    }
  ]
}
```

**Por qué:** El frontend necesita una estructura que permita renderizar el árbol y los colores.

**Beneficio:** Una sola llamada para toda la vista del pensum.

---

### Paso 6.2 — Componente árbol de materias

**Qué hacer:**
- Componente recursivo o librería (ej. `react-d3-tree`, `@xyflow/react`) para árbol
- Colores: verde (aprobada), rojo (reprobada), amarillo (en curso), gris (pendiente)
- Mostrar nota definitiva y promedio por semestre
- Vistas: global, por semestre, por materia (filtros o tabs)

**Por qué:** El MVP especifica el árbol visual con colores.

**Beneficio:** Vista clara del progreso académico.

---

## FASE 7: Dashboard Semestre y calendario (1–2 semanas)

**Objetivo:** Ver materias del semestre actual y calendario de evaluaciones.

### Paso 7.1 — Vista materias del semestre

**Qué hacer:**
- Página `/dashboard/semestre` o sección en dashboard
- Listar inscripciones del semestre actual con estado y nota parcial
- Enlace a detalle de cada materia (plan de evaluación, evaluaciones)

**Por qué:** El estudiante necesita ver qué está cursando.

**Beneficio:** Acceso rápido al semestre actual.

---

### Paso 7.2 — Calendario de evaluaciones

**Qué hacer:**
- Usar librería de calendario (FullCalendar, react-big-calendar, o custom)
- Eventos: fechas de evaluaciones (`fechaLimite` de Evaluacion) + eventos manuales (EventoCalendario)
- Al hacer clic en un evento: modal para ver/editar observación, nota esperada, nota real

**Por qué:** El MVP pide calendario con evaluaciones y modal para registrar datos.

**Beneficio:** Seguimiento en tiempo real del semestre.

---

### Paso 7.3 — Modal de evaluación

**Qué hacer:**
- Modal con campos: observación, nota esperada, nota real
- Al guardar: PATCH `/evaluaciones/:id`
- Recalcular nota definitiva en backend

**Por qué:** El estudiante registra notas desde el calendario o desde la materia.

**Beneficio:** Flujo ágil sin salir del calendario.

---

## FASE 8: Dashboard Materia y métricas (≈1 semana)

**Objetivo:** Vista detallada por materia con plan, notas y balance métrico.

### Paso 8.1 — Página detalle de materia

**Qué hacer:**
- Ruta `/dashboard/materias/:inscripcionId`
- Mostrar: plan de evaluación (ítems con %), evaluaciones con notas, promedio actual
- Formularios para añadir/editar plan de evaluación y evaluaciones
- Subida de archivos

**Por qué:** El MVP pide visión detallada por materia.

**Beneficio:** Control fino del registro académico.

---

### Paso 8.2 — Sistema de métricas (balance)

**Qué hacer:**
- Calcular por materia: `Σ (nota_real × porcentaje / 100)` de lo registrado
- Mostrar barra o indicador: "X% del plan evaluado" y "Nota parcial: Y"
- Si hay ítems sin nota, mostrar como pendientes

**Por qué:** El MVP pide balance métrico en tiempo real.

**Beneficio:** El estudiante ve cómo va antes de que termine el semestre.

---

## FASE 9: Eventos calendario y pulido (variable)

**Objetivo:** Eventos manuales, ajustes de UX, pruebas.

### Paso 9.1 — CRUD Eventos calendario

**Qué hacer:**
- Endpoints: GET, POST, PATCH, DELETE `/eventos`
- Tipos: tarea, examen, evaluacion
- Vinculación opcional a Evaluacion o InscripcionSemestre

**Por qué:** El estudiante puede añadir recordatorios o eventos que no vienen del plan.

**Beneficio:** Calendario más completo.

---

### Paso 9.2 — Landing, registro y login (UI)

**Qué hacer:**
- Landing: navbar, logo, hero, botón registro
- Registro: nombre, email, contraseña, confirmar, tipo ingreso
- Login: email, contraseña
- Rutas protegidas según rol y estado

**Por qué:** Son las páginas de entrada al sistema.

**Beneficio:** Onboarding completo.

---

### Paso 9.3 — Tests y corrección de bugs

**Qué hacer:**
- Tests unitarios en servicios críticos (cálculo nota definitiva, validación prerrequisitos)
- Tests e2e en flujos principales (registro → aprobación → perfil → inscripción)
- Revisión de edge cases

**Por qué:** Garantizar estabilidad antes de lanzar.

**Beneficio:** Menos bugs en producción.

---

## 5. Resumen de dependencias entre fases

```
Fase 0 (Fundamentos)
    ↓
Fase 1 (Admin: Carreras, Pensums, Materias)
    ↓
Fase 2 (Aprobación usuarios)
    ↓
Fase 3 (Perfil estudiante)
    ↓
Fase 4 (Inscripciones semestre)
    ↓
Fase 5 (Plan evaluación + Evaluaciones)
    ↓
Fase 6 (Dashboard Pensum) ←── puede avanzar en paralelo con 7
Fase 7 (Dashboard Semestre + Calendario)
Fase 8 (Dashboard Materia + Métricas)
    ↓
Fase 9 (Pulido)
```

---

## 6. Checklist de variables de entorno

**Backend (`.env`):**
```
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
JWT_EXPIRES_IN="7d"
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_KEY="..."  # Para Storage si se usa
```

**Frontend (`.env`):**
```
VITE_API_URL="http://localhost:3000"
```

---

## 7. Referencias

- [MVP - Gradum v1 (breve)](./MVP%20-%20Gradum%20v1%20(breve).md)
- [MVP - Diario Universitario](./MVP%20-%20Diario%20Universitario.md)
- [GRADUM - Modelo de datos - Entidades y Relaciones](./GRADUM%20-%20Modelo%20de%20datos%20-%20Entidades%20y%20Relaciones.md)
- [GRADUM - MER Mermaid](./GRADUM%20-%20MER%20Mermaid.md)
