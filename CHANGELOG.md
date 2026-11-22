# CHANGELOG — KABO_GESTION_ECOLE_PRO

## 1.0.0 — Version initiale (KABO EDUCATION)

### Modules livrés (14)
- Paramètres de l'établissement (identité, logo ≤ 300 ko, IA / IEF / district / commune / région / code, en-tête « République du Sénégal » commutable)
- Années scolaires : création, modification, activation exclusive, clôture avec avertissement sur les inscriptions actives
- Classes : CI/CP/CE1/CE2/CM1/CM2, multigrade, double flux, spécial, autre ; capacité ; affectation du titulaire ; effectifs F/G automatiques ; suppression réservée aux classes vides ; archivage
- Élèves : fiche complète (matricule unique contrôlé, photo ≤ 200 ko, parents/tuteur), statuts (nouveau, passant, redoublant, transféré, abandonné, sortant), recherche instantanée, filtres, pagination, fiche imprimable, historique scolaire, suppression avec garde-fous
- Enseignants : dossiers complets, affectations par année, archivage, liste imprimable
- Matières / sous-matières / périodes : modèles par défaut classique + franco-arabe, coefficients, notes maximales, trimestres, période personnalisée
- Évaluations et notes : création par matière/classe/période, barème contrôlé, saisie clavier (Entrée = cellule suivante), marque d'absence « ABS », suppression tracée
- Moyennes & classement : pondération configurable (coef évaluation × coef discipline), arrondis et politique d'absences paramétrables, ex æquo au même rang, statistiques de classe
- Bulletins & documents A4 : bulletin individuel (en-tête République du Sénégal / IA / IEF activable), bulletins de classe en lot, relevé de notes, fiche synoptique, listes, registre d'appel, statistiques ; impression, PDF via navigateur, HTML autonome, CSV
- Présences & absences : registre journalier (P/A/R/J + motif + observation), récapitulatif mensuel, historique individuel, statistiques
- Frais & paiements : catégories, attribution individuelle ou par classe, paiements partiels, soldes, reçus numérotés R{année}-NNNNN imprimables, annulation **tracée** (date/auteur/motif) sans suppression, état financier CSV
- Tableau de bord : indicateurs calculés depuis les données réelles, graphiques canvas locaux (effectifs, filles/garçons, par classe, encaissements mensuels)
- Sauvegarde & restauration : export JSON complet/par catégorie, validation d'enveloppe, prévisualisation, sauvegarde de sécurité automatique avant restauration, diagnostic (orphelins, tailles) avec nettoyage confirmé
- Utilisateurs & rôles : 6 profils, activation/désactivation, changement de mot de passe (SHA-256 via WebCrypto), verrouillage de session, journal d'audit de toutes les opérations
- Assistant d'import CSV élèves : correspondance de colonnes par alias, doublons internes et en base, prévisualisation, rapport d'import ; exports CSV des listes, résultats et état financier

### Tests
- 26 scénarios automatisés (harnais jsdom + fake-indexeddb) — 26/26 PASS
- Volumes 500 / 1 000 / 5 000 élèves et jusqu'à 5 000 notes — sans erreur
- Détails dans `RAPPORT_TESTS.md`

### Corrections internes notables (avant publication)
- Correction d'une seule erreur de syntaxe bloquante (backtick d'ouverture manquant dans un littéral de gabarit imbriqué, vue Notes)
- Correction du service de calcul : `sumCoeff` hors portée dans les statistiques
- Déclaration manquante des contrôleurs `TeachersUI` / `SubjectsUI` (arrêt total du script au démarrage)
- Index composé IndexedDB (`attendance` classe+date) désormais créé correctement + repli par filtre dans `DB.byIndex`
- Course critique dans `FinanceUI.setTab` (élément absent après re-rendu) neutralisée
- Import CSV : colonnes famille/tuteur/nationalité réellement importées, statuts normalisés, rejets explicites (date de naissance absente/valide)
- Nettoyages : code mort supprimé, `Util.confirm` accepte bouton personnalisé + style danger, façades de services (`DatabaseService`, `GradeService`, `BulletinService`, `ImportExportService`, `ValidationService`)
