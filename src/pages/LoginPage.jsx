import { useRef, useState } from 'react';
import { SiteLink } from '../components/SiteLayout.jsx';
import { signIn, signUp } from '../lib/cocoLatteApi.js';

export default function LoginPage({ navigate, onLogin, initialError = '' }) {
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState('signin');
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const submissionLock = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (submissionLock.current) return;
    submissionLock.current = true;
    const form = new FormData(event.currentTarget);
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const email = String(form.get('email')).trim();
      const password = String(form.get('password'));
      const session = mode === 'signup'
        ? await signUp(String(form.get('customerName')).trim(), email, password, remember)
        : await signIn(email, password, remember);
      if (!session) {
        setMessage('La cuenta se creó, pero no se inició una sesión. Revisa la configuración de acceso de Supabase antes de volver a intentarlo.');
      } else {
        onLogin(session);
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      submissionLock.current = false;
      setLoading(false);
    }
  }
  return <main className="login-body"><div className="login-layout">
    <section className="login-welcome"><SiteLink className="logo" href="/" navigate={navigate}>COCO <span>LATTE</span></SiteLink><p className="label">UNA EXPERIENCIA DELICIOSA</p><h1>Tu momento favorito empieza aqui.</h1><p>Inicia sesion para comprar tus productos favoritos de Coco Latte.</p><div className="welcome-icons"><i className="bi bi-cup-hot-fill" /><i className="bi bi-heart-fill" /><i className="bi bi-stars" /></div></section>
    <section className="login-card"><p className="label">ACCESO PARA CLIENTES</p><h2>{mode === 'signin' ? 'Inicia sesion' : 'Crea tu cuenta'}</h2><p>Ingresa para realizar tus compras y consultar tus pedidos.</p>
      <form id="loginForm" onSubmit={submit}>{mode === 'signup' && <label>Nombre completo<input name="customerName" required autoComplete="name" placeholder="Tu nombre completo" /></label>}<label>Correo electronico<input name="email" required type="email" autoComplete="email" placeholder="correo@ejemplo.com" /></label><label>Contrasena<span className="password-field"><input name="password" required type={showPassword ? 'text' : 'password'} minLength="6" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="Tu contrasena" /><button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword}>{showPassword ? 'Ocultar' : 'Mostrar'}</button></span></label>
        <label className="remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Recordar mi acceso</label><button className="button" type="submit" disabled={loading}>{loading ? 'Procesando...' : mode === 'signin' ? 'Ingresar y comprar' : 'Crear cuenta'}</button>
      </form>{error && <p className="form-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
      <p className="login-help">{mode === 'signin' ? 'Aun no tienes cuenta?' : 'Ya tienes una cuenta?'} <button className="text-button" type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }}>{mode === 'signin' ? 'Crear cuenta' : 'Iniciar sesion'}</button></p>
    </section>
  </div></main>;
}
