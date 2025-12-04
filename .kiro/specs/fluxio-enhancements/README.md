# Fluxio Enhancements Specification

## Vue d'ensemble

Cette spécification décrit les améliorations majeures à apporter au système Fluxio pour mieux répondre aux besoins d'un dépôt de vente de boissons en gros. L'objectif principal est de faciliter le suivi de qui (salariés/associés) doit de l'argent à la société.

## Structure de la Spec

### 📋 requirements.md

Contient 10 nouvelles exigences (Requirements 11-20) couvrant :

- **Req 11** : Tableau de bord des soldes par intervenant
- **Req 12** : Rapprochement de caisse
- **Req 13** : Catégorisation des mouvements
- **Req 14** : Gestion des avances et remboursements
- **Req 15** : Alertes et notifications
- **Req 16** : Rapports et exports
- **Req 17** : Détails enrichis des intervenants
- **Req 18** : Page d'accueil Dashboard
- **Req 19** : Paramètres et configuration
- **Req 20** : Filtre multi-modalités (déjà implémenté)

### 🎨 design.md

Contient la conception technique détaillée :

- Schéma de base de données étendu (Prisma)
- Nouveaux endpoints API
- Composants React
- Interfaces TypeScript
- Logique métier (calculs, alertes)
- Fonctions d'export (Excel, PDF)
- Stratégie de tests

### ✅ tasks.md

Plan d'implémentation en 10 phases :

1. **Phase 1** : Foundation (DB, types, utils)
2. **Phase 2** : Balance Management ⭐ (PRIORITÉ)
3. **Phase 3** : Cash Reconciliation
4. **Phase 4** : Movement Categorization
5. **Phase 5** : Advance Management
6. **Phase 6** : Alerts System
7. **Phase 7** : Settings
8. **Phase 8** : Dashboard & Reports
9. **Phase 9** : Charts
10. **Phase 10** : Testing & Polish

## Fonctionnalités Clés

### 🎯 1. Tableau de Bord des Soldes (PRIORITÉ HAUTE)

**Problème résolu** : Identifier rapidement qui doit de l'argent à la société

**Fonctionnalités** :

- Vue d'ensemble de tous les intervenants avec leur solde
- Calcul automatique : Sorties - Entrées = Dette
- Code couleur : Rouge (doit), Vert (crédit), Gris (zéro)
- Filtrage par type d'intervenant (ASSOCIE, SALARIE, etc.)
- Filtrage par période
- Tri par montant de dette
- Clic pour voir les détails

**Pages** :

- `/soldes` - Liste des soldes
- `/intervenants/[id]` - Détail d'un intervenant

### 💰 2. Gestion des Avances

**Problème résolu** : Suivre les avances données et leurs remboursements

**Fonctionnalités** :

- Création d'avances avec date d'échéance
- Lien entre avances et remboursements
- Calcul automatique du solde restant
- Statuts : EN_COURS, REMBOURSE_PARTIEL, REMBOURSE_TOTAL
- Alertes pour avances en retard
- Vue dédiée des avances en cours

**Pages** :

- `/avances` - Gestion des avances

### 🧮 3. Rapprochement de Caisse

**Problème résolu** : Vérifier que l'argent physique correspond aux enregistrements

**Fonctionnalités** :

- Calcul du solde théorique (mouvements ESPECES)
- Saisie du comptage physique
- Calcul automatique de l'écart
- Historique des rapprochements
- Graphique d'évolution des écarts
- Alertes si écart important

**Pages** :

- `/rapprochement` - Comptage de caisse

### 📊 4. Catégorisation et Rapports

**Problème résolu** : Comprendre où va l'argent

**Fonctionnalités** :

- Catégories : SALAIRES, ACHATS_STOCK, FRAIS_GENERAUX, etc.
- Rapports par catégorie
- Graphiques (camembert, barres)
- Comparaison mensuelle
- Export Excel

**Pages** :

- `/rapports/categories` - Analyse par catégorie

### 🔔 5. Système d'Alertes

**Problème résolu** : Être notifié des situations critiques

**Types d'alertes** :

- Dette d'un intervenant > seuil
- Caisse < minimum
- Avance en retard
- Écart de rapprochement > seuil

