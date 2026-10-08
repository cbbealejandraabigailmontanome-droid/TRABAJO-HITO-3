import { useState } from 'react';
import { currency } from '../data.js';
import { SiteLink } from '../components/SiteLayout.jsx';

export default function CheckoutPage({ cart, session, navigate, onPlaceOrder }) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [type, setType] = useState('Recoger en cafeteria');
  if (!session || session.role !== 'cliente') {
    return <main className="checkout-page"><p className="label">FINALIZAR PEDIDO</p><h1>Inicia sesion para continuar.</h1><SiteLink className="button" href="/login.html" navigate={navigate}>Iniciar sesion</SiteLink></main>;
  }
  if (order) return <main className="checkout-page"><section className="success-checkout"><i className="bi bi-check-circle-fill" /><p className="label">PEDIDO RECIBIDO</p><h2>Pedido realizado</h2><p>Gracias por comprar en Coco Latte.</p><div><b>Numero de pedido: #{order.number}</b><span>Total: {currency(order.total)}</span><span>Metodo de pago: {order.payment}</span><span>Estado: {order.status}</span></div><SiteLink className="button" href="/menu.html" navigate={navigate}>Volver al menu</SiteLink></section></main>;
  if (!cart.length) return <main className="checkout-page"><p className="label">FINALIZAR PEDIDO</p><h1>Tu pedido, listo para disfrutar.</h1><section className="empty-checkout"><i className="bi bi-bag" /><h2>Tu carrito esta vacio</h2><SiteLink className="button" href="/menu.html" navigate={navigate}>Explorar el menu</SiteLink></section></main>;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = onPlaceOrder({ name: String(form.get('name')).trim(), phone: String(form.get('phone')).trim(), payment: form.get('payment'), type: form.get('type') });
    if (result.error) setError(result.error);
    else setOrder(result.order);
  }

  return <main className="checkout-page"><p className="label">FINALIZAR PEDIDO</p><h1>Tu pedido, listo para disfrutar.</h1><p className="checkout-intro">Completa tus datos y revisa el resumen antes de confirmar.</p>
    <div className="checkout-layout"><form className="checkout-form" onSubmit={submit}>
      <div className="form-heading"><i className="bi bi-person-vcard" /><div><h2>Datos del cliente</h2><p>Usaremos esta informacion para tu pedido.</p></div></div>
      <div className="checkout-fields"><label>Nombre<input name="name" required autoComplete="name" defaultValue={session.name || ''} placeholder="Tu nombre" /></label><label>Numero de telefono<input name="phone" required type="tel" autoComplete="tel" placeholder="700 00000" /></label></div>
      <fieldset><legend><i className="bi bi-credit-card" /> Metodo de pago</legend><div className="payment-options"><label><input type="radio" name="payment" value="Efectivo" defaultChecked /><span><i className="bi bi-cash" /> Efectivo</span></label><label><input type="radio" name="payment" value="QR" /><span><i className="bi bi-qr-code" /> QR</span></label><label><input type="radio" name="payment" value="Tarjeta" /><span><i className="bi bi-credit-card-2-front" /> Tarjeta</span></label></div></fieldset>
      <label>Tipo de pedido<select name="type" value={type} onChange={(event) => setType(event.target.value)}><option>Recoger en cafeteria</option><option>Consumo en el local</option></select></label>
      {type === 'Recoger en cafeteria' && <p className="pickup-message"><i className="bi bi-clock" /> Tu pedido estara listo para recoger.</p>}
      <button className="button" type="submit">Confirmar pedido <i className="bi bi-arrow-right" /></button>{error && <p className="form-error" role="alert">{error}</p>}
    </form><aside className="order-summary"><p className="label">RESUMEN DE TU PEDIDO</p><h2>Tu compra</h2>{cart.map((item) => <div className="summary-line" key={item.id}><span>{item.name} <small>x{item.quantity}</small></span><strong>{currency(item.price * item.quantity)}</strong></div>)}<div className="summary-total"><span>Subtotal</span><strong>{currency(total)}</strong><span>Total</span><strong>{currency(total)}</strong></div></aside></div>
  </main>;
}
