/** Fuente única de datos del negocio. Datos tomados de tecnicentro80.com y rodmotors.ec (septiembre 2026). */

/** 0 = domingo ... 6 = sábado (mismo índice que Date#getUTCDay). */
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TimeRange {
  /** "HH:MM" en 24 h, hora de Guayaquil */
  open: string;
  close: string;
}

export type WeeklySchedule = Record<DayIndex, TimeRange | null>;

export interface Service {
  id: string;
  name: string;
  summary: string;
}

export interface ServiceGroup {
  /** También es el ancla de su sección en /servicios */
  id: string;
  num: string;
  title: string;
  lead: string;
  /** Icono Phosphor para astro-icon */
  icon: string;
  /** Clave del registro de fotos (src/data/photos.ts) */
  photo: string;
  services: Service[];
}

export interface VehicleClass {
  name: string;
  examples: string;
  icon: string;
}

export interface Principle {
  title: string;
  body: string;
}

export interface SiteData {
  name: string;
  legacyName: string;
  description: string;
  url: string;
  phoneDisplay: string;
  phoneE164: string;
  whatsappNumber: string;
  instagram: { handle: string; url: string };
  address: { street: string; reference: string; city: string; region: string; postalCode: string; countryCode: string };
  geo: { lat: number; lng: number };
  schedule: WeeklySchedule;
  yearsExperience: number;
  vehicleTypes: string[];
  vehicleClasses: VehicleClass[];
  serviceGroups: ServiceGroup[];
  equipment: { name: string; icon: string }[];
  principles: Principle[];
  /** Párrafos de la historia. Lo que está entre corchetes lo tiene que completar el negocio. */
  story: string[];
  /** Pendiente de confirmar con el negocio; se muestra como marcador. */
  parking: string | null;
}

export const site: SiteData = {
  name: 'Rod Motors',
  legacyName: 'Tecnicentro 80',
  description:
    'Taller automotriz en Samanes 5, Guayaquil. Mantenimiento, diagnóstico computarizado y reparación para livianos, semipesados y pesados.',
  url: 'https://rodmotors.ec',
  phoneDisplay: '098 332 3194',
  phoneE164: '+593983323194',
  whatsappNumber: '593983323194',
  instagram: { handle: '@rodmotors.ec', url: 'https://www.instagram.com/rodmotors.ec/' },
  address: {
    street: 'Cdla. Samanes 5, Mz. 942, Solar 4',
    reference: 'Esquina de Av. del Maestro y Miguel Riofrío',
    city: 'Guayaquil',
    region: 'Guayas',
    postalCode: '090509',
    countryCode: 'EC',
  },
  geo: { lat: -2.113483, lng: -79.895025 },
  // PENDIENTE DE CONFIRMAR: los dos sitios anteriores publicaban horarios distintos.
  schedule: {
    0: null,
    1: { open: '08:30', close: '18:00' },
    2: { open: '08:30', close: '18:00' },
    3: { open: '08:30', close: '18:00' },
    4: { open: '08:30', close: '18:00' },
    5: { open: '08:30', close: '18:00' },
    6: { open: '08:30', close: '17:00' },
  },
  yearsExperience: 10,
  vehicleTypes: ['Livianos', 'Semipesados', 'Pesados'],
  vehicleClasses: [
    { name: 'Livianos', examples: 'Autos y camionetas', icon: 'ph:car-profile' },
    { name: 'Semipesados', examples: 'Furgonetas y camiones medianos', icon: 'ph:van' },
    { name: 'Pesados', examples: 'Camiones grandes', icon: 'ph:truck' },
  ],
  serviceGroups: [
    {
      id: 'mantenimiento',
      num: '01',
      title: 'Mantenimiento',
      lead: 'Para que el vehículo no llegue a la falla.',
      icon: 'ph:wrench',
      photo: 'cambio-aceite',
      services: [
        { id: 'mantenimiento-preventivo', name: 'Mantenimiento preventivo', summary: 'Revisiones periódicas según el kilometraje para evitar fallas y alargar la vida útil del vehículo.' },
        { id: 'cambio-de-aceite', name: 'Cambio de aceite', summary: 'Aceite y filtro a tiempo, para que el motor no acumule residuos ni se desgaste.' },
        { id: 'limpieza-de-inyectores', name: 'Limpieza de inyectores', summary: 'Quitamos carbón y depósitos para recuperar aceleración y bajar el consumo de combustible.' },
      ],
    },
    {
      id: 'diagnostico',
      num: '02',
      title: 'Diagnóstico y motor',
      lead: 'Primero encontramos el origen, después reparamos.',
      icon: 'ph:engine',
      photo: 'escaner',
      services: [
        { id: 'diagnostico-computarizado', name: 'Diagnóstico computarizado', summary: 'Escaneamos el sistema electrónico y mecánico para encontrar el origen exacto de la falla.' },
        { id: 'motor', name: 'Motor', summary: 'Mantenimiento y reparación de motor para livianos, semipesados y pesados.' },
        { id: 'transmision', name: 'Transmisión', summary: 'Revisión y reparación del eje de transmisión y sus componentes.' },
      ],
    },
    {
      id: 'frenos',
      num: '03',
      title: 'Frenos y tren delantero',
      lead: 'Seguridad y estabilidad en la ciudad y en carretera.',
      icon: 'ph:steering-wheel',
      photo: 'alineadora',
      services: [
        { id: 'frenos', name: 'Frenos', summary: 'Mantenimiento de frenos para manejar seguro en la ciudad y en carretera.' },
        { id: 'suspension', name: 'Suspensión', summary: 'Si el vehículo vibra, suena o pierde estabilidad, revisamos la suspensión.' },
        { id: 'direccion', name: 'Dirección', summary: 'Revisión del sistema de dirección para un manejo preciso y suave.' },
        { id: 'alineacion-computarizada', name: 'Alineación computarizada', summary: 'Medimos la geometría de las ruedas para cuidar llantas, estabilidad y consumo.' },
      ],
    },
  ],
  equipment: [
    { name: 'Escáner de diagnóstico', icon: 'ph:scan' },
    { name: 'Alineadora computarizada', icon: 'ph:steering-wheel' },
    { name: 'Bahías para livianos a pesados', icon: 'ph:wrench' },
  ],
  principles: [
    { title: 'Primero el diagnóstico', body: 'Escaneamos el vehículo para encontrar el origen de la falla antes de cambiar piezas.' },
    { title: 'Todas las marcas', body: 'Trabajamos con cualquier marca de auto, camioneta o camión.' },
    { title: 'De livianos a pesados', body: 'Bahías y equipos para vehículos livianos, semipesados y pesados.' },
  ],
  story: [
    'Empezamos en [AÑO] como Tecnicentro 80, en la esquina de Av. del Maestro y Miguel Riofrío. [COMPLETAR: cómo empezó el taller y quién lo fundó.]',
    'Hoy seguimos en el mismo lugar con otro nombre, Rod Motors, y con diagnóstico y alineación computarizada para livianos, semipesados y pesados.',
  ],
  parking: null,
};

export const serviceNames: string[] = site.serviceGroups.flatMap((group) => group.services.map((s) => s.name));

export const WHATSAPP_GREETING = 'Hola Rod Motors, quiero agendar una cita.';
