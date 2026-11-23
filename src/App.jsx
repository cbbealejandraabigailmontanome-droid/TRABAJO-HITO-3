import { useCallback, useEffect, useState } from 'react';
import { BackToTop, Footer, Navbar } from './components/SiteLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { readStored, sampleProducts, saveStored } from './data.js';
import { supabase } from './lib/supabase.js';
import {
  createOrder,
  fetchCustomerOrders,
  fetchDashboardData,
  fetchProducts,
  getCurrentUser,
  signOut,
  updateOrderStatus,
} from './lib/cocoLatteApi.js';

function routeFor(pathname) {
  const base = import.meta.env.BASE_URL;
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  let appPathname = pathname;
  if (base !== '/') {
    if (pathname === normalizedBase) appPathname = '/';
    else if (pathname.startsWith(base)) appPathname = `/${pathname.slice(base.length)}`;
  }
  const normalizedPath = appPathname.replace(/\/+$/, '') || '/';
  const routes = {
    '/': 'home', '/index.html': 'home', '/menu': 'menu', '/menu.html': 'menu',
    '/login': 'login', '/login.html': 'login', '/checkout': 'checkout',
    '/checkout.html': 'checkout', '/dashboard': 'dashboard', '/dashboard.html': 'dashboard',
    '/orders': 'orders', '/orders.html': 'orders',
  };
  return Object.hasOwn(routes, normalizedPath) ? routes[normalizedPath] : 'not-found';
}

