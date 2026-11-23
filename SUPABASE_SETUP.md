# Supabase: configuración y seguridad

## Estado actual

- Aplicación: React 19 + Vite + JavaScript/JSX, npm, Windows x64.
- Supabase CLI: 2.122.0 como dependencia de desarrollo (`npx supabase`). SDK: `@supabase/supabase-js` 2.118.0.
- Proyecto Cloud del plan gratuito: activo y enlazado. La referencia del proyecto coincide con el host de `VITE_SUPABASE_URL`; el valor de la clave no se imprime ni se documenta.
- `.env.local` existe y contiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`; `.gitignore` ignora los archivos `*.local`. No hay `service_role` en el frontend.
- No se instaló ni utilizó Docker.

## Cuentas y contraseñas

El formulario de registro (`src/pages/LoginPage.jsx`) envía nombre, correo y contraseña a `signUp()` en `src/lib/cocoLatteApi.js`. La autenticación y el inicio de sesión continúan a cargo de Supabase Auth (`signInWithPassword`).

Las contraseñas no se guardan en `public.profiles` ni en una tabla propia. Supabase Auth almacena solo hashes bcrypt con sal en `auth.users`; bcrypt es hashing unidireccional, no cifrado reversible. [Documentación de seguridad de contraseñas de Supabase](https://supabase.com/docs/guides/auth/password-security).

La migración `20261116120000_create_account_profiles.sql` crea `public.profiles` para los datos de perfil del formulario:

- `user_id`: PK/FK a `auth.users.id`, con borrado en cascada.
- `email`: correo reflejado desde Auth, único y nullable.
- `full_name`: nombre completo, obligatorio, default `Cliente`.
- `created_at` y `updated_at`.

Un trigger `SECURITY DEFINER` crea y sincroniza el perfil cuando Auth inserta o actualiza el correo/metadato del nombre. La migración también hace backfill de cuentas existentes. RLS está activada; el usuario autenticado puede leer y actualizar solo su perfil propio. El grant de actualización se limita a `full_name`; no se concede INSERT/DELETE y el correo/ID son de solo lectura. `getCurrentUser()` obtiene el nombre desde `profiles`; las credenciales de inicio de sesión se validan únicamente con Supabase Auth.

## Archivos de integración

- `src/lib/supabase.js`: cliente central creado con URL y publishable key.
- `src/lib/cocoLatteApi.js`: registro/inicio/cierre, lectura de perfil, menú, pedidos, estados y ventas.
- `src/pages/LoginPage.jsx`: formulario existente conectado a Auth, sin cambios visuales.
- `supabase/migrations/20261116000000_secure_coco_latte_orders.sql`: catálogo, roles, pedidos, renglones, RLS y funciones de pedido.
- `supabase/migrations/20261116120000_create_account_profiles.sql`: perfiles y sincronización con Auth.
- `supabase/migrations/20261116130000_restrict_auth_rpcs_from_anon.sql`: revoca explícitamente al rol `anon` ejecución de RPC de pedidos/permisos.
- `supabase/tests/database/secure_orders_test.sql`: pruebas de perfiles visitante/cliente/personal, RLS y flujo de pedido; termina con `ROLLBACK`.
- `.env.example` y `.gitignore`: plantilla pública sin secretos y protección del entorno local.
- Evidencia del PDF: `.docs/supabase-integration/ANALISIS.md` y `CHECKLIST.md`.

## Permisos principales

- `profiles`: lectura propia para usuarios autenticados; cada cliente puede actualizar solo `full_name` de su perfil propio. El correo y `user_id` no se pueden modificar desde el navegador; no hay INSERT/DELETE directo.
- `products`: lectura pública del menú; sin escritura desde la API pública.
- `orders`: cliente lee solo pedidos propios; personal autorizado lee todos; no hay DELETE.
- `order_items`: cliente lee renglones de sus pedidos; personal autorizado lee todos; escritura solo dentro de RPC segura.
- `sales`: vista derivada protegida por RLS de tablas base; acceso al personal autorizado.
- `user_roles`: sin acceso de lectura/escritura desde el navegador.
- `create_customer_order(...)`: asigna `cliente_id = auth.uid()`, valida productos/precios/stock y crea pedido+renglones atómicamente. Solo `authenticated` puede ejecutarla.
- `is_authorized_staff()`: consulta rol administrativo; solo `authenticated` puede ejecutarla. La base vuelve a aplicar el rol en RLS y triggers.
- `enforce_order_status_transition()`: permite únicamente Recibido → En preparación → Listo → Entregado; Cancelado registra el actor y repone stock.

## Migraciones aplicadas a Cloud

`npx supabase migration list --linked` confirmó estas tres migraciones locales/remotas:

1. `20261116000000_secure_coco_latte_orders.sql`
2. `20261116120000_create_account_profiles.sql`
3. `20261116130000_restrict_auth_rpcs_from_anon.sql`
4. `20261123100000_allow_own_profile_name_update.sql`

Antes de cada migración nueva se ejecutó `npx supabase db push --linked --dry-run`; solo se aplicaron las migraciones previstas. No se creó un proyecto duplicado.

## Verificación realizada

- `npm.cmd run lint`: pasó.
- `npm.cmd run build`: pasó con Vite 8.3.2.
- `npx supabase db query --linked --file supabase/tests/database/secure_orders_test.sql`: 26 de 26 pruebas pgTAP pasaron en Cloud. Se usaron tres cuentas ficticias dentro de una transacción con `ROLLBACK`. La comprobación posterior encontró 1 cuenta Auth y 1 perfil persistentes; no se atribuyen a la prueba.
- Se comprobó `profiles` con RLS activada. La prueba temporal verificó que el trigger crea perfiles desde el registro Auth.

La configuración local de Supabase tiene `auth.email.enable_confirmations = false`. El 23/11/2026 se consultó el endpoint público de Auth de Cloud: email está habilitado, `mailer_autoconfirm=true` y el registro no está deshabilitado. Con esto, las nuevas cuentas deben quedar confirmadas y `signUp()` debe devolver una sesión. Una auditoría anterior encontró 1 usuario Auth y 1 perfil coincidente sin confirmar cuando la confirmación aún estaba activada; no se revisó la contraseña y no se creó ni eliminó ninguna cuenta. Si esa cuenta antigua todavía no permite ingresar, confirma manualmente su estado en **Authentication → Users** o usa la recuperación de acceso de Supabase; no se puede verificar una contraseña existente desde la tabla de perfiles.

El frontend no solicita correos en el flujo normal con `mailer_autoconfirm=true`. Supabase mantiene sus límites de protección contra abuso; el formulario impide envíos simultáneos y no reintenta registros automáticamente. Para producción, evalúa verificar correos y configurar SMTP propio en **Authentication → SMTP Settings**. Nunca guardes credenciales SMTP ni `service_role` en el frontend. [Límites de Supabase Auth](https://supabase.com/docs/guides/auth/rate-limits) y [configuración de SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

El frontend bloquea envíos simultáneos, traduce errores de Auth, detecta respuestas de correo duplicado, inicializa con `getSession()`, escucha `onAuthStateChange()`, restaura sesión y redirige usuarios autenticados que abren `/login`. “Recordar mi acceso” está activado inicialmente y guarda la sesión en almacenamiento local; si se desactiva, la sesión dura mientras esa pestaña esté abierta. El registro/inicio real todavía debe probarse en el navegador con la cuenta confirmada; no se crearon cuentas de prueba persistentes.

## Comandos útiles

Desde `react-app`:

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
npx supabase projects list
npx supabase migration list --linked
npx supabase db push --linked --dry-run
npx supabase db push --linked
npx supabase db query --linked --file supabase/tests/database/secure_orders_test.sql
```

Para otorgar acceso al panel, primero crea la cuenta en Authentication y asigna su UUID real mediante SQL administrativo:

```sql
insert into public.user_roles (user_id, role, authorized)
values ('<auth.users.id>', 'admin', true)
on conflict (user_id) do update
set role = excluded.role, authorized = excluded.authorized;
```

Usa `staff` para personal autorizado. Nunca permitas que el usuario cambie su propio rol desde el frontend.
