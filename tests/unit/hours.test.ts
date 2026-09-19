import { describe, expect, it } from 'vitest';
import type { WeeklySchedule } from '../../src/data/site';
import { dayOfIsoDate, formatOpenStatus, getOpenStatus, groupSchedule, guayaquilClock, guayaquilIsoDate } from '../../src/lib/hours';

const schedule: WeeklySchedule = {
  0: null,
  1: { open: '08:30', close: '18:00' },
  2: { open: '08:30', close: '18:00' },
  3: { open: '08:30', close: '18:00' },
  4: { open: '08:30', close: '18:00' },
  5: { open: '08:30', close: '18:00' },
  6: { open: '08:30', close: '17:00' },
};

const at = (isoUtc: string) => new Date(isoUtc);

describe('guayaquilClock', () => {
  it('convierte UTC a hora local de Guayaquil', () => {
    expect(guayaquilClock(at('2026-09-16T15:00:00Z'))).toEqual({ day: 3, minutes: 600 });
  });
  it('mantiene el día local cuando en UTC ya es el siguiente', () => {
    expect(guayaquilClock(at('2026-09-17T02:00:00Z'))).toEqual({ day: 3, minutes: 21 * 60 });
  });
});

describe('getOpenStatus', () => {
  it('abierto un miércoles a las 10:00', () => {
    expect(getOpenStatus(at('2026-09-16T15:00:00Z'), schedule)).toEqual({ kind: 'open', closesAt: '18:00' });
  });
  it('antes de abrir dice que abre hoy', () => {
    expect(getOpenStatus(at('2026-09-16T12:00:00Z'), schedule)).toEqual({ kind: 'closed', opensAt: '08:30', opensOn: 'today' });
  });
  it('a la hora exacta de cierre ya está cerrado', () => {
    expect(getOpenStatus(at('2026-09-16T23:00:00Z'), schedule)).toEqual({ kind: 'closed', opensAt: '08:30', opensOn: 'tomorrow' });
  });
  it('el sábado en la noche salta el domingo cerrado', () => {
    expect(getOpenStatus(at('2026-09-19T23:30:00Z'), schedule)).toEqual({ kind: 'closed', opensAt: '08:30', opensOn: 1 });
  });
  it('sin días abiertos devuelve unknown', () => {
    const closed: WeeklySchedule = { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
    expect(getOpenStatus(at('2026-09-16T15:00:00Z'), closed)).toEqual({ kind: 'unknown' });
  });
});

describe('formatOpenStatus', () => {
  it('formatea cada estado', () => {
    expect(formatOpenStatus({ kind: 'open', closesAt: '18:00' })).toBe('Abierto ahora. Cierra a las 18:00');
    expect(formatOpenStatus({ kind: 'closed', opensAt: '08:30', opensOn: 'today' })).toBe('Cerrado. Abre hoy a las 08:30');
    expect(formatOpenStatus({ kind: 'closed', opensAt: '08:30', opensOn: 'tomorrow' })).toBe('Cerrado. Abre mañana a las 08:30');
    expect(formatOpenStatus({ kind: 'closed', opensAt: '08:30', opensOn: 1 })).toBe('Cerrado. Abre el lunes a las 08:30');
    expect(formatOpenStatus({ kind: 'unknown' })).toBe('Consulta nuestro horario');
  });
});

describe('groupSchedule', () => {
  it('agrupa días consecutivos con el mismo horario', () => {
    expect(groupSchedule(schedule)).toEqual([
      { label: 'Lunes a viernes', hours: '08:30 a 18:00' },
      { label: 'Sábado', hours: '08:30 a 17:00' },
      { label: 'Domingo', hours: 'Cerrado' },
    ]);
  });
});

describe('fechas', () => {
  it('dayOfIsoDate no depende de la zona horaria', () => {
    expect(dayOfIsoDate('2026-09-20')).toBe(0);
    expect(dayOfIsoDate('2026-09-21')).toBe(1);
  });
  it('guayaquilIsoDate usa la fecha local', () => {
    expect(guayaquilIsoDate(at('2026-09-17T03:00:00Z'))).toBe('2026-09-16');
  });
});
