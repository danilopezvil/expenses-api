# expenses-api

REST API de gestión de gastos compartidos. Arquitectura hexagonal (Ports & Adapters) sobre NestJS 10.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | NestJS 10 + TypeScript (strict) |
| ORM | Prisma 5 + PostgreSQL 16 |
| Auth | passport-jwt / @nestjs/jwt |
| Docs | Swagger UI en `/api/docs` (solo `development`) |
| Logger | nestjs-pino (pino-pretty en dev) |
| Rate limiting | @nestjs/throttler |
| Storage | MinIO (S3-compatible) |
| Cache | Redis 7 |
| Contenedores | Podman + podman-compose |

---

## Inicio rápido

```bash
# 1. Copiar variables de entorno
cp .env.example .env

# 2. Levantar infraestructura (Podman rootless)
podman-compose up -d

# 3. Instalar dependencias
npm install

# 4. Crear schema en la base de datos
npm run migrate

# 5. Poblar datos de ejemplo
npm run seed

# 6. Arrancar en modo desarrollo
npm run dev
```

> **Nota Podman:** el socket rootless está en `/run/user/$(id -u)/podman/podman.sock`.
> Si alguna herramienta (p. ej. Prisma Studio, scripts de CI) necesita el endpoint Docker-compatible:
> ```bash
> export DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock
> ```

La API queda disponible en `http://localhost:3000`.
Swagger UI en `http://localhost:3000/api/docs`.

---

## Estructura del proyecto

```
expenses-api/
├── prisma/
│   ├── schema.prisma          # Modelos: User, Group, GroupMember, Expense, ExpenseSplit
│   └── seed.ts                # Datos de ejemplo (3 usuarios + 1 grupo + 4 gastos)
│
└── src/
    ├── main.ts                # Bootstrap: Pino, ValidationPipe, Swagger, versionado URI
    ├── app.module.ts          # Raíz: Config, Throttler, Passport/JWT, PrismaModule
    │
    ├── shared/                # Kernel compartido — sin lógica de negocio
    │   ├── result/
    │   │   └── result.ts      # Result<T,E> = Ok<T> | Err<E>  (type predicates)
    │   ├── domain/
    │   │   ├── aggregate-root.ts   # addDomainEvent / pullDomainEvents
    │   │   ├── value-object.ts     # Base inmutable con equals()
    │   │   └── domain-event.ts     # Interface { eventType, occurredAt, payload }
    │   ├── errors/
    │   │   ├── domain.errors.ts    # DomainError → NotFound/Validation/Conflict/Forbidden
    │   │   ├── app.errors.ts       # Unauthorized, InternalError
    │   │   └── http-exception.filter.ts  # Mapeo error → HTTP status
    │   └── infrastructure/
    │       ├── prisma/             # PrismaService (@Global) con retry al arrancar
    │       ├── strategies/         # JwtStrategy (passport)
    │       ├── guards/             # JwtAuthGuard, GroupMemberGuard
    │       └── decorators/         # @CurrentUser()
    │
    └── modules/
        └── expenses/
            ├── domain/                        # Sin imports de NestJS / Prisma / libs externas
            │   ├── entities/
            │   │   ├── expense.entity.ts      # AggregateRoot — create/assign/void/classify
            │   │   └── assignment.entity.ts   # % de reparto por miembro
            │   ├── value-objects/
            │   │   ├── money.vo.ts            # MoneyValidationError, add, multiply, formatted
            │   │   ├── percentage.vo.ts       # (0,100], validateSum con tolerancia float
            │   │   └── import-hash.vo.ts      # SHA-256 de 64 chars hex (Node crypto)
            │   ├── ports/
            │   │   └── expense-repository.port.ts  # IExpenseRepository + ExpenseFilters
            │   ├── services/
            │   │   ├── text-import-parser.service.ts  # "DD/MM | desc | amount", coma decimal
            │   │   └── expense-grouper.service.ts     # merge con herencia de assignments
            │   ├── events/
            │   │   ├── expense-created.event.ts
            │   │   ├── expense-assigned.event.ts
            │   │   └── expense-imported.event.ts
            │   └── __tests__/                 # 49 tests — sin dependencias de framework
            │       ├── money.vo.spec.ts
            │       ├── percentage.vo.spec.ts
            │       ├── text-import-parser.spec.ts
            │       ├── expense-grouper.spec.ts
            │       └── expense.entity.spec.ts
            ├── application/
            │   ├── use-cases/      # Create/Get/Update/Delete — retornan Result<T,E>
            │   ├── queries/        # ListExpensesQuery (read model directo a Prisma)
            │   └── dtos/           # Interfaces de entrada/salida del use case (sin decoradores)
            ├── infrastructure/
            │   ├── persistence/    # ExpensePrismaRepository (implementa el puerto)
            │   └── mappers/        # ExpenseMapper: PrismaModel ↔ DomainEntity
            └── delivery/http/
                ├── dtos/           # DTOs HTTP con class-validator / Swagger
                ├── expenses.controller.ts
                └── expenses.module.ts   # Wiring DI: EXPENSE_REPOSITORY → ExpensePrismaRepository
```

---

## Arquitectura hexagonal

```
  ┌─────────────────────────────────────────────┐
  │                  delivery/http               │  ← adaptador de entrada
  │  Controller → DTO (class-validator/Swagger)  │
  └────────────────────┬────────────────────────┘
                       │ llama
  ┌────────────────────▼────────────────────────┐
  │              application/use-cases           │  ← orquestación
  │  UseCase → Domain + IRepository (port)       │
  │  Retorna Result<T, DomainError>              │
  └──────────┬──────────────────┬───────────────┘
             │                  │ inject
  ┌──────────▼──────┐  ┌────────▼───────────────┐
  │     domain/     │  │   infrastructure/       │  ← adaptador de salida
  │  Entities, VOs  │  │  PrismaRepository       │
  │  DomainServices │  │  Mapper (Prisma↔Domain) │
  │  DomainEvents   │  └────────────────────────┘
  └─────────────────┘
```

