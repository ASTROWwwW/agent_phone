# Agent Phone

Téléphone FiveM intégré à la base **Agent**. Dérivé de Sky Phone 0.3.3
(Sky-Systems), sous licence GPL-3.0.

Le dépôt contient deux choses :

- `Phone/` — la ressource FiveM, telle qu'elle tourne sur le serveur.
- `frontend/` — la source Vue 3 du NUI, qui produit `Phone/source/html`.

## Ce qui a changé par rapport à l'amont

**Intégration à la base Agent.** ESX y est publié sous le nom de ressource
`Agent`. Le pont ne vise plus que cette ressource, côté serveur comme côté
client : ni `es_extended`, ni sélection automatique, ni réglage de framework.
Le nom résolu reste exposé en `Bridge.Framework.Resource`.

**Adaptateurs réduits au nécessaire.** La base tourne sur ESX + ox_inventory,
sans système de propriété tiers ni autre téléphone. Les 2 autres frameworks,
14 adaptateurs d'inventaire, 18 fichiers de pont immobilier, 15 fichiers de
compatibilité téléphone et la migration lb-phone ont été retirés — 51 fichiers.
Le garage reconnaissait encore 21 systèmes de propriété pour deux schémas
réels : il ne lit plus que celui d'Agent, `owned_vehicles` et sa colonne
`owner`, avec `custom` pour un schéma maison.

**Aligné sur le schéma réel.** La table ne porte que dix colonnes ; le
téléphone en interrogeait vingt-cinq, héritées des systèmes retirés, et les
absentes valaient `nil` en silence. Un écart avec la base est corrigé : la
fourrière, que le module de garage marque `garage = 'fourriere_auto'` et que
le téléphone cherchait sous les seuls mots `impound` et `pound`, si bien
qu'un véhicule saisi s'affichait dehors. Les comptes de paiement nomment
désormais ceux que déclare `Config.Accounts` — `bank`, `black_money`,
`money` — plutôt que de s'appuyer sur l'alias `cash` que le pont traduit ;
ce n'était pas un défaut, seulement une indirection de moins. Un contrat
verrouille ces points.
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

`oxmysql`, `ox_lib`, `ox_inventory`, et la base `Agent`. La voix est
détectée automatiquement parmi `pma-voice`,
`yaca-voice` et `saltychat`.

Trois objets doivent exister dans `ox_inventory` : le téléphone, et les
deux cartes SIM tant que `Config.Sim.Enabled` vaut `true`.

```lua
['phone'] = { label = 'Téléphone', weight = 190, stack = false, consume = 0 },
['agent_phone_sim_registered'] = { label = 'Carte SIM', weight = 5, stack = false, consume = 0 },
['agent_phone_sim_anonymous'] = { label = 'Carte SIM anonyme', weight = 5, stack = false, consume = 0 },
```

`stack = false` est obligatoire en mode unique, `consume = 0` pour que
l'utilisation déclenche l'ouverture sans consommer l'objet. Sans les deux
cartes SIM, aucun joueur n'obtient de numéro, donc ni appel ni message : le
démarrage écrit désormais en rouge la liste des objets absents.

**Entreprises alignées sur les métiers du serveur.** Les quatre entreprises
livrées visent `police`, `ambulance`, `mechanic` et `taxi`, tous employés
par les modules du serveur. Une cinquième visait `fire`, un métier qu'aucun
module ni fichier SQL ne connaît — ses seules occurrences étaient l'action de
licenciement — donc une entreprise à laquelle personne ne pouvait appartenir.
Elle est retirée.

## Installation

Place la ressource dans `resources/[script]/agent_phone`, puis démarre-la.

Elle doit y être un **dossier réel**. FXServer ne découvre pas une ressource
montée par lien ou par jonction : elle n'apparaît alors ni dans txAdmin ni
dans le journal, sans le moindre message d'erreur. Pour travailler depuis un
dépôt situé ailleurs, définis `AGENT_PHONE_DEPLOY` sur le dossier de la
ressource : chaque `pnpm build` l'y recopie.

```bash
AGENT_PHONE_DEPLOY="D:/serveur/resources/[script]/agent_phone" pnpm build
```
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
