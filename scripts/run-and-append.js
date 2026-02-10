const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const cwd = path.resolve(__dirname, '..');
const outFile = path.resolve(cwd, 'test-results', 'aggregate-results.json');

// Read SOFTWARE VERSION from web-site/VERSION if present
const versionFile = path.resolve(cwd, 'VERSION');
let softwareVersion = 'unknown';
try {
  if (fs.existsSync(versionFile)) {
    const raw = fs.readFileSync(versionFile, 'utf8');
    const firstLine = raw.split(/\r?\n/).find(l => l.trim() !== '') || '';
    const m = firstLine.match(/SOFTWARE\s*VERSION\s*:\s*(.+)/i);
    softwareVersion = m ? m[1].trim() : firstLine.trim();
  }
} catch (e) {
  softwareVersion = 'unknown';
}

function appendRun(summary) {
  let existing = [];
  try {
    if (fs.existsSync(outFile)) {
      const content = fs.readFileSync(outFile, 'utf8').trim();
      if (content) existing = JSON.parse(content);
      if (!Array.isArray(existing)) existing = [];
    }
  } catch (e) {
    existing = [];
  }

  existing.push(summary);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(existing, null, 2), 'utf8');
  console.log('Appended run to', outFile);
}

const proc = spawn('npx', ['playwright', 'test', '--reporter=list'], { cwd, shell: true });
let stdout = '';
let stderr = '';
proc.stdout.on('data', (d) => { const s = d.toString(); process.stdout.write(s); stdout += s; });
proc.stderr.on('data', (d) => { const s = d.toString(); process.stderr.write(s); stderr += s; });
proc.on('close', (code) => {
  const now = new Date();
  const runAt = now.toISOString();
  // parse counts
  const passedMatch = stdout.match(/(\d+) passed/);
  const failedMatch = stdout.match(/(\d+) failed/);
  const skippedMatch = stdout.match(/(\d+) skipped/);
  const timedOutMatch = stdout.match(/(\d+) timedOut/);
  const totalMatch = stdout.match(/Running\s+(\d+) tests/);

  const passed = passedMatch ? Number(passedMatch[1]) : 0;
  const failed = failedMatch ? Number(failedMatch[1]) : 0;
  const skipped = skippedMatch ? Number(skippedMatch[1]) : 0;
  const timedOut = timedOutMatch ? Number(timedOutMatch[1]) : 0;
  const total = totalMatch ? Number(totalMatch[1]) : (passed + failed + skipped + timedOut);

  const summary = {
    runAt,
    exitCode: code,
    total,
    softwareVersion,
    counts: { passed, failed, skipped, timedOut },
    stdoutSnippet: stdout.slice(-2000),
    stderrSnippet: stderr.slice(-2000)
  };

  appendRun(summary);
  process.exit(code);
});
