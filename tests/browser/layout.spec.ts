import { test, expect } from '@playwright/test';
for (const width of [360, 768, 1440]) {
  test(`public pages fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of ['/', '/check', '/guide', '/support', '/login']) {
      if (route === '/guide') continue;
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBeTruthy();
    }
    expect(errors).toEqual([]);
  });
}
