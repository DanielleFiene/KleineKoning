# Deployment Guide

## Cloudflare Pages Deployment

### 1. Voorbereiding

1. Zorg dat je code op GitHub staat
2. Zorg dat je Supabase project is ingesteld
3. Zorg dat alle environment variables bekend zijn

### 2. Cloudflare Pages Setup

1. Log in op [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Ga naar **Pages** → **Create a project**
3. Koppel je GitHub repository
4. Configureer build settings:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Root directory**: `/` (of de root van je project)
   - **Node.js version**: Cloudflare Pages detecteert automatisch Node.js 20.x via `.nvmrc` of `package.json` engines field

### 3. Environment Variables

Voeg de volgende environment variables toe in Cloudflare Pages:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Let op**: `SUPABASE_SERVICE_ROLE_KEY` is alleen nodig voor server-side operaties. Zet deze NIET in client-side code.

### 4. Supabase Auth Redirect URLs

Voeg toe in Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://your-project.pages.dev`
- **Redirect URLs**: 
  - `https://your-project.pages.dev/auth/callback`
  - `http://localhost:3000/auth/callback` (voor development)

### 5. Supabase Storage Policies

Zorg dat de Storage bucket `statements` bestaat en de juiste policies heeft:

```sql
-- Maak bucket (als deze nog niet bestaat)
INSERT INTO storage.buckets (id, name, public)
VALUES ('statements', 'statements', true);

-- Policy voor uploads
CREATE POLICY "Users can upload own statements"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'statements' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy voor downloads
CREATE POLICY "Users can read own statements"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'statements' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 6. Database Migratie

Zorg dat alle migrations zijn uitgevoerd in Supabase:

1. Ga naar SQL Editor in Supabase Dashboard
2. Voer `supabase/migrations/001_initial_schema.sql` uit
3. Controleer dat alle tabellen en RLS policies zijn aangemaakt

### 7. Test Checklist

Na deployment, test het volgende:

- [ ] Login werkt (magic link)
- [ ] Redirect naar /time na login
- [ ] Klanten kunnen worden aangemaakt
- [ ] Projecten kunnen worden aangemaakt
- [ ] Tijdentries kunnen worden toegevoegd
- [ ] Exports kunnen worden gegenereerd
- [ ] PDF downloads werken
- [ ] Data isolatie werkt (twee users zien elkaars data niet)

### 8. Monitoring

- Check Cloudflare Pages logs voor build errors
- Check Supabase logs voor database errors
- Monitor Supabase Storage usage
- Check auth logs in Supabase Dashboard

## Troubleshooting

### Build Fails

- Check of alle dependencies zijn geïnstalleerd
- Check of environment variables zijn ingesteld
- Check build logs in Cloudflare Dashboard
- **Node.js versie**: Zorg dat Node.js >= 20.9.0 wordt gebruikt (zie `.nvmrc` of `package.json` engines)

### Auth Redirect Issues

- Controleer redirect URLs in Supabase
- Controleer of de site URL correct is ingesteld
- Check browser console voor errors

### Storage Upload Fails

- Controleer Storage policies
- Controleer of bucket bestaat en public is
- Check Supabase logs voor errors

### RLS Policy Issues

- Test queries in Supabase SQL Editor
- Controleer of `auth.uid()` correct werkt
- Check of alle policies zijn aangemaakt

