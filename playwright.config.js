/** @type {import('@playwright/test').PlaywrightTestConfig} */
const TestInfoReporter = require('./modules/testInfo');

const config = {
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5000
  },
  use: {
    headless: false,
    baseURL: 'http://localhost:3001/web-site/',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    ignoreHTTPSErrors: true
  },
  reporter: [
    ['html'],
    ['./modules/testInfo.js'],
    ['./modules/jsonAppenderReporter2.js', { file: './test-results/aggregate-results.json' }]
  ]
};

module.exports = config;
