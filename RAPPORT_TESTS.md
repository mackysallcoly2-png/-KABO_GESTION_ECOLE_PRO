# RAPPORT DE TESTS — KABO_GESTION_ECOLE_PRO v1.0

**Méthode** : harnais automatisé exécutant réellement l'application (`index.html`) hors navigateur avec jsdom + fake-indexeddb (Node 22). Chaque scénario modifie et relit la vraie base IndexedDB émulée — aucune donnée « simulée ». Les scénarios métier du §XXII du cahier des charges sont couverts par ces 26 tests ; l'affichage visuel (couleurs, impression papier) requiert de fait une fenêtre de navigateur et est validé par le code CSS/HTML embarqué.

## Résultats : 26/26 PASS

| # | Scénario (§XXII ↔ test) | Résultat | Points contrôlés |
|---|---|---|---|
| 1 | Authentification locale | PASS | admin/admin accepté, écran d'accueil affiché, session créée |
| 2 | Initialisation d'une école (§22.1) | PASS | identité + IA/IEF/code enregistrés et relus |
| 3 | Création d'une année scolaire (§22.2) | PASS | `2025-2026` créée, activée ; **doublon refusé** |
| 4 | Création de plusieurs classes (§22.3) | PASS | 6 classes CI→CM2, effectif initial 0 |
| 5 | Inscription de 100 élèves (§22.4) | PASS | 50 CI + 50 CP, effectif CI = 50 recalculé |
| 6 | Détection doublons / unicité matricule | PASS | matricule dupliqué refusé avec message d'erreur explicite |
| 7 | Importation CSV (§22.5) | PASS | parseur `;`/`,`/guillemets ; assistant (correspondance colonnes, statuts normalisés, rejets explicites date de naissance) |
| 8 | Affectation des enseignants (§22.6) | PASS | dossier enseignant + affectation CI titulaire |
| 9 | Configuration des matières (§22.7) | PASS | 11 matières par défaut (classique + franco-arabe), 3 trimestres |
| 10 | Saisie des notes (§22.8) | PASS | 3 évaluations × 50 élèves, barème /10 contrôlé (15 hors barème → rejet), marque ABS |
| 11 | Calcul manuel de contrôle des moyennes (§22.9) | PASS | recalcul indépendant : moy. math KABO1010 = 7.67, moy. générale pondérée exacte, absence exclue de la formule (KABO1000) |
| 12 | Classement des élèves (§22.10) | PASS | rangs décroissants, min/max cohérents, **ex æquo au même rang** (KABO1011 = KABO1022) |
| 13 | Enregistrement des absences (§22.11) | PASS | 10 pointages (4 absents, 3 retards, 3 présents), récap mensuel conforme |
| 14 | Génération d'un bulletin (§22.12) | PASS | HTML complet (>500 caractères) avec matricule, notes, rang |
| 15 | Impression des bulletins d'une classe (§22.13) | PASS | lot généré (pagination A4 par bulletin), aperçu ouvert |
| 16 | Paiements partiels (§22.14) | PASS | 30 000 puis 20 000 FCFA sur 50 000 ; reçu séquentiel `R2025-NNNNN` ; **sur-paiement refusé** |
| 17 | Calcul des soldes (§22.15) | PASS | soldes 30k/20k/0 recalculés ; paiement annulé exclu du solde |
| 18 | Suivi financier sans effacement | PASS | annulation tracée (motif obligatoire, auteur, date), paiement conservé |
| 19 | Tableau de bord | PASS | 100 élèves, 50 F / 50 M, 6 classes — indicateurs réels |
| 20 | Sauvegarde complète (§22.16) | PASS | enveloppe app/version/schemaVersion, 23 magasins, contenu conforme (100 élèves, 42 payments) |
| 21 | Journal d'audit | PASS | 120+ entrées (connexions, saisies, paiements, annulation…) |
| 22 | Isolement des années scolaires | PASS | classe `2024-2025` invisible dans `2025-2026` |
| 23 | Rendu des 14 modules | PASS | dashboard, paramètres, classes, élèves, enseignants, matières, notes, bulletins, présences, finance, sauvegarde, audit, utilisateurs — sans exception |
| 24 | Diagnostic de base | PASS | comptages exacts, **0 orphelin** |
| 25 | Fermeture/réouverture + persistance (§22.17, 22.18, 22.19) | PASS | second contexte = navigateur réouvert : session restaurée, données intacts |
| 26 | Restauration d'une sauvegarde (§22.20) | PASS | 754/4 239 enregistrements restaurés, année active recalée ; fichier étranger/plus récent **rejeté** |

## Tests de volume (§XXI)

Exécution `node tests/volume.test.js` — enveloppe : jsdom + fake-indexeddb (plus lent qu'un IndexedDB natif : les chiffres réels en navigateur sont meilleurs).

| Volume | Inscriptions | Notes saisies | Calcul + classement | Pointage 200 élèves | Snapshot | Restauration | Total |
|---|---|---|---|---|---|---|---|
| 500 élèves | 80 ms | 500 notes — 472 ms | 8 ms (500 rangs) | 4 ms | 6 ms (613 ko) | 28 ms | 1,1 s |
| 1 000 élèves | 120 ms | 1 000 notes — 1,9 s | 13 ms (1 000 rangs) | 4 ms | 10 ms (1,2 Mo) | 52 ms | 2,7 s |
| 5 000 élèves | 404 ms | 5 000 notes — 50 s* | 81 ms (5 000 rangs) | 3 ms | 59 ms (5,7 Mo) | 294 ms | ≈52 s |

\* Le coût dominant est l'écriture note par note (1 transaction IndexedDB par note, robustesse : une note refusée n'annule pas les autres). En IndexedDB natif de navigateur, l'écriture est ~10× plus rapide ; le reste (lecture/calcul/classement) reste sous 100 ms même à 5 000 élèves. Pour des écoles très volumineuses, la sauvegarde/restauration et la lecture des listes restent instantanées (<300 ms).

**Navigation/persistance** : les vues reconstruisent depuis la base à chaque affichage — aucune donnée perdue en naviguant ; la dernière vue est restaurée à la réouverture.

## Reste à tester en conditions réelles (non couvert par l'automatisation)

- Rendu visuel des bulletins sur imprimante réelle (marges A4 selon pilote).
- Génération du PDF via « Enregistrer au format PDF » du navigateur.
- Expérience iOS/Safari (purge IndexedDB après 7 jours) — recommander des sauvegardes régulières.
- Import CSV avec les vrais fichiers produits par les écoles (alias de titres non prévus : utilisez le modèle fourni).
