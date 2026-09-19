# Rod Motors, reglas del repo

Pega este contenido al final del `CLAUDE.md` que genera Astro al crear el proyecto (no lo reemplaces: el de Astro trae notas útiles del framework, como usar `astro dev --background`).

## Qué es esto

Landing única para Rod Motors, taller automotriz en Samanes 5, Guayaquil. Reemplaza dos sitios previos: un Google Sites en tecnicentro80.com y un WordPress.com en rodmotors.ec. Es una landing de una sola página, no una aplicación.

- Spec: `docs/superpowers/specs/2026-09-17-rodmotors-landing-design.md`
- Plan: `docs/superpowers/plans/2026-09-17-rodmotors-landing.md`

## Stack

Astro 7 estático, Tailwind v4 vía plugin de Vite, astro-icon con Phosphor, Archivo Variable por Fontsource, vitest, playwright. Node >= 22.12. **TypeScript queda en `^6`**: `@astrojs/check` todavía no soporta TypeScript 7.

## Comandos

```bash
npm run dev          # desarrollo
npm run verify       # astro check + build + todos los tests de vitest (puerta de cada tarea)
npm run test         # solo unitarios
npm run test:build   # build + tests sobre el HTML generado
npm run test:e2e     # playwright
LAUNCH=1 npm run test:build   # además falla si quedan fotos provisionales
```

## Skills, en este orden

1. `superpowers:brainstorming` para cualquier cambio que no esté ya en el plan. Diseño aprobado antes de escribir código, siempre.
2. `superpowers:writing-plans` si el cambio es grande, luego `subagent-driven-development` o `executing-plans`.
3. `taste-skill:design-taste-frontend` y `example-skills:frontend-design` antes de tocar cualquier archivo de UI.
4. `ui-ux-pro-max` para consultas puntuales de UX o accesibilidad, una query a la vez. Sus sugerencias de paleta y tipografía para "automotive" ya se evaluaron y se descartaron (ver spec, sección 7.1): no las reintroduzcas.

## Reglas que no se negocian

**Copy**
- Cero em dash (—) y en dash (–) en texto visible. Cero emojis. Hay tests que lo verifican.
- Español de Ecuador, frases cortas, voz activa, mayúscula solo al inicio.
- Una etiqueta por intención: agendar es siempre "Agendar por WhatsApp". Nunca "Escríbenos", "Contáctanos" ni "Solicita tu cita" como sinónimos.
- Errores que dicen qué pasó y qué hacer. Sin "Ups" ni signos de admiración.
- Nada inventado: ni reseñas, ni cifras, ni certificaciones, ni nombres de clientes.

**Diseño**
- Solo los tokens de `src/styles/global.css`. La paleta por defecto de Tailwind está apagada con `--color-*: initial`, así que `bg-slate-800` o `text-white` no existen y no se vuelven a encender.
- Azul oscuro (`brand`, `ink`) es el color principal y domina header, "El taller" y pie, no solo el hero; `brand-soft` es el único tono derivado, para los recuadros de foto y video dentro de una sección `brand`. El ámbar (`accent`) es el único acento y solo marca acciones: CTA, foco, errores, nunca decorativo. Un solo sistema de esquinas (recto), un solo tema por página. Nada de negro ni blanco puros.
- El hero es la **variante B**, aprobada en el canvas de diseño: foto a ancho completo con un panel `bg-brand` sólido (nunca semitransparente ni degradado) sobre la izquierda en escritorio; en celular el texto va apilado sobre fondo `brand` y la foto queda debajo.
- Una sola familia tipográfica: Archivo Variable, self-hosted. Nunca `<link>` a Google Fonts.
- Iconos solo de Phosphor (`ph:...`) vía astro-icon. Nunca dibujar paths de SVG a mano.
- Sin etiquetas en mayúsculas encima de los títulos, sin indicadores de scroll, sin filas de tres tarjetas iguales, sin tarjetas con borde más sombra por defecto.
- Movimiento: entrada del hero y respuesta táctil de botones. Nada de revelados por scroll sección por sección. Todo detrás de `prefers-reduced-motion`.
- Modo claro y oscuro se revisan los dos antes de dar algo por terminado.

**Datos**
- Todo dato del negocio vive en `src/data/site.ts`. Nunca escribas un teléfono, un horario o una dirección directo en un componente.
- El horario actual está pendiente de confirmación del negocio. Si cambia, se cambia ahí y ya.
- `site.reviews` vacío significa que la sección no se muestra. No la rellenes para "que no se vea vacía".

**Fotos**
- Las de `src/assets/photos/` son grises provisionales hasta que el cliente entregue las reales. No se sustituyen por fotos de stock ni de otros talleres.
- Toda imagen con contenido lleva `alt` descriptivo; las decorativas llevan `alt=""` y `aria-hidden="true"`.

**No cambiar sin aprobación explícita del cliente**
- Slugs y anclas (`#servicios`, `#taller`, `#guia`, `#agendar`, `#ubicacion`): las redirecciones de las URLs viejas apuntan ahí.
- El contenido de `public/_redirects`.
- El nombre del negocio, el logo y el número de WhatsApp.
- La variante de hero (B) y qué secciones usan `bg-brand` (header, "El taller", pie): salieron de una revisión en el canvas de diseño, no de una preferencia de quien programa.

## Definición de terminado

`npm run verify` en verde, e2e en verde, revisado en celular y escritorio, en modo claro y oscuro, y la lista de la tarea 16 del plan recorrida entera.
