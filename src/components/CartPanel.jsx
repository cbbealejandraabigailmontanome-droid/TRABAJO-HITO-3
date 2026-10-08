import { useState } from 'react';
import { currency } from '../data.js';

export default function CartPanel({ cart, onContinue, onChange, onClear }) {
  const [open, setOpen] = useState(false);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <aside className={`cart-panel${open ? ' open' : ''}`}>
      <button className="cart-summary" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <i className="bi bi-bag-fill" /><span>Mi compra <b>{currency(total)}</b></span><em>{count}</em>
      </button>
      <div className="cart-details">
        {cart.length ? <>
          <h3>Resumen de compra</h3>
          {cart.map((item) => <div className="cart-item" key={item.id}>
            <span>{item.name}<small>{currency(item.price)} c/u</small></span>
            <div className="quantity-control"><button type="button" aria-label={`Disminuir ${item.name}`} onClick={() => onChange(item.id, -1)}>−</button><b>{item.quantity}</b><button type="button" aria-label={`Aumentar ${item.name}`} onClick={() => onChange(item.id, 1)}>+</button></div>
            <strong>{currency(item.price * item.quantity)}</strong>
            <button type="button" className="remove-item" aria-label={`Quitar ${item.name}`} onClick={() => onChange(item.id, -999)}><i className="bi bi-trash" /></button>
          </div>)}
          <div className="cart-total"><span>Total</span><strong>{currency(total)}</strong></div>
          <button className="button" type="button" onClick={onContinue}>Continuar compra</button>
          <button className="text-button" type="button" onClick={onClear}>Vaciar carrito</button>
        </> : <p className="cart-empty">Tu carrito esta vacio.</p>}
      </div>
    </aside>
  );
}
