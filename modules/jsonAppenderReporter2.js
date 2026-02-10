const fs = require('fs');
const path = require('path');

class JsonAppenderReporter {
  constructor(options) {
    this._file = (options && options.file) || './test-results/aggregate-results.json';
    this._results = [];
    this._startMs = Date.now();
    this._start = new Date().toISOString();
  }

  onBegin() {
    this._startMs = Date.now();
    this._start = new Date(this._startMs).toISOString();
    this._results = [];
  }

  onTestEnd(test, result) {
    const item = {
      titlePath: typeof test.titlePath === 'function' ? test.titlePath() : (test.parent ? [...test.parent.map(p => p.title), test.title] : [test.title]),
      title: test.title,
      file: test.location && test.location.file,
      line: test.location && test.location.line,
      status: result.status,
      duration: result.duration,
      errors: (result.errors || (result.error ? [result.error] : [])).map(e => e && (e.message || String(e))),
      stdout: result.stdout || [],
      stderr: result.stderr || []
    };
    this._results.push(item);
  }

  onEnd() {
    const endMs = Date.now();
    const endAt = new Date(endMs).toISOString();
    const durationMs = endMs - this._startMs;

    const counts = this._results.reduce((acc, t) => {
      acc.total += 1;
      const s = t.status || 'unknown';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, { total: 0 });

    const runEntry = {
      runAt: this._start,
      endAt,
      durationMs,
      total: counts.total,
      counts: {
        passed: counts.passed || 0,
        failed: counts.failed || 0,
        skipped: counts.skipped || 0,
        timedOut: counts.timedOut || 0,
        unknown: counts.unknown || 0
      },
      tests: this._results
    };

    const outPath = path.resolve(__dirname, '..', this._file);
    const dir = path.dirname(outPath);
    try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { }

    let existing = [];
    try {
      if (fs.existsSync(outPath)) {
        const content = fs.readFileSync(outPath, 'utf8').trim();
        if (content) existing = JSON.parse(content);
        if (!Array.isArray(existing)) existing = [];
      }
    } catch (e) {
      existing = [];
    }

    existing.push(runEntry);

    try {
      fs.writeFileSync(outPath, JSON.stringify(existing, null, 2), 'utf8');
      // eslint-disable-next-line no-console
      console.log(`Appended run with ${runEntry.total} tests to ${outPath}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to write aggregate results file:', e);
    }
  }
}

module.exports = JsonAppenderReporter;
