# KleineKoning

Tijdregistratie en urenstaat export applicatie voor Nederlandse zelfstandigen en kleine bedrijven.

## Features

- ✅ Magic link authenticatie (geen wachtwoorden)
- ✅ Klantenbeheer met BTW-profielen (NL/EU/Buitenland)
- ✅ Projectbeheer met tarieven en afrondingsregels
- ✅ Tijdregistratie met week view en timer
- ✅ Automatische afronding per project (geen/nearest15/up15/down15)
- ✅ PDF export (urenstaat) per klant/periode
- ✅ CSV export voor administratie
- ✅ Data isolatie per gebruiker (Row Level Security)
- ✅ Cross-tab timer synchronisatie

## Tech Stack

### Core Framework
- **Next.js 16** (App Router) - React framework met server-side rendering
- **TypeScript** - Type-safe JavaScript
- **React 19** - UI library

### UI & Styling
- **Material-UI (MUI)** - Component library voor UI elementen
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Headless UI primitives (dialog, select, tooltip, etc.)
- **Lucide React** - Icon library

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (magic links)
  - Row Level Security (RLS)
  - Edge Functions ready

### Utilities & Libraries
- **date-fns** - Datum formatting en manipulatie
- **pdf-lib** - PDF generatie voor urenstaten
- **react-hook-form** - Form state management
- **zod** - Schema validatie
- **@supabase/ssr** - Supabase SSR support

### Testing
- **Jest** - Test runner
- **React Testing Library** - Component testing utilities

### Deployment
- **Cloudflare Pages** - Hosting platform
- **Edge Runtime** - Voor snellere cold starts

## Project Structuur

```
KleineKoning/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── clients/             # Klantenbeheer
│   │   │   ├── [id]/            # Klant detail & edit
│   │   │   ├── new/             # Nieuwe klant
│   │   │   └── page.tsx         # Klanten overzicht
│   │   ├── projects/            # Projectbeheer
│   │   │   ├── [id]/            # Project detail & edit
│   │   │   ├── new/             # Nieuw project
│   │   │   └── page.tsx        # Projecten overzicht
│   │   ├── time/                # Tijdregistratie
│   │   │   └── page.tsx        # Week view met timer
│   │   ├── exports/             # PDF/CSV exports
│   │   │   └── page.tsx        # Export overzicht
│   │   └── layout.tsx           # Dashboard layout met sidebar
│   ├── actions/                 # Server Actions (data mutations)
│   │   ├── clients.ts           # Klant CRUD operaties
│   │   ├── projects.ts          # Project CRUD operaties
│   │   ├── time-entries.ts      # Tijdentry CRUD operaties
│   │   └── statements.ts        # Urenstaat generatie
│   ├── api/                     # API Routes (Edge Runtime)
│   │   ├── clients/             # Client API endpoints
│   │   ├── projects/            # Project API endpoints
│   │   ├── time-entries/        # Tijdentry API endpoints
│   │   ├── statements/          # Urenstaat API endpoints
│   │   ├── pdf/                 # PDF generatie endpoints
│   │   ├── csv/                 # CSV export endpoints
│   │   └── send-statement-email/# Email verzending
│   ├── auth/                    # Authenticatie
│   │   └── callback/            # Magic link callback handler
│   ├── login/                   # Login pagina
│   ├── privacy/                 # Privacy policy
│   ├── algemene-voorwaarden/    # Algemene voorwaarden
│   ├── verwerkersovereenkomst/  # Verwerkersovereenkomst
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Homepage (redirect naar /time)
│
├── components/                   # React Components
│   ├── timer.tsx                # Timer component met cross-tab sync
│   ├── timer-setup-dialog.tsx   # Timer setup modal
│   ├── timer-stop-dialog.tsx    # Timer stop & save modal
│   ├── time-entries-view.tsx    # Week view voor tijdentries
│   ├── client-form.tsx          # Klant formulier
│   ├── client-search.tsx        # Klant zoekcomponent
│   ├── project-form.tsx         # Project formulier
│   ├── project-search.tsx       # Project zoekcomponent
│   ├── exports-view.tsx         # Export overzicht component
│   ├── app-sidebar.tsx          # Dashboard sidebar
│   ├── sidebar-nav.tsx          # Sidebar navigatie
│   ├── app-footer.tsx           # Footer component
│   ├── user-menu.tsx             # Gebruiker menu
│   ├── toast-provider.tsx       # Toast notifications
│   ├── info-icon.tsx            # Info tooltip icon
│   ├── label-with-info.tsx      # Label met info tooltip
│   └── ui/                      # Reusable UI components (Radix UI)
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── select.tsx
│       └── ... (andere UI primitives)
│
├── hooks/                       # Custom React Hooks
│   ├── use-timer-state.ts      # Timer state management hook
│   └── use-mobile.tsx           # Mobile detection hook
│
├── lib/                         # Utility Libraries
│   ├── supabase/                # Supabase clients
│   │   ├── server.ts            # Server-side Supabase client
│   │   └── client.ts            # Browser Supabase client
│   ├── utils/                   # Utility functies
│   │   ├── date.ts              # Datum formatting & parsing
│   │   ├── pdf-generator.ts     # PDF generatie logica
│   │   └── pdf-html.ts          # PDF HTML templates
│   ├── types/                    # TypeScript types
│   │   └── database.ts          # Database type definitions
│   └── utils.ts                 # Algemene utility functies
│
├── supabase/                    # Database
│   └── migrations/              # SQL migrations
│
├── public/                      # Static assets
│   └── ... (favicons, images)
│
├── middleware.ts                # Next.js middleware (auth protection)
├── next.config.ts              # Next.js configuratie
├── tailwind.config.ts           # Tailwind CSS configuratie
├── tsconfig.json                # TypeScript configuratie
└── package.json                 # Dependencies
```

