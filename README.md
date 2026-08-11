# Calypso — Smart Campus Management Platform

Built for **DevFusion 4.0** hackathon.

A centralized platform for colleges to manage attendance, assignments, events, and role-based dashboards — replacing scattered WhatsApp groups and spreadsheets.

**Live app:** https://smart-campus-drab.vercel.app

---

## Features

- **Authentication** — Email/password and Google OAuth, role-based access (Student / Faculty / Coordinator / Admin)
- **Attendance** — Faculty create sessions and mark students present/absent; students view live percentage and history
- **Assignments** — Faculty create assignments with deadlines; students submit (file link or GitHub link) and get graded with marks + feedback; late submissions auto-flagged
- **Events** — Faculty/Coordinator/Admin create events; students register and receive a scannable QR ticket
- **Admin Dashboard** — Live stats and charts: user counts by role, attendance %, assignment/submission stats, event registrations
- **Security** — Password hashing (bcrypt), server-side Zod validation on every write, role-based route middleware, rate limiting on signup, audit logging for grading actions, security headers

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Neon), Drizzle ORM |
| Auth | NextAuth v5 (Google OAuth + Credentials) |
| Charts | Recharts |
| Deployment | Vercel |

---

## Local Setup

### 1. Clone and install
```bash
git clone https://github.com/insanityatpeak/smart-campus.git
cd smart-campus
pnpm install
```

### 2. Set up environment variables
Copy `.env.example` to `.env` and fill in real values:
```bash
cp .env.example .env
```

You'll need:
- A [Neon](https://neon.tech) Postgres database (free tier works) → copy the pooled connection string
- A Google OAuth Client ID/Secret from [Google Cloud Console](https://console.cloud.google.com) (see below)
- A generated `AUTH_SECRET`:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

### 3. Google OAuth setup
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Configure the OAuth consent screen (External, add app name)
3. Create an OAuth Client ID (Web application)
4. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy the Client ID and Secret into `.env`

### 4. Push the database schema
```bash
npx drizzle-kit push
```
This creates all tables in your Neon database directly (no migration files).

### 5. Run the dev server
```bash
pnpm dev
```
Visit `http://localhost:3000`.

---

## Database Schema

See `db/schema.ts` for the full Drizzle schema. Core tables:

- `users`, `departments` — accounts and org structure
- `accounts`, `sessions`, `verification_tokens` — required by NextAuth's adapter for OAuth
- `attendance_sessions`, `attendance_records` — attendance module
- `assignments`, `submissions` — assignments module
- `events`, `event_registrations` — events module
- `notifications`, `activity_logs` — notifications and audit trail

An ER diagram is included at `docs/er-diagram.png`.

---

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Student | tanmay@gmail.com | (set during signup) |
| Faculty | (promote a test account via Neon SQL editor) | — |
| Admin | (promote a test account via Neon SQL editor) | — |

To promote a user to a different role, run this in Neon's SQL editor:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-test-email@example.com';
```

---

## API Overview

All routes live under `app/api/`. Every write endpoint validates input with Zod and checks the caller's session role before touching the database.

| Route | Methods | Purpose |
|---|---|---|
| `/api/signup` | POST | Create a new account (rate-limited) |
| `/api/auth/[...nextauth]` | GET, POST | NextAuth handlers (login, OAuth, session) |
| `/api/attendance/sessions` | GET, POST | List/create attendance sessions (faculty) |
| `/api/attendance/records` | GET, POST | Mark attendance / view own history |
| `/api/assignments` | GET, POST | List/create assignments |
| `/api/submissions` | GET, POST, PATCH | Submit, list, and grade submissions |
| `/api/events` | GET, POST | List/create events |
| `/api/events/register` | GET, POST, PATCH | Register/cancel event registration |
| `/api/admin/stats` | GET | Aggregate stats for admin dashboard |
| `/api/users/students` | GET | List all students (faculty use, for attendance marking) |

---

## Known Limitations / Cut for Time

- Email verification/OTP on signup was deprioritized in favor of core modules
- File uploads use pasted URLs (Google Drive / GitHub links) rather than direct file storage — no S3/R2 integration
- Placements and Club Activities modules were out of scope for this build
- QR codes are generated via a public third-party API (api.qrserver.com), not self-hosted

---

## License

MIT — see `LICENSE`.
