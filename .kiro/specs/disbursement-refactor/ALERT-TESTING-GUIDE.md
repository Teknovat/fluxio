# Guide de Test du Système d'Alertes

## 🎯 Objectif

Ce guide vous aide à tester toutes les fonctionnalités du système d'alertes.

## 📋 Prérequis

1. Base de données configurée et migrée
2. Application en cours d'exécution
3. Compte utilisateur avec rôle ADMIN

## 🚀 Méthodes de Test

### **Méthode 1 : Scripts Automatisés** (Recommandé)

#### Étape 1 : Créer des données de test

```bash
npx ts-node scripts/create-test-data-for-alerts.ts
```

Ce script crée automatiquement :

- ✅ Un intervenant avec dette élevée (> 10000)
- ✅ Des mouvements créant un solde de caisse faible (< 5000)
- ✅ Un décaissement en retard (échéance dépassée)
- ✅ Un décaissement ouvert depuis longtemps (> 30 jours)
- ✅ Plusieurs décaissements pour total élevé (> 10000)

#### Étape 2 : Déclencher la vérification des alertes

```bash
npx ts-node scripts/test-alerts.ts
```

Ce script :

- Exécute toutes les vérifications d'alertes
- Affiche les alertes créées
- Montre les seuils configurés

### **Méthode 2 : Via l'Interface Utilisateur**

#### Étape 1 : Accéder au Dashboard

1. Connectez-vous à l'application
2. Allez sur `/dashboard`
3. En mode développement, vous verrez un bouton "🔍 Vérifier les Alertes"

#### Étape 2 : Déclencher la vérification

1. Cliquez sur "🔍 Vérifier les Alertes"
2. Un toast affichera le nombre d'alertes créées
3. Les alertes apparaîtront dans la section "Alertes"
4. Le badge dans la navigation sera mis à jour

### **Méthode 3 : Via l'API**

#### Déclencher la vérification

```bash
curl -X POST http://localhost:3000/api/alerts/check \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"
```

#### Lister les alertes

```bash
curl http://localhost:3000/api/alerts?dismissed=false \
  -H "Cookie: your-session-cookie"
```

#### Ignorer une alerte

```bash
curl -X POST http://localhost:3000/api/alerts/[alert-id]/dismiss \
  -H "Cookie: your-session-cookie"
```

## 🧪 Scénarios de Test

### **Test 1 : Alerte de Dette Élevée** 💰

**Objectif :** Déclencher une alerte DEBT_THRESHOLD

**Étapes :**

1. Aller sur `/intervenants`
2. Créer un nouvel intervenant (ex: "Test Associé")
3. Aller sur `/mouvements`
4. Créer un mouvement SORTIE de 15000 pour cet intervenant
5. Déclencher la vérification des alertes
6. Vérifier qu'une alerte apparaît

**Résultat attendu :**

- ⚠️ Alerte WARNING : "Dette élevée: Test Associé"
- Message : "Test Associé doit 15000 XAF à la société"
- Cliquer sur l'alerte → redirige vers `/intervenants/[id]`

### **Test 2 : Alerte de Caisse Faible** 💵

**Objectif :** Déclencher une alerte LOW_CASH

**Étapes :**

1. Vérifier le solde de caisse actuel sur `/dashboard`
2. Si > 5000, créer des mouvements SORTIE pour descendre < 5000
3. Déclencher la vérification des alertes

**Résultat attendu :**

- 🔴 Alerte ERROR : "Caisse faible"
- Message : "Le solde de caisse (XXX XAF) est en dessous du minimum (5000 XAF)"
- Cliquer sur l'alerte → redirige vers `/dashboard`

### **Test 3 : Décaissement en Retard** ⏰

**Objectif :** Déclencher une alerte OVERDUE_DISBURSEMENT

**Étapes :**

1. Aller sur `/disbursements`
2. Créer un décaissement avec une échéance dans le passé
3. Déclencher la vérification des alertes

**Résultat attendu :**

- ⚠️ Alerte WARNING : "Décaissement en retard: [Nom Intervenant]"
- Message : "Décaissement de XXX XAF en retard depuis le [date]"
- Cliquer sur l'alerte → redirige vers `/disbursements/[id]`

### **Test 4 : Décaissement Ouvert Longtemps** 📅

**Objectif :** Déclencher une alerte LONG_OPEN_DISBURSEMENT

**Étapes :**

1. Créer un décaissement avec une date de création > 30 jours
   - Utiliser le script ou modifier directement en base
2. Déclencher la vérification des alertes

**Résultat attendu :**

- ⚠️ Alerte WARNING : "Décaissement ouvert depuis longtemps: [Nom]"
- Message : "Décaissement de XXX XAF ouvert depuis XX jours (seuil: 30 jours)"
- Cliquer sur l'alerte → redirige vers `/disbursements/[id]`

### **Test 5 : Total Décaissements Élevé** 📊

**Objectif :** Déclencher une alerte HIGH_OUTSTANDING_DISBURSEMENTS

**Étapes :**

1. Créer plusieurs décaissements non justifiés
2. S'assurer que le total > 10000
3. Déclencher la vérification des alertes

**Résultat attendu :**

- ⚠️ Alerte WARNING : "Décaissements en cours élevés"
- Message : "Le total des décaissements en cours (XXX XAF) dépasse le seuil de 10000 XAF"
- Cliquer sur l'alerte → redirige vers `/disbursements`

### **Test 6 : Configuration des Seuils** ⚙️

**Objectif :** Tester la configuration personnalisée

**Étapes :**

