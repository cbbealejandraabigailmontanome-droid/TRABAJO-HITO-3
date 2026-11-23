create table public.products (
  id integer primary key,
  name text not null,
  description text not null,
  category text not null,
  price numeric(10, 2) not null check (price >= 0),
  stock integer not null check (stock >= 0),
  image text not null
);

insert into public.products (id, name, description, category, price, stock, image) values
  (1, 'Cafe Latte', 'Espresso suave con leche vaporizada.', 'Cafes', 18, 20, '/img/productos/cafe-latte.webp'),
  (2, 'Cappuccino', 'Cafe intenso, espuma cremosa y canela.', 'Cafes', 19, 18, '/img/productos/cappuccino.webp'),
  (3, 'Americano', 'Cafe negro, intenso y aromatico.', 'Cafes', 14, 25, '/img/productos/americano.webp'),
  (4, 'Mocha', 'Cafe, chocolate y leche cremosa.', 'Cafes', 21, 22, '/img/productos/mocha.webp'),
  (5, 'Frappe de Chocolate', 'Chocolate frio, crema y mucho sabor.', 'Frappes', 25, 15, '/img/productos/frappe-chocolate.webp'),
  (6, 'Frappe de Fresa', 'Fresa fresca con crema helada.', 'Frappes', 24, 14, '/img/productos/frappe-fresa.webp'),
  (7, 'Frappe de Oreo', 'Galleta, crema y chocolate.', 'Frappes', 26, 12, '/img/productos/frappe-oreo.webp'),
  (8, 'Frappe de Caramelo', 'Caramelo dulce y crema batida.', 'Frappes', 23, 18, '/img/productos/frappe-caramelo.webp'),
  (9, 'Limonada de coco', 'Refrescante bebida tropical.', 'Bebidas', 17, 20, '/img/productos/limonada-coco.webp'),
  (10, 'Te Helado de Limon', 'Te refrescante con limon y hielo.', 'Bebidas', 12, 25, '/img/productos/te-helado-limon.webp'),
  (11, 'Smoothie de Mango', 'Mango, yogurt y miel naturales.', 'Bebidas', 18, 19, '/img/productos/smoothie-mango.webp'),
  (12, 'Chocolate Frio', 'Chocolate frio con crema batida.', 'Bebidas', 10, 28, '/img/productos/chocolate-frio.webp'),
  (13, 'Cheesecake', 'Cremoso cheesecake con frutos rojos.', 'Postres', 20, 10, '/img/productos/cheesecake.webp'),
  (14, 'Brownie', 'Chocolate intenso con nueces.', 'Postres', 15, 8, '/img/productos/brownie.webp'),
  (15, 'Croissant', 'Mantequilloso y horneado cada dia.', 'Postres', 13, 7, '/img/productos/croissant.webp'),
  (16, 'Torta de Zanahoria', 'Especias suaves y cobertura cremosa.', 'Postres', 18, 15, '/img/productos/torta-zanahoria.webp');

create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'staff')),
  authorized boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_authorized_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and authorized and role in ('admin', 'staff')
  );
$$;

revoke all on function public.is_authorized_staff() from public;
grant execute on function public.is_authorized_staff() to authenticated;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  cliente_id uuid not null default auth.uid() references auth.users (id) on delete restrict,
  customer_name text not null,
  customer_phone text not null,
  payment_method text not null check (payment_method in ('Efectivo', 'QR', 'Tarjeta')),
  order_type text not null check (order_type in ('Recoger en cafeteria', 'Consumo en el local')),
  status text not null default 'Recibido' check (status in ('Recibido', 'En preparación', 'Listo', 'Entregado', 'Cancelado')),
  created_at timestamptz not null default now(),
  cancelled_by uuid references auth.users (id) on delete restrict
);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete restrict,
  product_id integer not null references public.products (id) on delete restrict,
  product_name text not null,
  quantity integer not null check (quantity between 1 and 99),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  unique (order_id, product_id)
);

create or replace function public.enforce_order_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.cliente_id is distinct from old.cliente_id
    or new.order_number is distinct from old.order_number
    or new.customer_name is distinct from old.customer_name
    or new.customer_phone is distinct from old.customer_phone
    or new.payment_method is distinct from old.payment_method
    or new.order_type is distinct from old.order_type
    or new.created_at is distinct from old.created_at then
    raise exception 'Los datos del pedido no se pueden cambiar';
  end if;

  if new.status = old.status then
    if new.cancelled_by is distinct from old.cancelled_by then
      raise exception 'No se puede cambiar el registro de cancelacion';
    end if;
    return new;
  end if;

  if not public.is_authorized_staff() then
    raise exception 'Solo personal autorizado puede cambiar el estado';
  end if;

  if (old.status = 'Recibido' and new.status = 'En preparación')
    or (old.status = 'En preparación' and new.status = 'Listo')
    or (old.status = 'Listo' and new.status = 'Entregado') then
    if new.cancelled_by is distinct from old.cancelled_by then
      raise exception 'No se permite cambiar el registro de cancelacion';
    end if;
    return new;
  end if;

  if new.status = 'Cancelado' and old.status in ('Recibido', 'En preparación', 'Listo') then
    if new.cancelled_by is distinct from auth.uid() then
      raise exception 'La cancelacion debe registrar al usuario que la realiza';
    end if;
    return new;
  end if;

  raise exception 'Transicion de estado no permitida: % -> %', old.status, new.status;
