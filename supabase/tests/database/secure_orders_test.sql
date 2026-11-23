begin;
create extension if not exists pgtap with schema extensions;
create temporary table test_output (tap text);
grant insert, select on pg_temp.test_output to anon, authenticated;
insert into pg_temp.test_output select extensions.plan(26);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'customer-one@example.test', '', now(), now(), now(), '{}', '{"full_name":"Cliente Uno"}'),
  ('00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'customer-two@example.test', '', now(), now(), now(), '{}', '{"full_name":"Cliente Dos"}'),
  ('00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'staff@example.test', '', now(), now(), now(), '{}', '{"full_name":"Personal"}')
on conflict (id) do nothing;

insert into public.user_roles (user_id, role, authorized)
values ('00000000-0000-0000-0000-000000000003', 'staff', true)
on conflict (user_id) do update set role = excluded.role, authorized = excluded.authorized;

set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);
insert into pg_temp.test_output select extensions.is(
  has_function_privilege('anon', 'public.create_customer_order(text, text, text, text, jsonb)', 'EXECUTE'),
  false,
  'visitor has no execute privilege on the order creation function'
);
insert into pg_temp.test_output select extensions.is(
  has_function_privilege('anon', 'public.is_authorized_staff()', 'EXECUTE'),
  false,
  'visitor has no execute privilege on the staff authorization function'
);
insert into pg_temp.test_output select extensions.throws_ok(
  $$select * from public.orders$$,
  '42501', null, 'visitor cannot read orders'
);
insert into pg_temp.test_output select extensions.throws_ok(
  $$select * from public.profiles$$,
  '42501', null, 'visitor cannot read profiles'
);
insert into pg_temp.test_output select extensions.throws_ok(
  $$select public.create_customer_order('Visitante', '70000000', 'QR', 'Recoger en cafeteria', '[{"product_id":1,"quantity":1}]'::jsonb)$$,
  '42501', null, 'visitor cannot create orders'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
insert into pg_temp.test_output select extensions.lives_ok(
  $$select public.create_customer_order('Cliente Uno', '70000001', 'QR', 'Recoger en cafeteria', '[{"product_id":1,"quantity":1}]'::jsonb)$$,
  'customer can create an order'
);
insert into pg_temp.test_output select extensions.is((select count(*)::integer from public.orders), 1, 'customer can read their own order');
insert into pg_temp.test_output select extensions.is((select count(*)::integer from public.profiles where user_id = auth.uid() and full_name = 'Cliente Uno'), 1, 'customer can read their own profile');
insert into pg_temp.test_output select extensions.lives_ok(
  $$update public.profiles set full_name = 'Nombre Actualizado' where user_id = auth.uid()$$,
  'customer can update their own profile name'
);
insert into pg_temp.test_output select extensions.is_empty(
  $$update public.profiles set full_name = 'Cambio ajeno' where user_id = '00000000-0000-0000-0000-000000000002' returning user_id$$,
  'customer cannot update another profile'
);
insert into pg_temp.test_output select extensions.is(
  has_column_privilege('authenticated', 'public.profiles', 'user_id', 'UPDATE'), false,
  'customer cannot change their profile user id'
);
insert into pg_temp.test_output select extensions.is(
  has_column_privilege('authenticated', 'public.profiles', 'email', 'UPDATE'), false,
  'customer cannot change the Auth-managed profile email'
);
insert into pg_temp.test_output select extensions.is(
  has_table_privilege('authenticated', 'public.user_roles', 'INSERT'), false,
  'customer cannot assign themselves a staff role'
);
insert into pg_temp.test_output select extensions.is_empty(
  $$update public.orders set status = 'Entregado' where cliente_id = '00000000-0000-0000-0000-000000000001' returning id$$,
  'customer cannot change order status'
);
insert into pg_temp.test_output select extensions.throws_ok(
  $$delete from public.orders where cliente_id = '00000000-0000-0000-0000-000000000001'$$,
  '42501', null, 'customer cannot delete orders'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
insert into pg_temp.test_output select extensions.lives_ok(
  $$select public.create_customer_order('Cliente Dos', '70000002', 'Efectivo', 'Consumo en el local', '[{"product_id":2,"quantity":1}]'::jsonb)$$,
  'second customer can create an order'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
insert into pg_temp.test_output select extensions.is((select count(*)::integer from public.orders), 1, 'customer cannot read another customer order');
insert into pg_temp.test_output select extensions.is((select count(*)::integer from public.profiles where user_id = '00000000-0000-0000-0000-000000000002'), 0, 'customer cannot read another customer profile');
insert into pg_temp.test_output select extensions.is((select count(*)::integer from public.sales), 1, 'customer cannot read another customer sale');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
insert into pg_temp.test_output select extensions.is((select count(*)::integer from public.orders), 2, 'authorized staff can read every order');
insert into pg_temp.test_output select extensions.is((select count(*)::integer from public.sales), 2, 'authorized staff can read every sale');
insert into pg_temp.test_output select extensions.lives_ok(
  $$update public.orders set status = 'En preparación' where cliente_id = '00000000-0000-0000-0000-000000000001'$$,
  'authorized staff can advance to the next status'
);
insert into pg_temp.test_output select extensions.throws_ok(
  $$update public.orders set status = 'Entregado' where cliente_id = '00000000-0000-0000-0000-000000000001'$$,
  'P0001', null, 'authorized staff cannot skip a status'
);
insert into pg_temp.test_output select extensions.lives_ok(
  $$update public.orders set status = 'Cancelado', cancelled_by = auth.uid() where cliente_id = '00000000-0000-0000-0000-000000000001'$$,
  'authorized staff can cancel and the database records the actor'
);
insert into pg_temp.test_output select extensions.is(
  (select cancelled_by = '00000000-0000-0000-0000-000000000003'::uuid from public.orders where cliente_id = '00000000-0000-0000-0000-000000000001'),
  true, 'cancellation records the authorized staff member'
);
insert into pg_temp.test_output select extensions.is((select stock from public.products where id = 1), 20, 'cancelling an order restores reserved stock');

insert into pg_temp.test_output select * from extensions.finish();
select json_agg(tap order by ctid) as test_results from pg_temp.test_output;
rollback;
