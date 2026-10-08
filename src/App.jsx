import { useCallback, useEffect, useState } from 'react';
import { BackToTop, Footer, Navbar } from './components/SiteLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { getInitialState, saveStored } from './data.js';

function routeFor(pathname) {
  if (pathname.endsWith('/menu.html')) return 'menu';
  if (pathname.endsWith('/login.html')) return 'login';
  if (pathname.endsWith('/checkout.html')) return 'checkout';
  if (pathname.endsWith('/dashboard.html')) return 'dashboard';
  return 'home';
}

export default function App() {
  const [state, setState] = useState(getInitialState);
  const [pathname, setPathname] = useState(window.location.pathname);
  const [notice, setNotice] = useState('');
  const page = routeFor(pathname);
  const loginRequired = page === 'checkout' && state.session?.role !== 'cliente';

  useEffect(() => {
    saveStored('products', state.products);
    saveStored('sales', state.sales);
    saveStored('orders', state.orders);
    saveStored('cart', state.cart);
    if (state.session) saveStored('session', state.session);
    else localStorage.removeItem('cocoLatte_session');
  }, [state]);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const titles = { home: 'Coco Latte | Cafeteria', menu: 'Menu | Coco Latte', login: 'Acceso | Coco Latte', checkout: 'Finalizar pedido | Coco Latte', dashboard: 'Panel | Coco Latte' };
    document.title = titles[loginRequired ? 'login' : page];
  }, [page, loginRequired]);

  const navigate = useCallback((event, href) => {
    if (event) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
    }
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) {
      window.location.assign(url.href);
      return;
    }
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    setPathname(url.pathname);
    if (url.hash) requestAnimationFrame(() => document.querySelector(url.hash)?.scrollIntoView({ behavior: 'smooth' }));
    else window.scrollTo(0, 0);
  }, []);

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

  function placeOrder(customer) {
    const unavailable = state.cart.find((item) => !state.products.some((product) => product.id === item.id && product.stock >= item.quantity));
    if (unavailable) return { error: `No hay stock suficiente de ${unavailable.name}. Regresa al menu para ajustar tu pedido.` };
    const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const id = Date.now();
    const order = { id, number: String(state.orders.length + 1).padStart(4, '0'), customer: customer.name, phone: customer.phone, payment: customer.payment, type: customer.type, items: state.cart, total, status: 'Recibido', date: new Date().toISOString() };
    const sales = state.cart.map((item) => ({ orderId: id, productId: item.id, product: item.name, quantity: item.quantity, price: item.price, total: item.price * item.quantity, date: order.date, metodoPago: order.payment }));
    const products = state.products.map((product) => {
      const item = state.cart.find((entry) => entry.id === product.id);
      const stock = item ? product.stock - item.quantity : product.stock;
      return { ...product, stock, available: stock > 0 };
    });
    setState((current) => ({ ...current, products, sales: [...current.sales, ...sales], orders: [order, ...current.orders], cart: [] }));
    return { order };
  }

  const onLogout = () => setState((current) => ({ ...current, session: null, cart: [] }));

  return <>
    {page !== 'login' && !loginRequired && <Navbar session={state.session} onLogout={onLogout} navigate={navigate} checkout={page === 'checkout'} dashboard={page === 'dashboard'} home={page === 'home'} />}
    {page === 'login' || loginRequired ? <LoginPage navigate={navigate} onLogin={(session) => {
      const pendingName = localStorage.getItem('cocoLatte_pendingProduct');
      const pending = state.products.find((product) => product.name === pendingName && product.stock > 0);
      setState((current) => {
        if (!pending) return { ...current, session };
        const existing = current.cart.find((item) => item.id === pending.id);
        const quantity = Math.min(pending.stock, (existing?.quantity || 0) + 1);
        const cart = existing ? current.cart.map((item) => item.id === pending.id ? { ...item, quantity } : item) : [...current.cart, { id: pending.id, name: pending.name, price: pending.price, quantity }];
        return { ...current, session, cart };
      });
      if (pending) {
        setNotice(`${pending.name} fue agregado al carrito.`);
        window.setTimeout(() => setNotice(''), 3500);
      }
      localStorage.removeItem('cocoLatte_pendingProduct');
    }} />
      : page === 'menu' ? <MenuPage products={state.products} cart={state.cart} session={state.session} navigate={navigate} onAdd={addToCart} onCartChange={changeCart} onCartClear={() => setState((current) => ({ ...current, cart: [] }))} />
        : page === 'checkout' ? <CheckoutPage cart={state.cart} session={state.session} navigate={navigate} onPlaceOrder={placeOrder} />
          : page === 'dashboard' ? <DashboardPage products={state.products} sales={state.sales} orders={state.orders} onOrderStatusChange={(id, status) => setState((current) => ({ ...current, orders: current.orders.map((order) => order.id === id ? { ...order, status } : order) }))} />
            : <HomePage navigate={navigate} />}
    {page !== 'login' && page !== 'checkout' && page !== 'dashboard' && <Footer />}
    {page !== 'login' && !loginRequired && <BackToTop />}
    {notice && page !== 'login' && <div className="purchase-message show" role="status"><i className="bi bi-check-circle-fill" /> {notice}</div>}
  </>;
}
