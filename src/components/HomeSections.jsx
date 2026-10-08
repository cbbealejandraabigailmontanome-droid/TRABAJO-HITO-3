import { SiteLink } from './SiteLayout.jsx';

export function Hero({ eyebrow, title, description, image, imageAlt, action, navigate }) {
  return <section className="hero"><div className="hero-copy"><p className="label">{eyebrow}</p><h1>{title}</h1><p>{description}</p><SiteLink className="button" href={action.href} navigate={navigate}>{action.label} <i className="bi bi-arrow-right" /></SiteLink></div>
    <div className="hero-image"><div className="hero-visual"><img src={image} alt={imageAlt} loading="eager" /></div></div>
  </section>;
}

export function FeatureCard({ icon, title, description }) {
  return <article><i className={`bi ${icon}`} /><h3>{title}</h3><p>{description}</p></article>;
}

export function TestimonialCard({ quote, name, role }) {
  return <article><p className="quote">“{quote}”</p><b>{name}</b><small>{role}</small></article>;
}

export function GalleryCard({ image, description }) {
  return <div><img src={image} alt={description} loading="lazy" /><span>{description}</span></div>;
}

export function CTA({ eyebrow, title, action, navigate }) {
  return <section className="cta"><div><p className="label">{eyebrow}</p><h2>{title}</h2></div><SiteLink className="button" href={action.href} navigate={navigate}>{action.label}</SiteLink></section>;
}
