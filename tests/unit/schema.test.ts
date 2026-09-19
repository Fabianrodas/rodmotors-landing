import { describe, expect, it } from 'vitest';
import { site } from '../../src/data/site';
import { buildAutoRepairJsonLd, buildOpeningHours } from '../../src/lib/schema';

describe('buildOpeningHours', () => {
  it('agrupa los días que comparten horario y omite los cerrados', () => {
    expect(buildOpeningHours(site)).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:30', closes: '18:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '08:30', closes: '17:00' },
    ]);
  });
});

describe('buildAutoRepairJsonLd', () => {
  const jsonLd = buildAutoRepairJsonLd(site, 'https://rodmotors.ec/og.jpg');

  it('usa el tipo AutoRepair y datos de contacto reales', () => {
    expect(jsonLd['@type']).toBe('AutoRepair');
    expect(jsonLd.telephone).toBe('+593983323194');
    expect(jsonLd.geo).toEqual({ '@type': 'GeoCoordinates', latitude: -2.113483, longitude: -79.895025 });
  });
  it('es serializable sin perder datos', () => {
    expect(JSON.parse(JSON.stringify(jsonLd))).toStrictEqual(jsonLd);
  });
  it('publica todos los servicios', () => {
    expect((jsonLd.makesOffer as unknown[]).length).toBe(10);
  });
});
