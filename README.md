# 🚀 InternTrack

A full-stack web application for managing and monitoring interns. The system allows interns to submit daily work updates while Tech Leads and Managers can review progress, provide feedback, and track performance through a centralized dashboard.

---

## 📸 Screenshots

### Login Page
![Login](./screenshots/login.png)

### Dashboard
![Dashboard](./screenshots/dashboard.png)

### Intern Management
![Interns](./screenshots/interns.png)

### Tech Lead Dashboard
![Tech Lead](./screenshots/tech-lead.png)

### Reports & Analytics
![Reports](./screenshots/reports.png)

---

## ✨ Features

- 👨‍🎓 Intern Management
- 👨‍💼 Role-Based Access (Intern, Tech Lead, Manager, Super Admin)
- 📝 Daily Work Log Submission
- 📊 Performance Tracking
- 💬 Feedback & Review System
- 📅 Attendance Monitoring
- 📈 Dashboard & Analytics
- 🔐 Custom Username/Password Authentication (bcryptjs + signed JWT session cookies)
- 🗄️ PostgreSQL Database (Prisma ORM)

---

## 🛠️ Tech Stack

### Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS v4
- Lucide React Icons
- Motion (Framer Motion)

### Backend

- Next.js API Routes
- Prisma ORM
- PostgreSQL (Supabase-hosted)
- bcryptjs (password hashing) + jsonwebtoken (JWT session signing)

---

## 📂 Project Structure

```
app/
  api/           → Next.js API routes
  dashboard/     → Main dashboard layout
  login/         → Login page
  superadmin/    → Super admin pages
  projects/      → Projects view
  discussions/   → Q&A discussions
  manager/       → Manager view
  team/          → Team view
src/
  components/    → Reusable UI components
  views/         → Role-specific views
  context/       → Auth & Theme context
  lib/           → Supabase clients, logger
  services/      → API service layer
  types.ts       → TypeScript interfaces
prisma/
  schema.prisma  → Database schema
  migrations/    → Migration files
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (with project created)
- PostgreSQL database (Supabase provides this)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/intern-monitor-app.git
cd intern-monitor-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string (Supabase project)
- `DIRECT_URL` - Direct PostgreSQL connection string (for Prisma migrations)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` - Required only if you use Supabase Storage uploads or Realtime subscriptions (optional for auth).
- `SESSION_SECRET` - Secret used to sign session JWT cookies. Generate a strong value with `openssl rand -base64 48`.
- `SESSION_MAX_AGE` - Session cookie lifetime in seconds (default `28800` = 8h).
- `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` - Used once to bootstrap the initial Super Admin account.

### 4. Set up the database

Run Prisma migrations to create/update tables:

```bash
npx prisma migrate dev
```

> If the database already exists and only the auth schema changed, apply the
> new migration manually in the Supabase SQL editor or run `npx prisma db push`.

Generate the Prisma client:

```bash
npx prisma generate
```

### 5. Bootstrap the first Super Admin

Registration is admin-only, so create the initial Super Admin with the provided
script (run once). It reads `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` from `.env`:

```bash
npx tsx scripts/bootstrap-superadmin.ts
```

The bootstrap username is derived from the email local part (e.g. `superadmin`).
Sign in at `/login` with that username and the password from your environment.
You will be prompted to change the password on first sign-in.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Authentication

This project uses **custom username/password authentication** with hashed
passwords and signed JWT session cookies. There is no Supabase Auth dependency.

- Passwords are hashed with **bcryptjs** (cost factor 12) and stored in the
  Prisma `User.passwordHash` column.
- On successful login, a signed JWT (`userId`, `role`, `mustChangePassword`)
  is written to an **HttpOnly, SameSite=Strict** cookie named `session`.
- `withAuth` middleware guard verifies the cookie on every protected API route
  and looks the user up in the database (checking `isActive`).
- Login is by **username** (auto-generated per-user), not email.

### Creating Users

Only **Super Admin** and **Manager** roles can create users (admin-only). When a
user is created, the backend **auto-generates a unique username** and a random
16-character password and returns them **once** so the creator can share them
securely. New users have `mustChangePassword = true` and must set a new password
on their first sign-in, after which the session cookie is re-issued.

- Super Admin creates Managers and Tech Leads via the Super Admin dashboard.
- Managers create Interns (and assign a reporting Tech Lead) via their
  User Management view.

### First User Setup

Bootstrap the first Super Admin (see step 5 above) with the env-provided
credentials, then sign in and create additional users from the dashboard.

---

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

---

## 🔮 Future Improvements

- Email Notifications
- Real-Time Updates (Supabase Realtime subscriptions)
- File Uploads (Supabase Storage for daily-log screenshots)
- Chat System
- Mobile Responsive UI
- Password Strength Feedback on First Login
- AI Performance Insights (Gemini)

---

## 👨‍💻 Author

**Shehan Samuditha**

- GitHub: https://github.com/devsamuditha
- LinkedIn: *(Add your LinkedIn profile here)*

---

## 📄 License

This project is licensed under the MIT License.
