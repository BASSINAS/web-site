/** @type {import('@playwright/test').PlaywrightTestConfig} */
const TestInfoReporter = require('./modules/testInfo');

const config = {
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5000
  },
  // Artifacts and runtime configuration
  retries: 1,
  outputDir: 'artifacts',
  use: {
    headless: !!process.env.CI,
    baseURL: 'http://localhost:3001/',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    ignoreHTTPSErrors: true,
    // Artefacts
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['./modules/testInfo.js'],
    ['./modules/jsonAppenderReporter2.js', { file: './test-results/aggregate-results.json' }],
    ['json', { outputFile: 'artifacts/playwright-results.json' }]
  ],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } }
  ]
};

module.exports = config;
