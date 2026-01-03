# KleineKoning

Tijdregistratie en urenstaat export applicatie.

## Setup

### 1. Installatie

```bash
npm install
```

### 2. Supabase Setup

1. Maak een nieuw Supabase project op [supabase.com](https://supabase.com)
2. Kopieer je project URL en anon key
3. Maak een `.env.local` bestand:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database Migratie

Voer de SQL migratie uit in je Supabase SQL Editor:

```bash
# Kopieer de inhoud van supabase/migrations/001_initial_schema.sql
# en voer deze uit in de Supabase SQL Editor
```

### 4. Storage Bucket

Maak een Storage bucket in Supabase:

1. Ga naar Storage in je Supabase dashboard
2. Maak een nieuwe bucket genaamd `statements`
3. Zet de bucket op **Public**
4. Voeg een Storage Policy toe:

```sql
-- Allow users to upload their own statements
CREATE POLICY "Users can upload own statements"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'statements' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own statements
CREATE POLICY "Users can read own statements"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'statements' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 5. Auth Redirect URLs

Voeg toe aan je Supabase Auth settings:
- Redirect URL: `http://localhost:3000/auth/callback` (development)
- Redirect URL: `https://your-domain.com/auth/callback` (production)

### 6. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- ✅ Magic link authenticatie
- ✅ Klantenbeheer met BTW-profielen
- ✅ Projectbeheer met tarieven en afrondingsregels
- ✅ Tijdregistratie met week view
- ✅ Automatische afronding per project
- ✅ PDF export (urenstaat) per klant/periode
- ✅ Data isolatie per gebruiker (RLS)

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase (PostgreSQL + Auth + Storage)
- date-fns

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

## Deployment

### Cloudflare Pages

1. Push naar GitHub
2. Koppel repository aan Cloudflare Pages
3. Build command: `npm run build`
4. Output directory: `.next`
5. Voeg environment variables toe in Cloudflare dashboard

### Environment Variables (Production)

Zorg dat deze zijn ingesteld:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (alleen voor server-side)

## Roadmap

Zie [PROJECT_PLAN.md](./PROJECT_PLAN.md) voor de volledige roadmap.

## License

ISC