## Folder Uitleg

### `/app` - Next.js App Router
- **`(dashboard)/`** - Protected routes die authenticatie vereisen
  - Alle routes hieronder zijn alleen toegankelijk voor ingelogde gebruikers
  - Layout bevat sidebar en navigatie
- **`actions/`** - Server Actions voor data mutations
  - Server-side functies die direct vanuit client components worden aangeroepen
  - Geen API routes nodig, direct database toegang
- **`api/`** - API Routes (Edge Runtime)
  - REST endpoints voor externe integraties
  - Alle routes gebruiken Edge Runtime voor betere performance
  - Alternatief voor Server Actions waar nodig (bijv. Cloudflare compatibility)

### `/components` - React Components
- **Hoofdcomponenten** - Feature-specifieke components (timer, forms, views)
- **`ui/`** - Reusable UI primitives gebaseerd op Radix UI
  - Headless components die gestyled zijn met Tailwind
  - Herbruikbaar door hele applicatie

### `/hooks` - Custom Hooks
- **`use-timer-state.ts`** - Timer state management met localStorage sync
- **`use-mobile.tsx`** - Responsive design utilities

### `/lib` - Utilities
- **`supabase/`** - Supabase client instanties
  - Server client voor SSR/SSG
  - Browser client voor client-side operaties
- **`utils/`** - Utility functies
  - **`date.ts`** - Datum parsing, formatting, week berekeningen
  - **`pdf-generator.ts`** - PDF generatie met pdf-lib
  - **`pdf-html.ts`** - HTML templates voor PDFs
- **`types/`** - TypeScript type definitions
  - Database types gegenereerd vanuit Supabase schema

### `/supabase/migrations` - Database Migrations
- SQL migrations voor database schema
- Uitgevoerd via Supabase CLI of dashboard

## Key Features Uitleg

### Timer Systeem
- **Cross-tab synchronisatie** - Timer werkt in meerdere tabs tegelijk
- **localStorage persistentie** - Timer blijft behouden na refresh
- **BroadcastChannel** - Real-time sync tussen tabs
- **Geen throttling** - Timer blijft accuraat in background tabs door startTime berekening

### Authenticatie
- **Magic links** - Geen wachtwoorden nodig
- **Middleware protection** - Automatische redirect naar login
- **Session management** - Via Supabase SSR

### Data Isolatie
- **Row Level Security (RLS)** - Elke gebruiker ziet alleen eigen data
- **Server-side validatie** - Alle mutaties worden gevalideerd
- **Client-side validatie** - Snelle feedback voor gebruikers

### PDF Generatie
- **Edge Runtime compatible** - Werkt op Cloudflare Pages
- **pdf-lib** - Client-side PDF generatie
- **Nederlandse formatting** - Datums, bedragen, BTW

## Bundle Size Optimalisaties

### Edge Runtime
- **API routes** gebruiken `export const runtime = 'edge'` waar mogelijk
- Edge Runtime heeft kleinere bundle sizes en snellere cold starts
- Routes die Edge Runtime gebruiken:
  - `/api/*` routes (clients, projects, time-entries, statements, etc.)
  - `/auth/callback` route
  - Middleware draait standaard op Edge Runtime

### Dependency Management
- **Material-UI (MUI)**: Alleen geïmporteerd waar nodig, tree-shaking via ES modules
- **date-fns**: Alleen specifieke functies geïmporteerd (bijv. `import { format } from "date-fns"`)
- **pdf-lib**: Alleen gebruikt in Edge-compatibele PDF generatie routes
- **Supabase**: Gebruikt `@supabase/ssr` voor optimale bundle size in SSR context

### Code Splitting
- Client components zijn gescheiden van server components
- Dynamische imports waar mogelijk voor zwaardere dependencies
- Route-based code splitting via Next.js App Router

## Development

Zie [SETUP.md](./SETUP.md) voor gedetailleerde setup instructies.

### Quick Start
```bash
npm install
npm run dev
```

### Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - ESLint check
- `npm run type-check` - TypeScript type checking
- `npm test` - Run tests
- `npm run test:watch` - Watch mode voor tests

## Roadmap

Zie [PROJECT_PLAN.md](./PROJECT_PLAN.md) voor de volledige roadmap.

## Deployment

Voor deployment instructies, zie [DEPLOYMENT.md](./DEPLOYMENT.md).

## License

ISC
