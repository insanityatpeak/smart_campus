# Calypso — Smart Campus Management Platform

**Problem Statement Chosen:** Problem Statement 1 — Smart Campus Management Platform

**Team:** Priyanshu Rawat (Solo)

**Live Deployment:** https://smart-campus-drab.vercel.app

---

## What This App Does

Calypso is a centralized platform for colleges to replace scattered WhatsApp groups and spreadsheets with one system. Students, faculty, and admins each get a dedicated dashboard to manage attendance, assignments, and events — all backed by a shared database with role-based access control.

Core flows implemented:
- Faculty create attendance sessions and mark students present/absent; students see live attendance percentage and history
- Faculty create assignments with deadlines; students submit via file/GitHub link; faculty grade with marks and feedback; late submissions are auto-flagged
- Faculty/Admin/Coordinator create events; students register and receive a scannable QR ticket
- Admin gets a live analytics dashboard (user counts, attendance %, assignment stats, event registrations) with charts

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes (same deployment as frontend — no separate backend server) |
| **Database** | PostgreSQL, hosted on Neon (serverless Postgres) |
| **ORM** | Drizzle ORM |
| **Auth** | NextAuth v5 — Google OAuth + Email/Password (Credentials provider), bcrypt password hashing |
| **Charts** | Recharts |
| **QR Generation** | api.qrserver.com (public QR code API) |
| **Deployment** | Vercel (frontend + backend API routes both deployed here — single unified deployment) |

---

## Features Built

- **Authentication** — Signup, login, logout, Google OAuth, email/password, role selection (Student/Faculty)
- **Role-based access control** — Middleware (`proxy.ts`) protects all dashboard routes; wrong-role access redirects to the correct dashboard instead of erroring
- **Attendance module** — Faculty create sessions, mark students present/absent; students view real-time percentage + full history
- **Assignments module** — Faculty create assignments with deadlines; students submit (file URL or GitHub link) and resubmit; faculty grade with marks + written feedback; late submissions auto-detected against the deadline
- **Events module** — Faculty/Admin/Coordinator create events; students register/cancel; registered students get a scannable QR ticket generated on the spot
- **Admin dashboard** — Live stats (total users by role, attendance %, assignment/submission counts, event registrations) rendered as pie and bar charts from real database queries
- **Landing page** — Hero, stats bar, feature grid, FAQ, footer, responsive nav
- **Security hardening** — Password hashing (bcrypt), Zod schema validation on every write endpoint, rate limiting on signup (5 attempts/min per IP), security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy), audit logging of grading actions to an `activity_logs` table

---

## Local Setup Instructions

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
- A [Neon](https://neon.tech) Postgres database (free tier) → copy the pooled connection string
- A Google OAuth Client ID/Secret from [Google Cloud Console](https://console.cloud.google.com)
- A generated `AUTH_SECRET`:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

### 3. Google OAuth setup
1. Google Cloud Console → APIs & Services → Credentials
2. Configure the OAuth consent screen (External, add app name)
3. Create an OAuth Client ID (Web application)
4. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy the Client ID and Secret into `.env`

### 4. Push the database schema
```bash
npx drizzle-kit push
```
This creates all tables directly in your Neon database (no migration files).

### 5. Run the dev server
```bash
pnpm dev
```
Visit `http://localhost:3000`.

---

## Test Credentials

Login is required to access all dashboard features. Use these accounts to explore the live deployment:

| Role | Email | Password |
|---|---|---|
| Student | `student@calypso.test` | *(see submission notes)* |
| Faculty | `faculty@calypso.test` | *(see submission notes)* |
| Admin | `admin@calypso.test` | *(see submission notes)* |

> No payment integration is used in this project — sandbox payment credentials are not applicable.

---

## Database Schema

Full schema in `db/schema.ts`. Core tables: `users`, `departments`, `accounts`/`sessions`/`verification_tokens` (NextAuth adapter), `attendance_sessions`, `attendance_records`, `assignments`, `submissions`, `events`, `event_registrations`, `notifications`, `activity_logs`.

ER diagram: `docs/er-diagram.pdf`
Architecture diagram: `docs/architecture-diagram.png`

---

## API Overview

All routes under `app/api/`. Every write endpoint validates input with Zod and checks the caller's session role before touching the database.

| Route | Methods | Purpose |
|---|---|---|
| `/api/signup` | POST | Create account (rate-limited) |
| `/api/auth/[...nextauth]` | GET, POST | NextAuth handlers |
| `/api/attendance/sessions` | GET, POST | List/create attendance sessions |
| `/api/attendance/records` | GET, POST | Mark attendance / view history |
| `/api/assignments` | GET, POST | List/create assignments |
| `/api/submissions` | GET, POST, PATCH | Submit, list, grade submissions |
| `/api/events` | GET, POST | List/create events |
| `/api/events/register` | GET, POST, PATCH | Register/cancel event registration |
| `/api/admin/stats` | GET | Aggregate stats for admin dashboard |
| `/api/users/students` | GET | List students (used for attendance marking) |

---

## Known Bugs / Limitations

- Email verification/OTP on signup was not implemented — deprioritized in favor of the core attendance/assignments/events modules
- File "uploads" are pasted URLs (Google Drive / GitHub links), not real file storage — no S3/R2 integration
- Placements and Club Activities modules from the spec were not built — out of scope given time constraints
- QR codes are generated via a public third-party API rather than self-hosted generation
- No dark/light mode toggle — the app is dark-theme only
- No dedicated Coordinator dashboard yet — the role exists and is protected by middleware, but has no unique UI beyond what Faculty sees
- Notifications table exists in the schema but is not yet wired up to any UI — no in-app notification bell yet

---

## License

MIT — see `LICENSE`.