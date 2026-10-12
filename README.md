# Coco Latte

Aplicacion SPA para la cafeteria Coco Latte, construida con React 19 y Vite.

## Desarrollo local

Requiere Node.js 22 o posterior.

```sh
npm ci
npm run dev
```

## Rutas

La navegacion se resuelve en el cliente con la History API, sin dependencias de router. La aplicacion mantiene las rutas `.html` del proyecto y acepta tambien sus versiones sin extension:

- `/` — inicio
- `/menu.html` — menu
- `/login.html` — acceso
- `/checkout.html` — finalizar pedido
- `/dashboard.html` — panel

Los botones Atrás y Adelante del navegador restauran la vista mediante `popstate`. Las rutas directas y el refresco de una vista funcionan con los archivos de entrada publicados por GitHub Pages.

## Comprobaciones

```sh
npm run lint
npm run build
npm run preview
```

No hay un script de pruebas automatizadas configurado actualmente.

Las imágenes del catálogo se sirven en WebP optimizado; los JPEG originales se conservan como respaldo.

## GitHub Pages

El workflow `.github/workflows/deploy-pages.yml` compila y despliega `dist` cuando se actualiza `main`. En GitHub, configura **Settings → Pages → Build and deployment → Source → GitHub Actions**. El build usa `/TRABAJO-HITO-3/` como base porque este repositorio se publica como proyecto bajo `github.io`.
