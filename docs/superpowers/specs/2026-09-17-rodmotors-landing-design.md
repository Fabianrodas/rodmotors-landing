# Rod Motors: landing única (spec de diseño)

**Fecha:** 2026-09-17
**Estado:** dominio, color principal y variante de hero confirmados (ver sección 7.3). El resto del diseño visual se termina de aprobar en Claude Design (ver `docs/design/2026-09-17-brief-claude-design.md`) antes de avanzar en el plan de implementación.
**Clasificación superpowers:** architectural (proyecto nuevo, repo vacío)
**Plan de implementación:** `docs/superpowers/plans/2026-09-17-rodmotors-landing.md`

---

## 1. Auditoría de lo que existe hoy

| | tecnicentro80.com | rodmotors.ec |
|---|---|---|
| Plataforma | Google Sites | WordPress.com (plan gratuito, creado en septiembre 2026) |
| Marca en pantalla | ROD MOTORS | ROD MOTORS, "Tecnicentro y taller automotriz" |
| Páginas | Inicio, Catálogo, Blog | Inicio, Acerca de |
| Contenido útil | 10 servicios con descripción, misión, 4 capturas de reseñas, mapa, horario | 3 servicios, 2 videos de YouTube, CTA a WhatsApp, dirección, horario |
| Problemas | Faltas de ortografía ("Quines somos", "tú seguridad", "cuidarde"), emoji en el H1, imágenes servidas por Google, cero SEO local, sin datos estructurados | Página "Acerca de" con el texto de ejemplo de WordPress, branding de WordPress.com en el pie, comentarios abiertos en la portada |
| Fortaleza que se conserva | Catálogo de servicios y el artículo de mantenimiento | CTA a WhatsApp con mensaje prellenado, videos reales del taller |

**Datos del negocio (unificados de ambos sitios):**

- Nombre comercial: Rod Motors. Nombre anterior o de la ficha de Google: Tecnicentro 80.
- Dirección: Cdla. Samanes 5, Mz. 942, Solar 4, esquina de Av. del Maestro y Miguel Riofrío, Guayaquil 090509.
- Coordenadas del mapa incrustado hoy: -2.113483, -79.895025.
- WhatsApp y teléfono: +593 98 332 3194. Instagram: @rodmotors.ec.
- Servicios: mantenimiento preventivo, cambio de aceite, limpieza de inyectores, diagnóstico computarizado, motor, transmisión, dirección, suspensión, frenos, alineación computarizada.
- Vehículos: livianos, semipesados y pesados. Más de 10 años de experiencia.
- Videos: `t3sSL3RLqLA`, `nQSDrwFfDnI`.

**Conflicto detectado:** los horarios no coinciden. Google Sites dice lunes a sábado de 08:00 a 18:00 y domingos de 10:00 a 16:00. WordPress dice lunes a viernes de 08:30 a 18:00 y sábado de 08:30 a 17:00. El plan usa el de WordPress por ser el más reciente y lo marca como pendiente de confirmar.

## 2. Decisión de producto

Un solo sitio, no dos. Los dos dominios son el mismo negocio, la misma dirección y el mismo teléfono; mantener dos sitios duplica el trabajo y divide el SEO local.

- Dominio principal: **rodmotors.ec**, confirmado por el cliente el 2026-09-17.
- **tecnicentro80.com** redirige 301 al principal, con mapeo de rutas viejas (ver sección 9).
- La ficha de Google Business Profile aparece como "TECNICENTRO 80": se recomienda renombrarla a "Rod Motors" y apuntar el sitio web al dominio nuevo. Es trabajo del negocio, no del repo.

## 3. Objetivo

La landing tiene un solo trabajo: que quien llega desde WhatsApp, Instagram o Google Maps, casi siempre en celular y con datos móviles, entienda en 5 segundos qué se hace ahí, vea que atienden su tipo de vehículo y pueda agendar o llegar sin fricción.

Señales de éxito, medibles sin analítica compleja:

