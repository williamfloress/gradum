# GRADUM v1 — Pendientes por sprint (backlog)

<!-- Sprint 3: la implementación está comentada en el código (auth guards, admin, rutas React, pages.css). -->

Documento de trabajo para continuar el desarrollo. Lista lo que **aún falta** respecto a [GRADUM - Distribucion de Tareas por Equipo](./GRADUM%20-%20Distribucion%20de%20Tareas%20por%20Equipo.md) y [GRADUM - Plan de Implementacion](./GRADUM%20-%20Plan%20de%20Implementacion.md).

**Última revisión del código:** abril 2026.

---

## Contexto: qué ya está mayormente cubierto

Sirve para no duplicar trabajo:

| Área | Estado |
|------|--------|
| Monorepo frontend (React/Vite) + backend (NestJS) | OK |
| Prisma + esquema de datos (incl. entidades futuras) | OK |
| Auth: Supabase (registro/login) + sincronización `Usuario` en Prisma; guards por rol | OK |
| Admin: listado de usuarios, acciones aprobar/denegar/suspender + `HistorialAprobacion` | OK |
| CRUD carreras (`/degree`), pensums, materias, prerrequisitos (rutas en inglés: `degree`, `pensum`, etc.) | OK |
| UI admin: `/admin/usuarios`, `/admin/carreras`, pensums y materias | OK |
| Landing, login, registro básico, dashboard placeholder | OK |
| Sprint 3: UX aprobación (admin + estudiante pendiente / denegado) | OK (ver abajo) |

**Desviaciones respecto al plan original (solo informativo):** auth con Supabase en lugar de JWT+bcrypt solo en Nest; endpoints de carrera bajo `degree` en lugar de `carreras`; admin conserva `PATCH .../usuarios/:id` con `{ accion }` y además existen rutas dedicadas `GET .../pendientes`, `PATCH .../aprobar` y `.../rechazar`.

---

## Sprint 3 — Aprobación de usuarios (completado)

Objetivo: panel admin + **UX del estudiante pendiente o con registro denegado**.

| ID | Tarea | Estado |
|----|--------|--------|
| S3-1 | **GET** `/admin/usuarios/pendientes`; **PATCH** `/admin/usuarios/:id/aprobar` y `.../rechazar` (+ `PATCH` con `{ accion }` para suspender) | Hecho |
| S3-2 | UI admin: **pestañas** (Todos / Pendientes / Aprobados / Denegados / Suspendidos) | Hecho |
| S3-3 | Rutas **`/pendiente-aprobacion`** y **`/cuenta-denegada`** con sesión Supabase; mensaje y acciones (comprobar estado / cerrar sesión) | Hecho |
| S3-4 | **Redirección** si `estado === pendiente_aprobacion` o `rechazado` hacia la pantalla correspondiente | Hecho |

**Política de login:** estudiantes `pendiente_aprobacion` y `rechazado` obtienen token; el acceso al resto de la API exige `estado === aprobado` (`ApprovedUserGuard`). Cuentas `baneado` no inician sesión.

---

## Sprint 4 — Perfil estudiante (onboarding)

Objetivo: estudiante aprobado elige carrera y pensum; **PerfilEstudiante** + inscripciones automáticas si primer semestre.

| ID | Tarea | Backend / Frontend |
|----|--------|---------------------|
| S4-1 | Registro extendido: campo **tipoIngreso** (primer_semestre \| avanzado) | Backend: DTO + persistir en `Usuario` o en flujo coherente con el modelo. Frontend: formulario registro. |
| S4-2 | **POST `/perfiles`** (o `/perfil`): crear `PerfilEstudiante` con validaciones (usuario aprobado, sin perfil previo, carrera/pensum existentes, pensum vigente automático si aplica) | Backend: módulo nuevo. |
| S4-3 | Si **tipoIngreso = primer_semestre**: al crear perfil, **inscripciones automáticas** a materias del pensum con `semestreNumero === 1` | Backend: transacción con `InscripcionSemestre`. |
| S4-4 | UI **/onboarding** o **/completar-perfil**: carrera, tipo ingreso, semestre actual (etiqueta), envío a POST perfil → redirección a dashboard | Frontend + integración. |
| S4-5 | **Protección de rutas**: si usuario aprobado **sin** `PerfilEstudiante`, redirigir a onboarding | Frontend: similar a `ProtectedRoute`. |
| S4-6 | Prueba manual E2E: registro → aprobación admin → onboarding → dashboard | QA. |

---

## Sprint 5 — Inscripciones (estudiantes avanzados)

Objetivo: añadir/quitar materias del semestre; lista de disponibles; drag & drop; alertas.

| ID | Tarea |
|----|--------|
| S5-1 | **GET/POST/DELETE** `/inscripciones` (o bajo prefijo `/perfil/...`) con validaciones: materia del pensum del usuario, prerrequisitos, estados |
| S5-2 | **GET** `/perfiles/mi-pensum/materias-disponibles?semestre=...` (o equivalente) |
| S5-3 | UI **drag & drop** (ej. `@dnd-kit/core`): columnas disponibles vs inscritas; integrar POST/DELETE |
| S5-4 | Lógica o endpoint de **alertas** por materias de semestres anteriores sin cerrar/aprobar |
| S5-5 | UI de la **alerta** “Tienes materias pendientes de semestres anteriores…” |
| S5-6 | Reglas para **primer semestre**: no permitir quitar materias automáticas (o según negocio) |

