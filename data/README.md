# Données Rise Music Mag

Ces fichiers JSON sont la source de vérité du site, consommés par `js/data-store.js` et éditables via l'admin Decap CMS (`/admin`).

**Note technique** : ces fichiers ne contiennent volontairement aucune clé `_comment` ou autre métadonnée hors-schéma à la racine. Decap CMS (en mode "file collection", utilisé ici) ne préserve pas de façon fiable les clés non déclarées dans `config.yml` lors d'un save — un champ `_comment` aurait pu silencieusement disparaître au premier enregistrement depuis l'admin. La documentation de chaque fichier vit donc ici plutôt que dans les fichiers eux-mêmes.

## artistes.json
`{ "artistes": [...] }` — Les 15 artistes migrés depuis l'ancien site (étape 1). Chaque entrée a un `id` slug stable : ne jamais le modifier après création, il sert de clé de référence pour `interviews.json` (`artisteId`), `albums.json` (`artisteId`) et `articles.json` (`artistesIds`).

## interviews.json
`{ "interviews": [...] }` — Modèle unique basé sur la fiche FRIEDA. `artisteId` relie l'interview à une fiche artiste quand elle existe (peut être `null`). La navigation précédent/suivant et les suggestions "Autres interviews" sont calculées automatiquement par `data-store.js`, pas stockées ici.

## articles.json
`{ "categories": [...], "articles": [...] }` — Contient actuellement 3 articles d'exemple (`statut: "exemple"`, titres préfixés `EXEMPLE —`) à remplacer par du vrai contenu avant mise en ligne. Voir `README-etape4.md` à la racine du projet pour le détail de cette décision.

## albums.json
`{ "albums": [...] }` — Les 15 entrées ont été migrées depuis le champ `meta` de `artistes.json` (ex: `"album « Maison »"` → entrée structurée). Champs encore à compléter via l'admin : `cover`, `spotify`, `appleMusic`, `description`.

## events.json
`{ "events": [...] }` — Contient actuellement 3 événements d'exemple (`statut: "exemple"`) à remplacer par du vrai contenu avant mise en ligne.

## site.json
Pas de wrapper de liste : objet de configuration globale directement à la racine (identité, couleurs, genres, navigation, réseaux sociaux). Édité via l'admin, section "Réglages du site" (file collection à fichier unique).

## ⚠️ Avant la mise en ligne réelle

1. Retirer `'exemple'` de la liste des statuts visibles dans `dataStore.getArticles()` et `dataStore.getEvents()` (`js/data-store.js`), ou simplement supprimer/republier les entrées exemple via l'admin
2. Compléter les sections marquées "à compléter" dans les pages Mentions légales / Confidentialité (raison sociale, hébergeur, etc. — voir `js/render-static-pages.js`)
3. Remplir les champs `reseaux` (Spotify, Instagram...) des artistes, actuellement `null`
