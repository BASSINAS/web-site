#!/usr/bin/env node
// scripts/analyze-incident.js
// Prototype d'analyse d'incident : heuristiques + appel optionnel à l'API OpenAI

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
let incidentPath = null;
let incidentsDir = path.join('artifacts', 'incidents');
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--incident' && argv[i+1]) { incidentPath = argv[i+1]; i++; }
  if (argv[i] === '--incidents-dir' && argv[i+1]) { incidentsDir = argv[i+1]; i++; }
}

function usage() {
  console.log('Usage: node scripts/analyze-incident.js --incident <path>');
  console.log('Or: node scripts/analyze-incident.js --incidents-dir <dir>');
}

if (!incidentPath && !fs.existsSync(incidentsDir)) {
  console.error('No incident specified and default incidents dir not found:', incidentsDir);
  usage();
  process.exit(1);
}

async function analyzeSingle(incidentFile) {
  const raw = fs.readFileSync(incidentFile, 'utf8');
  const inc = JSON.parse(raw);

  // Heuristics
  const heuristics = [];
  const err = (inc.error || '').toLowerCase();
  if (/timeout|timed out|exceeded/.test(err)) heuristics.push('Timeout probable (locator, network or slow load).');
  if (/cannot read property|typeerror/.test(err)) heuristics.push('JavaScript error (null/undefined access).');
  if (/ec|econnrefused|refused|enotfound|socket/.test(err)) heuristics.push('Network / infra error (connection refused or DNS).');
  if (inc.hars && inc.hars.length) heuristics.push('Network HAR present — check HTTP status codes and failed requests.');
  if ((inc.screenshots || []).length) heuristics.push('Screenshot(s) available — visual diff may help.');
  if ((inc.traces || []).length) heuristics.push('Trace(s) available — use Playwright trace viewer to inspect.');

  // Inspect network entries if provided in incident.network
  let netIssues = [];
  if (Array.isArray(inc.network)) {
    for (const n of inc.network) {
      if (n && n.status && n.status >= 500) netIssues.push({ url: n.url, status: n.status, type: 'server-error' });
      if (n && n.status && n.status >= 400 && n.status < 500) netIssues.push({ url: n.url, status: n.status, type: 'client-error' });
    }
    if (netIssues.length) heuristics.push(`Detected ${netIssues.length} network errors (4xx/5xx).`);
  }

  // Build short summary and prompt
  const summary = {
    testId: inc.testId || null,
    title: inc.title || null,
    file: inc.file || null,
    heuristics,
    networkIssues: netIssues,
    artifacts: {
      screenshots: inc.screenshots || [],
      videos: inc.videos || [],
      traces: inc.traces || [],
      hars: inc.hars || [],
      html: inc.html || []
    }
  };

  const prompt = [];
  prompt.push(`Contexte: test "${summary.title}" (${summary.testId}) dans ${summary.file}.`);
  if (inc.error) prompt.push(`Erreur: ${inc.error}`);
  if (netIssues.length) prompt.push(`Network issues: ${netIssues.slice(0,5).map(n=>`${n.status} ${n.url}`).join('; ')}`);
  if (summary.artifacts.screenshots.length) prompt.push(`Artifacts: ${summary.artifacts.screenshots.length} screenshot(s).`);
  if (summary.artifacts.traces.length) prompt.push(`Traces: ${summary.artifacts.traces.length} trace(s).`);
  prompt.push(`Heuristiques detectées: ${heuristics.join(' | ')}`);
  prompt.push('Question: Donne 3 causes probables, une estimation de confiance pour chaque cause (low/medium/high), et 2 actions concrètes pour investiguer ou corriger.');

  const userPrompt = prompt.join('\n');

  const analysis = {
    incidentFile: incidentFile,
    summary,
    prompt: userPrompt,
    llm: null,
    createdAt: new Date().toISOString()
  };

  // If OPENAI_API_KEY present, call API (Chat Completions)
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.OPENAI_API;
  if (apiKey) {
    console.log('OPENAI_API_KEY detected — calling OpenAI... (this may cost tokens)');
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a pragmatic test-analysis assistant. Provide concise diagnostics and concrete steps.' },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 800
        })
      });
      const data = await res.json();
      analysis.llm = data;
    } catch (err) {
      analysis.llm = { error: String(err) };
    }
  } else {
    // No API key — synthesize a simple heuristic-only answer
    const causes = [];
    if (heuristics.length === 0) causes.push({ cause: 'Unknown', confidence: 'low', actions: ['Inspect logs and artifacts manually'] });
    else {
      for (let i = 0; i < Math.min(3, heuristics.length); i++) {
        causes.push({ cause: heuristics[i], confidence: i===0 ? 'high' : 'medium', actions: ['Open related screenshot/trace', 'Check corresponding network request/status'] });
      }
    }
    analysis.llm = { heuristic_only: true, causes };
  }

  // Write analysis file
  const outDir = path.join(path.dirname(incidentFile));
  const outName = path.basename(incidentFile).replace(/\.json$/i, '') + '.analysis.json';
  const outPath = path.join(outDir, outName);
  fs.writeFileSync(outPath, JSON.stringify(analysis, null, 2), 'utf8');
  console.log('Analysis written to', outPath);
}

(async () => {
  if (incidentPath) {
    if (!fs.existsSync(incidentPath)) { console.error('Incident not found:', incidentPath); process.exit(1); }
    await analyzeSingle(incidentPath);
    process.exit(0);
  }

  // Process all incidents found in incidentsDir
  const files = fs.readdirSync(incidentsDir).filter(f => f.match(/incident.*\.json$/i));
  if (files.length === 0) {
    console.log('No incident JSON files found in', incidentsDir);
    process.exit(0);
  }
  for (const f of files) {
    const full = path.join(incidentsDir, f);
    await analyzeSingle(full);
  }
})();
