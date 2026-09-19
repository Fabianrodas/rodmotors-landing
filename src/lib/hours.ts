import type { DayIndex, TimeRange, WeeklySchedule } from '../data/site';

/** Ecuador continental usa UTC-5 todo el año (no hay horario de verano). */
const GUAYAQUIL_UTC_OFFSET_MINUTES = -300;

export const DAY_NAMES: Record<DayIndex, string> = {
  0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miércoles', 4: 'jueves', 5: 'viernes', 6: 'sábado',
};

export function toMinutes(hhmm: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!match) throw new Error(`Hora inválida: ${hhmm}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

export function guayaquilClock(date: Date): { day: DayIndex; minutes: number } {
  const shifted = new Date(date.getTime() + GUAYAQUIL_UTC_OFFSET_MINUTES * 60_000);
  return { day: shifted.getUTCDay() as DayIndex, minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() };
}

export type OpenStatus =
  | { kind: 'open'; closesAt: string }
  | { kind: 'closed'; opensAt: string; opensOn: 'today' | 'tomorrow' | DayIndex }
  | { kind: 'unknown' };

export function getOpenStatus(date: Date, schedule: WeeklySchedule): OpenStatus {
  const { day, minutes } = guayaquilClock(date);
  const today = schedule[day];
  if (today) {
    if (minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) return { kind: 'open', closesAt: today.close };
    if (minutes < toMinutes(today.open)) return { kind: 'closed', opensAt: today.open, opensOn: 'today' };
  }
  for (let offset = 1; offset <= 7; offset += 1) {
    const nextDay = ((day + offset) % 7) as DayIndex;
    const range = schedule[nextDay];
    if (range) return { kind: 'closed', opensAt: range.open, opensOn: offset === 1 ? 'tomorrow' : nextDay };
  }
  return { kind: 'unknown' };
}

export function formatOpenStatus(status: OpenStatus): string {
  switch (status.kind) {
    case 'open':
      return `Abierto ahora. Cierra a las ${status.closesAt}`;
    case 'closed': {
      const when = status.opensOn === 'today' ? 'hoy' : status.opensOn === 'tomorrow' ? 'mañana' : `el ${DAY_NAMES[status.opensOn]}`;
      return `Cerrado. Abre ${when} a las ${status.opensAt}`;
    }
    default:
      return 'Consulta nuestro horario';
  }
}

export interface ScheduleRow { label: string; hours: string }

const READING_ORDER: DayIndex[] = [1, 2, 3, 4, 5, 6, 0];

function sameRange(a: TimeRange | null, b: TimeRange | null): boolean {
  if (a === null || b === null) return a === b;
  return a.open === b.open && a.close === b.close;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Agrupa días consecutivos con el mismo horario: "Lunes a viernes: 08:30 a 18:00". */
export function groupSchedule(schedule: WeeklySchedule): ScheduleRow[] {
  const groups: { days: DayIndex[]; range: TimeRange | null }[] = [];
  for (const day of READING_ORDER) {
    const range = schedule[day];
    const last = groups.at(-1);
    if (last && sameRange(last.range, range)) last.days.push(day);
    else groups.push({ days: [day], range });
  }
  return groups.map(({ days, range }) => ({
    label: days.length === 1 ? capitalize(DAY_NAMES[days[0]]) : `${capitalize(DAY_NAMES[days[0]])} a ${DAY_NAMES[days[days.length - 1]]}`,
    hours: range ? `${range.open} a ${range.close}` : 'Cerrado',
  }));
}

/** Día de la semana de una fecha "YYYY-MM-DD" sin depender de la zona horaria del navegador. */
export function dayOfIsoDate(isoDate: string): DayIndex {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() as DayIndex;
}

/** Fecha de hoy en Guayaquil como "YYYY-MM-DD". */
export function guayaquilIsoDate(date: Date): string {
  return new Date(date.getTime() + GUAYAQUIL_UTC_OFFSET_MINUTES * 60_000).toISOString().slice(0, 10);
}
