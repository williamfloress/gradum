# GRADUM — Distribución de Tareas por Equipo (Agile/Scrum)

**Equipo:** Samuel, Jeisi, William  
**Metodología:** Agile / Scrum  
**Objetivo:** Trabajo equitativo y balanceado entre 3 personas

---

## 1. Resumen de la metodología

- **Sprints:** 2 semanas cada uno
- **Daily standups:** 15 min para sincronización
- **Sprint Planning:** Al inicio de cada sprint
- **Sprint Review + Retro:** Al final de cada sprint
- **Balance:** Alternancia entre backend, frontend y full-stack para evitar cuellos de botella

---

## 2. Matriz de responsabilidades por sprint

| Sprint | Samuel | Jeisi | William |
|--------|--------|-------|---------|
| **1** | Setup + DB + Schema | Auth module | Guards + Seed + Frontend base |
| **2** | Carreras + Pensums (API) | Materias + Prerrequisitos (API) | UI Admin completa |
| **3** | Endpoints aprobación | UI Admin panel aprobación | UI Estudiante espera |
| **4** | Perfil + Inscripciones auto | UI Onboarding | Integración + testing |
| **5** | Inscripciones API | UI Drag & Drop | Alertas semestres anteriores |
| **6** | Plan + Evaluaciones API | Cálculo nota + Storage | UI Planes y Evaluaciones |
| **7** | Endpoint pensum con estado | Árbol + Vista semestre | Calendario + Modal |
| **8** | API detalle materia | Sistema métricas (lógica) | UI detalle + métricas |
| **9** | CRUD Eventos | Landing + Auth UI | Tests + corrección bugs |

---

## 3. Detalle por sprint y persona

---

### SPRINT 1 — Fundamentos (1–2 semanas)

**Objetivo:** Proyecto inicializado, base de datos creada, auth básico funcionando.

#### Samuel
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 0.1 | Crear proyecto monorepo (`gradum/`, `frontend/`, `backend/`) | Fase 0, Paso 0.1 |
| 0.2 | Configurar Supabase y Prisma (instalación, `schema.prisma` inicial) | Fase 0, Paso 0.2 |
| 0.3 | Definir esquema completo de la base de datos (todas las entidades) | Fase 0, Paso 0.3 |
| 0.4 | Ejecutar migración inicial | Fase 0, Paso 0.4 |

**Entregables:** Monorepo listo, DB en Supabase, schema Prisma completo, migración aplicada.

---

#### Jeisi
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 0.5a | Módulo Auth: `AuthService` (registro, login, hash) | Fase 0, Paso 0.5 |
| 0.5b | Módulo Auth: `AuthController` (POST `/auth/register`, POST `/auth/login`) | Fase 0, Paso 0.5 |
| 0.5c | Módulo Auth: `JwtStrategy`, `JwtAuthGuard` | Fase 0, Paso 0.5 |

**Entregables:** Auth funcionando (registro + login con JWT).

---

#### William
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 0.6 | Guards por rol: `RolesGuard`, decorador `@Roles('admin')` | Fase 0, Paso 0.6 |
| 0.7 | Seed de datos: `prisma/seed.ts` (admin + carrera ejemplo) | Fase 0, Paso 0.7 |
| 0.8 | Inicializar frontend React + Vite en `frontend/` | Fase 0, Paso 0.1 |

**Entregables:** Rutas protegidas por rol, seed ejecutable, frontend base.

---

### SPRINT 2 — Admin: Carreras, Pensums, Materias (1–2 semanas)

**Objetivo:** El admin puede crear carreras, pensums y materias con prerrequisitos.

#### Samuel
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 1.1 | CRUD Carreras: `CarrerasModule`, endpoints GET/POST/PATCH/DELETE `/carreras` | Fase 1, Paso 1.1 |
| 1.2 | CRUD Pensums: `PensumsModule`, endpoints por carrera | Fase 1, Paso 1.2 |

**Entregables:** APIs de Carreras y Pensums protegidas con `@Roles('admin')`.

---

#### Jeisi
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 1.3 | CRUD Materias: `MateriasModule`, endpoints por pensum | Fase 1, Paso 1.3 |
| 1.4 | CRUD Prerrequisitos: endpoints, validación de ciclos | Fase 1, Paso 1.4 |

**Entregables:** APIs de Materias y Prerrequisitos con validación de ciclos.

---

#### William
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 1.5a | UI Admin: página `/admin/carreras` (lista + formulario crear/editar) | Fase 1, Paso 1.5 |
| 1.5b | UI Admin: página `/admin/carreras/:id/pensums` | Fase 1, Paso 1.5 |
| 1.5c | UI Admin: página `/admin/pensums/:id/materias` (materias + prerrequisitos) | Fase 1, Paso 1.5 |

**Entregables:** Flujo completo Admin → Carrera → Pensum → Materias en UI.

---

### SPRINT 3 — Aprobación de usuarios (≈1 semana)

**Objetivo:** Admin aprueba/rechaza estudiantes; estudiantes pendientes ven mensaje de espera.