function appPath(pathname) {
  const base = import.meta.env.BASE_URL;
  if (base === '/') return pathname;
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${pathname.replace(/^\/+/, '')}`;
}

function MessagePage({ children }) {
  return <main className="checkout-page"><p className="label">COCO LATTE</p><h1>{children}</h1></main>;
}

export default function App() {
  const [state, setState] = useState(() => ({
    products: sampleProducts,
    sales: [],
    orders: [],
    customerOrders: [],
    cart: readStored('cart', []),
    session: null,
  }));
  const [authReady, setAuthReady] = useState(!supabase);
  const [dataError, setDataError] = useState('');
  const [pathname, setPathname] = useState(window.location.pathname);
  const [dashboardReady, setDashboardReady] = useState(false);
  const page = routeFor(pathname);
  const loginRequired = (page === 'checkout' || page === 'orders') && state.session?.role !== 'cliente';

  useEffect(() => {
    saveStored('cart', state.cart);
  }, [state.cart]);

  useEffect(() => {
    if (!supabase) return undefined;
    let mounted = true;
    let lastSessionKey;
    let sessionRequest = 0;
    const syncAuthSession = (authSession) => {
      const sessionKey = authSession?.access_token || null;
      if (sessionKey === lastSessionKey) return;
      lastSessionKey = sessionKey;
      const requestId = ++sessionRequest;
      if (!authSession?.user) {
        setState((current) => ({ ...current, session: null }));
        setAuthReady(true);
        return;
      }
      getCurrentUser(authSession.user)
        .then((session) => {
          if (mounted && requestId === sessionRequest) setState((current) => ({ ...current, session }));
        })
        .catch((error) => {
          if (mounted && requestId === sessionRequest) setDataError(error.message);
        })
        .finally(() => {
          if (mounted && requestId === sessionRequest) setAuthReady(true);
        });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, authSession) => {
      window.setTimeout(() => {
        if (mounted) syncAuthSession(authSession);
      }, 0);
    });
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) throw error;
        syncAuthSession(data.session);
      })
      .catch(() => {
        if (mounted) {
          setDataError('No pudimos comprobar tu sesión. Recarga la página e intenta nuevamente.');
          setAuthReady(true);
        }
      });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const nextPath = window.location.pathname;
      if (routeFor(nextPath) === 'dashboard') setDashboardReady(false);
      setPathname(nextPath);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    fetchProducts()
      .then((products) => setState((current) => ({ ...current, products })))
      .catch((error) => setDataError(error.message));
  }, []);

  useEffect(() => {
    const titles = { home: 'Coco Latte | Cafeteria', menu: 'Menu | Coco Latte', login: 'Acceso | Coco Latte', checkout: 'Finalizar pedido | Coco Latte', dashboard: 'Panel | Coco Latte', orders: 'Mis pedidos | Coco Latte', 'not-found': 'Pagina no encontrada | Coco Latte' };
    document.title = titles[loginRequired ? 'login' : page];
  }, [page, loginRequired]);

  useEffect(() => {
    if (!authReady || page !== 'dashboard' || state.session?.role !== 'admin') return;
    fetchDashboardData()
      .then((data) => {
        setState((current) => ({ ...current, ...data }));
        setDataError('');
      })
      .catch((error) => setDataError(error.message))
      .finally(() => setDashboardReady(true));
  }, [page, authReady, state.session?.role]);

  useEffect(() => {
    if (!authReady || page !== 'orders' || state.session?.role !== 'cliente') return;
    fetchCustomerOrders()
      .then((orders) => setState((current) => ({ ...current, customerOrders: orders })))
      .catch((error) => setDataError(error.message));
  }, [page, authReady, state.session?.role]);

  const navigate = useCallback((event, href) => {
    const url = new URL(href, window.location.href);
    const webProtocol = url.protocol === 'http:' || url.protocol === 'https:';
    if (!webProtocol || url.origin !== window.location.origin) {
      if (!event && webProtocol) window.location.assign(url.href);
      return;
    }
    if (event) {
      const link = event.currentTarget;
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link?.hasAttribute('download') || (link?.target && link.target !== '_self')) return;
      event.preventDefault();
    }
    const nextPath = appPath(url.pathname);
    const nextUrl = `${nextPath}${url.search}${url.hash}`;
    if (nextUrl === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;
    if (routeFor(nextPath) === 'dashboard') setDashboardReady(false);
    window.history.pushState({}, '', nextUrl);
    setPathname(nextPath);
    if (url.hash) requestAnimationFrame(() => document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView({ behavior: 'smooth' }));
    else window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!authReady || page !== 'login' || !state.session) return;
    const timer = window.setTimeout(() => {
      navigate(null, state.session.role === 'admin' ? '/dashboard.html' : '/');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authReady, navigate, page, state.session]);

  function addToCart(product, quantity = 1) {
    setState((current) => {
      const stock = current.products.find((item) => item.id === product.id)?.stock || 0;
      const existing = current.cart.find((item) => item.id === product.id);
      const nextQuantity = Math.min(stock, (existing?.quantity || 0) + quantity);
      const cart = existing
        ? current.cart.map((item) => item.id === product.id ? { ...item, quantity: nextQuantity } : item)
        : nextQuantity > 0 ? [...current.cart, { id: product.id, name: product.name, price: product.price, quantity: nextQuantity }] : current.cart;
      return { ...current, cart };
    });
  }

  function changeCart(id, amount) {
    setState((current) => {
      const product = current.products.find((item) => item.id === id);
      const cart = current.cart.map((item) => item.id === id ? { ...item, quantity: Math.min(product?.stock || 0, item.quantity + amount) } : item).filter((item) => item.quantity > 0);
      return { ...current, cart };
    });
  }

  async function placeOrder(customer) {
    const unavailable = state.cart.find((item) => !state.products.some((product) => product.id === item.id && product.stock >= item.quantity));
    if (unavailable) return { error: `No hay stock suficiente de ${unavailable.name}. Regresa al menu para ajustar tu pedido.` };
    try {
      const created = await createOrder({ customer, cart: state.cart });
      const products = await fetchProducts();
      setState((current) => ({ ...current, products, cart: [] }));
      return { order: { ...created, number: String(created.order_number).padStart(4, '0') } };
    } catch (error) {
      return { error: error.message };
    }
  }

  async function changeOrderStatus(id, status) {
    try {
      await updateOrderStatus(id, status);
      setState((current) => ({ ...current, orders: current.orders.map((order) => order.id === id ? { ...order, status } : order) }));
      setDataError('');
    } catch (error) {
      setDataError(error.message);
    }
  }

  async function onLogout() {
    try {
      await signOut();
      setState((current) => ({ ...current, session: null, customerOrders: [], cart: [] }));
      navigate(null, '/login.html');
    } catch (error) {
      setDataError(error.message);
    }
  }

  const onLogin = (session) => {
    setState((current) => ({ ...current, session }));
    const pendingName = localStorage.getItem('cocoLatte_pendingProduct');
    const pending = state.products.find((product) => product.name === pendingName && product.stock > 0);
    if (pending) addToCart(pending);
    localStorage.removeItem('cocoLatte_pendingProduct');
    navigate(null, session.role === 'admin' ? '/dashboard.html' : '/');
  };

  if (!authReady && (page === 'login' || page === 'dashboard' || page === 'checkout' || page === 'orders')) return <MessagePage>Verificando tu acceso...</MessagePage>;

  const deniedPage = page === 'dashboard' && state.session?.role !== 'admin';
  const showLogin = page === 'login' || loginRequired || deniedPage;
  return <>
    {page !== 'login' && !loginRequired && !deniedPage && <Navbar session={state.session} onLogout={onLogout} navigate={navigate} checkout={page === 'checkout'} dashboard={page === 'dashboard'} home={page === 'home'} />}
    {showLogin ? <LoginPage navigate={navigate} onLogin={onLogin} initialError={deniedPage ? state.session ? 'Esta cuenta no tiene permisos para el panel administrativo.' : 'Inicia sesion con una cuenta autorizada para acceder al panel.' : ''} />
      : page === 'menu' ? <MenuPage products={state.products} cart={state.cart} session={state.session} navigate={navigate} onAdd={addToCart} onCartChange={changeCart} onCartClear={() => setState((current) => ({ ...current, cart: [] }))} />
        : page === 'checkout' ? <CheckoutPage cart={state.cart} session={state.session} navigate={navigate} onPlaceOrder={placeOrder} />
          : page === 'dashboard' ? dashboardReady ? <DashboardPage products={state.products} sales={state.sales} orders={state.orders} error={dataError} onOrderStatusChange={changeOrderStatus} /> : <MessagePage>{dataError || 'Cargando panel...'}</MessagePage>
            : page === 'orders' ? <OrdersPage orders={state.customerOrders} error={dataError} />
              : page === 'home' ? <HomePage navigate={navigate} /> : <NotFoundPage navigate={navigate} />}
    {page !== 'login' && page !== 'checkout' && page !== 'dashboard' && <Footer />}
    {page !== 'login' && !loginRequired && !deniedPage && <BackToTop />}
  </>;
}