1. Mensajes de WhatsApp que llegan con la orden de trabajo prellenada (se distinguen por el formato del mensaje).
2. Clics en llamar y en "cómo llegar".
3. LCP por debajo de 2.5 s en 4G y peso de JS por debajo de 50 KB.

## 4. Alcance

**Dentro de v1:** una sola página con secciones ancladas, formulario de orden de trabajo que abre WhatsApp, mapa con carga diferida, horario con estado abierto o cerrado en vivo, galería y videos del taller, guía corta de mantenimiento, datos estructurados de negocio local, página 404, redirecciones, modo claro y oscuro.

**Fuera de v1 (YAGNI):** blog, sistema de citas con base de datos, panel de administración, CMS, inglés, catálogo de repuestos, historial de vehículos, formularios que guarden datos en un servidor, analítica de terceros. Si el negocio los pide después, cada uno es su propio spec.

## 5. Framework: opciones y decisión

| Opción | A favor | En contra |
|---|---|---|
| **A. Astro 7 estático + Tailwind v4 (elegida)** | HTML estático, cero JS por defecto (la landing queda en ~7 KB de JS), optimización de imágenes integrada, contenido tipado en un solo archivo, se despliega gratis en cualquier host estático | El agente tiene que traducir los ejemplos en React de taste-skill a CSS o islas de TypeScript |
| B. Next.js estático + Motion | Es el stack por defecto de taste-skill, ejemplos copiables | Runtime de React para una página que no lo necesita, más de 90 KB de JS, más piezas que mantener para un negocio que no va a tocar el código |
| C. HTML plano + Vite | Lo más simple de entender | Sin componentes ni datos tipados, el contenido se repite en varios lugares, optimización de imágenes a mano |

**Decisión: A.** El cuello de botella real es la red móvil y la facilidad de cambiar un horario o un precio, no la capacidad de renderizado. Validado en un proyecto de prueba: build limpio, `astro check` sin errores, 51 tests en verde, 7.4 KB de JS y 16 KB de CSS.

Versiones fijadas (verificadas en npm el 2026-09-17): `astro@7.3.3`, `tailwindcss@4.3.3`, `@tailwindcss/vite@4.3.3`, `astro-icon@1.2.0`, `@iconify-json/ph@1.2.2`, `@fontsource-variable/archivo@5.3.0`, `@astrojs/sitemap@3.7.4`, `vitest@5.0.1`, `@playwright/test@1.63.0`. Node >= 22.12.

**Trampa conocida:** `@astrojs/check@0.9.10` pide `typescript ^5 || ^6`. TypeScript 7 ya es la versión "latest" en npm, así que hay que instalar `typescript@^6` explícitamente.

## 6. Arquitectura

```
src/
  data/site.ts          Único lugar con datos del negocio (horario, servicios, contacto)
  lib/hours.ts          Estado abierto/cerrado y agrupación del horario (zona America/Guayaquil)
  lib/whatsapp.ts       Validación de la orden de trabajo, mensaje y URL de wa.me
  lib/schema.ts         JSON-LD AutoRepair
  lib/contrast.ts       Utilidades WCAG para los tests de tokens
  layouts/Base.astro    <head>, SEO, fuente, JSON-LD, skip link
  components/           Header, Hero, Services, Workshop, Reviews, Guide, Booking, Visit, Footer, MobileBar
  pages/index.astro     Composición de la landing
  pages/404.astro
  styles/global.css     Tokens de color, tipografía, utilidades
  assets/photos/        Fotos reales (provisionales hasta que el cliente las entregue)
public/                 _redirects, _headers, robots.txt, favicon, og.jpg
tests/unit/             Lógica pura (vitest)
tests/build/            Reglas sobre el HTML ya compilado (vitest)
tests/e2e/              Flujo de agendar y accesibilidad (playwright)
```

Tres islas de JavaScript, cada una vanilla y pequeña: validación del formulario, estado del horario, carga diferida de mapa y videos. Sin librería de animación ni de estado.

## 7. Sistema de diseño

