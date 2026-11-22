# GUIDE UTILISATEUR — KABO_GESTION_ECOLE_PRO v1.0

Manuel des fonctionnalités. Messages et écrans sont en français ; les montants sont en FCFA.

## 1. Démarrage

Ouvrez `index.html` dans un navigateur moderne. À la première ouverture : identifiant **admin**, mot de passe **admin**. Changez ce mot de passe (menu Utilisateurs → votre profil → Modifier le mot de passe).

- **Verrouillage** (icône cadenas de l'en-tête) : fige l'écran sans fermer la session ; le mot de passe est demandé pour reprendre.
- **Déconnexion** : ferme la session ; les données restent en base locale.
- **Thème clair/sombre** : bouton ☾ / ☀ de l'en-tête (préférence mémorisée).
- Le menu latéral se replie/déplie avec le bouton ☰ ; l'application s'adapte aux tablettes et aux smartphones.

Après l'installation, deux réglages d'abord : **Paramètres → Établissement**, puis **Paramètres → Années scolaires** (créez l'année courante, ex. 2025-2026, puis « Activer »).

## 2. Paramètres de l'établissement

- Identité : nom, type, adresse, téléphone, courriel, responsable, année de création, logo (image ≤ 300 ko).
- Administration scolaire sénégalaise : Académie (IA), Inspection (IEF), District, Commune, Région, code établissement.
- « Bandeau République du Sénégal » : active/désactive l'en-tête officiel sur les documents imprimés, avec le texte du ministère modifiable.

## 3. Années scolaires

Format `2025-2026`. Créer, modifier, **activer** (une seule active à la fois), **clôturener**.

- Toutes les vues (classes, élèves, notes, finance…) ne montrent que l'année active. Les années précédentes restent consultables en changeant l'année dans le sélecteur des listes.
- La clôture est protégée : un avertissement indique le nombre de dossiers d'élèves encore actifs — passez-les d'abord en « passant », « redoublant », « abandonné » ou « sortant », ou clôturez en connaissance de cause.
- Ne mélangez jamais les données : une inscription, une note, un paiement appartiennent à une année précise.

## 4. Classes

- Niveaux : CI, CP, CE1, CE2, CM1, CM2. Types : classe simple, multigrade, double flux, spéciale, autre.
- Pour une classe multigrade, cochez les niveaux supplémentaires.
- L'effectif Total/Filles/Garçons est recalculé automatiquement à partir des inscriptions actives.
- Suppression : réservée aux classes sans inscription active (mesure anti-perte de données). Préférez « Archiver ».
- « Voir les élèves » liste les inscrits et permet l'impression.

## 5. Élèves

**Inscription individuelle** : bouton « ＋ Inscrire ». Onglets Identité / Famille / Scolarité. Le matricule est unique et contrôlé (bouton pour en générer un). Champs clés : nom, prénom, sexe, date et lieu de naissance, nationalité, adresse, père, mère, tuteur, téléphone du responsable, photo (≤ 200 ko).

**Inscription en série** : saisie d'élèves à la file (enchaînement automatique des fiches suivies, dans la même classe).

**Statuts** : nouveau, passant, redoublant, transféré, abandonné, sortant. Le transfert/redoublement se fait depuis la fiche (changement de classe ou d'année).

**Recherche & filtres** : recherche instantanée (nom, matricule), filtres classe / sexe / statut, pagination.

**Actions** : modifier, consulter la fiche (avec historique scolaire complet), exporter CSV, imprimer la liste, archiver. La suppression est refusée tant que l'élève a une inscription active et demande confirmation.

**Import CSV** : module Sauvegarde & données → Import CSV. Colonnes reconnues (avec alias) : `matricule; nom; prenom; sexe; date_naissance; lieu_naissance; nationalite; adresse; pere; mere; tuteur; tel_responsable; classe; statut`. Téléchargez le modèle fourni. L'assistant affiche : colonnes détectées, lignes valides/invalide, doublons internes et déjà en base, puis rapport d'import. Les élèves correspondent à des classes déjà existantes.

## 6. Enseignants

Fiche complète (matricule, domicile, diplôme, qualification, fonction, date de prise de service, statut). Actions : créer, modifier, profil (avec affectations), affecter une classe, archiver, imprimer la liste du personnel.

## 7. Matières, périodes et règles de calcul

Onglet **Matières** : nom, coefficient, note maximale (défaut 10), sous-matières, ordre, activation. Les modèles classique et franco-arabe sont proposés au premier lancement — adaptez-les librement (rien n'est imposé).

Onglet **Périodes** : premier/deuxième/troisième trimestre et périodes personnalisées (évaluations continues, contrôles…), désactivables.

Onglet **Règles de calcul** :
- nombre de décimales (défaut 2) ;
- mode d'arrondi (« standard », au centième supérieur…) ;
- politique des absences : **exclure** la note absente du calcul (défaut) ou compter **zéro** — documentez le choix de l'établissement, la règle n'est pas imposée par le logiciel.

La moyenne de discipline = Σ(note × coefficient de l'évaluation) / Σ(coefficients). La moyenne générale = Σ(moyenne de discipline × coefficient de la discipline) / Σ(coefficients).

## 8. Évaluations et notes

Sélectionnez la classe et la période, créez les évaluations (nom, matière, barème, coefficient), puis « Saisir les notes » :

- saisie au clavier : Entrée passe à la cellule suivante ;
- barème contrôlé (hors barème → rejet avec message) ;
- `ABS` ou case « Absent » pour une absence à l'évaluation ;
- enregistrement en un clic, possibilité de modifier/supprimer une évaluation (les notes liées sont signalées avant suppression).

## 9. Bulletins & documents

- Le **tableau des résultats** affiche rang (ex æquo au même rang), moyennes par discipline, moyenne générale, moyenne/min/max de classe, taux de réussite.
- **Bulletin individuel** : en-tête officiel (République du Sénégal, ministère, IA, IEF selon les paramètres), identification de l'élève, disciplines, notes, coefficients, moyennes, rang, appréciations, signatures.
- **Bulletins de la classe** en lot (un par page, A4).
- **Relevé de notes** et **fiche synoptique** de classe.
- Chaque document : Aperçu → **Imprimer** (ou PDF via l'impression du navigateur), ou **Exporter en HTML** autonome.
- **Astuce impression** : activez « Graphiques d'arrière-plan » et désactivez en-têtes/pieds du navigateur pour un rendu A4 propre.

## 10. Présences & absences

Sélectionnez classe + date : liste des inscrits avec Présent / Absent / Retard / Absence justifiée, motif et observation. Bouton « Tout présent » pour accélérer. L'enregistrement d'une journée vide efface les pointages de cette journée (avec confirmation).

- **Récapitulatif mensuel** : événements par élève hors présences.
- **Historique individuel** : détail par élève.
- Impression du registre journalier et du récapitulatif mensuel en A4.

## 11. Frais scolaires & paiements

- **Catégories** (gérables) : Inscription, Scolarité, Cantine, Transport, Fournitures, Autres.
- Créer des frais : élève (recherche par nom/matricule), catégorie, libellé, montant, année.
- **Attribution par classe** : applique des frais à tous les élèves inscrits d'une classe en une fois (confirmation avec montant total).
- **Encaisser** : paiement partiel ou total ; chaque paiement produit un **reçu numéroté** (`R2025-00001`…) imprimable : établissement, élève, classe, nature, montant payé, reste, date, agent encaisseur.
- **Tableau financier** : attendu, encaissé, restant, taux de recouvrement, encaissements mensuels (graphique), détail par catégorie, liste des reçus. Export CSV de l'état financier.
- **Annulation** : un paiement n'est JAMAIS supprimé — l'annulation enregistre date, auteur et motif obligatoire, et le reçu reste consultable.

## 12. Tableau de bord

Indicateurs calculés uniquement depuis vos données : nombre d'élèves, filles/garçons, classes, enseignants, état des inscriptions par statut, encaissements. Graphiques canvas locaux. Journal des dernières opérations (audit).

## 13. Sauvegarde, restauration, diagnostic

- **Sauvegarde complète JSON** (ou par catégorie : élèves, notes, paiements…). « Dernière sauvegarde » est affiché.
- **Restauration** : choisissez le fichier → validation du format (application/version/magasins) → prévisualisation (compteurs par catégorie) → confirmation → restauration contrôlée. Une **sauvegarde de sécurité** (élèves + journal) est créée automatiquement avant.
- **Diagnostic** : comptes par magasin, taille estimée, détection des incohérences (inscriptions/paiements orphelins), nettoyage confirmé des orphelins.
- **Habitude recommandée** : sauvegarde JSON hebdomadaire + après chaque grande saisie ; copies sur clé USB.

## 14. Utilisateurs et rôles

Profils : **Administrateur** (tout), **Directeur** (administration), **Secrétariat** (dossiers, inscriptions, présences), **Enseignant** (notes, présences, bulletins de ses classes — lecture des dossiers), **Gestionnaire** (paiements), **Consultation** (lecture seule, aucun bouton d'action).

Créer un compte = identifiant + nom complet + rôle + mot de passe. Désactivation possible (sauf admin). Le journal d'audit enregistre connexions, créations, modifications, suppressions, paiements, annulations, sauvegardes.

> **Avertissement de sécurité** : une application HTML locale n'offre pas la même protection qu'un serveur. Les rôles guident l'interface ; une personne qui maîtrise l'ordinateur peut contourner les restrictions. Verrouillez la session (cadenas) et protégez l'accès physique à la machine.
