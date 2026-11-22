# GUIDE TECHNIQUE — KABO_GESTION_ECOLE_PRO v1.0

Document destiné aux développeurs / mainteneurs. Éditeur : KABO EDUCATION.

## 1. Vue d'ensemble

Application **monolithique locale** : un seul fichier `index.html` (~240 ko) contient HTML5, CSS3 (design system intégré) et un unique bloc `<script>` ES6+ (« use strict »). Aucune requête réseau, aucune dépendance externe, aucun service : IndexedDB + LocalStorage suffisent. Le harnais de tests (`tests/`, Node 22 + jsdom + fake-indexeddb) exécute l'application hors navigateur.

## 2. Organisation interne (modules)

| Module | Rôle |
|---|---|
| `Util` | uid (UUID v4 via crypto), dates, montants FCFA, échappement HTML (`esc`/`attr`), SHA-256 (WebCrypto), téléchargement de fichiers, lecture, **parseur CSV** (`;`/`,` + guillemets), pagination, debounce, confirm |
| `DB` (= façade `DatabaseService`) | Gestionnaire central IndexedDB : 24 magasins, index, promise wrappers, opérations de masse, fallback par filtre si un index manque |
| `Notify` | Notifications (succès/warn/erreur/info) + panneau de notifications |
| `Audit` (= `AuditService`) | Journal d'audit : type d'opération, magasin, référence, détails, auteur, horodatage |
| `Auth` | Comptes locaux, SHA-256 (`sha256$hex`), sessions (LocalStorage), verrouillage, permissions (`can()`, `readOnly()`), vérrou `guard()` |
| `UI` | Modales, confirmations, loader, onglets, erreurs de formulaire, thème |
| `Router` | Navigation sans rechargement (`#/module`), rendu des 14 routes, restauration de la dernière vue |
| `SchoolService` | Fiche établissement, paramètres clé-valeur, années scolaires (activation exclusive, clôture protégée) |
| `ClassService` | Classes, effectifs calculés, suppression « vide d'abord », détails effectifs |
| `StudentService` (+ `ValidationService`) | Validation (matricule unique, dates, sexe), sauvegarde, suppression avec garde-fous, historique |
| `EnrollmentService` | Inscriptions/réinscriptions par année, statuts, matricule suivant |
| `TeacherService` + `Assignments` | Dossiers enseignants, affectations |
| `SubjectService` | Matières/sous-matières/périodes + amorçage des modèles par défaut |
| `GradeService` | Notes : lecture par évaluation/élève, upsert avec contrôle de barème, suppression |
| `CalculationService` | Config des règles (décimales, arrondi, politique d'absence) + `classResults()` (moyennes de discipline et générale pondérées, rangs avec ex æquo, statistiques) |
| `AttendanceService` | Registre journalier (P/A/R/J), supprime les pointages vides, stats mensuelles |
| `PaymentService` | Soldes, paiements partiels, numérotation séquentielle des reçus, annulation TRACÉE |
| `BulletinService` + `Print` | Génération documentaire et moteur d'impression (aperçu modale, impression navigateur, export HTML autonome) |
| `DashboardService` + `Charts` | Agrégats du tableau de bord ; moteur de graphiques canvas sans bibliothèque (barres, anneau, lignes, HiDPI) |
| `BackupService` (+ `ImportExportService`) | Snapshots JSON complets/par catégorie, validation, restauration contrôlée avec sauvegarde de sécurité, diagnostic |
| `CsvWizard` | Assistant d'import élèves en 8 étapes (fichier → Colonnes → correspondance → doublons → prévisualisation → confirmation → import → rapport) |

Contrôleurs d'interface : `YearsUI`, `ClassesUI`, `StudentsUI`, `TeachersUI`, `UsersUI`, `SubjectsUI`, `PeriodsUI`, `NotesUI`, `BulletinsUI`, `AttendanceUI`, `FinanceUI`, `ReceiptsUI`, `BackupUI`, `StatsPrint`.

## 3. Base de données (IndexedDB `KABO_GESTION_ECOLE_PRO`, version 1)

24 magasins requis présents : `settings` (clé), `academicYears`, `schools`, `users`, `roles`, `classes`, `students`, `guardians` (réservé — voir §6), `enrollments`, `teachers`, `teacherAssignments`, `subjects`, `subSubjects` (réservé), `gradingPeriods`, `assessments`, `grades`, `attendance`, `feeCategories`, `studentFees`, `payments`, `receipts`, `documents` (réservé), `auditLogs`, `backups`.

- Clés primaires `id` UUID v4 (`settings` : clé littérale). Chaque enregistrement porte `createdAt` / `updatedAt`.
- Index notables : `students.matricule` (unique), `users.username` (unique), `receipts.number` (unique), `enrollments.{studentId, classId, yearId}`, `grades.{assessmentId, studentId}`, `attendance.{classId, studentId, date, classId+date (composé)}`, `payments.{feeId, studentId, date}`, `studentFees.{studentId, classId, yearId}`, `auditLogs.{ts, entity}`.
- Les index composés sont créés en scindant la cléPath (`'classId,date'` → `['classId','date']`) ; `DB.byIndex` dispose d'un repli par filtre complet si un index est introuvable (nécessaire aussi pour les environnements exotiques).
- **Aucune donnée n'est dupliquée entre modules** : l'effectif d'une classe se calcule depuis `enrollments`, le solde d'un frais depuis `payments`, la moyenne depuis `grades` — jamais stockés en double.

### Relations logiques
`enrollments` relie `students` ↔ `classes` ↔ `academicYears` (l'inscription est l'unité d'isolation inter-années) ; `grades` → `assessments` → `subjects`/`gradingPeriods`/`classes` ; `studentFees` → `students`/`feeCategories`/`academicYears` ; `payments` → `studentFees` ; `receipts` → `payments` (1-pour-1, numéro unique) ; `attendance` → `students`/`classes` + date ; `teacherAssignments` → `teachers`/`classes`/`academicYears`.

## 4. Formules de calcul (configurables, aucune règle imposée)

Défauts réglables (onglet Règles de calcul → `settings`) : `calc.decimals = 2`, `calc.arrondi = 'standard'`, `calc.absencePolicy = 'exclure'` (alternative `zero`).

```
Moyenne de discipline = Σ(note × coef_évaluation) / Σ(coef_évaluation)
Moyenne générale      = Σ(moyenne_discipline × coef_discipline) / Σ(coef_discipline)
Rang                  : tri décroissant ; les ex æquo partagent le même rang (méthode standard 1-2-2-4)
```

- Note absente (case « Absent » ou vide) : exclue du numérateur et du dénominateur (politique `exclure`) ou comptée 0 (`zero`).
- Arrondi appliqué à la moyenne de discipline, puis à la moyenne générale.
- Statistiques de classe : moyenne, min, max, effectif noté, taux de réussite (moyenne ≥ 10), somme des coefficients des disciplines évaluées.

## 5. Numérotation des reçus

`R{année}-NNNNN` (séquentiel, basé sur le maximum existant +1, ex. `R2025-00042`). Un reçu correspond à un paiement ; une annulation conserve le reçu et le paiement (flags `cancelled`, `cancelReason`, `cancelledAt`, `cancelledBy`). Aucune transaction financière n'est jamais effacée.

## 6. Choix de conception à connaître

- **`guardians`** : le magasin est créé et indexé mais l'interface stocke les responsables (père/mère/tuteur/téléphone) directement sur la fiche élève — un seul écran, une seule source. Le magasin reste disponible pour une évolution « responsables multi-élèves ».
- **`subSubjects`** : les sous-matières sont stockées dans `subjects.subSubjects[]` (lecture groupée, pas de jointure) ; le magasin dédié reste disponible.
- **`documents`** : les documents (bulletins, listes, registres…) sont **générés à la demande** depuis les données vivantes (toujours exacts) et non archivés en base ; les opérations de génération sont journalisées dans `auditLogs`.
- **Transfert/années** : changer d'année = créer une inscription dans la nouvelle année ; l'historique scolaire reconstruit le parcours depuis `enrollments`.

## 7. Format de sauvegarde / restauration (JSON)

```json
{
  "app": "KABO_GESTION_ECOLE_PRO",
  "version": "1.0.0",
  "schemaVersion": 1,
  "createdAt": "2025-11-22T09:00:00.000Z",
  "data": { "students": [ ... ], "grades": [ ... ], "settings": [ ... ] }
}
```

- Validation (`BackupService.validate`) : application source, présence/structure de `data`, `schemaVersion` ≤ courant, magasins connus uniquement.
- Restauration : sauvegarde de sécurité automatique (`students` + `auditLogs`) → pour chaque magasin concerné : vidage puis réécriture en une transaction (atomicité) → re-calage de l'année active.
- Les sauvegardes partielles n'écrasent que les magasins inclus.

## 8. Persistances auxiliaires (LocalStorage)

`kabo.theme` (clair/sombre), `kabo.sidebar` (replié), `kabo.view` (dernière vue affichée), `kabo.session` (utilisateur connecté, rôle). Rien de sensible : aucun mot de passe ni donnée scolaire n'y transitent. `sessionStorage.kabo.locked` pour le verrouillage d'écran.

## 9. Sécurité — ce qui est fait et ce qui ne l'est PAS

- mots de passe hachés SHA-256 (WebCrypto) ; jamais stockés en clair ;
- échappement systématique des données affichées (`Util.esc`/`Util.attr`) contre l'injection HTML ;
- permissions d'interface par rôle + journal d'audit de toutes les opérations ;
- confirmations avant chaque opération sensible, sauvegarde de sécurité avant restauration, suppression protégée (classes non vides, élèves inscrits).

**Limite assumée et documentée** : tout est local et manipulable par une personne ayant accès à la machine (console du navigateur). Les rôles sont un garde-fou d'ergonomie, pas un système de sécurité serveur.

## 10. Limites du navigateur (documentées également dans le README)

- Navigateurs modernes à jour : Chrome/Edge/Firefox/Opera recommandés ; Safari 16+ fonctionne (quota IndexedDB plus raises, purge possible après 7 jours d'inactivité sur les sites non visités, moins pertinent en `file://`).
- Navigation privée : stockage souvent éphémère — à éviter pour la production.
- Les photos/logo copies en base gonflent la base : limite 200/300 ko imposée.
- Impression : rendu A4 optimisé mais le pilote d'impression (marges, en-têtes) est celui du navigateur.
- Volume : testé jusqu'à 5 000 élèves / 5 000 notes (voir `RAPPORT_TESTS.md`) ; la saisie des notes est transaction par transaction (robuste : une note perdue n'annule pas les autres), ce qui reste fluide jusqu'à quelques milliers de notes.
- Mot de passe admin oublié : aucun mécanisme distant ; utiliser une sauvegarde ou réinitialiser les données du navigateur (perte totale — sauvegardez).

## 11. Tests et reproducibilité

- `tests/smoke.test.js` : 26 scénarios bout-en-bout (login→école→année→classes→100 élèves→CSV→enseignant→matières→notes→moyennes contrôlées→classement/ex æquo→présences→bulletins→paiements→annulation tracée→tableau de bord→sauvegarde/audit→isolation d'année→rendu des 14 routes→diagnostic→réouverture→restauration→rejet de fichier étranger).
- `tests/volume.test.js` : 500 / 1 000 / 5 000 élèves, mesure des temps (inscriptions, 5 000 notes, calcul + classement, pointage 200 élèves, snapshot, restauration).
- `tests/gen_demo.js` : régénère `DONNEES_DEMO.json` via l'application elle-même (données fictives).

```bash
npm install && npm test     # attendu : Total: 26, OK: 26, KO: 0
npm run test:volume
```
