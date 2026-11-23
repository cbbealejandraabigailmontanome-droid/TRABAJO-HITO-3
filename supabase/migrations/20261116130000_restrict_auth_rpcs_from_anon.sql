-- Supabase default privileges may grant API execution to anon directly.
-- Revoke it explicitly; these functions are intended for authenticated users.
revoke all on function public.create_customer_order(text, text, text, text, jsonb)
from public, anon;

revoke all on function public.is_authorized_staff()
from public, anon;

grant execute on function public.create_customer_order(text, text, text, text, jsonb)
to authenticated;

grant execute on function public.is_authorized_staff()
to authenticated;