1. Aller sur `/settings`
2. Modifier les seuils :
   - Seuil de dette : 5000 (au lieu de 10000)
   - Solde minimum caisse : 3000 (au lieu de 5000)
   - Jours avant alerte : 15 (au lieu de 30)
3. Cliquer sur "Enregistrer les paramètres"
4. Déclencher la vérification des alertes
5. Vérifier que les nouvelles valeurs sont utilisées

**Résultat attendu :**

- ✅ Toast : "Paramètres enregistrés avec succès"
- Les alertes utilisent les nouveaux seuils
- Les messages d'alerte mentionnent les nouveaux seuils

### **Test 7 : Désactivation des Alertes** 🔕

**Objectif :** Tester la désactivation globale

**Étapes :**

1. Aller sur `/settings`
2. Décocher "Alertes activées"
3. Enregistrer
4. Déclencher la vérification des alertes

**Résultat attendu :**

- Aucune nouvelle alerte créée
- Message : "0 alerte(s) créée(s)"

### **Test 8 : Ignorer une Alerte** ✖️

**Objectif :** Tester la fonction d'ignorance

**Étapes :**

1. Aller sur `/dashboard`
2. Voir les alertes actives
3. Cliquer sur le bouton "X" d'une alerte
4. Vérifier que l'alerte disparaît
5. Vérifier que le badge de navigation est mis à jour

**Résultat attendu :**

- ✅ Toast : "Alerte ignorée"
- L'alerte disparaît de la liste
- Le compteur du badge diminue de 1

### **Test 9 : Navigation depuis les Alertes** 🧭

**Objectif :** Tester les liens de navigation

**Étapes :**

1. Pour chaque type d'alerte, cliquer sur "Voir les détails →"
2. Vérifier la redirection

**Résultats attendus :**
| Type d'Alerte | Destination |
|---------------|-------------|
| DEBT_THRESHOLD | `/intervenants/[id]` |
| LOW_CASH | `/dashboard` |
| OVERDUE_DISBURSEMENT | `/disbursements/[id]` |
| LONG_OPEN_DISBURSEMENT | `/disbursements/[id]` |
| HIGH_OUTSTANDING_DISBURSEMENTS | `/disbursements` |

### **Test 10 : Badge de Navigation** 🔔

**Objectif :** Tester le badge de compteur

**Étapes :**

1. Créer plusieurs alertes
2. Vérifier que le badge affiche le bon nombre
3. Ignorer une alerte
4. Vérifier que le badge se met à jour
5. Attendre 5 minutes
6. Vérifier que le badge se rafraîchit automatiquement

**Résultat attendu :**

- Badge affiche le nombre correct d'alertes actives
- Badge disparaît quand il n'y a plus d'alertes
- Badge affiche "99+" si > 99 alertes
- Auto-refresh toutes les 5 minutes

## 📊 Checklist de Test Complète

### Fonctionnalités de Base

- [ ] Les alertes sont créées correctement
- [ ] Les alertes apparaissent sur le dashboard
- [ ] Le badge de navigation affiche le bon nombre
- [ ] Les alertes peuvent être ignorées
- [ ] Les alertes ignorées ne réapparaissent pas

### Types d'Alertes

- [ ] DEBT_THRESHOLD fonctionne
- [ ] LOW_CASH fonctionne
- [ ] OVERDUE_DISBURSEMENT fonctionne
- [ ] LONG_OPEN_DISBURSEMENT fonctionne
- [ ] HIGH_OUTSTANDING_DISBURSEMENTS fonctionne
- [ ] RECONCILIATION_GAP fonctionne (si applicable)

### Configuration

- [ ] Les seuils peuvent être modifiés
- [ ] Les nouveaux seuils sont appliqués
- [ ] Les alertes peuvent être désactivées globalement
- [ ] Les paramètres sont sauvegardés correctement

### Navigation

- [ ] Cliquer sur une alerte redirige correctement
- [ ] Les liens pointent vers les bonnes pages
- [ ] Le badge de navigation est cliquable

### Performance

- [ ] Le badge se rafraîchit automatiquement
- [ ] Le dashboard se rafraîchit automatiquement
- [ ] Pas de ralentissement avec beaucoup d'alertes

### Sécurité

- [ ] Les alertes sont isolées par tenant
- [ ] Seuls les admins peuvent modifier les paramètres
- [ ] Les utilisateurs ne voient que leurs alertes

## 🐛 Problèmes Courants

### Aucune alerte n'apparaît

**Solutions :**

1. Vérifier que `alertsEnabled = true` dans Settings
2. Vérifier que les données dépassent les seuils
3. Exécuter manuellement `npx ts-node scripts/test-alerts.ts`
4. Vérifier les logs de la console

### Le badge ne se met pas à jour

**Solutions :**

1. Rafraîchir la page
2. Vérifier la console pour les erreurs
3. Vérifier que l'API `/api/alerts` fonctionne
4. Attendre 5 minutes pour l'auto-refresh

### Les alertes réapparaissent après ignorance

**Solutions :**

1. Vérifier que l'API dismiss fonctionne
2. Vérifier que `dismissed = true` en base
3. Corriger la condition qui déclenche l'alerte

## 📝 Notes

- Les alertes sont vérifiées automatiquement toutes les 5 minutes sur le dashboard
- En production, configurez un cron job pour vérifier les alertes régulièrement
- Les alertes ignorées restent en base avec `dismissed = true`
- Les seuils par défaut sont configurables dans Settings

## 🎓 Prochaines Étapes

Après avoir testé le système d'alertes :

1. Ajuster les seuils selon vos besoins métier
2. Former les utilisateurs sur le système d'alertes
3. Configurer un cron job pour vérifications automatiques
4. Monitorer les performances avec beaucoup d'alertes
