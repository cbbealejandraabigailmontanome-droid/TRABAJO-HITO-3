import { SiteLink } from '../components/SiteLayout.jsx';

export default function NotFoundPage({ navigate }) {
  return <main className="checkout-page not-found-page">
    <p className="label">ERROR 404</p>
    <h1>No encontramos esta pagina.</h1>
    <p className="checkout-intro">Puede que la direccion haya cambiado o no exista.</p>
    <SiteLink className="button" href="/" navigate={navigate}>Volver al inicio</SiteLink>
  </main>;
}