**Regla de dependencias:** las capas internas no conocen a las externas. El dominio no importa nada de NestJS, Prisma ni Express.

---

## Domain layer — reglas de la capa

- **Cero imports** de NestJS, Prisma o cualquier librería externa
- Las entidades usan **constructor privado** + factory estático `create()` que retorna `Result<T, E>`
- Los value objects son **inmutables** (props congelados en `ValueObject<T>`) y validan en el constructor
- Los domain services son **clases puras** sin decoradores
- Los errores de dominio son **typed** (`MoneyValidationError extends ValidationError`) para poder capturarlos específicamente en los use-cases

### Enums de Expense

| Enum | Valores |
|------|---------|
| `ExpenseSource` | `MANUAL`, `IMPORTED` |
| `ExpenseStatus` | `PENDING`, `IMPORTED`, `CLASSIFIED`, `VOIDED` |

### Flujo de estados

```
PENDING ──classify()──► CLASSIFIED
IMPORTED ─classify()──► CLASSIFIED
PENDING/IMPORTED/CLASSIFIED ──void()──► VOIDED  (irreversible)
```

### TextImportParserService — formato de línea

```
DD/MM | descripción | importe
15/03 | Supermercado | 85,50
```

- Separador: ` | ` (espacio-pipe-espacio)
- Fecha: `DD/MM` — el año se pasa como parámetro
- Importe: punto **o** coma como separador decimal
- Líneas vacías y que empiecen por `#` → ignoradas silenciosamente
- Errores de parseo → `ParseError[]`, nunca excepciones

## Pattern Result\<T, E\>

Los use-cases nunca lanzan excepciones de negocio — retornan `Result<T, DomainError>`:

```typescript
// use-case
const result = await this.expenseRepository.findById(id);
if (result.isErr()) return result;           // propaga el error
return ok(toResponseDto(result.value));      // happy path

// controller
const result = await this.createExpenseUseCase.execute(dto);
if (result.isErr()) throw result.error;      // HttpExceptionFilter lo convierte a HTTP
return result.value;
```

---

## Mapeo de errores → HTTP

| Clase de error | HTTP status |
|---------------|-------------|
| `NotFoundError` | 404 |
| `ValidationError` | 422 |
| `ConflictError` | 409 |
| `ForbiddenError` | 403 |
| `UnauthorizedError` | 401 |
| `DomainError` (genérico) | 400 |
| `HttpException` (NestJS) | el propio status |
| Cualquier otro | 500 |

---

## API endpoints

Todos bajo `/v1/` con autenticación `Bearer <JWT>`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/v1/expenses` | Crear gasto (acepta `splitBetween[]`) |
| `GET` | `/v1/expenses` | Listar con paginación y filtros |
| `GET` | `/v1/expenses/:id` | Obtener por ID |
| `PATCH` | `/v1/expenses/:id` | Actualizar (solo el owner) |
| `DELETE` | `/v1/expenses/:id` | Eliminar (solo el owner) |

Filtros disponibles en `GET /v1/expenses`: `page`, `limit`, `groupId`, `currency`, `paidById`.

---

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `NODE_ENV` | Entorno (`development`/`production`) | `development` |
| `PORT` | Puerto del servidor | `3000` |
| `DATABASE_URL` | Connection string PostgreSQL | — |
| `JWT_SECRET` | Clave secreta para firmar tokens | — |
| `JWT_EXPIRES_IN` | Duración del token | `7d` |
| `THROTTLE_TTL` | Ventana de rate limit (ms) | `60000` |
| `THROTTLE_LIMIT` | Máx requests por ventana | `100` |
| `REDIS_URL` | Redis connection string | — |
| `MINIO_*` | Configuración MinIO/S3 | ver `.env.example` |

---

## Scripts

```bash
npm run dev            # Arrancar en modo watch
npm run build          # Compilar a dist/
npm run migrate        # Crear/aplicar migraciones Prisma
npm run migrate:deploy # Aplicar migraciones en producción (sin generar)
npm run seed           # Poblar BD con datos de ejemplo
npm run prisma:studio  # Abrir Prisma Studio
npm run lint           # ESLint con autofix
npm run test           # Jest — todos los tests
npm run test:cov       # Jest con cobertura

# Solo domain layer (rápido, sin framework, < 10 s)
node_modules/.bin/jest --testPathPatterns=domain --no-coverage
```

---

## Datos de seed

Tras `npm run seed` quedan disponibles:

| Email | Contraseña |
|-------|-----------|
| alice@example.com | password123 |
| bob@example.com | password123 |
| carol@example.com | password123 |

Grupo creado: **Weekend Trip** con 4 gastos de ejemplo (food, transport, accommodation, health).

---

## Agregar un nuevo módulo

1. Crear la estructura en `src/modules/{nombre}/` con las 4 capas
2. Definir la entidad y value objects en `domain/entities/` y `domain/value-objects/`
3. Declarar el puerto en `domain/ports/` con un `Symbol` para DI
4. Implementar el repositorio en `infrastructure/persistence/`
5. Crear los use-cases en `application/use-cases/` retornando `Result<T, DomainError>`
6. Cablear todo en `delivery/http/{nombre}.module.ts` con `{ provide: PORT_SYMBOL, useClass: Adapter }`
7. Importar el módulo en `app.module.ts`