#### Samuel
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 2.1a | GET `/admin/usuarios/pendientes` | Fase 2, Paso 2.1 |
| 2.1b | PATCH `/admin/usuarios/:id/aprobar` y `/rechazar` | Fase 2, Paso 2.1 |
| 2.1c | Registrar en `HistorialAprobacion` (opcional) | Fase 2, Paso 2.1 |

**Entregables:** Endpoints de aprobación funcionando.

---

#### Jeisi
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 2.2 | UI Admin: página `/admin/usuarios` con tabs Pendientes/Aprobados/Rechazados | Fase 2, Paso 2.2 |
| 2.2b | Botones Aprobar / Rechazar por usuario | Fase 2, Paso 2.2 |

**Entregables:** Panel de aprobación usable por admin.

---

#### William
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 2.3 | UI Estudiante: pantalla `/pendiente-aprobacion` con mensaje de espera | Fase 2, Paso 2.3 |
| 2.3b | Redirección automática si `estado === pendiente_aprobacion` | Fase 2, Paso 2.3 |

**Entregables:** Estudiantes pendientes ven mensaje claro, no acceden al dashboard.

---

### SPRINT 4 — Perfil estudiante (≈1 semana)

**Objetivo:** Estudiante aprobado elige carrera y pensum; se crea PerfilEstudiante.

#### Samuel
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 3.1 | Flujo registro extendido: campo `tipoIngreso` | Fase 3, Paso 3.1 |
| 3.2 | POST `/perfiles` con validaciones y pensum vigente automático | Fase 3, Paso 3.2 |
| 3.3 | Lógica primer semestre: inscripciones automáticas al crear perfil | Fase 3, Paso 3.3 |

**Entregables:** API de perfiles con inscripciones automáticas para primer semestre.

---

#### Jeisi
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 3.4 | UI Onboarding: página `/onboarding` o `/completar-perfil` | Fase 3, Paso 3.4 |
| 3.4b | Formulario: carrera, tipo ingreso, semestre actual | Fase 3, Paso 3.4 |
| 3.4c | POST `/perfiles` → redirigir a dashboard | Fase 3, Paso 3.4 |

**Entregables:** Flujo de onboarding completo para estudiantes aprobados.

---

#### William
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 3.5 | Integración frontend-backend del flujo onboarding | - |
| 3.6 | Testing manual del flujo: registro → aprobación → perfil → dashboard | - |

**Entregables:** Flujo end-to-end verificado.

---

### SPRINT 5 — Inscripciones semestre (avanzados) (1–2 semanas)

**Objetivo:** Estudiante avanzado añade materias del semestre con drag & drop.

#### Samuel
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 4.1 | Endpoints: GET/POST/DELETE `/inscripciones` con validaciones | Fase 4, Paso 4.1 |
| 4.2 | GET `/perfiles/mi-pensum/materias-disponibles?semestre=...` | Fase 4, Paso 4.2 |

**Entregables:** APIs de inscripciones y materias disponibles.

---

#### Jeisi
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 4.3 | UI Drag & Drop: `@dnd-kit/core` o `react-beautiful-dnd` | Fase 4, Paso 4.3 |
| 4.3b | Dos columnas: disponibles vs inscritas | Fase 4, Paso 4.3 |
| 4.3c | Integración POST/DELETE con API | Fase 4, Paso 4.3 |

**Entregables:** Interfaz drag & drop funcional.

---

#### William
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 4.4 | Lógica/endpoint: alertas de semestres anteriores faltantes | Fase 4, Paso 4.4 |
| 4.4b | UI: mostrar alerta "Tienes materias pendientes de semestres anteriores..." | Fase 4, Paso 4.4 |

**Entregables:** Alertas visibles cuando faltan materias de semestres previos.

---

### SPRINT 6 — Plan de evaluación y evaluaciones (1–2 semanas)

**Objetivo:** Estudiante define porcentajes por materia y registra notas.

#### Samuel
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 5.1 | CRUD Plan de evaluación: endpoints por inscripción | Fase 5, Paso 5.1 |
| 5.2 | CRUD Evaluaciones: endpoints por plan | Fase 5, Paso 5.2 |

**Entregables:** APIs de planes y evaluaciones.

---

#### Jeisi
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 5.3 | Cálculo de nota definitiva: servicio que actualiza `InscripcionSemestre` | Fase 5, Paso 5.3 |
| 5.4 | Integración Supabase Storage para archivos en evaluaciones | Fase 5, Paso 5.4 |

**Entregables:** Nota definitiva calculada automáticamente, subida de archivos.

---

#### William
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 5.5 | UI: formularios para plan de evaluación (nombre, %, orden) | Fase 5 |
| 5.6 | UI: formularios para evaluaciones (fechaLimite, notas, archivos) | Fase 5 |

**Entregables:** Interfaz para gestionar planes y evaluaciones.

---

### SPRINT 7 — Dashboard Pensum y Semestre (1–2 semanas)

**Objetivo:** Árbol visual del pensum y vista del semestre actual con calendario.

#### Samuel
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 6.1 | GET `/perfiles/mi-pensum` con materias, estado, notas, prerrequisitos | Fase 6, Paso 6.1 |

