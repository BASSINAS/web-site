# Projet : site-web - étapes et commandes

But du projet
- Créer un site web professionnel pour un service de testing.
- Générer et exécuter des tests Playwright pour valider le site localement et en CI.

Prérequis
- Node.js (LTS) installé (v16+ recommandé). Vérifier :
  - `node -v`
  - `npm -v` (si `npm` non reconnu voir section dépannage)
- Playwright installé en dev : `npm i -D @playwright/test` et `npx playwright install`

Structure utile du repo
- `index.html` : site principal
- `tests/` : specs Playwright
- `library/` : helpers/pages pour tests
- `playwright.config.js` : configuration Playwright
- `package.json` : scripts utiles

Démarrer le serveur local (dev)
- Script ajouté : `npm run start` — sert le site pour que les tests accèdent à `http://localhost:3001/web-site/`
- Commande manuelle (si `npm` indisponible) :
```powershell
npx http-server .. -p 3001
```
- Si le port 3001 est déjà utilisé, choisir un autre port :
```powershell
npx http-server .. -p 3002
```

Lancer les tests Playwright
1. Ouvrir un terminal et démarrer le serveur (voir ci‑dessus).
2. Dans un autre terminal :
```powershell
npx playwright test
# ou en mode headful
npx playwright test --headed
```

Configuration recommandée
- `playwright.config.js` contient `use.baseURL: 'http://localhost:3001/web-site/'` pour centraliser l'URL.
- Les tests utilisent `await page.goto('.')` ou `await home.goto('.')` afin que Playwright résolve la route relative contre `baseURL` (utile si `baseURL` contient un sous‑chemin `/web-site/`).

Dépannage courant
- `npm` non reconnu : installer Node.js LTS depuis https://nodejs.org/fr/ ou utiliser `nvm-windows`.
- PowerShell bloque `npm` (PSSecurityException) : ouvrir PowerShell et exécuter (CurrentUser) :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```
- Port occupé (EADDRINUSE 3001) : identifier et fermer le processus :
```powershell
netstat -ano | findstr :3001
# noter le PID retourné, puis
Get-Process -Id <PID>
Stop-Process -Id <PID> -Force
```

Ajouter un script `test:e2e` (optionnel)
- Pour démarrer serveur + tests automatiquement on peut ajouter :
```json
"scripts": {
  "start": "npx http-server .. -p 3001",
  "test:e2e": "start-server-and-test start http://localhost:3001/web-site/ npx playwright test"
}
```
(Remarque : installer `start-server-and-test` en dev : `npm i -D start-server-and-test`)

Bonnes pratiques
- Centraliser l'URL de test dans `playwright.config.js`.
- Utiliser des sélecteurs robustes (`data-test` si possible) pour éviter la fragilité.
- Garder les helpers page objects dans `library/` pour réutilisabilité.
- Exécuter `npx playwright test --reporter=html` pour obtenir un rapport HTML.

Étapes suivantes suggérées
- Ajouter `test:e2e` et valider dans CI (GitHub Actions / GitLab CI).
- Ajouter un README détaillé si nécessaire.

---
Fichier créé automatiquement : `PROJECT_STEPS.md`
