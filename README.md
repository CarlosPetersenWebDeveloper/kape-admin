# Kape Admin

Panel administrativo de Kape Digital. Maneja TicoStar (y a futuro KapeMD, PlazaKape, etc.) desde una sola interfaz web.

## Stack
- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Supabase JS SDK** (mismo Supabase que usa TicoStar)
- **lucide-react** + **sonner** (toasts)

## Quickstart

```bash
npm install
npm run dev  # http://localhost:3000
```

## Acceso

Solo usuarios con `profiles.role = 'admin'` pueden entrar. Para hacerte admin la primera vez:

```sql
update profiles set role = 'admin' where id = (
  select id from auth.users where email = 'TU_EMAIL@aqui.com'
);
```

## Estructura

```
app/
├── login/page.tsx            # Pantalla de login
├── (dashboard)/              # Rutas protegidas (requieren admin)
│   ├── layout.tsx            # Sidebar + topbar
│   ├── page.tsx              # Home con stats
│   ├── teams/page.tsx        # Equipos
│   ├── players/page.tsx      # Jugadores
│   ├── matches/page.tsx      # Partidos + lineups
│   └── reports/page.tsx      # Reportes pendientes
lib/supabase/                 # Clientes browser + server
components/                   # UI compartida
middleware.ts                 # Refresh de sesión
```

## Deploy

Configurado para Vercel. Subir el repo y agregar las env vars en el dashboard.
Subdominio recomendado: `admin.kapedigital.com`.
