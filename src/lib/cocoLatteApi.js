import { setRememberSession, supabase } from './supabase.js';

export function requireSupabase() {
  if (!supabase) {
    throw new Error('No pudimos conectarnos. Intenta nuevamente.');
  }
  return supabase;
}

export async function getCurrentUser(authenticatedUser = null) {
  const client = requireSupabase();
  let user = authenticatedUser;
  if (!user) {
    const { data, error } = await client.auth.getUser();
    if (error) throw readableAuthError(error);
    user = data.user;
  }
  if (!user) return null;

  const [
    { data: isStaff, error: roleError },
    { data: profile, error: profileError },
  ] = await Promise.all([
    client.rpc('is_authorized_staff'),
    client.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle(),
  ]);
  return {
    id: user.id,
    email: user.email,
    name: (!profileError && profile?.full_name) || user.user_metadata?.full_name || user.email,
    // If the role lookup fails, fail closed and keep the account in the customer role.
    role: !roleError && isStaff ? 'admin' : 'cliente',
  };
}

export async function signIn(email, password, remember = true) {
  const client = requireSupabase();
  validateCredentials(email, password);
  setRememberSession(remember);
  const { data, error } = await client.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });
  if (error) throw readableAuthError(error);
  if (!data.user || !data.session) throw new Error('No se pudo comprobar la sesión. Inténtalo de nuevo.');
  return getCurrentUser(data.user);
}

export async function signUp(name, email, password, remember = true) {
  const client = requireSupabase();
  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 120) {
    throw new Error('Escribe tu nombre completo (entre 2 y 120 caracteres).');
  }
  validateCredentials(email, password);
  setRememberSession(remember);
  const { data, error } = await client.auth.signUp({
    email: normalizeEmail(email),
    password,
    options: { data: { full_name: cleanName } },
  });
  if (error) throw readableAuthError(error);
  if (data.user && data.user.identities?.length === 0) {
    throw new Error('Este correo ya tiene una cuenta. Inicia sesión con ese correo y contraseña.');
  }
  if (!data.session) return null;
  if (!data.user) throw new Error('Supabase no devolvió los datos de la cuenta. Inténtalo de nuevo.');
  return getCurrentUser(data.user);
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function validateCredentials(email, password) {
  const normalizedEmail = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Escribe una dirección de correo electrónico válida.');
  }
  if (!password || password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }
}

function readableAuthError(error) {
  const code = String(error.code || '').toLowerCase();
  const message = String(error.message || '').toLowerCase();

  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return new Error('El correo o la contraseña son incorrectos. Revisa los datos o crea una cuenta.');
  }
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return new Error('Tu cuenta necesita confirmar el correo electrónico antes de iniciar sesión.');
  }
  if (code === 'user_already_exists' || message.includes('already registered')) {
    return new Error('Este correo ya está registrado. Cambia a “Iniciar sesión” para entrar.');
  }
  if (code === 'email_rate_limit_exceeded' || code === 'over_email_send_rate_limit' || message.includes('email rate limit')) {
    return new Error('Supabase limitó temporalmente los correos de registro. Espera antes de volver a intentarlo; no pulses varias veces el botón.');
  }
  if (code === 'weak_password' || message.includes('password should be')) {
    return new Error('La contraseña no cumple los requisitos de seguridad configurados. Usa una contraseña más larga y segura.');
  }
  if (code === 'email_address_invalid' || message.includes('invalid email')) {
    return new Error('Escribe una dirección de correo electrónico válida.');
  }
  if (error.name === 'AuthRetryableFetchError' || error instanceof TypeError || /network|fetch failed|failed to fetch/.test(message)) {
    return new Error('No pudimos conectarnos. Intenta nuevamente.');
  }
  return new Error('No se pudo completar la operación. Inténtalo más tarde.');
}

export async function signOut() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function fetchProducts() {
  const client = requireSupabase();
  const { data, error } = await client.from('products').select('*').order('id');
  if (error) throw error;
  return data.map((product) => ({
    ...product,
    available: product.stock > 0,
    image: `${import.meta.env.BASE_URL}${product.image.replace(/^\//, '')}`,
  }));
}

export async function createOrder({ customer, cart }) {
  const client = requireSupabase();
  const { data, error } = await client.rpc('create_customer_order', {
    p_customer_name: customer.name,
    p_customer_phone: customer.phone,
    p_payment_method: customer.payment,
    p_order_type: customer.type,
    p_items: cart.map(({ id, quantity }) => ({ product_id: id, quantity })),
  });
  if (error) throw error;
  return data;
}

export async function fetchCustomerOrders() {
  const client = requireSupabase();
  const { data, error } = await client.from('orders')
    .select('id, order_number, customer_name, payment_method, status, created_at, order_items(product_name, quantity, unit_price)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapOrder);
}

export async function fetchDashboardData() {
  const client = requireSupabase();
  const [ordersResult, salesResult, productsResult] = await Promise.all([
    client.from('orders')
      .select('id, order_number, customer_name, payment_method, status, created_at, order_items(product_name, quantity, unit_price)')
      .order('created_at', { ascending: false }),
    client.from('sales').select('*'),
    fetchProducts(),
  ]);
  if (ordersResult.error) throw ordersResult.error;
  if (salesResult.error) throw salesResult.error;
  return {
    orders: ordersResult.data.map(mapOrder),
    sales: salesResult.data.map((sale) => ({
      orderId: sale.order_id,
      productId: sale.product_id,
      product: sale.product_name,
      quantity: sale.quantity,
      price: Number(sale.unit_price),
      total: Number(sale.line_total),
      date: sale.created_at,
      metodoPago: sale.payment_method,
    })),
    products: productsResult,
  };
}

function mapOrder(order) {
  const items = order.order_items.map((item) => ({
    name: item.product_name,
    quantity: item.quantity,
    price: Number(item.unit_price),
  }));
  return {
    id: order.id,
    number: String(order.order_number).padStart(4, '0'),
    customer: order.customer_name,
    payment: order.payment_method,
    status: order.status,
    date: order.created_at,
    items,
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
}

export async function updateOrderStatus(orderId, status) {
  const client = requireSupabase();
  const { error } = await client.from('orders').update({
    status,
    ...(status === 'Cancelado' ? { cancelled_by: (await client.auth.getUser()).data.user.id } : {}),
  }).eq('id', orderId);
  if (error) throw error;
}
