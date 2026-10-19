## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

# Rod Motors, reglas del repo

## Qué es esto

Sitio de Rod Motors, taller automotriz en Samanes 5, Guayaquil. Reemplaza dos sitios previos: un Google Sites en tecnicentro80.com y un WordPress.com en rodmotors.ec. Es un sitio de **cuatro páginas** (Inicio, Servicios, Ubicación, Acerca de), no una landing de una sola página ni una aplicación.

**El 2026-09-21 se rehizo el diseño de punta a punta**, con el logo real del cliente y una paleta nueva. Los documentos en `docs/superpowers/` (`specs/2026-09-17-rodmotors-landing-design.md` y `plans/2026-09-17-rodmotors-landing.md`) describen el diseño **anterior**, de una sola página con anclas: son historial, no la fuente de verdad actual. La fuente de verdad es el canvas de diseño donde se aprobó esta versión y este archivo.

## Stack

Astro 7 estático, Tailwind v4 vía plugin de Vite, astro-icon con Phosphor, Archivo Variable e IBM Plex Mono por Fontsource, vitest, playwright. Node >= 22.12. **TypeScript queda en `^6`**: `@astrojs/check` todavía no soporta TypeScript 7.

## Comandos

```bash
npm run dev          # desarrollo
npm run verify       # astro check + build + todos los tests de vitest (puerta de cada cambio)
npm run test         # solo unitarios
npm run test:build   # build + tests sobre el HTML generado, de las 5 páginas (4 + 404)
npm run test:e2e     # playwright
LAUNCH=1 npm run test:build   # además falla si quedan espacios de foto sin llenar o marcadores [ASÍ] en el texto
```

En Windows, `astro.config.mjs` le dice al watcher de Vite que ignore archivos del sistema (`DumpStack.log.tmp`, `pagefile.sys`...): sin eso `npm run dev` se cae con `EINVAL lstat`. `src/assets/photos/.gitkeep` mantiene la carpeta aunque no haya fotos.

Playwright no descarga su propio Chromium en algunos entornos de desarrollo. Si `npx playwright test` no encuentra navegador, exporta `PLAYWRIGHT_CHROMIUM_PATH` con la ruta a un Chromium ya instalado (`playwright.config.ts` ya lo lee); en CI con salida a internet, `npx playwright install chromium` es lo normal y esa variable no hace falta.

## Skills, en este orden

1. `superpowers:brainstorming` para cualquier cambio de diseño que no esté ya aprobado en un canvas. Diseño aprobado antes de escribir código, siempre.
2. `superpowers:writing-plans` si el cambio es grande, luego `subagent-driven-development` o `executing-plans`.
3. `taste-skill:design-taste-frontend` y `example-skills:frontend-design` antes de tocar cualquier archivo de UI.
4. `ui-ux-pro-max` para consultas puntuales de UX o accesibilidad, una query a la vez.

## Reglas que no se negocian

**Copy**
- Cero em dash (—) y en dash (–) en texto visible. Cero emojis. Hay tests que lo verifican en las 4 páginas.
- Español de Ecuador, frases cortas, voz activa, mayúscula solo al inicio.
- Una etiqueta por intención: agendar es siempre "Agendar por WhatsApp", en cualquier página. Nunca "Escríbenos", "Contáctanos" ni "Solicita tu cita" como sinónimos.
- Errores que dicen qué pasó y qué hacer. Sin "Ups" ni signos de admiración.
- Nada inventado: ni reseñas, ni cifras, ni certificaciones, ni nombres de clientes. Lo que falta (el año de fundación, si hay parqueo) queda como un marcador `[ASÍ]` en `src/data/site.ts`, nunca relleno inventado.