**Lectura del encargo (taste-skill 0.B):** rediseño con reformulación visual de un taller automotriz de barrio para dueños de autos y camiones del norte de Guayaquil que llegan desde el celular, con lenguaje de taller honesto, apoyado en Astro y Tailwind v4, tipografía grotesca de un solo cuerpo y movimiento contenido.

**Diales:** `DESIGN_VARIANCE: 6`, `MOTION_INTENSITY: 4`, `VISUAL_DENSITY: 4`. Variance media porque la asimetría ayuda a que no parezca plantilla, pero el objetivo es confianza y lectura rápida, no exhibición. Motion 4 porque en 4G cada kilobyte de animación se paga.

### 7.1 Paleta

Azul oscuro de marca (pedido del cliente, combina con el logo) sobre grises fríos de taller, más un acento ámbar de señalización (las marcas de seguridad y los brazos del elevador). Nada de negro ni blanco puros.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `brand` | `#13233c` | `#17273f` | Azul oscuro de marca: header, pie, secciones oscuras, sellos |
| `brand-soft` | `#25394f` | `#25394f` | Recuadros de foto y video dentro de una sección `brand` (El taller). Un solo valor en los dos temas |
| `on-brand` | `#eef2f7` | `#eef2f7` | Texto sobre el azul de marca |
| `ink` | `#13233c` | `#e8eef5` | Texto principal (en claro es el mismo azul de marca) |
| `canvas` | `#eef1f4` | `#0e1a2b` | Fondo de página |
| `surface` | `#f9fafb` | `#152438` | Tarjetas, formulario, sección del taller |
| `line` | `#ccd5de` | `#27374c` | Divisores |
| `field` | `#76838f` | `#6b7b90` | Bordes de campos de formulario (3:1 mínimo) |
| `muted` | `#4a5765` | `#a2b0c1` | Texto secundario |
| `accent` | `#e0a82e` | `#e3ad3b` | Único acento: fondo de CTA y foco |
| `on-accent` | `#13233c` | `#0e1a2b` | Texto sobre el acento |
| `accent-strong` | `#7d5610` | `#eab957` | Enlaces y errores sobre fondo claro |

El azul oscuro es el color principal y domina la página (tipografía, header, pie, secciones oscuras). El ámbar es el único acento y aparece solo donde hay una acción: CTA, foco y errores. El azul exacto se muestrea del logo cuando el cliente lo entregue; los valores de arriba son el punto de partida y ya pasan los tests de contraste.

Los contrastes se verifican en un test, no a ojo: `ink` sobre `canvas` >= 7:1, `muted` >= 4.5:1, texto sobre acento >= 4.5:1, borde de campo >= 3:1, en los dos modos.

**Revisión anti genérico (obligatoria, frontend-design):** la primera propuesta salió de `ui-ux-pro-max --design-system`, que para "automotive" devuelve slate `#1E293B` con rojo `#DC2626` y tipografía Syncopate o Inter con Playfair. Se descartó: "oscuro más rojo" es el cliché de concesionaria y uno de los clusters que frontend-design marca como firma de IA; Inter está desaconsejado como default en taste-skill y la serif no tiene justificación aquí. Se cambió por el azul oscuro de marca que pidió el cliente, sobre grises de taller, con ámbar de señalización como único acento. **Cuando llegue el logo en vector, ese azul reemplaza `--brand`** (y con él se deriva `--brand-soft`); el ámbar del acento no cambia por eso (tarea 2 del plan).

### 7.2 Tipografía

Una sola familia: **Archivo Variable** (Fontsource, self-hosted, ejes `wght` 100-900 y `wdth` 62-125%). Los titulares usan el eje de ancho en 118% con tracking negativo, el cuerpo va en ancho normal. Es el recurso de las placas y emblemas de vehículo, sirve de personalidad sin traer una segunda fuente. Números con `tabular-nums` en horarios, placas y teléfonos.

Sin etiquetas en mayúsculas sobre los títulos (cero "eyebrows"), sin resaltar una sola palabra del titular, sin serif decorativa.

### 7.3 Estructura de la página

