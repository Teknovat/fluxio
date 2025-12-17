# Migration: Documents sans Intervenant

## Changements effectués

### 1. Schéma Prisma

- ✅ Supprimé `intervenantId` du modèle `Document`
- ✅ Supprimé la relation `intervenant` du modèle `Document`
- ✅ Supprimé la relation `documents` du modèle `Intervenant`
- ✅ Supprimé l'index `@@index([tenantId, intervenantId])`

### 2. Types TypeScript

- ✅ Supprimé `intervenantId` et `intervenant?` de l'interface `Document`

### 3. API Documents (`app/api/documents/route.ts`)

- ✅ Retiré le paramètre `intervenantId` de la query string
- ✅ Retiré le filtre par `intervenantId`
- ✅ Retiré la recherche par nom d'intervenant
- ✅ Retiré l'include `intervenant` dans les requêtes
- ✅ Retiré la validation de l'intervenant dans POST
- ✅ Retiré `intervenantId` des données de création

### 4. Composants à mettre à jour

#### DocumentForm.tsx

- ❌ À FAIRE: Retirer complètement le sélecteur d'intervenant
- ❌ À FAIRE: Retirer `prefilledIntervenantId` des props
- ❌ À FAIRE: Retirer la logique de suggestion d'intervenant basée sur le type
- ❌ À FAIRE: Retirer la validation de `intervenantId`
- ❌ À FAIRE: Retirer `intervenantId` du payload API

#### DocumentCard.tsx

- ❌ À FAIRE: Retirer l'affichage du nom de l'intervenant

#### DocumentList (app/(dashboard)/documents/page.tsx)

- ❌ À FAIRE: Retirer le filtre par intervenant
- ❌ À FAIRE: Retirer l'affichage du nom d'intervenant dans les cartes

#### DocumentDetail (app/(dashboard)/documents/[id]/page.tsx)

- ❌ À FAIRE: Retirer l'affichage des informations d'intervenant
- ❌ À FAIRE: Afficher les intervenants qui ont payé via les justifications

#### DocumentSelector.tsx

- ❌ À FAIRE: Retirer le filtre par intervenant
- ❌ À FAIRE: Retirer `intervenantId` des props

#### Page Intervenant (app/(dashboard)/intervenants/[id]/page.tsx)

- ✅ DÉJÀ FAIT: Section documents ajoutée (task 15)
- ❌ À FAIRE: Modifier pour afficher les documents payés par cet intervenant (via justifications)

### 5. API Documents [id] (`app/api/documents/[id]/route.ts`)

- ❌ À FAIRE: Retirer l'include `intervenant` dans GET
- ❌ À FAIRE: Retirer la validation d'intervenant dans PUT
- ❌ À FAIRE: Retirer `intervenantId` des mises à jour

## Nouveau flux d'utilisation

### Avant (avec intervenantId):

1. Créer un document lié à un intervenant
2. Seul cet intervenant peut payer le document

### Après (sans intervenantId):

1. Créer un document (facture, bulletin, etc.)
2. N'importe quel intervenant peut payer via une justification
3. Le document affiche tous les intervenants qui ont contribué au paiement

## Exemple concret

**Document**: Facture électricité 1000 TND

**Paiements**:

- Décaissement Collaborateur A → Justification 500 TND → Document
- Décaissement Collaborateur B → Justification 400 TND → Document
- Décaissement Associé A → Justification 100 TND → Document

**Résultat**: Document payé à 100% par 3 intervenants différents

## Affichage dans l'interface

### Page Document Detail

Afficher:

- Informations du document (référence, type, montant total, etc.)
- Liste des paiements avec l'intervenant de chaque justification:
  - Collaborateur A: 500 TND
  - Collaborateur B: 400 TND
  - Associé A: 100 TND
- Total payé: 1000 TND
- Statut: PAID

### Page Intervenant Detail

Afficher:

- Documents payés par cet intervenant (via ses justifications)
- Montant payé par cet intervenant pour chaque document

## Migration des données existantes

L'utilisateur a indiqué qu'il fera la migration manuellement car il n'y a pas beaucoup de données.

## Prochaines étapes

1. Mettre à jour DocumentForm pour retirer le sélecteur d'intervenant
2. Mettre à jour DocumentCard pour retirer l'affichage de l'intervenant
3. Mettre à jour DocumentDetail pour afficher les intervenants payeurs
4. Mettre à jour la page Intervenant pour afficher les documents payés
5. Tester le flux complet de création et paiement multi-intervenants
