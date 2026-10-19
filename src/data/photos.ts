/**
 * Registro de las fotos que espera el sitio. Para poner una foto real, guárdala como
 * src/assets/photos/<clave>.jpg (o .png/.webp). Mientras no exista, el componente Photo
 * muestra un espacio marcado con esta descripción, en vez de una foto de stock.
 */
export const photos = {
  hero: 'Vehículo en la bahía principal, foto horizontal y luminosa',
  'bahia-elevador': 'Bahía de servicio con vehículo en el elevador',
  'camion-bahia': 'Camión en la bahía de trabajo pesado',
  'cambio-aceite': 'Cambio de aceite en la bahía',
  escaner: 'Escáner conectado al puerto de diagnóstico',
  alineadora: 'Alineadora computarizada trabajando sobre una rueda',
  fachada: 'Fachada completa del taller desde la calle',
  entrada: 'Letrero y entrada de vehículos',
  esquina: 'Esquina de Av. del Maestro y Miguel Riofrío',
  equipo: 'El equipo del taller',
  'tecnico-cliente': 'Técnico revisando un vehículo junto al cliente',
  'galeria-bahias': 'Bahías de servicio',
  'galeria-alineadora': 'Alineadora computarizada',
  'galeria-herramientas': 'Herramientas y equipo',
} as const;

export type PhotoKey = keyof typeof photos;
