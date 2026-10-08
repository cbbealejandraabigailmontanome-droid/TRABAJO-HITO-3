document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('#checkoutContent');
  const session = CocoStore.read('session', null);
  if (!session || session.role !== 'cliente') {
    window.location.href = 'login.html';
    return;
  }
  const cart = CocoStore.read('cart', []);
  if (!cart.length) {
    root.innerHTML = '<section class="empty-checkout"><i class="bi bi-bag"></i><h2>Tu carrito esta vacio</h2><a class="button" href="menu.html">Explorar el menu</a></section>';
    return;
  }
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  root.innerHTML = `<div class="checkout-layout"><form id="checkoutForm" class="checkout-form"><div class="form-heading"><i class="bi bi-person-vcard"></i><div><h2>Datos del cliente</h2><p>Usaremos esta informacion para tu pedido.</p></div></div><div class="checkout-fields"><label>Nombre<input name="name" required autocomplete="name" value="${session.name || ''}" placeholder="Tu nombre"></label><label>Numero de telefono<input name="phone" required type="tel" autocomplete="tel" placeholder="700 00000"></label></div><fieldset><legend><i class="bi bi-credit-card"></i> Metodo de pago</legend><div class="payment-options"><label><input type="radio" name="payment" value="Efectivo" checked><span><i class="bi bi-cash"></i> Efectivo</span></label><label><input type="radio" name="payment" value="QR"><span><i class="bi bi-qr-code"></i> QR</span></label><label><input type="radio" name="payment" value="Tarjeta"><span><i class="bi bi-credit-card-2-front"></i> Tarjeta</span></label></div></fieldset><label>Tipo de pedido<select name="type"><option>Recoger en cafeteria</option><option>Consumo en el local</option></select></label><p id="pickupMessage" class="pickup-message"><i class="bi bi-clock"></i> Tu pedido estara listo para recoger.</p><button class="button" type="submit">Confirmar pedido <i class="bi bi-arrow-right"></i></button><p id="checkoutError" class="form-error"></p></form><aside class="order-summary"><p class="label">RESUMEN DE TU PEDIDO</p><h2>Tu compra</h2>${cart.map(item => `<div class="summary-line"><span>${item.name} <small>x${item.quantity}</small></span><strong>${currency(item.price * item.quantity)}</strong></div>`).join('')}<div class="summary-total"><span>Subtotal</span><strong>${currency(total)}</strong><span>Total</span><strong>${currency(total)}</strong></div></aside></div>`;
  const form = document.querySelector('#checkoutForm');
  const type = form.elements.type;
  const pickupMessage = document.querySelector('#pickupMessage');
  type.addEventListener('change', () => pickupMessage.hidden = type.value !== 'Recoger en cafeteria');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const products = CocoStore.read('products');
    const unavailable = cart.find(item => {
      const product = products.find(entry => entry.id === item.id);
      return !product || product.stock < item.quantity;
    });
    if (unavailable) { document.querySelector('#checkoutError').textContent = `No hay stock suficiente de ${unavailable.name}. Regresa al menu para ajustar tu pedido.`; return; }
    const data = new FormData(form);
    const orders = CocoStore.read('orders', []);
    const order = { id: Date.now(), number: String(orders.length + 1).padStart(4, '0'), customer: data.get('name'), phone: data.get('phone'), payment: data.get('payment'), type: data.get('type'), items: cart, total, status: 'Recibido', date: new Date().toISOString() };
    CocoStore.write('orders', [order, ...orders]);
    CocoStore.write('sales', [...CocoStore.read('sales', []), ...cart.map(item => ({ orderId: order.id, productId: item.id, product: item.name, quantity: item.quantity, price: item.price, total: item.price * item.quantity, date: order.date, metodoPago: order.payment }))]);
    CocoStore.write('products', products.map(product => { const item = cart.find(entry => entry.id === product.id); const stock = item ? product.stock - item.quantity : product.stock; return { ...product, stock, available: stock > 0 }; }));
    CocoStore.write('cart', []);
    root.innerHTML = `<section class="success-checkout"><i class="bi bi-check-circle-fill"></i><p class="label">PEDIDO RECIBIDO</p><h2>Pedido realizado</h2><p>Gracias por comprar en Coco Latte.</p><div><b>Numero de pedido: #${order.number}</b><span>Total: ${currency(total)}</span><span>Metodo de pago: ${order.payment}</span><span>Estado: ${order.status}</span></div><a class="button" href="menu.html">Volver al menu</a></section>`;
  });
});
