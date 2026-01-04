# KleineKoning - Project Plan

## Scope

### Wat WEL
- Tijdregistratie per klant/project
- Handmatige invoer van tijdentries
- Afrondingsregels per project (none/nearest15/up15/down15)
- Klantenbeheer met BTW-profielen
- Projectbeheer met tarieven en units
- Export naar PDF (Urenstaat) per klant/periode (HTML-based, Edge Runtime compatible)
- Multi-user support met data separatie (RLS)
- Magic link of GitHub login
- Week view voor tijdentries
- PDF opslag in Supabase Storage

### Wat NIET (v1.0)
- Automatische facturering
- BTW berekeningen in PDF
- Geldbedragen in exports
- Timer functionaliteit (komt in v1.1)
- Mobile app
- Offline mode
- Recurring entries
- Templates

## Datamodel (High Level)

### `clients`
- `id` (uuid, PK)
- `owner_user_id` (uuid, FK naar auth.users)
- `name` (text)
- `btw_profile` (jsonb: `{label: string, percentage: number, rule: string}`)
- `created_at`, `updated_at`

### `projects`
- `id` (uuid, PK)
- `owner_user_id` (uuid, FK naar auth.users)
- `client_id` (uuid, FK naar clients)
- `name` (text)
- `rate_ex_btw` (numeric, intern tarief)
- `default_unit` (enum: minutes/quarter/hour/day)
- `rounding_rule` (enum: none/nearest15/up15/down15)
- `created_at`, `updated_at`

### `time_entries`
- `id` (uuid, PK)
- `owner_user_id` (uuid, FK naar auth.users)
- `client_id` (uuid, FK naar clients)
- `project_id` (uuid, FK naar projects)
- `date` (date)
- `description` (text)
- `duration_minutes` (integer, altijd in minuten)
- `created_at`, `updated_at`

### `statements`
- `id` (uuid, PK)
- `owner_user_id` (uuid, FK naar auth.users)
- `client_id` (uuid, FK naar clients)
- `statement_number` (text, uniek per owner)
- `period_start` (date)
- `period_end` (date)
- `generated_at` (timestamp)
- `pdf_url` (text, link naar Supabase Storage)
- `created_at`

### `statement_lines`
- `id` (uuid, PK)
- `statement_id` (uuid, FK naar statements)
- `date` (date)
- `description` (text)
- `duration_minutes` (integer)
- `project_name` (text, snapshot)
- `created_at`

## UX Flows

### 1. Login Flow
```
/login → Magic link email → Redirect naar /time
```

### 2. Client Management
```
/clients → Lijst met search
/clients/new → Form → Save → Redirect naar /clients
/clients/[id] → Detail + projecten lijst
/clients/[id]/edit → Form → Save → Redirect naar detail
```

### 3. Project Management
```
/clients/[id] → "Nieuw Project" button
/projects/new?client_id=X → Form → Save → Redirect naar client detail
/projects/[id]/edit → Form → Save → Redirect
```

### 4. Time Entry Flow
```
/time → Week selector + filters
→ Quick add form bovenaan
→ Entries gegroepeerd per dag
→ Edit/Delete per entry
→ Rounding preview bij save
```

### 5. Export Flow
```
/exports → Select klant + periode
→ Preview (HTML tabel)
→ "Generate PDF" button
→ Statement snapshot maken
→ PDF genereren + upload
→ Download button verschijnt
```

## Roadmap Fases

### ✅ Fase 0 — Project "regels"
- [x] PROJECT_PLAN.md aangemaakt
- [x] Definition of Done vastgelegd
- [x] Branch strategy bepaald

### ✅ Fase 1 — Baseline app
- [x] Next.js + TypeScript + Tailwind setup
- [x] Material-UI (MUI) geïnstalleerd
- [x] Sidebar layout
- [x] Placeholder pages: /login, /time, /clients, /projects, /exports

### ✅ Fase 2 — Supabase + Auth
- [x] Supabase project setup
- [x] Env vars configuratie
- [x] Auth flow (magic link)
- [x] Protected routes
- [x] Database schema migrations
- [x] RLS policies

### ✅ Fase 3 — CRUD UI
- [x] Clients CRUD
- [x] Projects CRUD
- [x] BTW profiel selectie
- [x] Rounding rules configuratie

### ✅ Fase 4 — Time Entries
- [x] Week view
- [x] Quick add form
- [x] Filters (klant, project, periode)
- [x] Rounding logic + preview

### ✅ Fase 5 — Export + PDF
- [x] Export selectie UI
- [x] Preview generatie
- [x] Statement snapshot
- [x] PDF generatie (HTML-based, Edge Runtime compatible)
- [x] Supabase Storage upload
- [x] Download functionaliteit

### ⏳ Fase 6 — Timer (v1.1 - Optioneel)
- [ ] Active timer state
- [ ] Start/stop functionaliteit
- [ ] Modal bij stop met entry details

### ✅ Fase 7 — Deploy
- [x] Cloudflare Pages configuratie
- [x] README met setup instructies
- [x] Env vars documentatie
- [x] Supabase redirect URLs instructies
- [x] Storage policies documentatie

## Definition of Done (per feature)

1. Werkt lokaal zonder errors
2. Basic tests/linters passeren (geen console errors)
3. RLS policies getest (eigen data isolatie)
4. Code review ready (clean, gecommentarieerd waar nodig)

## Tech Stack

- **Framework**: Next.js 16 (App Router) met Edge Runtime
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Material-UI (MUI)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Magic Link)
- **Storage**: Supabase Storage (voor PDFs)
- **PDF**: HTML-based generatie (Edge Runtime compatible)
- **Deploy**: Cloudflare Pages

## Branch Strategy

- `main`: productie-ready code
- `feat/auth`: auth implementatie
- `feat/time-entries`: tijdregistratie
- `feat/pdf-export`: export functionaliteit

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY= (alleen server-side)
```

