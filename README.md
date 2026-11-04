# Laboratorio de Automatización · Apartado de horarios

Misma página que antes (mismo diseño y flujo), ahora **sin Base44**:

- **Front-end**: sitio estático (React + Vite) que se publica solo en **GitHub Pages**.
- **Datos y reglas**: **Supabase** (gratis). Contraseñas, sesiones, cupos, sanciones y restricción por IP viven en funciones SQL (`supabase/schema.sql`); las tablas no se pueden leer desde el navegador.
- Sin marca de agua ni scripts de Base44.

## Puesta en marcha (≈10 min)

### 1. Supabase
1. Crea un proyecto gratis en <https://supabase.com>.
2. **SQL Editor** → pega y ejecuta todo `supabase/schema.sql`.
3. Edita usuario, correo y contraseña en `supabase/seed_admin.sql` y ejecútalo: es tu primer maestro. (Los demás se crean desde *Agregar Administrador*.)
4. **Project Settings → API**: copia la **Project URL** y la clave **anon / publishable**.

### 2. GitHub
1. Crea un repositorio y sube todo el contenido de esta carpeta a la rama `main`.
2. **Settings → Pages → Source: GitHub Actions**.
3. **Settings → Secrets and variables → Actions → pestaña *Variables*** → crea:
   - `VITE_SUPABASE_URL` = tu Project URL
   - `VITE_SUPABASE_ANON_KEY` = tu clave anon/publishable
   (la clave anon es pública por diseño; la seguridad está en las funciones SQL).
4. En **Actions**, el flujo *Publicar en GitHub Pages* corre solo en cada `push`. Tu página queda en `https://TU-USUARIO.github.io/TU-REPO/`.

### 3. Primer ingreso
Entra → pestaña **Maestro** → usuario del paso 1.3 → **Configuración**: ajusta las IP permitidas de tu laboratorio (o desactiva la restricción) y abre el registro / creación de equipos.

> Restricción por IP: Supabase ve la IP pública del visitante, igual que antes. Pon en *Configuración* la(s) IP pública(s) de la red del laboratorio.

### 4. (Opcional) Correo de "¿Olvidaste tu contraseña?"
Sin esto todo funciona, solo no se envía el correo. Con la CLI de Supabase:
```bash
supabase login && supabase link --project-ref TU-REF
supabase secrets set SITE_URL=https://TU-USUARIO.github.io/TU-REPO RESEND_API_KEY=re_xxx RESEND_FROM="Laboratorio <avisos@tu-dominio.com>"
supabase functions deploy request-reset --no-verify-jwt
```
(Resend gratis: <https://resend.com>; para enviar a cualquier correo debes verificar un dominio.)

## Desarrollo local
```bash
cp .env.example .env.local   # y rellena las 2 variables
npm install
npm run dev
```

## Notas
- Las rutas usan `#` (p. ej. `…/TU-REPO/#/estudiante`) para funcionar en GitHub Pages sin configuración extra.
- Los datos que tenías en Base44 (estudiantes, equipos, reservas) **no se migran solos**; la base nueva empieza vacía.
- Las reglas (cupos, bloques, tolerancia de 15/30 min, 1 día de anticipación…) son las mismas; están en `supabase/schema.sql` y `src/lib/lab-constants.js`.
