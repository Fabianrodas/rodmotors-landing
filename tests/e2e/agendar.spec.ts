import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const stubWhatsApp = async (page: import('@playwright/test').Page) => {
  await page.route('https://wa.me/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<p>WhatsApp</p>' }),
  );
};

test('la orden de trabajo abre WhatsApp con el mensaje armado', async ({ page }) => {
  await stubWhatsApp(page);
  await page.goto('/');

  const form = page.locator('form[data-orden]');
  // El radio es sr-only: la persona toca la etiqueta. exact evita que coincida con "Semipesado".
  await form.getByText('Pesado', { exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Pesado', exact: true })).toBeChecked();
  await page.getByLabel('Servicio').selectOption('Alineación computarizada');
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

for (const colorScheme of ['light', 'dark'] as const) {
  test(`sin violaciones de accesibilidad serias en modo ${colorScheme === 'light' ? 'claro' : 'oscuro'}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    // axe mide el contraste con la opacidad del momento: espera a que termine la entrada del hero.
    await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== 'running'));
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}