end;
$$;

create trigger orders_status_transition
before update on public.orders
for each row execute function public.enforce_order_status_transition();

create or replace function public.restore_stock_after_order_cancel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'Cancelado' and old.status <> 'Cancelado' then
    update public.products p
    set stock = p.stock + oi.quantity
    from public.order_items oi
    where oi.order_id = new.id and oi.product_id = p.id;
  end if;
  return new;
end;
$$;

create trigger orders_restore_stock_on_cancel
after update of status on public.orders
for each row execute function public.restore_stock_after_order_cancel();

create or replace function public.create_customer_order(
  p_customer_name text,
  p_customer_phone text,
  p_payment_method text,
  p_order_type text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_product_id integer;
  v_quantity integer;
begin
  if v_user_id is null then raise exception 'Debes iniciar sesion para pedir'; end if;
  if length(trim(coalesce(p_customer_name, ''))) not between 2 and 120 then raise exception 'Nombre no valido'; end if;
  if length(trim(coalesce(p_customer_phone, ''))) not between 5 and 40 then raise exception 'Telefono no valido'; end if;
  if p_payment_method is null or p_payment_method not in ('Efectivo', 'QR', 'Tarjeta') then raise exception 'Metodo de pago no valido'; end if;
  if p_order_type is null or p_order_type not in ('Recoger en cafeteria', 'Consumo en el local') then raise exception 'Tipo de pedido no valido'; end if;
  if p_items is null or jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'El pedido no tiene productos validos'; end if;

  insert into public.orders (cliente_id, customer_name, customer_phone, payment_method, order_type)
  values (v_user_id, trim(p_customer_name), trim(p_customer_phone), p_payment_method, p_order_type)
  returning * into v_order;

  for v_item in select value from jsonb_array_elements(p_items) loop
    if coalesce(v_item->>'product_id', '') !~ '^[0-9]+$'
      or coalesce(v_item->>'quantity', '') !~ '^[0-9]+$' then
      raise exception 'Producto o cantidad no valido';
    end if;
    v_product_id := (v_item->>'product_id')::integer;
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity not between 1 and 99 then raise exception 'Cantidad fuera de rango'; end if;

    select * into v_product from public.products where id = v_product_id for update;
    if not found then raise exception 'Producto no disponible'; end if;
    if v_product.stock < v_quantity then raise exception 'Stock insuficiente para %', v_product.name; end if;

    update public.products set stock = stock - v_quantity where id = v_product_id;
    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price)
    values (v_order.id, v_product.id, v_product.name, v_quantity, v_product.price);
  end loop;

  return jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'payment', v_order.payment_method,
    'total', (select sum(quantity * unit_price) from public.order_items where order_id = v_order.id)
  );
end;
$$;

revoke all on function public.create_customer_order(text, text, text, text, jsonb) from public;
grant execute on function public.create_customer_order(text, text, text, text, jsonb) to authenticated;

create view public.sales with (security_invoker = true) as
select oi.id as sale_id, o.id as order_id, oi.product_id, oi.product_name,
       oi.quantity, oi.unit_price, oi.quantity * oi.unit_price as line_total,
       o.payment_method, o.created_at
from public.order_items oi
join public.orders o on o.id = oi.order_id
where o.status <> 'Cancelado';

alter table public.products enable row level security;
alter table public.user_roles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Anyone can view the menu" on public.products
for select to anon, authenticated using (true);

create policy "Customers and staff can view allowed orders" on public.orders
for select to authenticated
using (cliente_id = (select auth.uid()) or (select public.is_authorized_staff()));

create policy "Only authorized staff can update orders" on public.orders
for update to authenticated
using ((select public.is_authorized_staff()))
with check ((select public.is_authorized_staff()));

create policy "Customers and staff can view allowed order items" on public.order_items
for select to authenticated
using (
  exists (select 1 from public.orders o where o.id = order_id and o.cliente_id = (select auth.uid()))
  or (select public.is_authorized_staff())
);

-- Clear default API grants, then expose only the reads and status column update needed.
revoke all privileges on table public.products, public.user_roles, public.orders, public.order_items from anon, authenticated;
revoke all privileges on table public.sales from anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.orders, public.order_items to authenticated;
grant update (status, cancelled_by) on public.orders to authenticated;
grant select on public.sales to authenticated;

create policy "Only authorized staff can read sales" on public.order_items
for select to authenticated using ((select public.is_authorized_staff()));
