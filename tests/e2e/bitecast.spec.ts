import { expect, test } from '@playwright/test';

function mockForecastPayload() {
  const baseEpoch = 1_705_000_000;
  const hours = 72;

  return {
    latitude: 39.7392,
    longitude: -104.9903,
    timezone: 'America/Denver',
    hourly: {
      time: Array.from({ length: hours }, (_, i) => baseEpoch + i * 3600),
      temperature_2m: Array.from({ length: hours }, (_, i) => 16 + Math.sin(i / 3) * 5),
      precipitation_probability: Array.from({ length: hours }, (_, i) => (i % 9 === 0 ? 48 : 22)),
      windspeed_10m: Array.from({ length: hours }, (_, i) => 9 + (i % 8)),
      windgusts_10m: Array.from({ length: hours }, (_, i) => 17 + (i % 11)),
      cloudcover: Array.from({ length: hours }, (_, i) => 30 + (i % 45)),
      surface_pressure: Array.from({ length: hours }, (_, i) => 1014 - i * 0.12),
      pressure_msl: Array.from({ length: hours }, (_, i) => 1014 - i * 0.12),
    },
  };
}

test('deny geolocation, manual search, and cached offline result', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_success, error) => {
      error({
        code: 1,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
        message: 'Permission denied',
      } as GeolocationPositionError);
    };
  });

  await page.route('https://geocoding-api.open-meteo.com/v1/search**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            id: 1,
            name: 'Denver',
            admin1: 'Colorado',
            country: 'United States',
            latitude: 39.7392,
            longitude: -104.9903,
            timezone: 'America/Denver',
          },
        ],
      }),
    });
  });

  await page.route('https://api.open-meteo.com/v1/forecast**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(mockForecastPayload()),
    });
  });

  await page.goto('/');

  await page.getByRole('button', { name: /use my location/i }).click();
  await expect(page.locator('.location-error').filter({ hasText: /location permission denied/i })).toBeVisible();

  await page.getByLabel(/search city, state, or country/i).fill('denver');
  const resultOption = page.getByRole('button', { name: /denver, colorado, united states/i });
  await expect(resultOption).toBeVisible();
  await resultOption.click();

  await expect(page.getByText('Bite Score')).toBeVisible();
  await expect(page.locator('.score-value')).toContainText(/[0-9]+/);
  await expect(page.getByRole('heading', { name: /next hours/i })).toBeVisible();

  await page.getByRole('link', { name: /^Details$/ }).click();
  await expect(page).toHaveURL(/\/details$/);
  await expect(page.getByText(/no forecast loaded|48h hourly forecast \+ bite score/i)).toBeVisible();

  await page.getByRole('link', { name: /^Settings$/ }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole('heading', { name: /^Settings$/ })).toBeVisible();

  await page.getByRole('link', { name: /^Home$/ }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.score-value')).toContainText(/[0-9]+/);

  await page.context().setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));

  await expect(page.getByText(/offline mode: showing cached forecast/i)).toBeVisible();
  await expect(page.locator('.score-value')).toContainText(/[0-9]+/);
});
