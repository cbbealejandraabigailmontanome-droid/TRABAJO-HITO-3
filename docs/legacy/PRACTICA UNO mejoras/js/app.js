/* Datos compartidos de Coco Latte */
const CocoStore = {
  read(key, fallback = []) {
    const saved = localStorage.getItem(`cocoLatte_${key}`);
    return saved ? JSON.parse(saved) : fallback;
  },
  write(key, value) {
    localStorage.setItem(`cocoLatte_${key}`, JSON.stringify(value));
  }
};

/* Para cambiar una imagen, sustituye solo el valor de image por tu archivo local. */
const sampleProducts = [
  { id: 1, name: 'Cafe Latte', description: 'Espresso suave con leche vaporizada.', price: 18, category: 'Cafes', stock: 20, available: true, image: 'img/productos/cafe-latte.jpg' },
  { id: 2, name: 'Cappuccino', description: 'Cafe intenso, espuma cremosa y canela.', price: 19, category: 'Cafes', stock: 18, available: true, image: 'img/productos/cappuccino.jpg' },
  { id: 3, name: 'Americano', description: 'Cafe negro, intenso y aromatico.', price: 14, category: 'Cafes', stock: 25, available: true, image: 'img/productos/americano.jpg' },
  { id: 4, name: 'Mocha', description: 'Cafe, chocolate y leche cremosa.', price: 21, category: 'Cafes', stock: 22, available: true, image: 'img/productos/mocha.jpg' },
  { id: 5, name: 'Frappe de Chocolate', description: 'Chocolate frio, crema y mucho sabor.', price: 25, category: 'Frappes', stock: 15, available: true, image: 'img/productos/frappe-chocolate.jpg' },
  { id: 6, name: 'Frappe de Fresa', description: 'Fresa fresca con crema helada.', price: 24, category: 'Frappes', stock: 14, available: true, image: 'img/productos/frappe-fresa.jpg' },
  { id: 7, name: 'Frappe de Oreo', description: 'Galleta, crema y chocolate.', price: 26, category: 'Frappes', stock: 12, available: true, image: 'img/productos/frappe-oreo.jpg' },
  { id: 8, name: 'Frappe de Caramelo', description: 'Caramelo dulce y crema batida.', price: 23, category: 'Frappes', stock: 18, available: true, image: 'img/productos/frappe-caramelo.jpg' },
  { id: 9, name: 'Limonada de coco', description: 'Refrescante bebida tropical.', price: 17, category: 'Bebidas', stock: 20, available: true, image: 'img/productos/limonada-coco.jpg' },
  { id: 10, name: 'Te Helado de Limon', description: 'Te refrescante con limon y hielo.', price: 12, category: 'Bebidas', stock: 25, available: true, image: 'img/productos/te-helado-limon.jpg' },
  { id: 11, name: 'Smoothie de Mango', description: 'Mango, yogurt y miel naturales.', price: 18, category: 'Bebidas', stock: 19, available: true, image: 'img/productos/smoothie-mango.jpg' },
  { id: 12, name: 'Chocolate Frio', description: 'Chocolate frio con crema batida.', price: 10, category: 'Bebidas', stock: 28, available: true, image: 'img/productos/chocolate-frio.jpg' },
  { id: 13, name: 'Cheesecake', description: 'Cremoso cheesecake con frutos rojos.', price: 20, category: 'Postres', stock: 10, available: true, image: 'img/productos/cheesecake.jpg' },
  { id: 14, name: 'Brownie', description: 'Chocolate intenso con nueces.', price: 15, category: 'Postres', stock: 8, available: true, image: 'img/productos/brownie.jpg' },
  { id: 15, name: 'Croissant', description: 'Mantequilloso y horneado cada dia.', price: 13, category: 'Postres', stock: 7, available: true, image: 'img/productos/croissant.jpg' },
  { id: 16, name: 'Torta de Zanahoria', description: 'Especias suaves y cobertura cremosa.', price: 18, category: 'Postres', stock: 15, available: true, image: 'img/productos/torta-zanahoria.jpg' }
];

function defaultProductImage(product) {
  return product.image || 'img/productos/cafe-latte.jpg';
}

function initializeData() {
  const savedProducts = CocoStore.read('products', []);
  /* Restaura el menu de 16 productos si existia el catalogo anterior de 20. */
  if (savedProducts.length !== sampleProducts.length) {
    CocoStore.write('products', sampleProducts);
  } else {
    CocoStore.write('products', savedProducts.map(product => ({
      ...product,
      image: defaultProductImage(product),
      stock: Number.isFinite(product.stock) ? product.stock : 0,
      available: Number(product.stock) > 0
    })));
  }
  if (!localStorage.getItem('cocoLatte_sales')) CocoStore.write('sales', []);
  if (!localStorage.getItem('cocoLatte_orders')) CocoStore.write('orders', []);
  if (!localStorage.getItem('cocoLatte_ratings')) CocoStore.write('ratings', []);
}

function currency(value) { return `Bs. ${Number(value).toFixed(2)}`; }
function productIcon(category) { return { Cafes: 'bi-cup-hot-fill', Frappes: 'bi-cup-straw', Bebidas: 'bi-droplet-fill', Postres: 'bi-cake2-fill' }[category] || 'bi-cup-hot-fill'; }
function ranking() { const products = CocoStore.read('products'); const sales = CocoStore.read('sales'); return products.map(product => ({ ...product, sold: sales.filter(sale => sale.productId === product.id).reduce((total, sale) => total + Number(sale.quantity), 0) })).sort((a, b) => b.sold - a.sold); }
function orderTotal(order) { return order.items.reduce((total, item) => total + item.price * item.quantity, 0); }

initializeData();

document.addEventListener('DOMContentLoaded', () => {
  const session = CocoStore.read('session', null);
  const navigation = document.querySelector('.header nav');
  const loginLink = navigation?.querySelector('a[href="login.html"]');

  if (session?.role === 'cliente' && navigation) {
    const name = session.name || session.email?.split('@')[0] || 'Mi cuenta';
    const account = document.createElement('div');
    account.className = 'account-menu';
    account.innerHTML = `<button class="account-button" type="button"><i class="bi bi-person-circle"></i><span>${name}</span><i class="bi bi-chevron-down"></i></button><div class="account-dropdown"><span>${session.email || 'Cliente Coco Latte'}</span><a href="menu.html"><i class="bi bi-bag-heart"></i> Mis compras</a><button type="button" id="logoutButton"><i class="bi bi-box-arrow-right"></i> Cerrar sesion</button></div>`;
    if (loginLink) loginLink.replaceWith(account);
    else navigation.appendChild(account);

    account.querySelector('.account-button').addEventListener('click', () => account.classList.toggle('open'));
    account.querySelector('#logoutButton').addEventListener('click', () => {
      localStorage.removeItem('cocoLatte_session');
      localStorage.removeItem('cocoLatte_cart');
      window.location.href = 'index.html';
    });
  }

  const scrollButton = document.createElement('button');
  scrollButton.className = 'scroll-top';
  scrollButton.title = 'Volver al inicio';
  scrollButton.setAttribute('aria-label', 'Volver al inicio');
  scrollButton.innerHTML = '<i class="bi bi-arrow-up"></i>';
  document.body.appendChild(scrollButton);
  window.addEventListener('scroll', () => scrollButton.classList.toggle('visible', window.scrollY > 250));
  scrollButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
});
