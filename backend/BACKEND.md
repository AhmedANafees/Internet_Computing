# Course Registration Dashboard - Backend

Backend server for the CP476 Course Registration Dashboard. Built with Node.js,
Express, and MySQL. This service exposes a REST API that the React frontend
consumes for authentication, the course catalog, planning, registration, and
admin course management.

## Tech stack

- Node.js (version 18 or newer)
- Express 4 for the HTTP layer
- MySQL 8 with the mysql2 driver (promise based, connection pooled)
- bcryptjs for password hashing
- A normalized `Accounts` supertype with `Students` and `Administrators`
  profile tables, and database backed sessions in `UserSessions`
- Jest and supertest for tests

## Prerequisites

Install these before running the project:

1. Node.js 18+ and npm (https://nodejs.org)
2. MySQL Server 8 (https://dev.mysql.com/downloads/mysql/) and a user that can
   create databases

Confirm they are installed:

```bash
node --version
npm --version
mysql --version
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file and fill in your MySQL credentials
cp .env.example .env
#   On Windows PowerShell:  Copy-Item .env.example .env

# 3. Create the database and tables
npm run db:init

# 4. (Optional) Load sample data for development
npm run db:seed

# 5. Start the server
npm run dev      # development, restarts on file changes
npm start        # plain start
```

Once running, check it is alive:

- `GET http://localhost:3000/` returns basic API info
- `GET http://localhost:3000/health` returns the database connection status

`npm run db:seed` loads a sample dataset across three terms (a past term with
completed courses, the current open-registration term, and a future term):
faculties, departments, programs, ~14 courses with prerequisites and an
antirequisite, ~21 sections, five students with academic history and current
registrations, an active hold, degree requirements, plans, and saved filters.

Logins (students share one password, admins another):

```
students: teststudent@example.edu, aanderson@example.edu, bbrown@example.edu,
          cclark@example.edu, ddavis@example.edu                 password: Password123!
admins:   admin@example.edu, registrar@example.edu               password: Admin123!
```

Some scenarios baked into the data: `CP312` (Fall) is full so registering it
waitlists; `bstudent` has an active hold that blocks registration; and several
students have completed prerequisites so eligibility checks have something to
work against.

To create an additional administrator at any time:

```bash
npm run admin:create -- <email> <password> [firstName] [lastName]
```

## Environment variables

See `.env.example` for the full list. The important ones are the `DB_*` MySQL
connection settings, `PORT`, and `CORS_ORIGIN` (set this to the frontend dev
server URL). Never commit your real `.env`.

## Project structure

```
src/
  config/        Centralized config loaded from environment variables
  db/            MySQL pool, query and transaction helpers, schema.sql
  middleware/    authenticate, authorize, requestLogger, notFound, errorHandler
  repositories/  Data access (SQL) per entity, built on the db helpers
  services/      Business rules; call repositories and registrationService
  controllers/   Request handlers (validate input, call services, shape JSON)
  routes/        Express routers (map paths to controllers, attach middleware)
  utils/         ApiError, asyncHandler, logger, validate, access
  app.js         Express app assembly (middleware, routes, error handling)
  server.js      Entry point (startup, DB check, graceful shutdown)
scripts/
  init-db.js     Creates the database and tables from schema.sql
  seed.js        Inserts sample development data
  create-admin.js  Creates an administrator account
tests/
  unit/          Pure unit tests (no database)
  integration/   API tests against a seeded database
```

## Architecture

Requests flow through clear layers, each with one job:

```
route  ->  controller  ->  service  ->  repository  ->  db helpers  ->  MySQL
```

- Routes map an HTTP method and path to a controller and attach middleware.
- Controllers translate between HTTP and services and never touch the database.
- Services hold the business rules (eligibility, ownership, validation).
- Repositories own the SQL for one entity, built on the `src/db` helpers.
- `src/db` runs parameterized queries and transactions against the pool.

Simple entities reuse factories (`baseRepository`, `crudService`,
`crudController`) so each entity file stays small; complex ones (courses,
sections, enrollments, plans, students) add their own queries and rules.

All database access uses parameterized queries (the `?` placeholders) so the
code is safe from SQL injection. Use `db.withTransaction` for any operation
that writes to more than one table and must succeed or fail as a unit, such as
enrolling a student and incrementing `enrolled_count`.

## Authentication and roles

Authentication uses opaque session tokens stored server side in `UserSessions`.
The flow:

1. The login controller verifies credentials with `authService`, then calls
   `sessionService.createSession` to issue a token.
2. The client sends the token on later requests as
   `Authorization: Bearer <token>`.
3. The `authenticate` middleware validates the token, attaches `req.user`, and
   extends the session expiry. Sessions expire after 30 minutes of inactivity
   (configurable via `SESSION_INACTIVITY_MINUTES`), per user story US-01.

`req.user` is `{ accountId, role, email, firstName, lastName, studentId, adminId }`. A role is
**derived**, not stored: an account is an `admin` when an `Administrators` row
references it, otherwise a `student` when a `Students` row does. This keeps the
schema normalized (no role column that could disagree with the profile tables).

Guard admin only routes (US-13, US-14, US-25) by combining the two middlewares:

```js
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.post('/courses', authenticate, authorize('admin'), courseController.create);
```

## API reference

Base path: `/api`. All responses are JSON. Success responses are wrapped as
`{ "data": ... }`; errors as `{ "error": { "message", "code", "details" } }`.
Send the session token from login as `Authorization: Bearer <token>`.

Access levels below: **public** (no token), **auth** (any signed in user),
**self/admin** (the owning student or an admin), **admin** (admin only).

### Auth
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/auth/login` | public | body `{ email, password }`; returns `{ token, expiresAt, user }` |
| POST | `/auth/logout` | auth | revokes the current session |
| GET | `/auth/me` | auth | the current user context |

### Catalog (browsing is public; writes are admin)
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/courses` | public | filters: `q`, `level`, `departmentId`, `facultyId`, `limit`, `offset` |
| GET | `/courses/:id` | public | detail with prerequisites, antirequisites, and co-requisites |
| POST/PUT/DELETE | `/courses[/:id]` | admin | manage courses |
| GET | `/courses/:id/{prerequisites,corequisites,antirequisites}` | public | list a course's relationships |
| POST | `/courses/:id/{prerequisites,corequisites,antirequisites}` | admin | body `{ targetCourseId }` |
| DELETE | `/courses/:id/{prerequisites,corequisites,antirequisites}/:targetId` | admin | remove a relationship |
| GET | `/sections` | public | filters: `q`, `courseId`, `termId`, `level`, `facultyId`, `departmentId`, `parentCrn`, `timeBand` (morning/afternoon/evening), `availableOnly`. Each row carries `crn`, credits, subject, campus, seats, and `meeting_times` |
| GET | `/sections/:crn` | public | detail with schedule, seats remaining, and linked labs |
| GET | `/sections/:crn/seats` | public | seat counts |
| GET | `/sections/:crn/students` | admin | section roster |
| POST/PUT/DELETE | `/sections[/:crn]` | admin | manage sections |
| GET | `/departments`, `/departments/:id`, `/departments/:id/courses` | public | |
| GET | `/programs`, `/programs/:id`, `/programs/:id/courses` | public | required courses |
| GET | `/instructors`, `/instructors/:id`, `/instructors/:id/sections` | public | |
| GET | `/terms`, `/faculties`, `/faculties/:id/departments`, `/rooms`, `/schedules`, `/schedules/section/:crn` | public | writes admin |

### Students (self or admin)
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/students` | admin | list |
| GET | `/students/:id` | self/admin | profile |
| GET | `/students/:id/schedule` | self/admin | weekly meetings of registered sections |
| GET | `/students/:id/enrollments` | self/admin | enrollment history |
| GET | `/students/:id/waitlist` | self/admin | waitlist entries |
| GET | `/students/:id/degree-progress` | self/admin | completed vs required per requirement |
| GET | `/students/:id/conflicts?crn=` | self/admin | whether a section conflicts with the student's schedule |
| POST/PUT/DELETE | `/students[/:id]` | admin | manage students |

### Registration and waitlists
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/enrollments` | auth | body `{ crn }`; registers the signed in student |
| DELETE | `/enrollments/:id` | self/admin | drop |
| POST | `/enrollments/:id/switch` | self/admin | body `{ toCrn }`; swap |
| GET | `/enrollments` | admin | all enrollments |
| GET | `/enrollments/:id` | self/admin | one enrollment |
| PUT | `/enrollments/:id` | admin | set grade or status |
| POST | `/waitlists` | auth | body `{ crn }` |
| DELETE | `/waitlists/:id` | self/admin | leave the waitlist |

Registration actions return `{ result: "registered" | "waitlisted" | "failed", reason? }`.
A `failed` result responds with HTTP 409 and a reason such as `Prerequisite not met`,
`Time conflict`, `Active hold on account`, or `Already registered in this course`.

### Course plans (student only)
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/plans`, `/plans/:id` | student | |
| POST | `/plans` | student | body `{ planName? }` |
| POST | `/plans/:id/items` | student | body `{ crn }` |
| DELETE | `/plans/:id/items/:crn` | student | |
| POST | `/plans/:id/submit` | student | registers every section in the plan (US-07) |

## Registration rules

`registrationService` implements the registration logic so controllers stay
thin:

- Time conflict detection across a plan and against current registrations
  (US-06, US-18).
- `registerPlan` attempts each section in order and returns a per section
  result of `registered`, `waitlisted`, or `failed` with a reason (US-07).
- Eligibility checks: active holds, duplicate course, prerequisites (US-17),
  and antirequisites.
- Seat handling with row locking inside a transaction, waitlisting a full
  section (US-19).
- `dropSection` and `swapSection`, each writing an audit entry (US-08).

## Data model note

The schema has evolved from the original milestone design to match the
front-end needs, so re-run `npm run db:init` if you initialized from an earlier
version (there is no production data yet). Changes, all worth flagging to the
data modeling lead:

- Auth was normalized into an `Accounts` supertype with `Students` and
  `Administrators` profile tables (login is by email, stored once on `Accounts`).
- `CourseSections` is keyed by `crn` (the course reference number students
  register with), and `parent_crn` links a lab or tutorial to its lecture.
- `Rooms` gained a `campus`, and a `Corequisites` table was added alongside
  `Prerequisites` and `Antirequisites`.

Still open for a later iteration: a per-class-instance status model for the
timetable (marking a single date cancelled or moved to remote).

## Security

- **Passwords are hashed, never stored or returned in readable form.** Account
  passwords go through bcrypt (salted, one-way) in `authService.hashPassword` and
  are only ever checked with `bcrypt.compare`. The database holds the hash in
  `Accounts.password_hash`; the plaintext is never persisted, logged, or included
  in any API response. Passwords are hashed rather than reversibly encrypted on
  purpose, which is the recommended practice for credentials: a full database
  dump still does not reveal them. The cost factor is tunable via
  `BCRYPT_SALT_ROUNDS`.
- **SQL injection:** every query is parameterized through the `db` helpers; user
  input is never concatenated into SQL.
- **Sessions:** opaque random tokens stored server side in `UserSessions`, with a
  30 minute inactivity expiry and revocation on logout.
- **Secrets:** database credentials live only in `.env`, which is gitignored.

### Encryption at rest

Hashing protects the credentials themselves. To encrypt the entire datastore on
disk (every table, not just passwords), enable encryption at the database or
operating system level. This is a deployment setting, not application code, so it
is intentionally not baked into `schema.sql`:

- **MySQL InnoDB encryption (TDE):** configure a keyring component, then set
  `default_table_encryption=ON` or create tables with `ENCRYPTION='Y'`.
- **Full disk encryption:** BitLocker (Windows) or LUKS/FileVault, which
  transparently encrypts the MySQL data directory.

## Testing

```bash
npm test                 # unit tests, no database required
npm run test:integration # API tests against a seeded database
```

Unit tests (`tests/unit`) cover app wiring, the role guard, and the time
conflict logic with no database. The integration suite (`tests/integration`)
drives the real endpoints with supertest and expects a seeded database, so run
`npm run db:init && npm run db:seed` first. Point integration tests at a
dedicated database, not data you care about, since they create and drop records.
