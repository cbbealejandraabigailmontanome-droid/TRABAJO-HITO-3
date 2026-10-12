import ProductCard from '../components/ProductCard.jsx';
import { SiteLink } from '../components/SiteLayout.jsx';
import { CTA, FeatureCard, GalleryCard, Hero, TestimonialCard } from '../components/HomeSections.jsx';
import { sampleProducts } from '../data.js';

const productImage = (filename) => `${import.meta.env.BASE_URL}img/productos/${filename}`;

const features = [
  { icon: 'bi-cup-hot', title: 'Cafe de calidad', description: 'Opciones clasicas y especiales para cada gusto.' },
  { icon: 'bi-heart', title: 'Hecho con carino', description: 'Atencion cercana en cada visita.' },
  { icon: 'bi-sun', title: 'Siempre fresco', description: 'Bebidas frias, postres y antojos del dia.' },
];
const testimonials = [
  { quote: 'El lugar perfecto para conversar y disfrutar un cafe.', name: 'Maria P.', role: 'Cliente frecuente' },
  { quote: 'Los frappes son frescos, cremosos y deliciosos.', name: 'Daniel R.', role: 'Cliente frecuente' },
  { quote: 'La atencion siempre hace que quiera volver.', name: 'Carla V.', role: 'Cliente frecuente' },
];
const gallery = [
  { image: productImage('cafe-latte.webp'), description: 'Cafes de especialidad' },
  { image: productImage('cheesecake.webp'), description: 'Postres del dia' },
  { image: productImage('cappuccino.webp'), description: 'Momentos compartidos' },
  { image: productImage('limonada-coco.webp'), description: 'Bebidas refrescantes' },
];

export default function HomePage({ navigate }) {
  const special = { ...sampleProducts[4], variant: 'highlight', badge: 'MAS VENDIDO' };
  return <main>
    <Hero eyebrow="CAFE, POSTRES Y BUENOS MOMENTOS" title={<>Tu pausa sabe mejor en <span>Coco Latte</span>.</>} description="Un espacio fresco y cercano para disfrutar de sabores preparados con cuidado." image={productImage('cafe-latte.webp')} imageAlt="Cafe recien preparado en Coco Latte" action={{ href: '/menu.html', label: 'Ver nuestro menu' }} navigate={navigate} />
    <section className="section" id="nosotros"><p className="label">NUESTRA ESENCIA</p><h2>Pequenos detalles, grandes sabores.</h2><div className="feature-grid">{features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}</div></section>
    <section className="specials"><div className="specials-copy"><p className="label">RECOMENDADO DEL DIA</p><h2>Frappes que alegran cualquier tarde.</h2><p>Chocolate, Oreo, fresa y el toque especial de Coco Latte. Elige tu favorito y haz de tu pausa un momento delicioso.</p><SiteLink className="button" href="/menu.html" navigate={navigate}>Conocer especialidades</SiteLink></div><ProductCard product={special} /></section>
    <section className="section testimonials"><p className="label">NUESTRA COMUNIDAD</p><h2>Momentos que nos inspiran.</h2><div className="feature-grid">{testimonials.map((item) => <TestimonialCard key={item.name} {...item} />)}</div></section>
    <section className="gallery section"><p className="label">UN VISTAZO A COCO LATTE</p><h2>Un espacio para disfrutar.</h2><div className="gallery-grid">{gallery.map((item) => <GalleryCard key={item.description} {...item} />)}</div></section>
    <CTA eyebrow="TU PROXIMO ANTOJO TE ESPERA" title="Encuentra tu sabor favorito." action={{ href: '/menu.html', label: 'Explorar el menu' }} navigate={navigate} />
    <section className="section color-section" id="horario"><p className="label">TE ESPERAMOS</p><h2>Visitanos</h2><div className="hours"><div><i className="bi bi-clock" /><b>Lunes a Viernes</b><span>08:00 - 21:00</span></div><div><i className="bi bi-geo-alt" /><b>Ubicacion</b><span>Av. del Sabor 123</span></div><div><i className="bi bi-phone" /><b>Contacto</b><span>+591 700 12345</span></div></div></section>
  </main>;
}
