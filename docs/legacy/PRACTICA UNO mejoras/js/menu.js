document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('#menuGrid');
  const search = document.querySelector('#searchProduct');
  const filters = document.querySelectorAll('[data-filter]');
  let activeFilter = 'Todos';
  let cart = CocoStore.read('cart', []);

  const cartPanel = document.createElement('aside');
  cartPanel.className = 'cart-panel';
  cartPanel.innerHTML = `
    <button class="cart-summary" type="button">
      <i class="bi bi-bag-fill"></i>
      <span>Mi compra <b id="cartAmount">Bs. 0.00</b></span>
      <em id="cartCount">0</em>
    </button>
    <div class="cart-details" id="cartDetails"></div>`;
  document.body.appendChild(cartPanel);

  function updateCart() {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelector('#cartAmount').textContent = currency(total);
    document.querySelector('#cartCount').textContent = quantity;
    CocoStore.write('cart', cart);
    document.querySelector('#cartDetails').innerHTML = cart.length
      ? `<h3>Resumen de compra</h3>${cart.map(item => `<div class="cart-item"><span>${item.name}<small>${currency(item.price)} c/u</small></span><div class="quantity-control"><button data-action="decrease" data-id="${item.id}" aria-label="Disminuir">-</button><b>${item.quantity}</b><button data-action="increase" data-id="${item.id}" aria-label="Aumentar">+</button></div><strong>${currency(item.price * item.quantity)}</strong><button class="remove-item" data-action="remove" data-id="${item.id}" aria-label="Eliminar"><i class="bi bi-trash"></i></button></div>`).join('')}<div class="cart-total"><span>Total</span><strong>${currency(total)}</strong></div><button id="confirmPurchase" class="button">Continuar compra</button><button id="clearCart" class="text-button">Vaciar carrito</button>`
      : '<p class="cart-empty">Tu carrito esta vacio.</p>';
  }

  function addPendingProduct() {
    const pendingProduct = localStorage.getItem('cocoLatte_pendingProduct');
    if (!pendingProduct) return;
    localStorage.removeItem('cocoLatte_pendingProduct');
    const product = CocoStore.read('products').find(item => item.name === pendingProduct && item.stock > 0);
    if (!product) return;
    const existing = cart.find(item => item.id === product.id);
    if (existing) existing.quantity = Math.min(product.stock, existing.quantity + 1);
    else cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
    updateCart();
    showPurchaseMessage(`${product.name} fue agregado al carrito.`);
  }

  function renderMenu() {
    const query = search.value.trim().toLowerCase();
    const products = CocoStore.read('products')
      .filter(product => (activeFilter === 'Todos' || product.category === activeFilter) && product.name.toLowerCase().includes(query))
      .slice(0, 4);
    grid.innerHTML = products.length ? products.map(product => {
      const image = product.image || defaultProductImage(product);
      return `<article class="product-card"><div class="product-photo ${product.category.toLowerCase()}"><img src="${image}" alt="${product.name}" loading="lazy" onerror="this.onerror=null;this.src='img/productos/cafe-latte.jpg';"><i class="bi ${productIcon(product.category)}"></i></div><div class="product-content"><div class="product-meta"><span>${product.category}</span><span class="${product.stock > 0 ? 'available' : 'sold-out'}">${product.stock > 0 ? `Disponible (${product.stock})` : 'Agotado'}</span></div><h3>${product.name}</h3><p>${product.description}</p><strong>${currency(product.price)}</strong><div class="product-actions"><div class="quantity-control"><button data-action="card-decrease" data-id="${product.id}" aria-label="Disminuir">-</button><b data-quantity="${product.id}">1</b><button data-action="card-increase" data-id="${product.id}" aria-label="Aumentar">+</button></div><button class="buy-button" data-product="${product.name}" ${product.stock > 0 ? '' : 'disabled'}>${product.stock > 0 ? 'Agregar al carrito' : 'Agotado'}</button></div></div></article>`;
    }).join('') : '<p class="empty-message">No encontramos productos para esta busqueda.</p>';
  }

  function changeQuantity(id, amount) {
    const item = cart.find(entry => entry.id === id);
    const product = CocoStore.read('products').find(entry => entry.id === id);
    if (!product) return;
    if (!item && amount > 0) cart.push({ id, name: product.name, price: product.price, quantity: Math.min(amount, product.stock) });
    else if (item) {
      item.quantity = Math.min(product.stock, item.quantity + amount);
      if (item.quantity <= 0) cart = cart.filter(entry => entry.id !== id);
    }
    updateCart();
  }

  filters.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filters.forEach(item => item.classList.toggle('active', item === button));
    renderMenu();
  }));
  search.addEventListener('input', renderMenu);
  grid.addEventListener('click', event => {
    const button = event.target.closest('.buy-button');
    if (!button || button.disabled) return;
    const session = CocoStore.read('session', null);
    if (!session || session.role !== 'cliente') {
      localStorage.setItem('cocoLatte_pendingProduct', button.dataset.product);
      window.location.href = 'login.html';
      return;
    }
    const product = CocoStore.read('products').find(item => item.name === button.dataset.product);
    const quantity = Number(button.closest('.product-content').querySelector('[data-quantity]')?.textContent || 1);
    const existing = cart.find(item => item.id === product.id);
    if (existing) existing.quantity = Math.min(product.stock, existing.quantity + quantity);
    else cart.push({ id: product.id, name: product.name, price: product.price, quantity: Math.min(quantity, product.stock) });
    updateCart();
    showPurchaseMessage(`${product.name} fue agregado al carrito.`);
  });
  cartPanel.querySelector('.cart-summary').addEventListener('click', () => cartPanel.classList.toggle('open'));
  grid.addEventListener('click', event => {
    const control = event.target.closest('[data-action^="card-"]');
    if (!control) return;
    const value = document.querySelector(`[data-quantity="${control.dataset.id}"]`);
    const product = CocoStore.read('products').find(item => item.id === Number(control.dataset.id));
    const next = Number(value.textContent) + (control.dataset.action === 'card-increase' ? 1 : -1);
    value.textContent = Math.max(1, Math.min(product.stock, next));
  });
  cartPanel.addEventListener('click', event => {
    const control = event.target.closest('[data-action]');
    if (control) changeQuantity(Number(control.dataset.id), control.dataset.action === 'increase' ? 1 : control.dataset.action === 'decrease' ? -1 : -999);
    if (event.target.closest('#clearCart')) { cart = []; updateCart(); }
    if (event.target.closest('#confirmPurchase')) {
      if (!CocoStore.read('session', null)) { window.location.href = 'login.html'; return; }
      window.location.href = 'checkout.html';
    }
  });
  function showPurchaseMessage(message) {
    let messageBox = document.querySelector('#purchaseMessage');
    if (!messageBox) {
      messageBox = document.createElement('div');
      messageBox.id = 'purchaseMessage';
      messageBox.className = 'purchase-message';
      document.body.appendChild(messageBox);
    }
    messageBox.innerHTML = `<i class="bi bi-check-circle-fill"></i> ${message}`;
    messageBox.classList.add('show');
    setTimeout(() => messageBox.classList.remove('show'), 3500);
  }
  renderMenu();
  updateCart();
  addPendingProduct();
});
