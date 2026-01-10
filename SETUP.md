# Setup Instructies

Deze guide laat je stap-voor-stap zien hoe je het KleineKoning project op je computer kunt zetten.

## Vereisten

- **Node.js** >= 22.0.0
- **npm** >= 10.9.0
- **Git** (voor cloning)
- **Supabase account** (gratis tier is voldoende)

## Optie 1: Setup via GitHub UI (Aanbevolen voor beginners)

### Stap 1: Fork of Clone via GitHub UI

1. Ga naar de GitHub repository: `https://github.com/[jouw-username]/KleineKoning`
2. Klik op de groene **"Code"** knop
3. Kies **"Download ZIP"**
4. Pak het ZIP bestand uit op je computer

### Stap 2: Open in Terminal

1. Open Terminal (Mac/Linux) of PowerShell/Command Prompt (Windows)
2. Navigeer naar de uitgepakte folder:
   ```bash
   cd Downloads/KleineKoning-main  # of waar je het hebt uitgepakt
   ```

### Stap 3: Installeer Dependencies

```bash
npm install
```

Dit kan een paar minuten duren. Alle dependencies worden gedownload.

### Stap 4: Environment Variables

1. Maak een `.env.local` bestand in de root van het project:
   ```bash
   # Windows (PowerShell)
   New-Item .env.local
   
   # Mac/Linux
   touch .env.local
   ```

2. Voeg de volgende variabelen toe (vul je Supabase credentials in):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Hoe krijg je Supabase credentials?**
   - Ga naar [supabase.com](https://supabase.com)
   - Maak een nieuw project (of gebruik bestaand project)
   - Ga naar **Settings** > **API**
   - Kopieer **Project URL** en **anon/public key**

### Stap 5: Database Setup

1. Installeer Supabase CLI (optioneel, maar aanbevolen):
   ```bash
   npm install -g supabase
   ```

2. Login bij Supabase:
   ```bash
   supabase login
   ```

3. Link je project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Run migrations:
   ```bash
   supabase db push
   ```

   **Of via Supabase Dashboard:**
   - Ga naar **SQL Editor** in je Supabase dashboard
   - Open de migration files in `supabase/migrations/`
   - Run ze één voor één in de SQL Editor

### Stap 6: Start Development Server

```bash
npm run dev
```

7. Open je browser en ga naar: `http://localhost:3000`

## Optie 2: Setup via CLI (SSH)

### Stap 1: Clone Repository

```bash
# Via SSH (vereist SSH key setup op GitHub)
git clone git@github.com:[jouw-username]/KleineKoning.git

# Of via HTTPS
git clone https://github.com/[jouw-username]/KleineKoning.git
```

### Stap 2: Navigeer naar Project

```bash
cd KleineKoning
```

### Stap 3: Installeer Dependencies

```bash
npm install
```

### Stap 4: Environment Variables

Maak `.env.local` bestand:

```bash
# Mac/Linux
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EOF

# Windows (PowerShell)
@"
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
"@ | Out-File -FilePath .env.local -Encoding utf8
```

Vul je Supabase credentials in (zie Optie 1, Stap 4).

### Stap 5: Database Setup

```bash
# Installeer Supabase CLI (als je die nog niet hebt)
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Stap 6: Start Development Server

```bash
npm run dev
```

## Optie 3: Setup via CLI (HTTPS)

Volg dezelfde stappen als Optie 2, maar gebruik HTTPS URL:

```bash
git clone https://github.com/[jouw-username]/KleineKoning.git
```

## Troubleshooting

### "Module not found" errors

```bash
# Verwijder node_modules en package-lock.json
rm -rf node_modules package-lock.json  # Mac/Linux
rmdir /s node_modules & del package-lock.json  # Windows

# Herinstalleer
npm install
```

### Port 3000 al in gebruik

```bash
# Gebruik een andere poort
npm run dev -- -p 3001
```

### Supabase connection errors

1. Controleer of je `.env.local` bestand correct is
2. Controleer of je Supabase project actief is
3. Controleer of je de juiste credentials hebt (URL en anon key)
4. Test je Supabase connection:
   ```bash
   # In je browser console op localhost:3000
   console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
   ```

### TypeScript errors

```bash
# Run type check
npm run type-check

# Fix automatisch waar mogelijk
npm run lint -- --fix
```

### Database migrations falen

1. Controleer of je Supabase CLI correct is geïnstalleerd:
   ```bash
   supabase --version
   ```

2. Controleer of je project correct is gelinkt:
   ```bash
   supabase status
   ```

3. Run migrations handmatig via Supabase Dashboard (SQL Editor)

## Verificatie

Na setup zou je het volgende moeten kunnen doen:

1. ✅ Development server starten zonder errors
2. ✅ Naar `http://localhost:3000` navigeren
3. ✅ Login pagina zien
4. ✅ Magic link kunnen aanvragen
5. ✅ Inloggen en dashboard zien

## Volgende Stappen

- Lees de [README.md](./README.md) voor project overzicht
- Bekijk [PROJECT_PLAN.md](./PROJECT_PLAN.md) voor roadmap
- Zie [DEPLOYMENT.md](./DEPLOYMENT.md) voor deployment instructies

## Hulp Nodig?

- Check de [GitHub Issues](https://github.com/[jouw-username]/KleineKoning/issues)
- Maak een nieuwe issue aan als je problemen hebt
- Controleer de Supabase [documentatie](https://supabase.com/docs)