```
+--------------------------------------------------------------+
| Header (bg-brand)  Rod Motors   Servicios  El taller  [CTA]   |
+--------------------------------------------------------------+
| HERO, variante B: foto a ancho completo +                     |
| panel sólido bg-brand a la izquierda (sin degradado)          |
|  [panel] H1 Taller automotriz en Samanes 5                    |
|  [panel] subtítulo 18 palabras            [ foto de bahía,    |
|  [panel] [Agendar por WhatsApp] Cómo llegar   ancho completo] |
+--------------------------------------------------------------+
| SERVICIOS (bento de 5 celdas, 3 grupos + foto + tipos)        |
|  +-------------+-------+   la celda de tipos de vehículo va   |
|  | Mantenim.   | foto  |   con fondo tintado del acento       |
|  +--------+----+ (4:5) |                                      |
|  | Diag.  |    |       |                                      |
|  +--------+----+-------+                                      |
|  | Frenos, susp.| tipos |                                     |
+--------------------------------------------------------------+
| EL TALLER (bg-brand, galería asimétrica en brand-soft + video)|
+--------------------------------------------------------------+
| OPINIONES (cita destacada + 2 cortas; no se renderiza vacía)  |
+--------------------------------------------------------------+
| GUÍA (lista de definición a 2 columnas, sin tarjetas)         |
+--------------------------------------------------------------+
| AGENDAR (texto 4/12 + "orden de trabajo" 8/12)  <- el momento |
+--------------------------------------------------------------+
| UBICACIÓN (datos + pastilla de horario 5/12, mapa diferido 7/12)|
+--------------------------------------------------------------+
| Footer (bg-brand) + barra fija en celular: Llamar | Agendar   |
+--------------------------------------------------------------+
```

**Decisión aprobada en el canvas de diseño (2026-09-18):** entre dos variantes de hero (A: split con foto a un lado sobre fondo claro; B: foto a ancho completo con un panel sólido de marca) se eligió la **B**. Esa misma revisión fijó que el azul de marca no se queda solo en el hero: domina también el header, "El taller" y el pie, con `brand-soft` como tono intermedio para los recuadros de foto y video dentro de "El taller". En celular, donde un panel lateral no cabe, el hero apila el texto sobre fondo `brand` encima de la foto.

Siete secciones con seis familias de layout distintas, ninguna repetida dos veces seguidas, sin la fila de tres tarjetas iguales.

**El elemento memorable, uno solo:** la orden de trabajo. Es el papel que llenan al recibir un vehículo, convertido en formulario: tipo de vehículo con iconos, servicio, marca y modelo, placa, día preferido, nota. Al enviar no guarda nada: abre WhatsApp con el mensaje armado. Todo lo demás de la página se mantiene callado.

### 7.4 Movimiento y modo oscuro

Un solo momento orquestado (la entrada del hero) más respuesta táctil en botones (`-translate-y-px` al hover, `translate-y-px` al presionar). Sin revelados por scroll sección por sección, que es justo la firma de página generada. Todo detrás de `prefers-reduced-motion`.

Modo claro y oscuro desde el inicio con variables CSS y `prefers-color-scheme`, sin interruptor. Un solo tema por página, ninguna sección se invierte.

### 7.5 Reglas de copy

Español de Ecuador, frases cortas, voz activa, mayúscula solo al inicio. Cero em dash (—) y en dash (–), cero emojis, cero "impulsa", "potencia", "solución integral". Una sola etiqueta por intención: siempre "Agendar por WhatsApp", nunca "Escríbenos" o "Contáctanos" como sinónimos. Los errores dicen qué pasó y qué hacer: "Ese día el taller está cerrado. Elige otro."

Se corrigen las faltas de ortografía del sitio actual y se conserva el contenido real (misión, catálogo, guía de mantenimiento).

## 8. Contenido

Todo el contenido vive en `src/data/site.ts`. Los servicios se agrupan en tres bloques (Mantenimiento; Diagnóstico y motor; Frenos, suspensión y dirección) porque diez ítems sueltos en una lista son ilegibles. La guía sale del artículo del blog actual, incluidos los intervalos de bujías que el negocio ya publica (cobre cada 20.000 km, iridio entre 80.000 y 100.000 km).

