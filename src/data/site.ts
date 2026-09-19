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
  id: string;
  title: string;
  /** Icono Phosphor para astro-icon, p. ej. "ph:wrench" */
  icon: string;
  services: Service[];
}

export interface Review {
  quote: string;
  author: string;
  context: string;
}

export interface GuideItem {
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
  youtubeIds: string[];
  serviceGroups: ServiceGroup[];
  guide: GuideItem[];
  reviews: Review[];
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
  // PENDIENTE DE CONFIRMAR: los dos sitios actuales publican horarios distintos.
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
  youtubeIds: ['t3sSL3RLqLA', 'nQSDrwFfDnI'],
  serviceGroups: [
    {
      id: 'mantenimiento',
      title: 'Mantenimiento',
      icon: 'ph:wrench',
      services: [
        { id: 'mantenimiento-preventivo', name: 'Mantenimiento preventivo', summary: 'Revisiones periódicas para evitar fallas y alargar la vida útil del vehículo.' },
        { id: 'cambio-de-aceite', name: 'Cambio de aceite', summary: 'Aceite a tiempo para que el motor no acumule residuos ni se desgaste.' },
        { id: 'limpieza-de-inyectores', name: 'Limpieza de inyectores', summary: 'Quitamos carbón y depósitos para recuperar aceleración y bajar el consumo.' },
      ],
    },
    {
      id: 'diagnostico-y-motor',
      title: 'Diagnóstico y motor',
      icon: 'ph:engine',
      services: [
        { id: 'diagnostico-computarizado', name: 'Diagnóstico computarizado', summary: 'Escaneamos el sistema electrónico y mecánico para encontrar el origen de la falla.' },
        { id: 'motor', name: 'Motor', summary: 'Mantenimiento y reparación de motor para todo tipo de vehículo.' },
        { id: 'transmision', name: 'Transmisión', summary: 'Revisión y reparación del eje de transmisión.' },
      ],
    },
    {
      id: 'frenos-suspension-direccion',
      title: 'Frenos, suspensión y dirección',
      icon: 'ph:steering-wheel',
      services: [
        { id: 'frenos', name: 'Frenos', summary: 'Mantenimiento de frenos para manejar seguro en la ciudad y en carretera.' },
        { id: 'suspension', name: 'Suspensión', summary: 'Si el vehículo vibra, suena o pierde estabilidad, revisamos la suspensión.' },
        { id: 'direccion', name: 'Dirección', summary: 'Revisión del sistema de dirección para un manejo preciso y suave.' },
        { id: 'alineacion-computarizada', name: 'Alineación computarizada', summary: 'Medimos la geometría de las ruedas para cuidar llantas, estabilidad y consumo.' },
      ],
    },
  ],
  guide: [
    { title: 'Aceite de motor', body: 'Si no se cambia a tiempo, se acumulan residuos que desgastan las piezas del motor.' },
    { title: 'Inyectores', body: 'Limpios, dosifican bien el combustible y evitan consumo excesivo u obstrucciones.' },
    { title: 'Bujías', body: 'Las de cobre se cambian cada 20.000 km. Las de iridio, entre 80.000 y 100.000 km.' },
    { title: 'Cuerpo de aceleración', body: 'Limpiarlo quita hollín y carbón, ahorra combustible y evita reparaciones costosas.' },
  ],
  // Vacío hasta tener reseñas reales con permiso del cliente. La sección no se renderiza si está vacío.
  reviews: [],
};

export const serviceNames: string[] = site.serviceGroups.flatMap((group) => group.services.map((s) => s.name));
