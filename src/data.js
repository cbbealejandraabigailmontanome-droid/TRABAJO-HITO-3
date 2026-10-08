const productImage = (filename) => `${import.meta.env.BASE_URL}img/productos/${filename}`;

export const sampleProducts = [
  { id: 1, name: 'Cafe Latte', description: 'Espresso suave con leche vaporizada.', price: 18, category: 'Cafes', stock: 20, available: true, image: productImage('cafe-latte.jpg') },
  { id: 2, name: 'Cappuccino', description: 'Cafe intenso, espuma cremosa y canela.', price: 19, category: 'Cafes', stock: 18, available: true, image: productImage('cappuccino.jpg') },
  { id: 3, name: 'Americano', description: 'Cafe negro, intenso y aromatico.', price: 14, category: 'Cafes', stock: 25, available: true, image: productImage('americano.jpg') },
  { id: 4, name: 'Mocha', description: 'Cafe, chocolate y leche cremosa.', price: 21, category: 'Cafes', stock: 22, available: true, image: productImage('mocha.jpg') },
  { id: 5, name: 'Frappe de Chocolate', description: 'Chocolate frio, crema y mucho sabor.', price: 25, category: 'Frappes', stock: 15, available: true, image: productImage('frappe-chocolate.jpg') },
  { id: 6, name: 'Frappe de Fresa', description: 'Fresa fresca con crema helada.', price: 24, category: 'Frappes', stock: 14, available: true, image: productImage('frappe-fresa.jpg') },
  { id: 7, name: 'Frappe de Oreo', description: 'Galleta, crema y chocolate.', price: 26, category: 'Frappes', stock: 12, available: true, image: productImage('frappe-oreo.jpg') },
  { id: 8, name: 'Frappe de Caramelo', description: 'Caramelo dulce y crema batida.', price: 23, category: 'Frappes', stock: 18, available: true, image: productImage('frappe-caramelo.jpg') },
  { id: 9, name: 'Limonada de coco', description: 'Refrescante bebida tropical.', price: 17, category: 'Bebidas', stock: 20, available: true, image: productImage('limonada-coco.jpg') },
  { id: 10, name: 'Te Helado de Limon', description: 'Te refrescante con limon y hielo.', price: 12, category: 'Bebidas', stock: 25, available: true, image: productImage('te-helado-limon.jpg') },
  { id: 11, name: 'Smoothie de Mango', description: 'Mango, yogurt y miel naturales.', price: 18, category: 'Bebidas', stock: 19, available: true, image: productImage('smoothie-mango.jpg') },
  { id: 12, name: 'Chocolate Frio', description: 'Chocolate frio con crema batida.', price: 10, category: 'Bebidas', stock: 28, available: true, image: productImage('chocolate-frio.jpg') },
  { id: 13, name: 'Cheesecake', description: 'Cremoso cheesecake con frutos rojos.', price: 20, category: 'Postres', stock: 10, available: true, image: productImage('cheesecake.jpg') },
  { id: 14, name: 'Brownie', description: 'Chocolate intenso con nueces.', price: 15, category: 'Postres', stock: 8, available: true, image: productImage('brownie.jpg') },
  { id: 15, name: 'Croissant', description: 'Mantequilloso y horneado cada dia.', price: 13, category: 'Postres', stock: 7, available: true, image: productImage('croissant.jpg') },
  { id: 16, name: 'Torta de Zanahoria', description: 'Especias suaves y cobertura cremosa.', price: 18, category: 'Postres', stock: 15, available: true, image: productImage('torta-zanahoria.jpg') },
];

export const categories = ['Todos', 'Cafes', 'Frappes', 'Bebidas', 'Postres'];
export const currency = (value) => `Bs. ${Number(value || 0).toFixed(2)}`;
export const iconForCategory = (category) => ({ Cafes: 'bi-cup-hot-fill', Frappes: 'bi-cup-straw', Bebidas: 'bi-droplet-fill', Postres: 'bi-cake2-fill' }[category] || 'bi-cup-hot-fill');

export function readStored(key, fallback) {
  try {
    const saved = localStorage.getItem(`cocoLatte_${key}`);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function saveStored(key, value) {
  localStorage.setItem(`cocoLatte_${key}`, JSON.stringify(value));
}

export function getInitialState() {
  let products = readStored('products', []);
  if (!Array.isArray(products) || products.length !== sampleProducts.length) {
    products = sampleProducts;
  } else {
    products = products.map((product) => ({
      ...product,
      image: product.image?.startsWith('/') && import.meta.env.BASE_URL !== '/' && !product.image.startsWith(import.meta.env.BASE_URL)
        ? `${import.meta.env.BASE_URL}${product.image.slice(1)}`
        : product.image || sampleProducts.find((item) => item.id === product.id)?.image || sampleProducts[0].image,
      stock: Number.isFinite(product.stock) ? product.stock : 0,
      available: Number(product.stock) > 0,
    }));
  }
  saveStored('products', products);
  for (const key of ['sales', 'orders', 'ratings']) {
    if (!localStorage.getItem(`cocoLatte_${key}`)) saveStored(key, []);
  }
  return {
    products,
    sales: readStored('sales', []),
    orders: readStored('orders', []),
    cart: readStored('cart', []),
    session: readStored('session', null),
  };
}

export function getDashboardData(products, sales, orders) {
  const today = new Date().toDateString();
  const todayOrders = orders.filter((order) => new Date(order.date).toDateString() === today);
  const todaySales = sales.filter((sale) => new Date(sale.date).toDateString() === today);
  const todayAmount = todaySales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const unitsToday = todaySales.reduce((sum, sale) => sum + Number(sale.quantity), 0);
  const ranked = products.map((product) => ({ ...product, sold: sales.filter((sale) => sale.productId === product.id).reduce((sum, sale) => sum + Number(sale.quantity), 0) })).sort((a, b) => b.sold - a.sold);
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const daySales = sales.filter((sale) => new Date(sale.date).toDateString() === date.toDateString());
    return { label: date.toLocaleDateString('es-BO', { weekday: 'short' }), amount: daySales.reduce((sum, sale) => sum + Number(sale.total), 0) };
  });
  const payments = ['QR', 'Efectivo', 'Tarjeta'].map((method) => sales.filter((sale) => sale.metodoPago === method).reduce((sum, sale) => sum + Number(sale.total), 0));
  return { todayOrders, todayAmount, unitsToday, ranked, week, payments };
}