---

## Sprint 6 — Plan de evaluación y evaluaciones

Objetivo: por cada inscripción, definir % del plan, evaluaciones, notas; cálculo de nota definitiva; archivos.

| ID | Tarea |
|----|--------|
| S6-1 | CRUD **planes de evaluación** por inscripción: `GET/POST/PATCH/DELETE` … `/inscripciones/:id/planes-evaluacion` (o ruta equivalente) |
| S6-2 | Validación: suma de **porcentajes ≤ 100** (y reglas de negocio acordadas) |
| S6-3 | CRUD **evaluaciones** por plan: `…/planes-evaluacion/:id/evaluaciones` |
| S6-4 | **Cálculo nota definitiva**: `Σ (nota_real × porcentaje / 100)`; actualizar `InscripcionSemestre.notaDefinitiva` y reglas de `estado` |
| S6-5 | **Supabase Storage**: subida de archivos; guardar URLs en `evaluaciones.archivos` (JSON); endpoint dedicado si hace falta |
| S6-6 | UI formularios plan (% , orden) y evaluaciones (fechas, notas, archivos) |

---

## Sprint 7 — Dashboard pensum y semestre + calendario

Objetivo: árbol del pensum con colores; vista semestre; calendario y modal.

| ID | Tarea |
|----|--------|
| S7-1 | **GET** `/perfiles/mi-pensum` (o similar): materias agrupadas por semestre, estados, notas, prerrequisitos, promedios |
| S7-2 | Componente **árbol visual** (colores: aprobada / reprobada / en curso / pendiente) |
| S7-3 | Vista **materias del semestre actual** (p. ej. `/dashboard/semestre` o sección en dashboard) |
| S7-4 | **Calendario** (FullCalendar, react-big-calendar u otro): eventos desde `Evaluacion.fechaLimite` + preparar hueco para eventos manuales |
| S7-5 | **Modal** de evaluación (observación, nota esperada, nota real) enlazado a PATCH |

---

## Sprint 8 — Detalle materia y métricas

Objetivo: página de detalle por inscripción y “balance métrico”.

| ID | Tarea |
|----|--------|
| S8-1 | Endpoint **detalle** inscripción/materia: plan + evaluaciones anidadas |
| S8-2 | Ruta **/dashboard/materias/:inscripcionId** (o id coherente con el API) |
| S8-3 | Lógica **% del plan evaluado** y **nota parcial** (backend o derivado en frontend con API mínima) |
| S8-4 | UI: barra/indicadores de balance métrico en tiempo real |

---

## Sprint 9 — Eventos, landing pulida y calidad

Objetivo: CRUD eventos de calendario; pulir marketing/auth; tests.

| ID | Tarea |
|----|--------|
| S9-1 | CRUD **EventoCalendario**: `GET/POST/PATCH/DELETE` `/eventos` (tipos tarea/examen/evaluacion; vínculos opcionales) |
| S9-2 | Integrar eventos manuales en el **calendario** del Sprint 7 |
| S9-3 | **Landing**: revisar navbar, hero, CTA (gran parte existe; alinear con checklist del plan) |
| S9-4 | **Registro**: confirmar contraseña, **tipoIngreso** visible si aplica al flujo final |
| S9-5 | **Tests unitarios** (cálculo nota, validación prerrequisitos/ciclos) |
| S9-6 | **Tests e2e** flujos críticos |
| S9-7 | Pase de **bugs y edge cases** |

---

## Fases del Plan de Implementación (mapeo rápido)

Lo anterior corresponde a estas fases del documento técnico:

| Fase plan | Contenido | Estado en backlog |
|-----------|-----------|-------------------|
| Fase 2 | Aprobación usuarios | Sprint 3 (completado) |
| Fase 3 | Perfil estudiante | Sprint 4 |
| Fase 4 | Inscripciones semestre | Sprint 5 |
| Fase 5 | Plan evaluación + evaluaciones + nota + storage | Sprint 6 |
| Fase 6 | Dashboard pensum (árbol) | Sprint 7 (parte Samuel/Jeisi) |
| Fase 7 | Semestre actual + calendario + modal | Sprint 7 (resto) |
| Fase 8 | Detalle materia + métricas | Sprint 8 |
| Fase 9 | Eventos + pulido + tests | Sprint 9 |

**Fases 0–1** se consideran cubiertas salvo las diferencias de naming/endpoints ya mencionadas.

---

## Orden sugerido de dependencias

```
Sprint 4 (perfil + inscripciones auto 1er sem)
    → Sprint 5 (inscripciones avanzados)
        → Sprint 6 (planes y evaluaciones)
            → Sprint 7 (vistas agregadas + calendario)
                → Sprint 8 (detalle + métricas)
                    → Sprint 9 (eventos + QA)
```

Sprint 3 ya cubre sesión para pendientes y denegados; puede ejecutarse en paralelo con Sprint 4 si hace falta.

---

## Referencias

- [GRADUM - Plan de Implementacion](./GRADUM%20-%20Plan%20de%20Implementacion.md)
- [GRADUM - Distribucion de Tareas por Equipo](./GRADUM%20-%20Distribucion%20de%20Tareas%20por%20Equipo.md)
