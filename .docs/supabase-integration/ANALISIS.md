# Análisis del PDF y correspondencia con COCO LATTE

## Fuente y alcance

- Fuente: `docs/Informe_Seguridad_Coco_Latte.pdf`, cuatro páginas.
- El archivo es legible y su texto fue extraído de los flujos PDF. Sus páginas contienen texto y tablas de propuesta; no presenta un diagrama ER, cardinalidades formales ni una matriz CRUD detallada por entidad.
- Por eso, el análisis distingue lo expresado en el PDF de las decisiones de implementación que completan el modelo existente de la aplicación. No se atribuyen al PDF columnas, tipos PostgreSQL ni relaciones que no especifique.

## Contenido relevante por página

| Página | Contenido del PDF | Uso en la implementación |
|---|---|---|
| 1 | Objetivo: proteger pedidos, clientes y panel administrativo con autenticación, autorización y RLS. El sistema es React + Vite. | Confirma Supabase Auth/RLS como enfoque y preservar el frontend existente. |
| 2 | Riesgo de lectura de pedidos ajenos o cambios no autorizados. Propone que `Pedido` tenga `cliente_id`, asignado desde la cuenta autenticada. La tabla de ejemplo muestra `id`, `cliente_id`, cliente, total y estado. Define permisos de visitante, cliente y administrador/personal. | `cliente_id` se deriva de `auth.uid()`; RLS filtra propietario y personal. La tabla es ilustrativa, no una definición completa de atributos ni tipos. |
| 3 | Solo personal autorizado cambia estados en secuencia: Recibido → En preparación → Listo → Entregado. Se deniega eliminar; Cancelado es una alternativa sugerida para conservar historial. Sugiere mover pedidos de `localStorage` a base remota y proteger las operaciones con RLS. | Trigger SQL valida transiciones; no se concede DELETE; Cancelado registra el actor. La compra se crea de forma atómica en la base. |
| 4 | Casos esperados para visitante, cliente y administrador. Lista ajustes de Auth, `cliente_id`, RLS, protección de ruta, transición de estados y denegación de borrado. | Guía la matriz CRUD y los escenarios de verificación; aún requieren prueba real con roles en Cloud. |

## Entidades y atributos

El PDF identifica expresamente el recurso Pedido y solo ilustra algunos atributos. La aplicación y la migración actual requieren datos adicionales para mantener el menú, renglones de pedido, roles y ventas. Se documenta la procedencia:

| Entidad | Atributos / restricciones | Procedencia y notas |
|---|---|---|
| Pedido (`public.orders`) | `id` UUID PK, default `gen_random_uuid()`; `order_number` bigint identity único; `cliente_id` UUID NOT NULL, default `auth.uid()`, FK a `auth.users(id)`; `customer_name`, `customer_phone`; `payment_method`; `order_type`; `status` con valores Recibido, En preparación, Listo, Entregado o Cancelado; `created_at` timestamptz default `now()`; `cancelled_by` UUID nullable, FK a `auth.users(id)`. | `cliente_id`, cliente, total y estado aparecen en el ejemplo del PDF. Los demás atributos/defaults/restricciones son implementación existente adaptada al checkout; el PDF no determina sus tipos ni reglas detalladas. El total se calcula con los renglones, no se almacena en `orders`. |
| Renglón de pedido (`public.order_items`) | `id` bigint identity PK; `order_id` UUID NOT NULL FK `orders(id)`; `product_id` integer NOT NULL FK `products(id)`; `product_name`; `quantity` entre 1 y 99; `unit_price` numeric(10,2) >= 0; UNIQUE (`order_id`, `product_id`). | Tabla complementaria que necesita el flujo de carrito y el catálogo de la aplicación; no está definida en el PDF. FKs usan `ON DELETE RESTRICT`. |
| Producto (`public.products`) | `id` integer PK; `name`, `description`, `category`, `image` text NOT NULL; `price` numeric(10,2) >= 0; `stock` integer >= 0. | Catálogo ya existente en la aplicación; el PDF permite consultar el menú, pero no especifica su esquema. Migración carga los 16 productos visibles en el catálogo. |
| Rol (`public.user_roles`) | `user_id` UUID PK/FK `auth.users(id)` con `ON DELETE CASCADE`; `role` limitado a `admin`/`staff`; `authorized` boolean default true; `created_at` timestamptz default `now()`. | Entidad técnica añadida para autorización. El PDF requiere personal autorizado, pero no establece tabla, atributos ni mecanismo de asignación. |
| Perfil (`public.profiles`) | `user_id` UUID PK/FK `auth.users(id)` con `ON DELETE CASCADE`; `email` text nullable UNIQUE; `full_name` text NOT NULL, default `Cliente`, longitud recortada 1–120; `created_at`, `updated_at` timestamptz default `now()`. | Tabla pública de perfil para nombre/correo del formulario. Un trigger `SECURITY DEFINER` la crea/sincroniza desde `auth.users` y hace backfill. No contiene contraseña; las credenciales permanecen en Supabase Auth. |
| Venta (`public.sales`) | Vista derivada: renglones de pedidos no cancelados con identificadores, producto, cantidad, precio, total de línea, pago y fecha. | Recurso de lectura para el panel existente, derivado del modelo de pedidos; no es una entidad definida en el PDF. `security_invoker` conserva RLS de tablas base. |

## Relaciones y cardinalidades

