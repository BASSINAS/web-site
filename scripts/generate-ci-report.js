const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function extractVersion(versionFilePath) {
  try {
    if (!fs.existsSync(versionFilePath)) return 'unknown';
    const raw = fs.readFileSync(versionFilePath, 'utf8');
    const firstNonEmpty = raw.split(/\r?\n/).find((line) => line.trim() !== '') || '';
    const match = firstNonEmpty.match(/SOFTWARE\s*VERSION\s*:\s*(.+)/i);
    return (match ? match[1] : firstNonEmpty).trim() || 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

function walkSuites(suites, collector) {
  for (const suite of suites || []) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        collector(test, spec);
      }
    }
    walkSuites(suite.suites || [], collector);
  }
}

function computeCounts(playwrightJson) {
  const counts = {
    passed: 0,
    failed: 0,
    flaky: 0,
    interrupted: 0,
    timedOut: 0,
    skipped: 0,
    total: 0
  };

  walkSuites(playwrightJson.suites || [], (test) => {
    counts.total += 1;
    const results = Array.isArray(test.results) ? test.results : [];
    const lastResult = results.length ? results[results.length - 1] : null;
    const lastStatus = lastResult && lastResult.status;
    const status = test.status;

    if (status === 'flaky') {
      counts.flaky += 1;
      return;
    }
    if (lastStatus === 'timedOut') {
      counts.timedOut += 1;
      return;
    }
    if (lastStatus === 'interrupted') {
      counts.interrupted += 1;
      return;
    }
    if (status === 'skipped' || lastStatus === 'skipped') {
      counts.skipped += 1;
      return;
    }
    if (status === 'unexpected' || lastStatus === 'failed') {
      counts.failed += 1;
      return;
    }
    if (status === 'expected' || lastStatus === 'passed') {
      counts.passed += 1;
      return;
    }
    counts.failed += 1;
  });

  return counts;
}

function makeMarkdown(payload) {
  const { softwareVersion, runAt, counts, successRate, sourceFile } = payload;
  const successRateNumber = Number(successRate);
  const successIcon = successRateNumber >= 90 ? '🟢' : successRateNumber >= 70 ? '🟡' : '🔴';
  return [
    '# CI Test Summary',
    '',
    `- Software version: ${softwareVersion}`,
    `- Generated at: ${runAt}`,
    `- Source: ${sourceFile}`,
    '',
    '| Metric | Count |',
    '|---|---:|',
    `| ✅ Passed | ${counts.passed} |`,
    `| ❌ Failed | ${counts.failed} |`,
    `| 🔁 Flaky | ${counts.flaky} |`,
    `| ⛔ Interrupted | ${counts.interrupted} |`,
    `| ⏱️ Timed out | ${counts.timedOut} |`,
    `| ⏭️ Skipped | ${counts.skipped} |`,
    `| 📊 Total | ${counts.total} |`,
    '',
    `- ${successIcon} Success rate: **${successRate}%**`
  ].join('\n');
}

function main() {
  const cwd = process.cwd();
  const reportFile = process.env.PW_JSON_REPORT || path.resolve(cwd, 'artifacts', 'playwright-results.json');
  const versionFile = process.env.VERSION_FILE || path.resolve(cwd, 'VERSION');
  const outDir = process.env.CI_REPORT_OUT_DIR || path.resolve(cwd, 'artifacts');

  if (!fs.existsSync(reportFile)) {
    throw new Error(`Playwright JSON report not found at: ${reportFile}`);
  }

  const playwrightJson = readJson(reportFile);
  const counts = computeCounts(playwrightJson);
  const executed = Math.max(counts.total - counts.skipped, 0);
  const successful = counts.passed + counts.flaky;
  const successRate = executed === 0 ? '0.00' : ((successful / executed) * 100).toFixed(2);

  const payload = {
    softwareVersion: extractVersion(versionFile),
    runAt: new Date().toISOString(),
    sourceFile: path.relative(cwd, reportFile).replace(/\\/g, '/'),
    counts,
    successRate
  };

  fs.mkdirSync(outDir, { recursive: true });
  const jsonOut = path.resolve(outDir, 'ci-test-summary.json');
  const mdOut = path.resolve(outDir, 'ci-test-summary.md');

  fs.writeFileSync(jsonOut, JSON.stringify(payload, null, 2), 'utf8');
  fs.writeFileSync(mdOut, makeMarkdown(payload), 'utf8');

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${makeMarkdown(payload)}\n`, 'utf8');
  }

  console.log(`Generated ${jsonOut}`);
  console.log(`Generated ${mdOut}`);
}

main();