import type { DayIndex, SiteData } from '../data/site';

const SCHEMA_DAYS: Record<DayIndex, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday',
};

export interface OpeningHoursSpecification {
  '@type': 'OpeningHoursSpecification';
  dayOfWeek: string[];
  opens: string;
  closes: string;
}

export function buildOpeningHours(site: SiteData): OpeningHoursSpecification[] {
  const byRange = new Map<string, DayIndex[]>();
  for (const day of [1, 2, 3, 4, 5, 6, 0] as DayIndex[]) {
    const range = site.schedule[day];
    if (!range) continue;
    const key = `${range.open}-${range.close}`;
    byRange.set(key, [...(byRange.get(key) ?? []), day]);
  }
  return [...byRange.entries()].map(([key, days]) => {
    const [opens, closes] = key.split('-');
    return { '@type': 'OpeningHoursSpecification', dayOfWeek: days.map((d) => SCHEMA_DAYS[d]), opens, closes };
  });
}

/** JSON-LD schema.org AutoRepair para la ficha local del negocio. */
export function buildAutoRepairJsonLd(site: SiteData, imageUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    '@id': `${site.url}/#taller`,
    name: site.name,
    alternateName: site.legacyName,
    description: site.description,
    url: `${site.url}/`,
    image: imageUrl,
    telephone: site.phoneE164,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.street}. ${site.address.reference}`,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.countryCode,
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    openingHoursSpecification: buildOpeningHours(site),
    areaServed: { '@type': 'City', name: site.address.city },
    sameAs: [site.instagram.url],
    makesOffer: site.serviceGroups.flatMap((group) =>
      group.services.map((service) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: service.name } })),
    ),
  };
}
