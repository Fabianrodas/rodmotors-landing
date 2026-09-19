# Fase de diseño: de Claude Design al código

**Resultado (2026-09-18):** el Design System y el canvas ya existen y se revisaron juntos. Entre las dos variantes de hero se eligió la **B** (foto a ancho completo con panel sólido de marca). Enlaces para volver a abrirlos:

- Design System: https://claude.ai/artifact/MiNtkS7ejcm6jjS4AMyPyJ
- Canvas con los 8 tableros (hero, servicios, taller, agendar, ubicación, pie): https://claude.ai/artifact/SkqozkpvpzEfSbqBv4zVGj

El resto de este documento es la guía con la que se llegó a ese resultado; sigue siendo la referencia para futuras rondas de diseño (por ejemplo, cuando llegue el logo y haya que afinar el azul exacto).

Flujo acordado: primero el diseño visual en Claude Design, y solo cuando te guste, se ejecuta el plan de implementación en Astro. Tres piezas, en este orden.

## 1. Design System (artifact tipo "Design System")

Es la referencia de marca: tokens de color en modo claro y oscuro, escala tipográfica, espaciado, radios y reglas de uso. Se crea una vez y tanto el canvas de diseño como el código lo leen. Es lo que evita que el diseño y el sitio terminen con dos azules distintos.

Contenido inicial (ya validado contra WCAG en los dos modos):

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `brand` | `#13233c` | `#17273f` | Azul oscuro de marca: header, pie, secciones oscuras |
| `on-brand` | `#eef2f7` | `#eef2f7` | Texto sobre el azul |
| `ink` | `#13233c` | `#e8eef5` | Texto principal |
| `canvas` | `#eef1f4` | `#0e1a2b` | Fondo de página |
| `surface` | `#f9fafb` | `#152438` | Tarjetas, formulario |
| `line` | `#ccd5de` | `#27374c` | Divisores |
| `field` | `#76838f` | `#6b7b90` | Bordes de campos |
| `muted` | `#4a5765` | `#a2b0c1` | Texto secundario |
| `accent` | `#e0a82e` | `#e3ad3b` | Único acento: CTA y foco |
| `on-accent` | `#13233c` | `#0e1a2b` | Texto sobre el acento |
| `accent-strong` | `#7d5610` | `#eab957` | Enlaces y errores en fondo claro |

El azul manda: tipografía, header, pie y secciones oscuras. El ámbar aparece solo donde hay una acción. Si prefieres el CTA en azul sólido en vez de ámbar, es un cambio de dos tokens y se prueba en el canvas antes de decidir.

**Pendiente para fijarlo:** el logo en vector o en PNG grande, para muestrear el azul exacto en vez de partir del propuesto.

## 2. Canvas de diseño (artifact tipo "Design")

Artboards a producir, en este orden. Escritorio a 1440 px, celular a 390 px.

**Ronda 1, la decisión grande**
1. Hero escritorio, dos variantes. A: split asimétrico, texto a la izquierda y foto de bahía a la derecha sangrando al borde. B: foto a ancho completo con el azul de marca encima y el texto sobre ella.
2. Hero celular de la variante que elijas, con la barra fija inferior (Llamar y Agendar por WhatsApp).

**Ronda 2, el resto del scroll**
3. Servicios: bento de cinco celdas (tres grupos, una foto vertical, una celda de tipos de vehículo).
4. El taller: galería asimétrica con dos videos en miniatura.
5. Guía de mantenimiento y opiniones.
6. Agendar: la orden de trabajo, que es el elemento memorable de la página.
7. Ubicación: datos, horario con el estado abierto o cerrado, y el mapa antes de cargarse.
8. Pie.

**Ronda 3, los detalles que deciden si se ve profesional**
9. Botones en reposo, hover, presionado y foco.
10. Campos de formulario: normal, con foco, con error.
11. La orden de trabajo en celular, en los tres estados: vacía, con error y completa.
12. Modo oscuro del hero y del formulario.
13. Página 404.

## 3. Prompt para arrancar el canvas

Pégalo tal cual en Claude Design (o aquí mismo, pidiendo el artifact de diseño):