**Affichage** :

- Badge dans la navigation
- Bannière sur le dashboard
- Historique des alertes

### 📈 6. Dashboard Enrichi

**Problème résolu** : Vue d'ensemble rapide de la situation

**Widgets** :

- Solde actuel
- Dettes totales
- Avances en cours
- Évolution mensuelle
- Mouvements récents
- Top 5 débiteurs
- Alertes actives
- Graphique de tendance

**Pages** :

- `/` - Dashboard (nouvelle page d'accueil)

## Ordre d'Implémentation Recommandé

### 🚀 Phase 1 : Démarrage Rapide (1-2 jours)

1. Mettre à jour le schéma de base de données
2. Créer les types TypeScript
3. Créer les fonctions de calcul

### ⭐ Phase 2 : Soldes (2-3 jours) - **COMMENCER ICI**

1. API des soldes
2. Page Soldes
3. Page Détail Intervenant

Cette phase résout votre besoin principal !

### 💰 Phase 3 : Avances (2-3 jours)

1. API des avances
2. Page Avances
3. Formulaires avance/remboursement

### 🧮 Phase 4 : Rapprochement (1-2 jours)

1. API rapprochement
2. Page Rapprochement

### 📊 Phase 5 : Catégories (2 jours)

1. Ajouter catégorie aux mouvements
2. API rapports
3. Page Rapports

### 🔔 Phase 6 : Alertes (1-2 jours)

1. API alertes
2. Composants alertes
3. Job de vérification

### ⚙️ Phase 7 : Paramètres (1 jour)

1. API settings
2. Page Paramètres

### 📈 Phase 8 : Dashboard (2 jours)

1. API dashboard
2. Page Dashboard
3. Exports

## Dépendances Techniques

### Nouvelles Dépendances NPM

```json
{
  "exceljs": "^4.3.0", // Export Excel
  "pdfkit": "^0.13.0", // Export PDF
  "recharts": "^2.10.0" // Graphiques
}
```

### Migrations Base de Données

```bash
npx prisma migrate dev --name add-enhancements
npx prisma generate
```

## Estimation Totale

- **Développement** : 15-20 jours
- **Tests** : 3-5 jours
- **Documentation** : 1-2 jours
- **Total** : ~20-27 jours

## Démarrage Rapide

Pour commencer l'implémentation de la **Phase 2 (Soldes)** qui est la priorité :

```bash
# 1. Mettre à jour la base de données
npx prisma migrate dev --name add-enhancements

# 2. Installer les dépendances
npm install exceljs pdfkit recharts

# 3. Commencer par la tâche 1 du tasks.md
# Voir tasks.md Phase 1 et Phase 2
```

## Questions Fréquentes

### Q: Puis-je implémenter seulement certaines fonctionnalités ?

**R:** Oui ! Les phases sont indépendantes. Vous pouvez commencer par la Phase 2 (Soldes) qui est la plus importante.

### Q: Est-ce compatible avec le système actuel ?

**R:** Oui, toutes les améliorations sont additives. Elles n'impactent pas les fonctionnalités existantes.

### Q: Combien de temps pour avoir les soldes fonctionnels ?

**R:** Environ 3-4 jours pour avoir Phase 1 + Phase 2 complètes.

### Q: Les données existantes seront-elles conservées ?

**R:** Oui, les migrations Prisma préservent toutes les données existantes.

## Support

Pour toute question sur cette spec :

1. Consultez les fichiers requirements.md, design.md, tasks.md
2. Vérifiez les commentaires dans le code
3. Référez-vous aux numéros de requirements (ex: Req 11.1)

## Prochaines Étapes

1. ✅ Lire cette documentation
2. ✅ Examiner requirements.md pour comprendre les besoins
3. ✅ Examiner design.md pour la conception technique
4. ⏭️ Commencer l'implémentation avec tasks.md Phase 1
5. ⏭️ Implémenter Phase 2 (Soldes) - PRIORITÉ
6. ⏭️ Tester et valider avec des données réelles
7. ⏭️ Continuer avec les autres phases selon les besoins

Bonne implémentation ! 🚀
