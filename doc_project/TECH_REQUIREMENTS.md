# Exigences techniques — Projet agent d'analyse d'échecs de tests

But : lister précisément l'infrastructure logicielle, services et configurations nécessaires pour développer, exécuter et intégrer un agent IA capable d'analyser les échecs de tests Playwright localement et en CI.

1) Environnement de développement
- Système : Windows / macOS / Linux (dev et CI doivent être cohérents).
- Node.js : LTS (>= 18 recommandé). Vérifier `node -v`.
- npm ou pnpm : pour installer dépendances.
- Git : contrôle de version.
- (Optionnel) Python 3 si certains outils d'analyse sont en Python.

2) Dépendances principales (trouver dans `package.json`)
- `@playwright/test` (test runner + artefacts).
- `http-server` ou équivalent pour servir le site en local (`npx http-server`).
- `start-server-and-test` (optionnel) pour orchestrer serveur + tests.
- Librairie HTTP pour appels API (ex. `axios` ou `node-fetch`) pour envoyer artéfacts à l'agent.
- Outils de packaging/artifact upload (ex. `aws-sdk` si stockage S3, `@actions/core` pour GitHub Actions).

3) Playwright — configuration minimale recommandée
- `use.baseURL` pointant vers l'URL utilisée en CI (ex. `http://localhost:3001/web-site/`).
- Artéfacts :
  - `screenshot: 'only-on-failure'`
  - `video: 'retain-on-failure'`
  - `trace: 'on-first-retry'`
  - `outputDir: 'artifacts/'`
- Reporter HTML + JSON (ex. `html`, reporter custom pour exporter métadonnées).

4) Stockage des artéfacts
- Emplacement local `artifacts/<run-id>/` pendant l'exécution.
- Optionnel : stockage distant (S3, Azure Blob, GitHub Actions artifacts) pour analyses rétrospectives.
- Requis : accès en lecture aux artéfacts pour le job d'analyse (CI).

5) Modèle IA / LLM
- Fournisseur LLM (OpenAI, Azure OpenAI, Anthropic, local LLM). Nécessite clé API sécurisée.
- Recommandation : LLM pour résumé + suggesting + embeddings service (OpenAI embeddings ou similaire) pour recherche d'antécédents.
- Contraintes : anonymisation / filtrage des données sensibles avant envoi.

6) CI (exemple GitHub Actions)
- Runner Linux (ubuntu-latest) ou Windows selon besoin visuel.
- Jobs:
  - `build` et `serve` (ou build & static hosting)
  - `test` (npx playwright test)
  - `upload-artifacts` (en cas d'échec)
  - `analyze-failures` (exécute script d'analyse, appelle LLM, poste commentaire PR)
- Secrets requis : `ACTIONS_STEP_DEBUG` (optionnel), `OPENAI_API_KEY`, `GITHUB_TOKEN`.

7) Sécurité & conformité
- Ne pas transmettre d'informations sensibles (tokens, données personnelles) sans anonymisation.
- Restreindre accès aux artéfacts et clés API via secrets CI.

8) Observabilité & stockage des résultats
- DB légère pour indexer échecs (Postgres / SQLite / vector DB pour embeddings).
- Logs structurés (JSON) pour traçabilité.

9) Outils additionnels recommandés
- `playwright-telemetry` (ou script custom) pour agrégation de métriques.
- Vector DB (pinecone / weaviate / Milvus) si recherche par similarité nécessaire.

Fichiers attendus dans le repo
- `playwright.config.js` (avec artéfacts configurés)
- `scripts/collect-and-pack.js` (regroupe artéfacts en JSON)
- `scripts/analyze-failure.js` (appel LLM + heuristiques)
- `workflows/ci-playwright.yml` (CI)
- `PROJECT_STEPS.md`, `TECH_REQUIREMENTS.md`, `AGENT_SETUP_STEPS.md`

---
Ces exigences servent de checklist technique. Je peux générer un `playwright.config.js` d'exemple et un `package.json` enrichi si tu veux.