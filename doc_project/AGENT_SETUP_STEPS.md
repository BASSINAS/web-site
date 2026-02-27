# AGENT SETUP — étapes détaillées pour construire l'agent IA d'analyse des échecs (CI)

Objectif : fournir étapes précises, scripts et intégrations nécessaires pour que l'agent collecte artéfacts Playwright provenant d'un run CI, les analyse automatiquement (LLM + heuristiques) et fournisse un diagnostic dans la PR.

Résumé des étapes (haut niveau)
1. Configurer Playwright pour produire artéfacts.
2. Ajouter scripts qui regroupent et normalisent artéfacts en un JSON d'incident.
3. Prototyper un module d'analyse local (heuristiques + prompt LLM).
4. Intégrer l'analyse en CI (workflow qui upload artéfacts puis déclenche analyse on-failure).
5. Poster résumé d'analyse dans la PR et stocker résultat pour apprentissage continu.

Détails étapes & commandes

Etape A — Playwright : activer artéfacts
- Modifier `playwright.config.js` :
  - `use.screenshot: 'only-on-failure'`
  - `use.video: 'retain-on-failure'`
  - `use.trace: 'on-first-retry'`
  - `outputDir: 'artifacts/<run-id>'`
- Exemple :
```js
// playwright.config.js (extrait)
module.exports = {
  use: {
    baseURL: 'http://localhost:3002/web-site/',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  },
  outputDir: 'artifacts'
};
```

Etape B — Script de regroupement (artifact packer)
- Créer `scripts/collect-and-pack.js` (Node) :
  - Recherche répertoire `artifacts` du run courant (ou chemin CI fourni)
  - Pour chaque test échoué, collecte :
    - `testTitle`, `testFile`, `errorStack`
    - chemins screenshots, video, trace, raw HTML (si présent)
    - console logs et network HAR (si collectés)
    - metadata (browser, os, baseURL, runId)
  - Produit un JSON unique : `artifacts/<run-id>/incident-<testId>.json`
- Format minimal JSON :
```json
{
  "testId": "tests/contact.spec.js:contact section",
  "title": "contact section displays...",
  "error": "TypeError ...",
  "screenshots": ["s1.png"],
  "video": "v1.webm",
  "trace": "trace.zip",
  "console": ["error: ..."],
  "network": [{"url":"...","status":500}],
  "metadata": {"browser":"chromium","os":"ubuntu-latest","baseURL":"..."}
}
```

Etape C — Module d'analyse local (prototype)
- Créer `scripts/analyze-incident.js` :
  - Entrée : chemin `incident-<id>.json`
  - Étapes :
    1. Charger JSON + artéfacts (lire screenshot path, trace path)
    2. Extraire features :
       - Présence d'erreur JS (stack frames), codes HTTP 4xx/5xx, timeouts, sélecteurs introuvables (timeout on locator), erreurs réseau host unreachable, différences DOM (si snapshot baseline dispo).
       - Durée du test, retry count.
    3. Appliquer règles heuristiques (exemples) :
       - Si `error` contient `Timeout` et locator inconnu → suspicion de sélecteur / temps d'attente.
       - Si plusieurs tests échouent au même step avec 5xx → suspicion API / infra.
       - Si échec intermittent (succeeds on retry) → flaky probable.
    4. Construire prompt synthétique pour LLM (max 1-2 paragraphes) incluant :
       - Contexte (test, page, baseURL)
       - Top 3 logs/stack frames
       - Top network failures
       - Heuristique préliminaire + question: "Donne 3 causes probables, priorité et actions concrètes"
    5. Appeler LLM (ex. OpenAI) via API et enregistrer réponse en `analysis-<id>.json`.
- Exemples d'appel LLM (pseudo) :
```js
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{role:'system', content:'You are a test-analysis assistant.'}, {role:'user', content: prompt}]
});
```

Etape D — Heuristiques & templates
- Template prompt court (extrait):
```
Contexte: test "{{title}}" dans {{file}} sur {{baseURL}}. Erreur: {{error}}. Logs: {{topLogs}}. Network failures: {{topNet}}. Heuristiques: {{heuristicsSummary}}.
Question: Donne 3 causes probables (ordre de priorité), actions de correction (1-3 étapes) et une commande pour reproduire localement si possible.
```
- Définir mapping d'indices de confiance produit par LLM et heuristiques.

Etape E — Intégration CI (GitHub Actions, exemple)
- Workflow (extrait):
  - Job `test`:
    - checkout, setup Node
    - start server (serve the built site)
    - `npx playwright test` (avec `--output` vers artifacts)
    - `if: failure()` → `actions/upload-artifact` (upload artifacts dir)
  - Job `analyze` (needs: test) `if: failure()`:
    - download-artifact
    - `node scripts/collect-and-pack.js --artifacts=...`
    - `node scripts/analyze-incident.js --incident=...` (appel LLM)
    - `curl` ou GitHub API pour poster commentaire PR avec résumé

Etape F — Poster feedback automatique sur PR
- Utiliser `GITHUB_TOKEN` pour poster un commentaire via API. Exemple minimal :
```bash
curl -X POST -H "Authorization: token $GITHUB_TOKEN" \
  -d '{"body":"Analyse automatique: ..."}' \
  https://api.github.com/repos/<owner>/<repo>/issues/<pr_number>/comments
```
- Inclure : résumé, probabilité, actions proposées, lien artéfacts.

Etape G — Boucle d'apprentissage
- Stocker les analyses et la décision humaine (bug/flaky/infra) dans une base.
- Construire dataset pour classifier automatiquement les nouveaux incidents.
- Optionnel : indexer embeddings des prompts+résumés pour recherche d'incidents similaires.

Étape H — Monitoring & métriques
- Collecter : failure rate, time to fix, top 10 causes, précision agent (après feedback).
- Dashboards : Grafana / Datadog / simple dashboard JSON.

Livrables immédiats à implémenter (priorité)
1. `playwright.config.js` — activer artéfacts + `outputDir`.
2. `scripts/collect-and-pack.js` — regrouper artéfacts en JSON.
3. `scripts/analyze-incident.js` — prototype d'appel LLM + heuristiques.
4. `workflows/ci-playwright.yml` — CI qui upload artéfacts et lance analyse on-failure.
5. Mechanism to post PR comment (using `GITHUB_TOKEN`).



Validation et tests
- Test local : lancer serveur + `npx playwright test` avec un test volontairement cassé pour valider la collecte et l'analyse.
- Test CI : ouvrir PR contenant un changement qui casse volontairement un test, vérifier que l'analyse est postée.

Sécurité & coûts
- Anonymiser PII avant envoi à LLM.
- Surveiller usage API LLM — budget et quotas.

---
Si tu veux, je peux :
- Générer le `playwright.config.js` recommandé,
- Écrire un `scripts/collect-and-pack.js` minimal,
- Écrire un `scripts/analyze-incident.js` prototype (appel OpenAI),
- Fournir un template GitHub Actions `workflows/ci-playwright.yml`.
Dis-moi quelle(s) pièce(s) tu veux que je crée en priorité.