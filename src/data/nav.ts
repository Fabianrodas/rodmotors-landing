export type PageKey = 'inicio' | 'servicios' | 'ubicacion' | 'acerca';
export const NAV: { key: PageKey; href: string; label: string }[] = [
  { key: 'inicio', href: '/', label: 'Inicio' },
  { key: 'servicios', href: '/servicios', label: 'Servicios' },
  { key: 'ubicacion', href: '/ubicacion', label: 'Ubicación' },
  { key: 'acerca', href: '/acerca-de', label: 'Acerca de' },
];
