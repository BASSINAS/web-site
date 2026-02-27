#!/usr/bin/env node
// scripts/collect-and-pack.js
// Regroupe artéfacts Playwright et génère des JSON d'incident pour chaque test échoué.

const fs = require('fs');
const path = require('path');

function usage() {
  console.log('Usage: node scripts/collect-and-pack.js [--artifacts ./artifacts]');
}

const argv = process.argv.slice(2);
let artifactsDir = 'artifacts';
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--artifacts' && argv[i+1]) {
    artifactsDir = argv[i+1];
    i++;
  }
}

if (!fs.existsSync(artifactsDir)) {
  console.error(`Artifacts directory not found: ${artifactsDir}`);
  usage();
  process.exit(1);
}

function walkDirSync(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results.push(...walkDirSync(full));
    } else {
      results.push(full);
    }
  });
  return results;
}

function findJsonFiles(dir) {
  const all = walkDirSync(dir);
  return all.filter(f => f.toLowerCase().endsWith('.json'));
}

function tryParseJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return null;
  }
}

// Try to load reporter outputs that likely contain test results
const candidates = [
  path.join(artifactsDir, 'playwright-results.json'),
  path.join('test-results', 'aggregate-results.json'),
  path.join('test-results', 'aggregate-results.json')
];

let resultObjects = [];
for (const c of candidates) {
  if (fs.existsSync(c)) {
    const parsed = tryParseJson(c);
    if (parsed) resultObjects.push({ source: c, content: parsed });
  }
}

// Also parse any JSON files in artifacts and test-results
const moreJsons = findJsonFiles(artifactsDir).concat(findJsonFiles('test-results')).filter(Boolean);
for (const jf of moreJsons) {
  const parsed = tryParseJson(jf);
  if (parsed) resultObjects.push({ source: jf, content: parsed });
}

// Heuristic: traverse parsed JSONs and find objects that look like test results
function extractFailuresFromObject(obj, source) {
  const failures = [];

  function walk(o) {
    if (!o || typeof o !== 'object') return;
    // Common Playwright reporter fields: status, title, file, error
    if (o.status && (o.status === 'failed' || o.status === 'error')) {
      failures.push({ __source: source, entry: o });
    }
    // Some reporters use 'results' arrays
    if (Array.isArray(o)) {
      o.forEach(walk);
    } else {
      Object.keys(o).forEach(k => walk(o[k]));
    }
  }

  walk(obj);
  return failures;
}

for (const ro of resultObjects) {
  const f = extractFailuresFromObject(ro.content, ro.source);
  if (f.length) {
    resultObjects.failures = (resultObjects.failures || []).concat(f);
  }
}

// If no explicit failures found in JSON, fallback: try to detect failed test folders by presence of 'failed' text files or non-empty screenshots
const allFiles = walkDirSync(artifactsDir);

// Build quick maps for artifact types
const screenshots = allFiles.filter(f => f.match(/\.png$/i));
const videos = allFiles.filter(f => f.match(/\.(webm|mp4|mov)$/i));
const traces = allFiles.filter(f => f.match(/trace.*\.zip$/i) || f.match(/\.zip$/i));
const hars = allFiles.filter(f => f.match(/\.har$/i));
const htmls = allFiles.filter(f => f.match(/\.html$/i));
const logs = allFiles.filter(f => f.match(/\.log$|console|stderr|stdout/i));

// Prepare output folder
const incidentsDir = path.join(artifactsDir, 'incidents');
if (!fs.existsSync(incidentsDir)) fs.mkdirSync(incidentsDir, { recursive: true });

let incidentCount = 0;

function writeIncident(incident) {
  incidentCount++;
  const out = path.join(incidentsDir, `incident-${Date.now()}-${incidentCount}.json`);
  fs.writeFileSync(out, JSON.stringify(incident, null, 2), 'utf8');
  console.log('Wrote', out);
}

// Create incident objects from discovered failures
if (resultObjects.failures && resultObjects.failures.length) {
  for (const f of resultObjects.failures) {
    const e = f.entry;
    const title = e.title || (e.test && e.test.title) || 'unknown test';
    const file = e.file || (e.location && e.location.file) || 'unknown file';
    const err = e.error || e.err || e.errors || null;
    const errStr = err ? (typeof err === 'string' ? err : JSON.stringify(err)) : '';

    // Try to find related artifacts by filename or title
    const matchKey = path.basename(file).replace(/\.[^.]+$/, '');
    const relatedScreens = screenshots.filter(s => s.toLowerCase().includes(matchKey.toLowerCase()) || s.toLowerCase().includes(path.basename(title).toLowerCase()));
    const relatedVideos = videos.filter(s => s.toLowerCase().includes(matchKey.toLowerCase()));
    const relatedTraces = traces.filter(s => s.toLowerCase().includes(matchKey.toLowerCase()));
    const relatedHars = hars.filter(s => s.toLowerCase().includes(matchKey.toLowerCase()));
    const relatedHtml = htmls.filter(s => s.toLowerCase().includes(matchKey.toLowerCase()));
    const relatedLogs = logs.filter(s => s.toLowerCase().includes(matchKey.toLowerCase()));

    const incident = {
      testId: `${file}:${title}`,
      title,
      file,
      error: errStr,
      screenshots: relatedScreens,
      videos: relatedVideos,
      traces: relatedTraces,
      hars: relatedHars,
      html: relatedHtml,
      logs: relatedLogs,
      metadata: {
        baseURL: process.env.BASE_URL || null,
        artifactsDir: path.resolve(artifactsDir),
        sourceJson: f.__source
      }
    };

    writeIncident(incident);
  }
} else {
  // fallback: if there are screenshots or traces, create incidents per folder that contains them
  const candidateFolders = new Set();
  [...screenshots, ...videos, ...traces, ...hars, ...htmls].forEach(p => candidateFolders.add(path.dirname(p)));
  if (candidateFolders.size === 0) {
    console.log('No failures or artifacts found to pack.');
    process.exit(0);
  }
  for (const folder of candidateFolders) {
    const files = walkDirSync(folder);
    const incident = {
      testId: `auto:${path.basename(folder)}`,
      title: `Artifacts from ${path.basename(folder)}`,
      file: folder,
      error: '',
      screenshots: files.filter(f => f.match(/\.png$/i)),
      videos: files.filter(f => f.match(/\.(webm|mp4|mov)$/i)),
      traces: files.filter(f => f.match(/trace.*\.zip$/i) || f.match(/\.zip$/i)),
      hars: files.filter(f => f.match(/\.har$/i)),
      html: files.filter(f => f.match(/\.html$/i)),
      logs: files.filter(f => f.match(/\.log$|console|stderr|stdout/i)),
      metadata: {
        baseURL: process.env.BASE_URL || null,
        artifactsDir: path.resolve(artifactsDir),
        generatedFrom: 'fallback-scan'
      }
    };
    writeIncident(incident);
  }
}

console.log('\nDone. Incidents written to', incidentsDir);
