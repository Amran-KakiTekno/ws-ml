import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = 'http://127.0.0.1:4106';

async function selectFilter(page: Page, testId: string, value: string): Promise<void> {
  await page.getByTestId(testId).selectOption(value);
}

/** Collect every attribute value of every SVG in the page, so NaN can be detected. */
async function svgAttributeValues(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const values: string[] = [];
    for (const svg of Array.from(document.querySelectorAll('svg'))) {
      for (const attribute of Array.from(svg.attributes)) {
        values.push(attribute.value);
      }
      for (const element of Array.from(svg.querySelectorAll('*'))) {
        for (const attribute of Array.from(element.attributes)) {
          values.push(attribute.value);
        }
      }
    }
    return values;
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Intervention Explorer' })).toBeVisible();
});

test('the synthetic-data notice is visible on the page', async ({ page }) => {
  await expect(page.getByText('Synthetic data.', { exact: false }).first()).toBeVisible();
});

test('the initial state shows all twelve authored operations', async ({ page }) => {
  await expect(page.getByTestId('kpi-count')).toHaveText('12');
  await expect(page.getByTestId('record-row')).toHaveCount(12);

  const countCells = await page
    .getByTestId('chart-count-by-family')
    .locator('tbody tr td')
    .allTextContents();
  const summed = countCells.reduce((sum, cell) => sum + Number(cell.trim()), 0);
  expect(summed).toBe(12);
});

test('filtering by Survey narrows the records and the KPIs to four', async ({ page }) => {
  await selectFilter(page, 'filter-family', 'Survey');

  await expect(page.getByTestId('kpi-count')).toHaveText('4');
  await expect(page.getByTestId('record-row')).toHaveCount(4);
  await expect(page.getByTestId('chart-count-by-family').locator('tbody tr')).toHaveCount(1);
  await expect(page.getByTestId('chart-count-by-family').locator('tbody td').first()).toHaveText('4');
});

test('filtering by region and outcome applies both dimensions', async ({ page }) => {
  await selectFilter(page, 'filter-region', 'Central');
  await selectFilter(page, 'filter-outcome', 'Complete');

  const count = await page.getByTestId('kpi-count').textContent();
  expect(Number(count)).toBeGreaterThan(0);
  expect(Number(count)).toBeLessThan(12);

  for (const row of await page.getByTestId('record-row').all()) {
    await expect(row).toContainText('Central');
    await expect(row).toContainText('Complete');
  }
});

test('the KPI values recompute from the filtered rows', async ({ page }) => {
  await selectFilter(page, 'filter-family', 'Survey');

  const durations = await page
    .getByTestId('record-row')
    .locator('td:nth-child(6)')
    .allTextContents();
  const expectedAverage =
    durations.reduce((sum, value) => sum + Number(value.trim()), 0) / durations.length;
  const shown = (await page.getByTestId('kpi-average-duration').textContent()) ?? '';
  expect(Number(shown.replace('h', '').trim())).toBeCloseTo(expectedAverage, 1);

  const completion = await page.getByTestId('kpi-completion-rate').textContent();
  expect(completion).toMatch(/^\d+\.\d%$/);
});

test('selecting an operation shows its synthetic detail and sequence summary', async ({ page }) => {
  await expect(page.getByTestId('detail-empty')).toBeVisible();

  await page.getByTestId('inspect-op-1001').click();

  await expect(page.getByTestId('detail-panel')).toBeVisible();
  await expect(page.getByTestId('detail-operation-id')).toContainText('op-1001');
  await expect(page.getByTestId('detail-family')).toHaveText('Cleanout');
  await expect(page.getByTestId('detail-region')).toHaveText('North');
  await expect(page.getByTestId('detail-outcome')).toHaveText('Complete');
  await expect(page.getByTestId('detail-sequence')).toContainText('Isolate the line');
});

test('an impossible filter combination shows the empty state with zeroed KPIs', async ({ page }) => {
  await selectFilter(page, 'filter-family', 'Survey');
  await selectFilter(page, 'filter-region', 'South');

  await expect(page.getByTestId('empty-state')).toHaveText('No operations match these filters');
  await expect(page.getByTestId('kpi-count')).toHaveText('0');
  await expect(page.getByTestId('kpi-average-duration')).toHaveText('0.0 h');
  await expect(page.getByTestId('kpi-non-productive')).toHaveText('0.0 h');
  await expect(page.getByTestId('kpi-completion-rate')).toHaveText('0.0%');
  await expect(page.getByTestId('record-row')).toHaveCount(0);

  const values = await svgAttributeValues(page);
  expect(values.join(' ')).not.toContain('NaN');
  expect(values.join(' ')).not.toContain('Infinity');
});

test('the page recovers from the empty state when the filters are reset', async ({ page }) => {
  await selectFilter(page, 'filter-family', 'Survey');
  await selectFilter(page, 'filter-region', 'South');
  await expect(page.getByTestId('empty-state')).toBeVisible();

  await page.getByTestId('reset-filters').click();

  await expect(page.getByTestId('empty-state')).toHaveCount(0);
  await expect(page.getByTestId('kpi-count')).toHaveText('12');
  await expect(page.getByTestId('record-row')).toHaveCount(12);
});

test('the filtered summary downloads as a client-generated CSV', async ({ page }) => {
  await selectFilter(page, 'filter-family', 'Survey');
  await expect(page.getByTestId('record-row')).toHaveCount(4);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('download-csv').click(),
  ]);

  expect(download.suggestedFilename()).toBe('intervention-explorer-summary.csv');

  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  const csv = Buffer.concat(chunks).toString('utf8');
  const lines = csv.split('\n');

  expect(lines).toHaveLength(5);
  expect(lines[0]).toBe(
    'operationId,assetAlias,family,region,startedOn,durationHours,nonProductiveHours,outcome,sequenceSummary',
  );
  expect(lines.slice(1).every((line) => line.startsWith('op-3'))).toBe(true);
  expect(csv).toContain('Survey');
});

test('the charts expose accessible titles, descriptions and tabular alternatives', async ({ page }) => {
  const chart = page.getByTestId('chart-count-by-family');
  await expect(chart.locator('svg title')).toHaveText('Operations by family');
  await expect(chart.locator('svg desc')).not.toBeEmpty();
  await expect(chart.locator('table')).toBeVisible();
  await expect(chart.locator('tbody tr')).toHaveCount(3);

  await expect(page.getByTestId('chart-average-duration-by-family').locator('table')).toBeVisible();
  await expect(page.getByTestId('chart-duration-scatter').locator('table')).toBeVisible();
  await expect(page.getByTestId('chart-duration-scatter').locator('tbody tr')).toHaveCount(12);
});

test('the page does not overflow horizontally at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByTestId('record-row')).toHaveCount(12);

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
});

test('the page has no serious or critical accessibility violations', async ({ page }) => {
  await page.getByTestId('inspect-op-1001').click();
  await expect(page.getByTestId('detail-panel')).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );

  expect(blocking).toEqual([]);
});

test('the running page makes no request to a non-local origin', async ({ page }) => {
  const externalRequests: string[] = [];

  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (
      !url.startsWith(BASE_URL) &&
      !url.startsWith('data:') &&
      !url.startsWith('blob:') &&
      !url.startsWith('about:')
    ) {
      externalRequests.push(url);
    }
    await route.continue();
  });

  await selectFilter(page, 'filter-family', 'Survey');
  await page.getByTestId('inspect-op-3001').click();
  await expect(page.getByTestId('detail-panel')).toBeVisible();

  expect(externalRequests).toEqual([]);
});
