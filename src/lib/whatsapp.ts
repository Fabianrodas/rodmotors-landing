import type { WeeklySchedule } from '../data/site';
import { DAY_NAMES, dayOfIsoDate } from './hours';

export const VEHICLE_TYPES = ['liviano', 'semipesado', 'pesado'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  liviano: 'Liviano',
  semipesado: 'Semipesado',
  pesado: 'Pesado',
};

/** Lo que llega del formulario: todo string, como en el DOM. */
export interface BookingInput {
  vehicleType: string;
  service: string;
  vehicle: string;
  plate: string;
  preferredDate: string;
  name: string;
  notes: string;
}

export interface Booking {
  vehicleType: VehicleType;
  service: string;
  vehicle?: string;
  plate?: string;
  preferredDate?: string;
  name?: string;
  notes?: string;
}

export type BookingField = keyof BookingInput;

export type ValidationResult =
  | { ok: true; booking: Booking }
  | { ok: false; errors: Partial<Record<BookingField, string>> };

export interface ValidationContext {
  /** Fecha de hoy en Guayaquil, "YYYY-MM-DD". */
  today: string;
  schedule: WeeklySchedule;
  services: string[];
}

const MAX_PLATE = 10;
const MAX_NAME = 60;
const MAX_NOTES = 300;

export function validateBooking(input: BookingInput, context: ValidationContext): ValidationResult {
  const errors: Partial<Record<BookingField, string>> = {};
  const vehicleType = input.vehicleType.trim() as VehicleType;
  const service = input.service.trim();
  const vehicle = input.vehicle.trim();
  const plate = input.plate.trim().toUpperCase();
  const preferredDate = input.preferredDate.trim();
  const name = input.name.trim();
  const notes = input.notes.trim();

  if (!VEHICLE_TYPES.includes(vehicleType)) errors.vehicleType = 'Elige el tipo de vehículo.';
  if (!service) errors.service = 'Elige un servicio.';
  else if (!context.services.includes(service)) errors.service = 'Ese servicio no está en la lista.';
  if (plate.length > MAX_PLATE) errors.plate = `La placa no puede pasar de ${MAX_PLATE} caracteres.`;
  if (name.length > MAX_NAME) errors.name = `El nombre no puede pasar de ${MAX_NAME} caracteres.`;
  if (notes.length > MAX_NOTES) errors.notes = `La nota no puede pasar de ${MAX_NOTES} caracteres.`;
  if (preferredDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) errors.preferredDate = 'Usa el selector de fecha.';
    else if (preferredDate < context.today) errors.preferredDate = 'Elige una fecha de hoy en adelante.';
    else if (context.schedule[dayOfIsoDate(preferredDate)] === null) errors.preferredDate = 'Ese día el taller está cerrado. Elige otro.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    booking: {
      vehicleType,
      service,
      ...(vehicle ? { vehicle } : {}),
      ...(plate ? { plate } : {}),
      ...(preferredDate ? { preferredDate } : {}),
      ...(name ? { name } : {}),
      ...(notes ? { notes } : {}),
    },
  };
}

/** "2026-09-22" -> "martes 22/09/2026" */
export function formatBookingDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${DAY_NAMES[dayOfIsoDate(isoDate)]} ${d}/${m}/${y}`;
}

export function composeBookingMessage(booking: Booking, businessName: string): string {
  const lines = [`Hola ${businessName}, quiero agendar una cita.`, `Servicio: ${booking.service}`];
  lines.push(`Vehículo: ${VEHICLE_LABELS[booking.vehicleType]}${booking.vehicle ? `, ${booking.vehicle}` : ''}`);
  if (booking.plate) lines.push(`Placa: ${booking.plate}`);
  if (booking.preferredDate) lines.push(`Día preferido: ${formatBookingDate(booking.preferredDate)}`);
  if (booking.name) lines.push(`Mi nombre: ${booking.name}`);
  if (booking.notes) lines.push(`Nota: ${booking.notes}`);
  return lines.join('\n');
}

export function buildWhatsAppUrl(whatsappNumber: string, message: string): string {
  if (!/^\d{8,15}$/.test(whatsappNumber)) throw new Error(`Número de WhatsApp inválido: ${whatsappNumber}`);
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
