import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const stubWhatsApp = async (page: import('@playwright/test').Page) => {
  await page.route('https://wa.me/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<p>WhatsApp</p>' }));
};

test('la orden de trabajo abre WhatsApp con el mensaje armado', async ({ page }) => {
  await stubWhatsApp(page);
  await page.goto('/');

  const form = page.locator('form[data-orden]');
  // El radio real queda oculto (sr-only) a propósito: el control visible es la etiqueta
  // que lo envuelve. force evita el chequeo de visibilidad del input, no el evento.
  await form.getByRole('radio', { name: 'Pesado', exact: true }).check({ force: true });
  await page.locator('#service').selectOption('Alineación computarizada');
  await page.getByLabel('Placa').fill('gba-1234');
  await form.getByRole('button', { name: 'Agendar por WhatsApp' }).click();

  await page.waitForURL(/wa\.me/);
  const text = new URL(page.url()).searchParams.get('text') ?? '';
  expect(text).toContain('Servicio: Alineación computarizada');
  expect(text).toContain('Vehículo: Pesado');
  expect(text).toContain('Placa: GBA-1234');
});

test('muestra el error junto al campo cuando falta el servicio', async ({ page }) => {
  await stubWhatsApp(page);
  await page.goto('/');

  const form = page.locator('form[data-orden]');
  await form.getByRole('button', { name: 'Agendar por WhatsApp' }).click();

  await expect(form.locator('[data-error="service"]')).toHaveText('Elige un servicio.');
  await expect(page.locator('#service')).toHaveAttribute('aria-invalid', 'true');
  await expect(page).toHaveURL(/\/$/);
});

test('en celular el CTA del hero se ve sin hacer scroll', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'celular', 'Solo aplica al viewport de celular');
  await page.goto('/');
  await expect(page.locator('main section').first().getByRole('link', { name: 'Agendar por WhatsApp' })).toBeInViewport();
});

test('el titular del hero ocupa como máximo 2 líneas', async ({ page }) => {
  await page.goto('/');
  const lines = await page.locator('h1').evaluate((h1) => Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight)));
  expect(lines).toBeLessThanOrEqual(2);
});

test('el menú de celular abre, navega a Servicios y marca la página actual', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'celular', 'El menú desplegable solo existe en celular');
  await page.goto('/');
  // La etiqueta del botón cambia a "Cerrar menú" al abrirse, así que se ubica por el
  // gancho estable, no por un nombre accesible que cambia con el estado.
  const boton = page.locator('[data-menu-boton]');
  await boton.click();
  await expect(boton).toHaveAttribute('aria-expanded', 'true');
  await expect(boton).toHaveAccessibleName('Cerrar menú');
  await page.getByRole('navigation', { name: 'Principal, celular' }).getByRole('link', { name: 'Servicios' }).click();
  await expect(page).toHaveURL(/\/servicios$/);
  // El menú se cierra solo al navegar (correcto); se vuelve a abrir para comprobar que la
  // página nueva, ya cargada de cero, marca su propio enlace como el actual.
  await boton.click();
  await expect(page.getByRole('navigation', { name: 'Principal, celular' }).getByRole('link', { name: 'Servicios' })).toHaveAttribute('aria-current', 'page');
});

test('las pestañas de servicios cambian de panel con el teclado', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'Las pestañas solo se ven en escritorio; en celular las tres tarjetas van apiladas');
  await page.goto('/');
  const tabs = page.getByRole('tab');
  await tabs.first().focus();
  await expect(page.getByRole('tabpanel')).toContainText('Mantenimiento preventivo');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('tab', { selected: true })).toHaveText(/Diagnóstico y motor/);
  await expect(page.getByRole('tabpanel')).toContainText('Diagnóstico computarizado');
});

test('el mapa no carga hasta que se toca', async ({ page }) => {
  await page.goto('/ubicacion');
  const mapa = page.getByRole('button', { name: 'Mapa de Google, carga al tocar' }).first();
  await expect(page.locator('iframe')).toHaveCount(0);
  await mapa.click();
  await expect(page.locator('iframe').first()).toBeVisible();
});

test('sin violaciones de accesibilidad serias, en cada página', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of ['/', '/servicios', '/ubicacion', '/acerca-de']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
    expect(serious, `${path}: ${JSON.stringify(serious, null, 2)}`).toEqual([]);
  }
});
