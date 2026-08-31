# Règles de contribution — Agent Phone

Document lu par les humains comme par les agents qui touchent ce dépôt.
Les tests de contrat vérifient une partie de ces règles ; le reste tient à la
discipline.

## Structure

- `Phone/` — la ressource FiveM. `Phone/source/html` est **généré**, jamais
  édité à la main.
- `frontend/` — la source Vue 3 du NUI. C'est là qu'on modifie l'interface.
- Le nom du dossier de ressource n'est pas figé. Rien ne doit le coder en dur :
  `frontend/src/testing/resource.ts`, `frontend/build.cjs` et
  `frontend/testserver/configurator-fixture.cjs` le résolvent en cherchant le
  premier dossier voisin qui porte un `fxmanifest.lua`.

## Parité avec le Phone Configurator (obligatoire)

Le panneau admin édite la configuration en base, pas les fichiers Lua. Les
sections proposées sont construites à partir de `config/config.lua` et
`config/media.lua` via l'instantané généré `source/shared/config_default.lua`.

Conséquence : **une modification de configuration sans support correspondant
dans le Configurator est incomplète.** Concrètement, toute clé ajoutée,
renommée ou supprimée dans `config/config.lua` ou `config/media.lua` impose de
régénérer `source/shared/config_default.lua` avec `pnpm build`, sinon les
serveurs déjà en base gardent l'ancienne forme et le panneau admin affiche une
configuration qui n'existe plus.

## Les contrats Lua ↔ NUI sont des tests

Les fichiers `*.contract.test.ts` lisent les sources Lua sur disque et
vérifient que les deux côtés parlent des mêmes événements, des mêmes tables et
des mêmes clés de locale. Quand on retire une fonctionnalité, on retire aussi
son contrat — un contrat qui pointe vers un fichier supprimé casse la suite
entière et masque les vraies régressions.

Filtre de complétude : chercher plus large que le code de production. Un
renommage ou une suppression doit couvrir les `.lua`, `.ts`, `.vue`, `.sql`,
les locales, `fxmanifest.lua` et les noms de fichiers eux-mêmes.

## Secrets

Les peppers de hachage vivent dans `Phone/config/secrets.lua`, chargé
uniquement en `server_scripts` et exclu du dépôt. `config/config.lua` est
déclaré en `client_scripts` : tout ce qu'il contient est téléchargé dans le
cache de chaque joueur. `IsDuplicityVersion()` empêche l'affectation côté
client, pas la distribution du fichier.

## Avant de pousser

```
cd frontend
pnpm test        # suite complète, contrats compris
pnpm type-check
pnpm build       # régénère source/html et config_default.lua
```
