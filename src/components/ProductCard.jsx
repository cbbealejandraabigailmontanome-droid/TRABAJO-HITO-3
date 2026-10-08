import { currency, iconForCategory } from '../data.js';

export default function ProductCard({ product, quantity = 1, onQuantityChange, onAdd, sold, variant = 'menu' }) {
  const available = product.stock > 0;
  if (product.variant === 'highlight') return <article className="specials-card"><span>{product.badge}</span><i className={`bi ${iconForCategory(product.category)}`} /><h3>{product.name}</h3><strong>{currency(product.price)}</strong></article>;
  const dashboard = variant === 'dashboard';
  return (
    <article className="product-card">
      <div className={`product-photo ${product.category.toLowerCase()}${dashboard ? ' dashboard-product-photo' : ''}`}>
        {dashboard ? <i className={`bi ${iconForCategory(product.category)}`} /> : <img src={product.image} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/img/productos/cafe-latte.jpg'; }} />}
      </div>
      <div className="product-content">
        {!dashboard && <div className="product-meta"><span>{product.category}</span><span className={available ? 'available' : 'sold-out'}>{available ? `Disponible (${product.stock})` : 'Agotado'}</span></div>}
        <h3>{product.name}</h3>
        <p>{sold === undefined ? product.description : `${sold} unidades vendidas`}</p>
        <strong>{currency(product.price)}</strong>
        {onAdd && <div className="product-actions"><div className="quantity-control">
          <button type="button" aria-label={`Disminuir cantidad de ${product.name}`} onClick={() => onQuantityChange(product.id, -1)} disabled={!available || quantity <= 1}>−</button>
          <b>{quantity}</b>
          <button type="button" aria-label={`Aumentar cantidad de ${product.name}`} onClick={() => onQuantityChange(product.id, 1)} disabled={!available || quantity >= product.stock}>+</button>
        </div><button className="buy-button" type="button" disabled={!available} onClick={() => onAdd(product, quantity)}>{available ? 'Agregar al carrito' : 'Agotado'}</button></div>}
      </div>
    </article>
  );
}
