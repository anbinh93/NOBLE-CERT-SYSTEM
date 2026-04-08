---
name: noble-cert-patterns
description: Coding patterns extracted from noble-cert-system repository - a full-stack language academy platform
version: 1.0.0
source: local-git-analysis
analyzed_commits: 17
---

# Noble Cert System Patterns

## Project Overview

Full-stack language academy platform (Noble Language Academy) with three applications in a pnpm monorepo:
- **frontend/** — Next.js 16 (App Router, React 19, Tailwind CSS 4, shadcn/ui)
- **admin-frontend/** — Next.js admin dashboard (same stack)
- **backend/** — Express + Prisma + TypeScript API server

## Commit Conventions

Uses **conventional commits** with bracketed type prefix:
- `[feat]: description` — New features
- `[fix]: description` — Bug fixes
- `ci: description` — CI/CD changes (no brackets)

Commit messages are short and in English or mixed Vietnamese/English.

## Code Architecture

### Frontend (Next.js App Router)

```
frontend/
├── app/
│   ├── (public)/          # Public pages (landing, blog, courses, verify)
│   ├── (student)/         # Protected student routes (unused grouping)
│   ├── student/           # Student dashboard, settings, certificates, learning
│   └── api/               # API routes (og, auth, notifications)
├── components/
│   ├── landing/           # Homepage section components
│   ├── layout/            # Header, Footer, Sidebar
│   ├── ui/                # shadcn/ui primitives + custom components
│   ├── course/            # Course display components
│   ├── certificate/       # Certificate rendering (html2canvas + jspdf)
│   ├── learning/          # LMS learning interface components
│   └── auth/              # Auth-related components
├── lib/                   # Utilities (i18n, auth config, utils)
├── locales/               # Translation files (vi.ts, en.ts)
├── services/              # API service layer (blog.service.ts)
└── public/                # Static assets (logo.webp, partners/)
```

### Backend (Express + Prisma)

```
backend/src/
├── controllers/           # Route handlers (admin, auth, public, attendance)
├── routes/                # Express route definitions
├── services/              # Business logic (auth, certificate, email, payment, post)
├── middlewares/            # Auth middleware
├── config/                # Database config
├── utils/                 # Seed scripts, utilities
└── __tests__/             # Test files
```

### Admin Frontend

```
admin-frontend/src/
├── app/
│   ├── (dashboard)/       # Dashboard pages (courses, users, certificates, posts, billing, settings)
│   ├── login/             # Admin auth
│   └── forgot-password/
├── components/
│   ├── layout/            # Admin sidebar, header, nav-config
│   └── ui/                # shadcn/ui components
├── lib/                   # Auth storage, utilities
└── middleware.ts           # Edge auth middleware
```

## Key Patterns

### Route Groups for Layout Control
Public pages use `(public)/` route group. Student pages under `student/`. Admin uses `(dashboard)/`.

### Server Components by Default
Homepage (`page.tsx`) is a server component that fetches data directly:
```typescript
export const dynamic = "force-dynamic";
async function getCourses() {
  const res = await fetch(`${apiUrl}/api/public/courses`, { cache: 'no-store' });
  return data;
}
export default async function LandingPage() { ... }
```

### Client Components with "use client"
Interactive components (header, language switcher, carousels) use `"use client"` directive at the top.

### Service Layer Pattern
API calls are encapsulated in service files with fallback data:
```typescript
// services/blog.service.ts
export const BlogService = {
  async getLatestPosts(limit = 6): Promise<PostPublic[]> {
    try { /* fetch from API */ }
    catch { return FALLBACK_POSTS.slice(0, limit); }
  },
};
```

### Custom i18n (No Library)
Lightweight React Context-based i18n with lazy-loaded locale files:
- Provider: `I18nProvider` in `lib/i18n.tsx`
- Hook: `useI18n()` returns `{ locale, setLocale, t }`
- Storage: localStorage (`noble-cert-locale`)
- Locales: Vietnamese (default) + English

### Theme System
- Tailwind CSS 4 with CSS variables in `globals.css`
- `@theme` directive for design tokens
- Light/dark mode via `next-themes`
- Color scheme: Green (#031d16) + Gold (#d4af37)

### Font System
- Sans: Be Vietnam Pro (body text, UI)
- Serif: Merriweather (headings, brand)
- Applied via CSS variables `--font-sans` and `--font-serif`

### shadcn/ui Components
New York style, Lucide icons. Components in `components/ui/`. Config in `components.json`.

## Workflows

### Adding a New Homepage Section
1. Create component in `components/landing/SectionName.tsx`
2. Import in `app/(public)/page.tsx`
3. Place in the section order within the JSX

### Adding a New Locale Key
1. Add key to `locales/vi.ts` (primary)
2. Add matching key to `locales/en.ts`
3. Use via `t("section.key")` in client components

### Adding an Admin Page
1. Create page in `admin-frontend/src/app/(dashboard)/feature/page.tsx`
2. Add nav entry in `components/layout/nav-config.ts`
3. Add corresponding backend controller + route

### Backend API Endpoint
1. Add controller method in `controllers/`
2. Register route in `routes/`
3. Add service logic in `services/`

## File Co-Change Patterns

These files frequently change together:
- `header.tsx` + `language-switcher.tsx` + `i18n.tsx` (language features)
- `admin.controller.ts` + `admin.routes.ts` (admin API changes)
- `auth.controller.ts` + `auth.routes.ts` + `auth.service.ts` (auth features)
- `schema.prisma` + `seed.ts` (database schema changes)

## Deployment

- Docker: Each app has its own `Dockerfile` and `.dockerignore`
- Orchestration: `docker-compose.yml` at root
- CI/CD: `.github/workflows/deploy.yml` for auto-deploy
- Next.js: `output: "standalone"` for containerized builds

## Testing

- Backend has `__tests__/` directory
- No frontend test framework configured yet
- No test scripts in frontend `package.json`
