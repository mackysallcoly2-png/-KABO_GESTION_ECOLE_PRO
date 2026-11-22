# KABO_GESTION_ECOLE_PRO v1.0

**Éditeur : KABO EDUCATION** — Application locale autonome de gestion scolaire pour écoles sénégalaises (primaire, écoles classiques et franco-arabes).

Un seul fichier livrable : **`index.html`** (HTML5 + CSS3 + JavaScript ES6+ intégrés). Aucune connexion Internet, aucun CDN, aucun backend, aucune API externe. Toutes les données restent sur l'ordinateur.

---

## Installation

1. Copier `index.html` sur l'ordinateur (clé USB, dossier local…).
2. L'ouvrir avec un navigateur moderne **à jour** :
   - Chrome / Edge (recommandé), Firefox, Opera ;
   - Safari 16+ fonctionne (iOS/macOS : voir limites ci-dessous).
3. La base IndexedDB est créée automatiquement au premier lancement.
4. **Première connexion : identifiant `admin`, mot de passe `admin`** — *changez immédiatement ce mot de passe* (module Utilisateurs → profil → Modifier le mot de passe).

Aucun serveur, aucune installation, aucun compte en ligne. L'application fonctionne hors ligne après le premier chargement (le fichier étant local, c'est immédiat).

Optionnel : charger `DONNEES_DEMO.json` (module **Sauvegarde & données → Restauration**) pour obtenir un établissement fictif complet (84 élèves, 6 classes, notes, présences, paiements) et découvrir le logiciel sans risque : c'est un jeu de données **entièrement fictif**, réinitialisable ensuite.

## Contenu du package

| Fichier | Rôle |
|---|---|
| `index.html` | Application complète (livrable principal) |
| `README.md` | Ce fichier |
| `GUIDE_UTILISATEUR.md` | Manuel fonctionnel par module |
| `GUIDE_TECHNIQUE.md` | Architecture, base de données, formats, règles de calcul |
| `DONNEES_DEMO.json` | Jeu de démonstration fictif (format de sauvegarde natif) |
| `CHANGELOG.md` | Historique des versions |
| `RAPPORT_TESTS.md` | Scénarios testés et résultats (26 tests automatisés + volumes) |
| `tests/` | Harnais de tests (Node.js 22 + jsdom + fake-indexeddb, usage développeur) |

## Périmètre fonctionnel (14 modules)

- Paramètres de l'établissement (identité, logo, IA / IEF / district, en-tête « République du Sénégal » activable)
- Années scolaires (création, activation, clôture protégée — jamais de mélange entre années)
- Classes (CI→CM2, multigrade, capacité, effectifs F/G calculés, seul une classe vide peut être supprimée)
- Élèves (fiche complète, photo, statuts nouveau/passant/redoublant/transféré/abandonné/sortant, recherche instantanée, pagination, historique, fiche imprimable)
- Enseignants (dossiers, affectations par classe et par année, archivage, liste imprimable)
- Matières & périodes (coefficients, notes maximales, sous-matières, modèles classique + franco-arabe, trimestres)
- Évaluations & notes (saisie clavier cellule par cellule, barème contrôlé, absences « ABS », annulable)
- Moyennes & classement (formule pondérée **configurable**, arrondis paramétrables, politique d'absences, ex æquo au même rang)
- Présences (registre journalier P/A/R/J avec motif, récapitulatif mensuel, historique individuel)
- Bulletins & documents A4 (bulletin individuel/classe, relevé de notes, fiche synoptique, listes, statistiques — impression navigateur / PDF / HTML autonome / CSV)
- Frais & paiements (catégories, attribution individuelle ou par classe, paiement partiel, soldes, reçus numérotés, **annulation tracée — jamais de suppression silencieuse**)
- Tableau de bord (indicateurs réels + graphiques canvas 100 % locaux)
- Sauvegarde / restauration JSON (validation, prévisualisation, sauvegarde de sécurité avant restauration, diagnostic de base)
- Utilisateurs & rôles (6 profils : Administrateur, Directeur, Secrétariat, Enseignant, Gestionnaire, Consultation), journal d'audit, verrouillage de session
- Assistant d'import CSV (correspondance de colonnes, doublons internes + base, prévisualisation, rapport) et exports CSV partout

## ⚠️ Limites et sécurité — à lire

1. **Les rôles locaux ne constituent PAS une sécurité forte.** Une personne ayant accès aux fichiers et au navigateur peut ouvrir la console et lire/modifier les données. Ce système de rôles sert à l'ergonomie et à la prévention des erreurs, pas à la protection contre un utilisateur malveillant. Toute donnée réellement sensible doit être protégée physiquement (session verrouillée avec mot de passe, ordinateur sous clé).
2. **Le navigateur peut, dans certains cas, vider le stockage local** : navigation privée, libération d'espace par le système (Safari vide les données IndexedDB des sites non visités depuis 7 jours ; pour un fichier local ouvert en `file://`, ce risque est moindre mais réel). **Effectuez des sauvegardes JSON régulières** (module Sauvegarde) et conservez-les sur clé USB.
3. **Un seul établissement / un seul ordinateur par fichier** : les données IndexedDB sont attachées au navigateur. Ne partagez pas les données par mail ; passez par les sauvegardes JSON.
4. Les photos (≤ 200 ko) et le logo (≤ 300 ko) sont stockés en base locale : évitez les images volumineuses si vous gérez plus de 1 000 élèves.
5. Mot de passe oublié : il n'y a **aucun service en ligne** pour le réinitialiser. Seule la restauration d'une sauvegarde contenant le compte précédent — ou la suppression des données du navigateur (source de perte) — le permet. Notez le mot de passe administrateur.

## Tests développeurs (optionnels — l'application elle-même n'a aucune dépendance)

```bash
npm install        # jsdom + fake-indexeddb (tests hors navigateur uniquement)
npm test           # 26 scénarios automatiques (attendu : 26/26 PASS)
npm run test:volume  # volumes 500 / 1000 / 5000 élèves
npm run demo         # régénère DONNEES_DEMO.json via l'application
```

## Licence et mentions

© KABO EDUCATION — KABO_GESTION_ECOLE_PRO v1.0. Les données saisies restent la propriété de l'établissement et ne quittent jamais l'ordinateur.