`reviews` arranca vacío. La sección no se renderiza hasta que el cliente entregue el texto real de las reseñas con permiso de usar el nombre. No se inventan testimonios.

## 9. SEO y migración

- JSON-LD `AutoRepair` con dirección, coordenadas, teléfono, horario y servicios.
- `title`, `description` (70 a 160 caracteres), canonical, Open Graph, `lang="es-EC"`, sitemap y robots.
- Redirecciones 301 desde las rutas viejas en `public/_redirects`: `/inicio` a `/`, `/nuestros-servicios/catálogo` (y su versión codificada) a `/#servicios`, `/nuestros-servicios/blog` a `/#guia`, `/acerca-de/` a `/`.
- tecnicentro80.com: redirección 301 de dominio completo hacia rodmotors.ec conservando la ruta.
- Antes de apagar los sitios viejos se guarda una copia de las fotos y del texto.

## 10. Accesibilidad y rendimiento

Objetivos verificables: contraste AA en ambos modos, foco visible, skip link, formulario con etiquetas visibles y errores junto al campo, área táctil de 44 px, `axe` sin violaciones serias, LCP < 2.5 s, CLS < 0.1, JS < 50 KB.

## 11. Estrategia de pruebas

1. **Unitarias (vitest):** horario y estado abierto/cerrado, validación y mensaje de WhatsApp, JSON-LD, contraste de tokens, integridad de los datos.
2. **Sobre el build (vitest + node-html-parser):** un solo `h1`, `lang`, description, canonical, alt en todas las imágenes, JSON-LD parseable, cero em dash, cero emojis, una sola etiqueta por intención, y con `LAUNCH=1` cero fotos provisionales.
3. **E2E (playwright):** llenar la orden de trabajo lleva a `wa.me` con el texto correcto, el CTA del hero se ve sin hacer scroll en un viewport de celular, `axe` limpio.

Las reglas de taste-skill que se pueden mecanizar son tests, no buenas intenciones.

## 12. Despliegue

Cloudflare Workers con static assets (Cloudflare recomienda Workers por encima de Pages para proyectos nuevos; un sitio estático se despliega sin adaptador, y `_redirects`, `_headers` y `not_found_handling: "404-page"` funcionan ahí). Alternativa si no se quieren mover los nameservers: Netlify. El repo queda listo para cualquiera de los dos porque ambos leen los mismos archivos.

## 13. Riesgos

| Riesgo | Mitigación |
|---|---|
| Fotos: sin fotos reales del taller la página pierde el 80% de su fuerza | Lista de tomas en el plan, imágenes provisionales generadas para poder construir, test de lanzamiento que las bloquea |
| Colores de marca desconocidos (no se pudo leer el logo) | Tarea 2: extraer colores del logo y reemplazar `--brand` si el azul exacto difiere |
| Horario contradictorio entre los dos sitios | Confirmar con el negocio antes de publicar; está en un solo archivo |
| Reseñas solo existen como capturas | Transcribir con permiso o enlazar a Google; la sección no se muestra vacía |
| El embed de mapa sin API key podría cambiar | El botón de mapa es diferido y los enlaces a Google Maps y Waze funcionan aunque el embed falle |

## 14. Decisiones por confirmar con el cliente

1. ~~Dominio principal~~: confirmado, rodmotors.ec manda y tecnicentro80.com redirige.
2. Horario real, incluido si abren domingos.
3. Logo en vector para muestrear el azul exacto de marca. El cliente ya definió que el color principal es azul oscuro.
4. ¿Se conserva "Tecnicentro 80" como nombre anterior visible en el pie?
5. Fotos: ¿las toma el negocio o se contrata sesión? Lista de tomas en el plan, tarea 8.
6. Reseñas: ¿se pueden transcribir con nombre?
7. ¿Se agrega algún servicio que hoy no está en los sitios (por ejemplo revisión técnica vehicular, grúa, repuestos)?
8. Host: Cloudflare (implica mover nameservers) o Netlify.
