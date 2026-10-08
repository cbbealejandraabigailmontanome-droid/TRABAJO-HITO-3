import { useEffect, useState } from 'react';

export function SiteLink({ href, navigate, children, ...props }) {
  return <a href={href} onClick={(event) => navigate(event, href)} {...props}>{children}</a>;
}

export function Navbar({ session, onLogout, navigate, checkout = false, dashboard = false, home = false }) {
  const [accountOpen, setAccountOpen] = useState(false);
  return (
    <header className="header">
      <SiteLink className="logo" href="/" navigate={navigate}>COCO <span>LATTE</span></SiteLink>
      <nav aria-label="Navegacion principal">
        {dashboard ? <>
          <SiteLink href="/menu.html" navigate={navigate}>Ver menu</SiteLink>
          <SiteLink className="button small" href="/" navigate={navigate}>Salir</SiteLink>
        </> : checkout ? <>
          <SiteLink href="/" navigate={navigate}>Inicio</SiteLink>
          <SiteLink href="/menu.html" navigate={navigate}>Menu</SiteLink>
          <SiteLink className="checkout-nav-link" href="/menu.html" navigate={navigate}><i className="bi bi-arrow-left" /> Seguir comprando</SiteLink>
        </> : <>
          <SiteLink href="/" navigate={navigate}>Inicio</SiteLink>
          <SiteLink href="/menu.html" navigate={navigate}>Menu</SiteLink>
          {home && <><SiteLink href="/#nosotros" navigate={navigate}>Nosotros</SiteLink><SiteLink href="/#horario" navigate={navigate}>Horarios</SiteLink></>}
        </>}
        {session?.role === 'cliente' ? (
          <div className={`account-menu${accountOpen ? ' open' : ''}`}>
            <button className="account-button" type="button" aria-expanded={accountOpen} onClick={() => setAccountOpen((open) => !open)}>
              <i className="bi bi-person-circle" /><span>{session.name || session.email?.split('@')[0] || 'Mi cuenta'}</span><i className="bi bi-chevron-down" />
            </button>
            <div className="account-dropdown"><span>{session.email || 'Cliente Coco Latte'}</span>
              <SiteLink href="/menu.html" navigate={navigate}><i className="bi bi-bag-heart" /> Mis compras</SiteLink>
              <button type="button" onClick={onLogout}><i className="bi bi-box-arrow-right" /> Cerrar sesion</button>
            </div>
          </div>
        ) : <SiteLink className="button small" href="/login.html" navigate={navigate}>Iniciar sesion</SiteLink>}
      </nav>
    </header>
  );
}

export function Footer() {
  return <footer>COCO LATTE - Un sorbo de felicidad.</footer>;
}

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 250);
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);
  return <button className={`scroll-top${visible ? ' visible' : ''}`} type="button" title="Volver al inicio" aria-label="Volver al inicio" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><i className="bi bi-arrow-up" /></button>;
}
