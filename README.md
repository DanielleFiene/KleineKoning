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

## Roadmap

Zie [PROJECT_PLAN.md](./PROJECT_PLAN.md) voor de volledige roadmap.

## Deployment

Voor deployment instructies, zie [DEPLOYMENT.md](./DEPLOYMENT.md).

## License

ISC
