import { currency } from '../data.js';

export default function OrdersPage({ orders, error }) {
  return <main className="menu-page dashboard-page"><p className="label">MI CUENTA</p><h1>Mis pedidos</h1><p>Consulta el estado de tus compras.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <section className="dashboard-section"><div className="orders-list">{orders.length ? orders.map((order) => <article className="order-row" key={order.id}>
      <div><b>#{order.number}</b><span>{new Date(order.date).toLocaleString('es-BO')}</span><small>{order.items.reduce((sum, item) => sum + item.quantity, 0)} productos</small></div>
      <strong>{currency(order.total)}</strong><span>{order.status}</span><span>{order.payment}</span>
    </article>) : <p className="empty-message">Aun no tienes pedidos.</p>}</div></section>
  </main>;
}
