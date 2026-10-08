import { useState } from 'react';
import { SiteLink } from '../components/SiteLayout.jsx';

export default function LoginPage({ navigate, onLogin }) {
  const [remember, setRemember] = useState(false);
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onLogin({ role: 'cliente', name: String(form.get('customerName')).trim(), email: String(form.get('email')).trim() });
    navigate(null, '/menu.html');
  }
  return <main className="login-body"><div className="login-layout">
    <section className="login-welcome"><SiteLink className="logo" href="/" navigate={navigate}>COCO <span>LATTE</span></SiteLink><p className="label">UNA EXPERIENCIA DELICIOSA</p><h1>Tu momento favorito empieza aqui.</h1><p>Inicia sesion para comprar tus productos favoritos de Coco Latte.</p><div className="welcome-icons"><i className="bi bi-cup-hot-fill" /><i className="bi bi-heart-fill" /><i className="bi bi-stars" /></div></section>
    <section className="login-card"><p className="label">ACCESO PARA CLIENTES</p><h2>Inicia sesion</h2><p>Ingresa para realizar tus compras y consultar tus pedidos.</p>
      <form id="loginForm" onSubmit={submit}><label>Nombre completo<input name="customerName" required autoComplete="name" placeholder="Tu nombre completo" /></label><label>Correo electronico<input name="email" required type="email" autoComplete="email" placeholder="correo@ejemplo.com" /></label><label>Contrasena<input name="password" required type="password" autoComplete="current-password" placeholder="Tu contrasena" /></label>
        <label className="remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Recordar mi acceso</label><button className="button" type="submit">Ingresar y comprar</button>
      </form><p className="login-help">Aun no tienes cuenta? Este acceso es una demostracion para clientes.</p>
    </section>
  </div></main>;
}
