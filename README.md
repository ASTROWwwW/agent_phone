# Agent Phone

Téléphone FiveM intégré à la base **Agent**. Dérivé de Sky Phone 0.3.3
(Sky-Systems), sous licence GPL-3.0.

Le dépôt contient deux choses :

- `Phone/` — la ressource FiveM, telle qu'elle tourne sur le serveur.
- `frontend/` — la source Vue 3 du NUI, qui produit `Phone/source/html`.

## Ce qui a changé par rapport à l'amont

**Intégration à la base Agent.** ESX y est publié sous le nom de ressource
`Agent` et non `es_extended`. Le pont résout désormais le nom réel au lieu de
le coder en dur, côté serveur comme côté client, et expose le résultat en
`Bridge.Framework.Resource`.

**Adaptateurs réduits au nécessaire.** La base tourne sur ESX + ox_inventory,
sans système de propriété tiers ni autre téléphone. Les 2 autres frameworks,
14 adaptateurs d'inventaire, 18 fichiers de pont immobilier, 15 fichiers de
compatibilité téléphone et la migration lb-phone ont été retirés — 51 fichiers.
Les tables d'adaptateurs ont été purgées en conséquence, sinon la détection
automatique pouvait sélectionner un adaptateur dont le fichier n'existe plus.

**Applications retirées.** Douze applications ont été supprimées : Radio,
CrewLink, CityWarn, Weazel News, Santé, Pages Locales, VaultX (crypto), House
(immobilier) et les quatre jeux Memory, Démineur, Tower Stack et Neon Drop.

La suppression va jusqu'au bout : vues, stores, types, aperçus de l'App Store,
fichiers Lua client et serveur, entrées du `fxmanifest`, sections de
`config.lua`, clés des trois locales, définitions de tables et
`sql/install.sql`. Le pont radio du système vocal part avec l'application —
les appels ne s'en servaient pas.

Les tables déjà créées en base ne sont pas supprimées : le schéma se contente
de ne plus les créer. Pour récupérer la place, un `DROP TABLE` manuel sur les
préfixes `agent_phone_radio_`, `agent_phone_crewlink_`,
`agent_phone_citywarn_`, `agent_phone_weazel_`, `agent_phone_health_`,
`agent_phone_pages_` et `agent_phone_crypto_` suffit. House ne stockait rien en
base : il lisait la ressource de logement via un pont, retiré avec l'app.

**Renommage complet.** L'identité technique et les marques visibles par les
joueurs sont passées de « Sky » à « Agent » : événements, tables, globals Lua,
libellés des locales, et le contrat NUI des deux côtés. Ne subsistent que le
ciel météo, la sonnerie Skyline et l'attribution de licence ci-dessous.

**Secrets sortis du fichier client.** Voir plus bas.

## Prérequis

`oxmysql`, `ox_lib`, `ox_inventory`, et ESX (ressource `Agent` ou
`es_extended`). La voix est détectée automatiquement parmi `pma-voice`,
`yaca-voice` et `saltychat`.

L'item du téléphone doit exister dans `ox_inventory` :

```lua
['phone'] = { label = 'Téléphone', weight = 190, stack = false, consume = 0 },
```

`stack = false` est obligatoire en mode unique, `consume = 0` pour que
l'utilisation déclenche l'ouverture sans consommer l'objet.

## Installation

Place la ressource dans `resources/[script]/agent_phone`, puis démarre-la.
Le nom du dossier fait foi : c'est lui que FiveM utilise comme nom de
ressource, et le NUI le résout par `GetParentResourceName()`.

Le schéma SQL se crée tout seul au premier démarrage, en
`CREATE TABLE IF NOT EXISTS`. `sql/install.sql` n'est qu'un confort.

## Secrets

Les quatre peppers de hachage de mots de passe **ne doivent jamais** vivre
dans `config/config.lua` : ce fichier est déclaré en `client_scripts`, donc
téléchargé dans le cache de chaque joueur et lisible tel quel.
`IsDuplicityVersion()` empêche l'affectation côté client, pas la distribution
du fichier.

Ils vivent donc dans `config/secrets.lua`, chargé uniquement en
`server_scripts` et exclu du dépôt :

```
cp Phone/config/secrets.example.lua Phone/config/secrets.lua
```

Génère chaque valeur avec 32 octets aléatoires en hexadécimal. Changer un
pepper invalide les mots de passe déjà enregistrés.

## Développement du frontend

```
cd frontend
pnpm install --frozen-lockfile
pnpm dev     # Vite sur 5174 + backend NUI simulé sur 3002
pnpm build   # écrit dans Phone/source/html
pnpm test    # 1393 tests, dont les contrats Lua <-> NUI
```

Épingle **pnpm 10**. pnpm 11 ne lit plus `pnpm.overrides` depuis
`package.json` et l'installation échoue en silence, avec un code de sortie 0
trompeur :

```
corepack use pnpm@10.15.0
```

## Licence

GPL-3.0, comme l'amont. Voir `LICENSE`. L'attribution d'origine à
Sky-Systems, éditeur de Sky Phone 0.3.3 dont ce dépôt dérive, est déclarée en
tête de ce fichier et dans `LICENSE`.
