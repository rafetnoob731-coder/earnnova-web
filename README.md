# 🚀 EARNNOVA Next.js (2026 Modern Stack)

Premium earning platform built with the modern 2026 stack.

## 🏗️ Stack

| Layer | Technology |
|-------|-----------|
| **Language** | TypeScript (strict) |
| **Framework** | Next.js 15 (App Router) |
| **Styling** | Tailwind CSS v4 |
| **Animations** | Motion (ex-Framer Motion) |
| **Backend** | Supabase (PostgreSQL) |
| **Auth** | Better Auth |
| **ORM** | Drizzle |
| **Data Fetch** | TanStack Query |
| **Validation** | Zod |
| **Notifications** | Sonner |
| **Icons** | Lucide React |

## 📁 Structure

```
src/
├── app/
│   ├── (auth)/           # Public routes (login, register)
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/      # Protected routes
│   │   ├── dashboard/    # Main dashboard
│   │   ├── earn/         # Watch ads
│   │   ├── withdraw/     # Cash out
│   │   ├── referrals/    # Refer friends
│   │   ├── history/      # Transaction log
│   │   ├── profile/      # User settings
│   │   ├── admin/        # Admin panel
│   │   └── layout.tsx    # Dashboard layout + navigation
│   ├── globals.css       # Design system
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Redirect to /login
├── components/
│   ├── providers.tsx     # TanStack Query + Sonner
├── lib/
│   ├── schema.ts         # Database types
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Helpers (cn, formatUSD, etc.)
└── middleware.ts          # Auth protection
```

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local .env
# Edit .env with your Supabase credentials

# 3. Run database migrations (via Drizzle)
npm run db:push

# 4. Start dev server
npm run dev

# 5. Open http://localhost:3000
```

## 🎯 Features

- ✅ **Glassmorphism UI** — Premium design with blur, depth, and gradients
- ✅ **Motion Animations** — Staggered entries, 3D tilts, page transitions
- ✅ **Responsive** — Mobile-first, sidebar on desktop, bottom nav on mobile
- ✅ **Dark Mode** — OLED-friendly Deep Navy palette
- ✅ **Type Safety** — Strict TypeScript throughout
- ✅ **Auth** — Better Auth session management
- ✅ **Dashboard** — Stats, progress bar, ads, transactions
- ✅ **Earn** — Watch ads with daily limit & cooldown
- ✅ **Withdraw** — 7 payment methods with dynamic forms
- ✅ **Referrals** — Code sharing, milestones, bonus tracking
- ✅ **History** — Filterable transaction log
- ✅ **Admin** — User/ad/withdrawal management
- ✅ **Performance** — TanStack Query caching, optimized builds