- Usuario autenticado 1 — 0..N pedidos: `orders.cliente_id → auth.users.id`. Cada pedido pertenece exactamente a una cuenta; `ON DELETE RESTRICT` conserva el historial.
- Pedido 1 — 1..N renglones: `order_items.order_id → orders.id`. La creación de pedido valida al menos un renglón dentro de una función transaccional.
- Producto 1 — 0..N renglones: `order_items.product_id → products.id`. Los renglones conservan nombre y precio histórico; `ON DELETE RESTRICT` evita borrar productos referenciados.
- Usuario 1 — 0..1 rol administrativo: `user_roles.user_id → auth.users.id`. La fila solo representa admin/staff autorizable; los clientes no necesitan rol explícito.
- Usuario 1 — 1 perfil: `profiles.user_id → auth.users.id`. La fila se genera automáticamente al crear una cuenta de Auth.
- `sales` se deriva por JOIN de `order_items` y `orders`; no es una relación editable por separado.

Estas cardinalidades describen la migración y el código actual, no el PDF: el documento no dibuja cardinalidades.

## Matriz de operaciones y acceso

| Entidad / operación | Público (visitante) | Cliente autenticado | Admin / staff autorizado | Implementación / verificación |
|---|---|---|---|---|
| Productos: Crear | Denegado | Denegado | Denegado desde cliente público | No se concede escritura API; catálogo inicial en migración. |
| Productos: Leer | Sí, menú | Sí, menú | Sí | SELECT público con RLS. |
| Productos: Actualizar / Eliminar | Denegado | Denegado | Denegado desde cliente público | Sin grants/policies de escritura. |
| Pedidos: Crear | Denegado | Sí, solo mediante `create_customer_order` | También sujeto a identidad autenticada; función fija propietario desde `auth.uid()` | Función valida entradas, stock, precios y crea atómicamente pedido/renglones. SQL de pgTAP contempla la operación. |
| Pedidos: Leer | Denegado | Solo propios | Todos | RLS en `orders`; escenario SQL de dos clientes y staff. |
| Pedidos: Actualizar | Denegado | Denegado | Solo cambio de estado permitido por trigger | Privilegio limitado a `status`, `cancelled_by`; trigger valida rol y transición. |
| Pedidos: Eliminar | Denegado | Denegado | Denegado | Sin permiso DELETE; historial conservado. |
| Renglones: Crear | Denegado | Solo indirectamente al crear pedido | No se expone CRUD directo | Escritura dentro de la función segura. |
| Renglones: Leer | Denegado | Solo de pedidos propios | Todos | RLS por propietario o personal. |
| Renglones: Actualizar / Eliminar | Denegado | Denegado | Denegado desde API | Sin grants de escritura. |
| Roles: CRUD | Denegado | Denegado | Denegado desde app | Asignación administrativa mediante SQL controlado; no se permite autoasignación de rol. |
| Perfiles: Crear | Trigger interno al registrar en Auth | Trigger interno al registrar en Auth | Trigger interno al registrar en Auth | No hay INSERT directo desde API. |
| Perfiles: Leer | Denegado | Solo propio | Solo su propio perfil | RLS y grant SELECT a usuarios autenticados. |
| Perfiles: Actualizar / Eliminar | Denegado | Puede actualizar `full_name` solo en su perfil | Puede actualizar `full_name` solo en su perfil | RLS por `user_id`; `user_id` y `email` no son actualizables y no hay DELETE. |
| Ventas: Leer | Denegado | Denegado | Sí, todas las no canceladas | Vista con `security_invoker`; RLS en tablas base. |

La matriz combina los permisos expresos del PDF con los recursos que ya usa la app. El PDF no pide CRUD de catálogo, roles, renglones o ventas como tablas independientes.

## Flujos de la aplicación

- Menú: `src/lib/cocoLatteApi.js` → `fetchProducts()` → SELECT de `products`; público.
- Registro/inicio/cierre: `signUp()`, `signIn()`, `signOut()` vía Supabase Auth. El trigger copia nombre/correo a `profiles`; `getCurrentUser()` lee el nombre desde el perfil. La contraseña nunca se consulta desde una tabla pública. Los permisos administrativos se resuelven con `is_authorized_staff()`.
- Checkout: `src/pages/CheckoutPage.jsx` → `createOrder()` → RPC `create_customer_order`; el cliente no envía `cliente_id`, precio autoritativo ni total calculado.
- Mis pedidos: `src/pages/OrdersPage.jsx` → `fetchCustomerOrders()` → RLS limita pedidos/renglones al propietario.
- Dashboard: `src/pages/DashboardPage.jsx` → `fetchDashboardData()`; la ruta se restringe en React y los datos se vuelven a proteger mediante RLS.
- Cambio de estado: UI propone el siguiente paso; `enforce_order_status_transition()` es la validación autoritativa de base.

## Decisiones y pendientes

- Se conserva el diseño y los flujos actuales. `profiles` guarda los datos de cuenta visibles del formulario; el inicio de sesión siempre valida correo/contraseña con Supabase Auth, que almacena hashes bcrypt con sal y no contraseñas reversibles.
- El PDF no aporta suficiente detalle para afirmar que existe un modelo ER/CRUD formal. Para mayor fidelidad académica, haría falta un ER/CRUD separado si se esperaba que el PDF definiera cada atributo/operación.
- La organización tiene un proyecto en plan gratuito; la CLI confirmó que está activo y enlazado, y la referencia coincide con `.env.local`. No se creó un proyecto duplicado.
- Se aplicaron `20261116120000_create_account_profiles.sql` y `20261116130000_restrict_auth_rpcs_from_anon.sql` tras dry-run. El historial remoto coincide con las migraciones locales.
- Las pruebas pgTAP en Cloud pasaron 26/26; cada escenario usó usuarios ficticios y el script termina con `ROLLBACK`. La revisión posterior encontró 1 usuario Auth y 1 perfil persistentes, que no se atribuyen a la prueba. La creación/inicio de sesión real desde UI queda por probar manualmente.
