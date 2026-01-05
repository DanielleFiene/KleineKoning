# KleineKoning

Tijdregistratie en urenstaat export applicatie voor Nederlandse zelfstandigen en kleine bedrijven.

## Features

- ✅ Magic link authenticatie
- ✅ Klantenbeheer met BTW-profielen
- ✅ Projectbeheer met tarieven en afrondingsregels
- ✅ Tijdregistratie met week view
- ✅ Automatische afronding per project
- ✅ PDF export (urenstaat) per klant/periode
- ✅ Data isolatie per gebruiker (RLS)

## Tech Stack

- Next.js 16 (App Router) met Edge Runtime
- TypeScript
- Material-UI (MUI) voor UI componenten
- Tailwind CSS voor styling
- Supabase (PostgreSQL + Auth + Storage)
- date-fns voor datum formatting
- Cloudflare Pages voor hosting

## Project Structuur

```
app/
  (dashboard)/     # Protected routes
    clients/       # Klanten CRUD
    projects/      # Projecten CRUD
    time/          # Tijdregistratie
    exports/       # PDF exports
  actions/         # Server actions
  api/            # API routes
components/       # React components
lib/             # Utilities
supabase/        # Database migrations
```

## Bundle Size Optimalisaties

We proberen de bundle size klein te houden voor snellere laadtijden en betere performance:

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

### Best Practices
- Vermijd onnodige dependencies in client components
- Gebruik Edge Runtime voor stateless API routes
- Minimaliseer client-side JavaScript waar mogelijk

## Roadmap

Zie [PROJECT_PLAN.md](./PROJECT_PLAN.md) voor de volledige roadmap.

## Deployment

Voor deployment instructies, zie [DEPLOYMENT.md](./DEPLOYMENT.md).

## License

ISC