**Entregables:** API que alimenta el árbol visual.

---

#### Jeisi
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 6.2 | Componente árbol de materias (colores por estado) | Fase 6, Paso 6.2 |
| 7.1 | Vista materias del semestre actual | Fase 7, Paso 7.1 |

**Entregables:** Árbol visual y lista de materias del semestre.

---

#### William
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 7.2 | Calendario de evaluaciones (FullCalendar, react-big-calendar o custom) | Fase 7, Paso 7.2 |
| 7.3 | Modal de evaluación (observación, nota esperada, nota real) | Fase 7, Paso 7.3 |

**Entregables:** Calendario con eventos y modal para registrar notas.

---

### SPRINT 8 — Dashboard Materia y métricas (≈1 semana)

**Objetivo:** Vista detallada por materia con plan, notas y balance métrico.

#### Samuel
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 8.1a | Endpoint detalle de inscripción/materia con plan y evaluaciones | Fase 8, Paso 8.1 |

**Entregables:** API para la página de detalle de materia.

---

#### Jeisi
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 8.2a | Lógica de balance métrico: "X% del plan evaluado", "Nota parcial: Y" | Fase 8, Paso 8.2 |

**Entregables:** Cálculos de métricas reutilizables (backend o servicio frontend).

---

#### William
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 8.1b | Página `/dashboard/materias/:inscripcionId` con plan y evaluaciones | Fase 8, Paso 8.1 |
| 8.2b | UI: barra/indicador de balance métrico en tiempo real | Fase 8, Paso 8.2 |

**Entregables:** Página de detalle de materia con métricas visuales.

---

### SPRINT 9 — Eventos, landing y pulido (variable)

**Objetivo:** Eventos manuales, landing, registro/login UI, tests y corrección de bugs.

#### Samuel
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 9.1 | CRUD Eventos calendario: GET/POST/PATCH/DELETE `/eventos` | Fase 9, Paso 9.1 |

**Entregables:** API de eventos manuales para el calendario.

---

#### Jeisi
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 9.2 | Landing: navbar, logo, hero, botón registro | Fase 9, Paso 9.2 |
| 9.2b | UI Registro: nombre, email, contraseña, tipo ingreso | Fase 9, Paso 9.2 |
| 9.2c | UI Login: email, contraseña | Fase 9, Paso 9.2 |

**Entregables:** Landing y flujo de registro/login completos.

---

#### William
| Paso | Tarea | Referencia Plan |
|------|-------|-----------------|
| 9.3 | Tests unitarios (cálculo nota, validación prerrequisitos) | Fase 9, Paso 9.3 |
| 9.3b | Tests e2e en flujos principales | Fase 9, Paso 9.3 |
| 9.3c | Revisión de edge cases y corrección de bugs | Fase 9, Paso 9.3 |

**Entregables:** Suite de tests y bugs corregidos.

---

## 4. Dependencias entre sprints

```
Sprint 1 (Fundamentos) ─────────────────────────────────────────┐
    ↓                                                             │
Sprint 2 (Admin) ────────────────────────────────────────────────┤
    ↓                                                             │
Sprint 3 (Aprobación) ───────────────────────────────────────────┤
    ↓                                                             │
Sprint 4 (Perfil) ────────────────────────────────────────────────┤
    ↓                                                             │
Sprint 5 (Inscripciones) ─────────────────────────────────────────┤
    ↓                                                             │
Sprint 6 (Plan evaluación) ──────────────────────────────────────┤
    ↓                                                             │
Sprint 7 (Dashboard Pensum + Semestre) ←── pueden avanzar en paralelo
Sprint 8 (Dashboard Materia + Métricas) ───────────────────────────┤
    ↓                                                             │
Sprint 9 (Pulido) ────────────────────────────────────────────────┘
```

---

## 5. Criterios de Definition of Done (DoD)

Para considerar una tarea completada:

- [ ] Código en rama compartida (main/develop)
- [ ] Sin errores de linter
- [ ] Probado manualmente o con tests
- [ ] Documentación mínima si aplica (comentarios, README)
- [ ] Revisado por al menos otro miembro del equipo (opcional en sprints tempranos)

---

## 6. Ceremonias sugeridas

| Ceremonia | Frecuencia | Duración | Responsable |
|-----------|------------|----------|-------------|
| Sprint Planning | Inicio de sprint | 1–2 h | Rotativo |
| Daily Standup | Diario | 15 min | Rotativo |
| Sprint Review | Fin de sprint | 1 h | Rotativo |
| Retrospectiva | Fin de sprint | 30 min | Rotativo |
| Refinamiento backlog | Mitad de sprint | 30 min | Opcional |

---

## 7. Referencias

- [GRADUM - Plan de Implementacion](./GRADUM%20-%20Plan%20de%20Implementacion.md)
- [MVP - Gradum v1 (breve)](./MVP%20-%20Gradum%20v1%20(breve).md)
- [GRADUM - Modelo de datos](./GRADUM%20-%20Modelo%20de%20datos%20-%20Entidades%20y%20Relaciones.md)
