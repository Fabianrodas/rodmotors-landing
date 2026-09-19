import { describe, expect, it } from 'vitest';
import { serviceNames, site } from '../../src/data/site';

function allStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(allStrings);
  return [];
}

const strings = allStrings(site);

describe('datos del negocio', () => {
  it('no usa guiones largos ni cortos en el texto', () => {
    const offenders = strings.filter((text) => /[—–]/.test(text));
    expect(offenders).toEqual([]);
  });

  it('no usa emojis', () => {
    const offenders = strings.filter((text) => /\p{Extended_Pictographic}/u.test(text));
    expect(offenders).toEqual([]);
  });

  it('el teléfono está en formato E.164 y el de WhatsApp solo tiene dígitos', () => {
    expect(site.phoneE164).toMatch(/^\+593\d{9}$/);
    expect(site.whatsappNumber).toMatch(/^593\d{9}$/);
    expect(site.phoneE164).toBe(`+${site.whatsappNumber}`);
  });

  it('los identificadores de servicio son únicos', () => {
    const ids = site.serviceGroups.flatMap((group) => group.services.map((service) => service.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(serviceNames.length).toBe(ids.length);
  });

  it('la descripción sirve como meta description', () => {
    expect(site.description.length).toBeGreaterThanOrEqual(70);
    expect(site.description.length).toBeLessThanOrEqual(160);
  });

  it('el horario abre al menos cinco días', () => {
    const openDays = Object.values(site.schedule).filter(Boolean);
    expect(openDays.length).toBeGreaterThanOrEqual(5);
  });

  it('cada resumen de servicio es corto', () => {
    for (const name of site.serviceGroups.flatMap((group) => group.services)) {
      expect(name.summary.split(' ').length, name.name).toBeLessThanOrEqual(20);
    }
  });
});
