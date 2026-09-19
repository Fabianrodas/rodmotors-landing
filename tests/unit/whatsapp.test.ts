import { describe, expect, it } from 'vitest';
import { serviceNames, site } from '../../src/data/site';
import { buildWhatsAppUrl, composeBookingMessage, formatBookingDate, validateBooking } from '../../src/lib/whatsapp';
import type { BookingInput } from '../../src/lib/whatsapp';

const context = { today: '2026-09-16', schedule: site.schedule, services: serviceNames };

const empty: BookingInput = { vehicleType: '', service: '', vehicle: '', plate: '', preferredDate: '', name: '', notes: '' };
const valid: BookingInput = { ...empty, vehicleType: 'pesado', service: 'Alineación computarizada' };

describe('validateBooking', () => {
  it('exige tipo de vehículo y servicio', () => {
    const result = validateBooking(empty, context);
    expect(result).toEqual({ ok: false, errors: { vehicleType: 'Elige el tipo de vehículo.', service: 'Elige un servicio.' } });
  });
  it('rechaza servicios fuera de la lista', () => {
    const result = validateBooking({ ...valid, service: 'Pintura' }, context);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.service).toBe('Ese servicio no está en la lista.');
  });
  it('rechaza fechas pasadas', () => {
    const result = validateBooking({ ...valid, preferredDate: '2026-09-15' }, context);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.preferredDate).toBe('Elige una fecha de hoy en adelante.');
  });
  it('rechaza días cerrados', () => {
    const result = validateBooking({ ...valid, preferredDate: '2026-09-20' }, context);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.preferredDate).toBe('Ese día el taller está cerrado. Elige otro.');
  });
  it('acepta el mismo día y normaliza la placa', () => {
    const result = validateBooking({ ...valid, preferredDate: '2026-09-16', plate: ' gba-1234 ' }, context);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.booking).toEqual({ vehicleType: 'pesado', service: 'Alineación computarizada', plate: 'GBA-1234', preferredDate: '2026-09-16' });
  });
  it('limita el largo de la nota', () => {
    const result = validateBooking({ ...valid, notes: 'a'.repeat(301) }, context);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.notes).toBe('La nota no puede pasar de 300 caracteres.');
  });
});

describe('mensaje de WhatsApp', () => {
  it('formatea la fecha en español', () => {
    expect(formatBookingDate('2026-09-22')).toBe('martes 22/09/2026');
  });
  it('arma el mensaje solo con los campos llenos', () => {
    const message = composeBookingMessage({ vehicleType: 'liviano', service: 'Frenos', vehicle: 'Chevrolet Sail 2018' }, site.name);
    expect(message).toBe(['Hola Rod Motors, quiero agendar una cita.', 'Servicio: Frenos', 'Vehículo: Liviano, Chevrolet Sail 2018'].join('\n'));
  });
  it('arma la URL de wa.me con el texto codificado', () => {
    const url = buildWhatsAppUrl(site.whatsappNumber, 'Hola Rod Motors\nServicio: Frenos');
    expect(url).toBe('https://wa.me/593983323194?text=Hola%20Rod%20Motors%0AServicio%3A%20Frenos');
  });
  it('rechaza números mal formados', () => {
    expect(() => buildWhatsAppUrl('+593983323194', 'hola')).toThrow();
  });
});
