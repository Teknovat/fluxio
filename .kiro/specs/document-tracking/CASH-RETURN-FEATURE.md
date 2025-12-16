# Fonctionnalité Retour Caisse (CASH_RETURN)

## Vue d'ensemble

Une nouvelle catégorie de justification "Retour Caisse" (CASH_RETURN) a été ajoutée pour gérer le flux quotidien de la caisse:

1. **Matin**: Décaissement vers la caissière (SORTIE de caisse)
2. **Soir**: Retour de la caisse (ENTRÉE via justification "Retour Caisse")
3. **Lendemain**: Nouveau décaissement (SORTIE)

## Comportement spécial

Contrairement aux autres catégories de justification qui documentent simplement l'utilisation des fonds, **CASH_RETURN crée automatiquement un mouvement ENTRÉE** pour enregistrer le retour de l'argent en caisse.

## Modifications apportées

### 1. Types (`types/index.ts`)

Ajout de `CASH_RETURN` à l'enum `JustificationCategory`:

```typescript
export enum JustificationCategory {
  STOCK_PURCHASE = "STOCK_PURCHASE",
  BANK_DEPOSIT = "BANK_DEPOSIT",
  CASH_RETURN = "CASH_RETURN", // ← NOUVEAU
  SALARY = "SALARY",
  TRANSPORT = "TRANSPORT",
  SUPPLIES = "SUPPLIES",
  UTILITIES = "UTILITIES",
  OTHER = "OTHER",
}
```

### 2. API de justification (`app/api/disbursements/[id]/justify/route.ts`)

Ajout de la logique pour créer un mouvement ENTRÉE quand la catégorie est CASH_RETURN:

```typescript
// Create justification record and optionally create ENTREE movement for CASH_RETURN
// CASH_RETURN creates an ENTREE movement to track cash returning to the company
let cashReturnMovement = null;

if (category === JustificationCategory.CASH_RETURN) {
  // Create ENTREE movement for cash return
  cashReturnMovement = await prisma.mouvement.create({
    data: {
      tenantId,
      date: new Date(date),
      intervenantId: disbursement.intervenantId,
      type: "ENTREE",
      amount,
      modality: "ESPECES",
      category: "AUTRES",
      reference: reference || `Retour caisse - ${disbursement.id.substring(0, 8)}`,
      note: note || "Retour de caisse",
    },
  });
}
```

### 3. Formulaire de justification (`components/JustificationForm.tsx`)

Ajout du label "Retour caisse" dans les options de catégorie:

```typescript
const categoryLabels: Record<JustificationCategory, string> = {
  STOCK_PURCHASE: "Achat de stock",
  BANK_DEPOSIT: "Dépôt bancaire",
  CASH_RETURN: "Retour caisse", // ← NOUVEAU
  SALARY: "Salaire",
  TRANSPORT: "Transport",
  SUPPLIES: "Fournitures",
  UTILITIES: "Services publics",
  OTHER: "Autre",
};
```

## Flux d'utilisation

### Scénario: Gestion quotidienne de la caisse

1. **Matin (9h00)**:

   - Créer un décaissement de 500 TND pour la caissière
   - Cela crée un mouvement SORTIE de 500 TND
   - Solde de la caissière: +500 TND (elle doit 500 TND à la société)

2. **Soir (18h00)**:

   - La caissière a utilisé 350 TND pour des achats
   - Elle retourne 150 TND en caisse
   - Créer une justification "Retour Caisse" de 150 TND
   - Cela crée automatiquement un mouvement ENTRÉE de 150 TND
   - Solde de la caissière: +350 TND (elle doit encore 350 TND)

3. **Justification des dépenses**:
   - Créer des justifications pour les 350 TND utilisés (achats, salaires, etc.)
   - Si justifié avec des documents: solde ajusté = 0 TND
   - Si justifié sans documents: solde = +350 TND (dette)

## Impact sur le calcul des soldes

Le calcul des soldes a été modifié dans `lib/calculations.ts` pour:

1. **Exclure les montants justifiés avec documents** du calcul de la dette
2. **Inclure les mouvements ENTRÉE** créés par CASH_RETURN

Formule:

```
Solde = (Total SORTIES - Montants justifiés avec documents) - Total ENTRÉES
```

## Exemple complet

### Données initiales

- Intervenant: Caissière
- Solde initial: 0 TND

### Opérations

1. Décaissement: 500 TND (SORTIE)
2. Retour caisse: 150 TND (ENTRÉE via CASH_RETURN)
3. Justification avec document (salaire): 200 TND
4. Justification sans document (fournitures): 150 TND

### Calcul du solde

- Total SORTIES: 500 TND
- Total ENTRÉES: 150 TND (retour caisse)
- Justifié avec documents: 200 TND (salaire)
- **Solde = (500 - 200) - 150 = 150 TND**

La caissière doit 150 TND à la société (les fournitures non justifiées par un document).

## Test manuel

Pour tester la fonctionnalité:

1. Créer un décaissement pour un intervenant
2. Ajouter une justification avec catégorie "Retour caisse"
3. Vérifier qu'un mouvement ENTRÉE a été créé dans la liste des mouvements
4. Vérifier que le solde de l'intervenant est correctement calculé

## Notes techniques

- Le mouvement ENTRÉE est créé avec modalité "ESPECES" (cash)
- La catégorie du mouvement est "AUTRES"
- La référence par défaut est "Retour caisse - [ID décaissement]"
- Le mouvement est lié à l'intervenant du décaissement

## Améliorations futures possibles

1. Ajouter une relation explicite entre la justification CASH_RETURN et le mouvement ENTRÉE créé
2. Permettre de supprimer une justification CASH_RETURN et supprimer automatiquement le mouvement ENTRÉE associé
3. Ajouter des statistiques sur les retours de caisse dans le dashboard
4. Créer un rapport de réconciliation quotidienne de caisse
