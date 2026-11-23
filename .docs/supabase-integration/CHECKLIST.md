# Integración Supabase desde PDF ER/CRUD

## Evidencia y estado

- [x] Revisar el proyecto y validar el PDF. React 19 + Vite + JSX + npm; PDF legible de cuatro páginas en `docs/Informe_Seguridad_Coco_Latte.pdf`.
- [x] Documentar el modelo y su correspondencia con la aplicación. Evidencia: [ANALISIS.md](ANALISIS.md). El PDF es una propuesta de seguridad sin ER/CRUD formal; se distinguen sus requisitos de las entidades complementarias de la app.
- [x] Identificar y enlazar el proyecto remoto. `npx supabase projects list` devolvió un proyecto `ACTIVE_HEALTHY` y enlazado; la referencia coincide con `.env.local`. Organización en plan gratuito según el Dashboard.
- [x] Crear, aplicar y verificar migraciones/permisos. `db push --linked --dry-run` mostró solo la migración prevista; la cuarta migración se aplicó a Cloud y RLS de `profiles` está activa. Los escenarios pgTAP terminaron 26/26 aprobados.
- [x] Configurar SDK y entorno. SDK instalado; cliente lee `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`; ambas variables están configuradas localmente. No se imprimieron sus valores. `.gitignore` ignora `.env.local` mediante `*.local`.
- [x] Integrar las operaciones. Auth registra/inicia sesión; trigger crea/sincroniza `profiles`; `getCurrentUser()` obtiene el nombre del perfil; pedidos y panel usan las consultas/RPC existentes. No hay columna de contraseña en tablas públicas.
- [x] Verificar permisos de perfil en Cloud: lectura/actualización propia permitida, actualización ajena, cambio de identidad/correo y autoasignación de rol denegados. Falta registro/inicio de sesión manual desde la interfaz.
- [x] Documentar cambios y pendientes en `ANALISIS.md`, este archivo y `SUPABASE_SETUP.md`.

## Migraciones remotas aplicadas

1. `20261116000000_secure_coco_latte_orders.sql` — migración base previa, ya aplicada.
2. `20261116120000_create_account_profiles.sql` — tabla de perfiles, trigger de sincronización/backfill y RLS de lectura propia.
3. `20261116130000_restrict_auth_rpcs_from_anon.sql` — revoca explícitamente acceso `anon` a funciones de creación/autorización.
4. `20261123100000_allow_own_profile_name_update.sql` — permite cambiar solo el nombre del perfil propio; bloquea cambios de identidad/correo y conserva RLS.

## Resultados de pruebas en Cloud

`npx supabase db query --linked --file supabase/tests/database/secure_orders_test.sql`: 26/26 `ok`. La prueba incluye cinco casos para perfil propio y privilegios de rol. El test crea tres identidades ficticias y termina con `ROLLBACK`. La consulta posterior mostró 1 cuenta Auth y 1 perfil persistentes, por lo que no se asume que sean datos de prueba.

- Visitante: no lee perfiles/pedidos ni ejecuta RPC privadas.
- Cliente: crea pedido, lee su perfil/pedidos, no lee datos ajenos, no cambia estados y no borra pedidos.
- Personal: lee todos los pedidos/ventas, avanza estados válidos, no salta estados y las anulaciones registran actor/restauran stock.

Validaciones del proyecto: `npm.cmd run lint` pasó; `npm.cmd run build` pasó con Vite 8.3.2.

## Pendiente para uso real

Revisar **Authentication → Sign In / Providers → Email** para confirmar la opción deseada en Cloud; `supabase/config.toml` afecta solo a desarrollo local. Finalmente, hacer un registro e inicio de sesión manual. pgTAP no envía correos ni valida contraseñas reales. Nunca solicitar ni guardar contraseñas fuera de Supabase Auth.
