import ProductCard from '../components/ProductCard.jsx';
import { currency, getDashboardData } from '../data.js';

export default function DashboardPage({ products, sales, orders, onOrderStatusChange }) {
  const { todayOrders, todayAmount, unitsToday, ranked, week, payments: paymentAmounts } = getDashboardData(products, sales, orders);
  const stats = [['Ventas de hoy', currency(todayAmount), 'bi-cash-stack'], ['Pedidos de hoy', todayOrders.length, 'bi-bag-check'], ['Productos vendidos', unitsToday, 'bi-box-seam'], ['Ticket promedio', currency(todayOrders.length ? todayAmount / todayOrders.length : 0), 'bi-receipt'], ['Producto mas vendido', ranked[0]?.sold ? ranked[0].name : 'Sin datos', 'bi-trophy']];
  const paymentTotal = paymentAmounts.reduce((sum, amount) => sum + amount, 0);
  const firstShare = paymentTotal ? paymentAmounts[0] / paymentTotal * 100 : 0;
  const secondShare = paymentTotal ? paymentAmounts[1] / paymentTotal * 100 : 0;
  const chartStyle = { background: `conic-gradient(#079aa3 0 ${firstShare}%, #f5b82e ${firstShare}% ${firstShare + secondShare}%, #f28c28 ${firstShare + secondShare}% 100%)` };

  return <main className="menu-page dashboard-page"><p className="label">PANEL DE ADMINISTRACION</p><h1>Resumen de Coco Latte</h1><p>Pedidos y ventas reales de tu cafeteria.</p>
    <section className="feature-grid statistics-grid">{stats.map(([title, value, icon]) => <article key={title}><i className={`bi ${icon}`} /><h3>{title}</h3><p>{value}</p></article>)}</section>
    <section className="dashboard-row"><article className="dashboard-panel"><p className="label">VENTAS DE LOS ULTIMOS 7 DIAS</p><div className="sales-chart" role="img" aria-label="Ventas de los ultimos siete dias">{week.map((day) => <div className="sales-day" key={day.label}><span>{currency(day.amount)}</span><div className="sales-bar-track"><i style={{ height: `${Math.max(4, Math.min(100, day.amount / (Math.max(...week.map((item) => item.amount), 1)) * 100))}%` }} /></div><small>{day.label}</small></div>)}</div></article>
      <article className="dashboard-panel"><p className="label">VENTAS POR METODO DE PAGO</p><div className="payment-chart-wrap"><div className="payment-chart" style={chartStyle} role="img" aria-label="Distribucion de ventas por metodo de pago" /><ul className="payment-legend">{['QR', 'Efectivo', 'Tarjeta'].map((method, index) => <li key={method}><i className={`legend-dot legend-${index}`} />{method}<b>{currency(paymentAmounts[index])}</b></li>)}</ul></div></article></section>
    <section className="dashboard-section"><p className="label">PEDIDOS</p><h2>Pedidos recientes</h2><div className="orders-list">{orders.length ? orders.map((order) => <article className="order-row" key={order.id}><div><b>#{order.number}</b><span>{order.customer}</span><small>{order.items.reduce((sum, item) => sum + item.quantity, 0)} productos</small></div><strong>{currency(order.total)}</strong><span>{order.payment}</span><select aria-label={`Estado del pedido ${order.number}`} value={order.status} onChange={(event) => onOrderStatusChange(order.id, event.target.value)}>{['Recibido', 'En preparacion', 'Listo', 'Entregado'].map((status) => <option key={status}>{status}</option>)}</select></article>) : <p className="empty-message">Aun no hay pedidos realizados.</p>}</div></section>
    <section className="section top-products"><p className="label">PRODUCTOS MAS VENDIDOS</p><h2>Los favoritos de tus clientes.</h2><div className="menu-grid">{ranked.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} sold={product.sold} variant="dashboard" />)}</div></section>
  </main>;
}
