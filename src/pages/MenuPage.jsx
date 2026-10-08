import { useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import CartPanel from '../components/CartPanel.jsx';
import { categories } from '../data.js';

export default function MenuPage({ products, cart, session, navigate, onAdd, onCartChange, onCartClear }) {
  const [category, setCategory] = useState('Todos');
  const [query, setQuery] = useState('');
  const [quantities, setQuantities] = useState({});
  const [message, setMessage] = useState('');
  const shownProducts = useMemo(() => products.filter((product) => (category === 'Todos' || product.category === category) && product.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 4), [products, category, query]);

  function addProduct(product, quantity) {
    if (!session || session.role !== 'cliente') {
      localStorage.setItem('cocoLatte_pendingProduct', product.name);
      navigate(null, '/login.html');
      return;
    }
    onAdd(product, quantity);
    setMessage(`${product.name} fue agregado al carrito.`);
    window.setTimeout(() => setMessage(''), 3500);
  }

  return <>
    <main className="menu-page"><p className="label">NUESTRO MENU</p><h1>Elige tu antojo</h1><p>Explora nuestras bebidas, cafes y postres.</p>
      <section className="category-showcase"><article><i className="bi bi-cup-hot-fill" /><b>Cafes</b><small>Calientes y aromaticos</small></article><article><i className="bi bi-cup-straw" /><b>Frappes</b><small>Frescos y cremosos</small></article><article><i className="bi bi-cake2-fill" /><b>Postres</b><small>Para endulzar el dia</small></article></section>
      <div className="menu-tools"><label className="search"><i className="bi bi-search" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Que estas buscando?" aria-label="Buscar productos" /></label>
        <div className="filters">{categories.map((item) => <button key={item} type="button" className={category === item ? 'active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
      </div>
      <section className="menu-grid">{shownProducts.length ? shownProducts.map((product) => <ProductCard key={product.id} product={product} quantity={quantities[product.id] || 1} onQuantityChange={(id, delta) => setQuantities((current) => ({ ...current, [id]: Math.max(1, Math.min(product.stock, (current[id] || 1) + delta)) }))} onAdd={addProduct} />) : <p className="empty-message">No encontramos productos para esta busqueda.</p>}</section>
      <section className="menu-note"><i className="bi bi-info-circle" /><div><b>Todo preparado al momento</b><p>Consulta con nuestro equipo por opciones sin azucar, leche vegetal y disponibilidad.</p></div></section>
      <section className="loyalty"><i className="bi bi-stars" /><div><h2>Tu proxima visita puede ser aun mejor.</h2><p>Pregunta por nuestras promociones de temporada y sabores especiales.</p></div></section>
    </main>
    {message && <div className="purchase-message show" role="status"><i className="bi bi-check-circle-fill" /> {message}</div>}
    <CartPanel cart={cart} onContinue={() => navigate(null, session?.role === 'cliente' ? '/checkout.html' : '/login.html')} onChange={onCartChange} onClear={onCartClear} />
  </>;
}