**Diseño**
- Un solo tema, oscuro. No hay modo claro ni `prefers-color-scheme`: la paleta vive entera en `:root`, en `src/styles/global.css`. La paleta por defecto de Tailwind está apagada con `--color-*: initial`, así que `bg-slate-800` o `text-white` no existen y no se vuelven a encender.
- Tokens: `fondo`, `superficie`, `elevada`, `marca`, `profundo` (fondos); `claro`, `apagado`, `etiqueta` (texto); `amarillo`, `tinta` (el único acento y su texto encima); `borde`; `abierto` (el punto de estado). El azul de marca (`marca`, `#244587`) es una versión atenuada del azul del logo (`#0036b3` al 100% de saturación): a saturación completa competía con el logo real en vez de hacerlo resaltar. No lo subas de saturación sin volver a medir contraste en `tests/unit/tokens.test.ts`.
- El amarillo (`amarillo`) es el único acento: CTA, foco, la barra del punto de estado, la línea diagonal de marca. No es decorativo en ningún otro lado.
- La firma visual del sitio es la diagonal de marca (componente `ui/Diagonal.astro`): un panel `bg-marca` con un filo `amarillo` cortado en diagonal (arriba en celular, a la izquierda en escritorio), tomada de la forma del escudo del logo. Se usa en el hero de Inicio (enmarca la foto `hero`, con el logo como sello junto al estado), en la sección de tipos de vehículo de Servicios, en el hero de Acerca de y en la banda de cierre (`CtaBand`, que a la izquierda lleva la vía urgente: estado y teléfono). No inventes una segunda geometría de marca.
- Una sola familia tipográfica para texto corrido (Archivo Variable, self-hosted) y una mono (IBM Plex Mono) solo para etiquetas, marcadores y microcopy técnico (`font-mono`). Nunca `<link>` a Google Fonts.
- Iconos solo de Phosphor (`ph:...`) vía astro-icon. Nunca dibujar paths de SVG a mano.
- Sin etiquetas en mayúsculas encima de los títulos salvo el eyebrow de cada hero (uno por página). Sin indicadores de scroll. Sin filas de tres tarjetas iguales.
- Movimiento: una entrada por página (el hero), la marquesina de marcas, el pulso del punto de "abierto" y la palabra elástica de "DIAGNÓSTICO" en la banda de proceso de Inicio (`ProcessBand`). Todo detrás de `prefers-reduced-motion`; los tests e2e de accesibilidad emulan `reducedMotion: 'reduce'` en vez de esperar a que animaciones infinitas terminen (nunca terminan, es a propósito).
- Revisar siempre en celular y en escritorio: el breakpoint es `lg` (1024px), sin punto intermedio.
- Cero repetición: un dato aparece una vez por página. El detalle de cada servicio vive solo en /servicios; el inicio muestra los nombres y enlaza al detalle. El "10+ años" va en el bento del inicio y en el título de Acerca de, en ningún otro lado.
- Las listas numeradas (01, 02...) quedan solo para los frentes de servicio de /servicios. No numerar pasos ni principios.
- `TextLink` usa flecha normal; `ph:navigation-arrow` solo en enlaces de "cómo llegar".

**Datos**
- Todo dato del negocio vive en `src/data/site.ts`. Nunca escribas un teléfono, un horario o una dirección directo en un componente.
- El horario actual está pendiente de confirmación del negocio. Si cambia, se cambia ahí y ya.
- `site.story`, `site.milestones`, `site.faq` y `site.parking` pueden traer marcadores entre corchetes (`[AÑO]`, `[COMPLETAR: ...]`, `[CONFIRMAR: ...]`). Se renderizan en ámbar a propósito, para que se noten. No los completes por tu cuenta.
- Pendiente de confirmar con el cliente aunque no lleve corchetes: `site.brands` (marcas de la marquesina) y `site.process` (que cotizan antes de reparar y avisan por WhatsApp).
- Reseñas: `site.reviews` vacío y `site.googleRating` null muestran marcadores en `Reviews.astro`. Solo reseñas reales de Google con permiso de quien la escribió.

**Fotos**
- El registro de fotos que espera el sitio vive en `src/data/photos.ts` (14 claves, `hero` incluida). Con `caption`, `Photo` lleva un pie (se usa en el bento de equipos). El componente `ui/Photo.astro` muestra la foto real si existe un archivo en `src/assets/photos/<clave>.(jpg|png|webp)`; si no, un espacio marcado con la descripción de esa toma, nunca una foto de stock ni una ilustración de relleno.
- Poner una foto real es copiar el archivo con el nombre de la clave a `src/assets/photos/`. Ningún componente cambia.
- `public/og.jpg` (la imagen al compartir el enlace) sale de `scripts/og-image.mjs`: usa `src/assets/photos/fachada.jpg` si ya existe, y si no arma una tarjeta de marca con el logo. Correr de nuevo el script cuando llegue esa foto.
- `src/assets/brand/logo.png` es el logo real del cliente, ya sin el fondo blanco que traía el archivo original (se le quitó el fondo conservando los blancos internos del escudo). Es el único logo: no se regenera ni se reemplaza salvo que el cliente entregue un archivo nuevo. `scripts/favicon.mjs` lo usa para generar `public/favicon.png` y `public/apple-touch-icon.png`.
- Toda imagen con contenido lleva `alt` descriptivo; las decorativas llevan `alt=""` y `aria-hidden="true"`.

**Rutas**
- Las cuatro páginas son rutas reales (`/`, `/servicios`, `/ubicacion`, `/acerca-de`), no anclas de una sola página. `public/_redirects` manda las rutas viejas del Google Sites a la página nueva más parecida. **Nunca agregues ahí una regla que apunte a una de estas cuatro rutas**: taparía la página real (ya pasó una vez con `/acerca-de`, se corrigió).
- El menú (`src/data/nav.ts`) es la única lista de páginas: agregar o quitar una página empieza ahí.

**No cambiar sin aprobación explícita del cliente**
- El nombre del negocio, el logo y el número de WhatsApp.
- El contenido de `public/_redirects`.
- La dirección de marca (diagonal + escudo del logo) y la paleta: salieron de una revisión de diez direcciones de diseño en el canvas, no de una preferencia de quien programa.

## Definición de terminado

`npm run verify` en verde, `npm run test:e2e` en verde, revisado en celular y escritorio en las 4 páginas.