```
Diseña la landing de Rod Motors, taller automotriz (tecnicentro) en Cdla. Samanes 5,
Guayaquil. Atiende vehículos livianos, semipesados y pesados, todas las marcas, más de
10 años. El público llega desde WhatsApp, Instagram y Google Maps, casi siempre en
celular. El único objetivo de la página es que agenden por WhatsApp o lleguen al taller.

Color principal: azul oscuro de marca #13233c sobre gris frío #eef1f4, superficie
#f9fafb, texto secundario #4a5765, líneas #ccd5de. Único acento: ámbar #e0a82e con
texto #13233c encima, solo para CTA, foco y errores. Modo oscuro: fondo #0e1a2b,
superficie #152438, texto #e8eef5.

Tipografía: una sola familia, Archivo (variable, eje de ancho 62 a 125%). Titulares con
ancho expandido cerca de 118% y tracking negativo. Números tabulares en horarios,
placas y teléfono.

Esquinas rectas en todo. Sin sombras. Fotos reales del taller (marca los espacios si no
las tienes). Iconos de Phosphor.

Nada de: em dash, emojis, etiquetas en mayúsculas encima de los títulos, filas de tres
tarjetas iguales, degradados morados o azules de IA, indicadores de scroll, insignias
tipo "certificado" inventadas, fotos de stock de talleres ajenos.

Copy real, en español de Ecuador, frases cortas:
- H1: Taller automotriz en Samanes 5
- Subtítulo: Mantenimiento, diagnóstico computarizado y reparación para livianos,
  semipesados y pesados. Todas las marcas.
- CTA, siempre con esta etiqueta: Agendar por WhatsApp
- Secundario: Cómo llegar
- Servicios en tres grupos: Mantenimiento (mantenimiento preventivo, cambio de aceite,
  limpieza de inyectores); Diagnóstico y motor (diagnóstico computarizado, motor,
  transmisión); Frenos, suspensión y dirección (frenos, suspensión, dirección,
  alineación computarizada).
- Sección Agendar: un formulario con forma de orden de trabajo del taller. Campos: tipo
  de vehículo (liviano, semipesado, pesado) con iconos, servicio, marca y modelo, placa,
  día preferido, nombre, y "¿Qué le pasa al vehículo?". Botón: Agendar por WhatsApp.
  Debajo, en letra pequeña: Nada se guarda en esta web. Los datos viajan solo en tu
  mensaje de WhatsApp.
- Horario: lunes a viernes 08:30 a 18:00, sábado 08:30 a 17:00, domingo cerrado
  (pendiente de confirmar con el negocio).
- Contacto: WhatsApp 098 332 3194, Instagram @rodmotors.ec.

Empieza por dos variantes del hero en escritorio y su versión en celular. No pases al
resto del scroll hasta que elija una.
```

## 4. Cómo iterar sin dar vueltas

- Una ronda, una decisión. Elegir el hero antes de dibujar lo demás.
- Pide cambios por token, no por pantalla: "sube el contraste del subtítulo", "el ámbar solo en el CTA", "menos aire entre la foto y el bento".
- Cada vez que algo se apruebe, que quede reflejado en el Design System (un color, un tamaño, un espaciado). Ahí es donde el código lo va a leer.
- Si una sección no se entiende sin explicación, el problema es la sección, no la explicación.

## 5. Criterio para dar el diseño por aprobado

- El hero entra en pantalla de celular: titular de máximo 2 líneas, subtítulo de máximo 20 palabras y el CTA visible sin hacer scroll.
- Una sola etiqueta para agendar en toda la página.
- Ninguna familia de layout se repite dos veces.
- Se ve en modo claro y en modo oscuro.
- Todo el texto de la maqueta es texto real del negocio, no relleno.
- Los espacios de foto están marcados con la toma que va en cada uno.

## 6. Paso a código

Cuando el diseño esté aprobado:

1. Los tokens del Design System entran a `src/styles/global.css` (tarea 2 del plan de implementación). Los tests de contraste corren sobre esos valores, así que un color que no pase se detecta al instante.
2. Los artboards se traducen a los componentes que ya están escritos en las tareas 8 a 15 del plan. El maquetado existe: lo que cambia son valores y composición, no la arquitectura.
3. Las tareas 1 a 7 (andamiaje, datos del negocio, librerías de horario, WhatsApp y JSON-LD, fotos) no dependen del diseño y se pueden ir ejecutando mientras revisas las pantallas.
4. Producción: `npm run build` genera HTML estático y se sube a Cloudflare Workers con static assets o a Netlify. Sin servidor, sin base de datos, sin costo mensual de hosting. Ahí se conecta rodmotors.ec y se activa la redirección 301 de tecnicentro80.com (tarea 17).

**Por qué Astro y no exportar directo el diseño:** un artifact de diseño se comparte por enlace, pero no es un sitio con dominio propio, SEO local, datos estructurados ni redirecciones desde las URLs viejas. Eso es exactamente lo que necesita el negocio para no perder lo poco que hoy tiene indexado, y es lo que hace el proyecto en Astro.

## 7. Lo que el diseño no decide

Sigue pendiente del negocio y bloquea el lanzamiento, no el diseño: el logo en vector, las seis fotos del taller (lista en la tarea 7 del plan), el horario real y las reseñas transcritas con permiso.
