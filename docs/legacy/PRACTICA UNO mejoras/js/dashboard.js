document.addEventListener('DOMContentLoaded', () => {
  const sales = CocoStore.read('sales', []);
  const orders = CocoStore.read('orders', []);
  const today = new Date().toDateString();
  const todayOrders = orders.filter(order => new Date(order.date).toDateString() === today);
  const todaySales = sales.filter(sale => new Date(sale.date).toDateString() === today);
  const todayAmount = todaySales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const soldToday = todaySales.reduce((sum, sale) => sum + Number(sale.quantity), 0);
  const rankedProducts = ranking();
  const averageTicket = todayOrders.length ? todayAmount / todayOrders.length : 0;
  const cards = [['Ventas de hoy', currency(todayAmount), 'bi-cash-stack'], ['Pedidos de hoy', todayOrders.length, 'bi-bag-check'], ['Productos vendidos', soldToday, 'bi-box-seam'], ['Ticket promedio', currency(averageTicket), 'bi-receipt'], ['Producto mas vendido', rankedProducts[0]?.sold ? rankedProducts[0].name : 'Sin datos', 'bi-trophy']];
  document.querySelector('#statistics').innerHTML = cards.map(item => `<article><i class="bi ${item[2]}"></i><h3>${item[0]}</h3><p>${item[1]}</p></article>`).join('');
  document.querySelector('#topProducts').innerHTML = rankedProducts.slice(0, 4).map(product => `<article class="product-card"><div class="product-photo ${product.category.toLowerCase()}"><i class="bi ${productIcon(product.category)}"></i></div><div class="product-content"><h3>${product.name}</h3><p>${product.sold} unidades vendidas</p><strong>${currency(product.price)}</strong></div></article>`).join('');
  renderOrders();
  renderCharts();

  function renderOrders() {
    const list = document.querySelector('#ordersList');
    list.innerHTML = orders.length ? orders.map(order => `<article class="order-row"><div><b>#${order.number}</b><span>${order.customer}</span><small>${order.items.reduce((sum, item) => sum + item.quantity, 0)} productos</small></div><strong>${currency(order.total)}</strong><span>${order.payment}</span><select data-order="${order.id}">${['Recibido', 'En preparacion', 'Listo', 'Entregado'].map(status => `<option ${status === order.status ? 'selected' : ''}>${status}</option>`).join('')}</select></article>`).join('') : '<p class="empty-message">Aun no hay pedidos realizados.</p>';
    list.querySelectorAll('select').forEach(select => select.addEventListener('change', () => { const order = orders.find(item => item.id === Number(select.dataset.order)); order.status = select.value; CocoStore.write('orders', orders); }));
  }

  function renderCharts() {
    if (typeof Chart === 'undefined') return;
    const labels = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); return date.toLocaleDateString('es-BO', { weekday: 'short' }); });
    const amounts = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); return sales.filter(sale => new Date(sale.date).toDateString() === date.toDateString()).reduce((sum, sale) => sum + Number(sale.total), 0); });
    new Chart(document.querySelector('#salesChart'), { type: 'bar', data: { labels, datasets: [{ label: 'Bs.', data: amounts, backgroundColor: '#079aa3', borderRadius: 5 }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
    const payments = ['QR', 'Efectivo', 'Tarjeta'].map(payment => sales.filter(sale => sale.metodoPago === payment).reduce((sum, sale) => sum + Number(sale.total), 0));
    new Chart(document.querySelector('#paymentChart'), { type: 'doughnut', data: { labels: ['QR', 'Efectivo', 'Tarjeta'], datasets: [{ data: payments, backgroundColor: ['#079aa3', '#f5b82e', '#f28c28'] }] }, options: { plugins: { legend: { position: 'bottom' } } } });
  }
});
