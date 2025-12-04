# Référence des couleurs des catégories

## Palette de couleurs par défaut

### Catégories de dépenses

#### 🟢 SALAIRES - #10B981 (Vert Émeraude)

- **Usage**: Salaires et rémunérations du personnel
- **RGB**: rgb(16, 185, 129)
- **Signification**: Croissance, stabilité, ressources humaines

#### 🟠 ACHATS_STOCK - #F59E0B (Ambre)

- **Usage**: Achats de marchandises et stock
- **RGB**: rgb(245, 158, 11)
- **Signification**: Investissement, valeur, inventaire

#### 🔵 FRAIS_GENERAUX - #6366F1 (Indigo)

- **Usage**: Frais généraux et dépenses courantes
- **RGB**: rgb(99, 102, 241)
- **Signification**: Opérations quotidiennes, routine

#### 🔴 AVANCES_ASSOCIES - #EC4899 (Rose)

- **Usage**: Avances données aux associés
- **RGB**: rgb(236, 72, 153)
- **Signification**: Relations, partenariat, prêts

#### 🔴 CHARGES_FIXES - #EF4444 (Rouge)

- **Usage**: Charges fixes et récurrentes
- **RGB**: rgb(239, 68, 68)
- **Signification**: Obligations, dépenses obligatoires

### Catégories de revenus

#### 🟦 VENTES - #14B8A6 (Turquoise)

- **Usage**: Ventes et revenus
- **RGB**: rgb(20, 184, 166)
- **Signification**: Revenus, succès, croissance

### Catégorie générique

#### ⚫ AUTRES - #6B7280 (Gris)

- **Usage**: Transactions non catégorisées
- **RGB**: rgb(107, 114, 128)
- **Signification**: Neutre, divers, non classifié

## Guide de sélection des couleurs

### Principes

1. **Contraste**: Choisir des couleurs avec un bon contraste pour la lisibilité
2. **Distinction**: Éviter les couleurs trop similaires entre catégories
3. **Signification**: Associer la couleur à la nature de la catégorie
4. **Accessibilité**: Considérer les utilisateurs daltoniens

### Recommandations par type

#### Dépenses

- Rouge, Orange, Ambre: Sorties d'argent
- Rose, Magenta: Relations, prêts

#### Revenus

- Vert, Turquoise, Bleu clair: Entrées d'argent

#### Opérations

- Bleu, Indigo, Violet: Opérations courantes

#### Neutre

- Gris: Non catégorisé ou divers

## Format technique

### Format requis

- **Type**: Hexadécimal
- **Format**: #RRGGBB
- **Exemple**: #10B981

### Validation

- Doit commencer par #
- Suivi de 6 caractères hexadécimaux (0-9, A-F)
- Insensible à la casse (accepte a-f et A-F)

### Exemples valides

```
#FF0000  ✅ Rouge
#00FF00  ✅ Vert
#0000FF  ✅ Bleu
#123ABC  ✅ Bleu personnalisé
#ffffff  ✅ Blanc (minuscules acceptées)
```

### Exemples invalides

```
FF0000   ❌ Manque le #
#FFF     ❌ Trop court (doit être 6 caractères)
#GGGGGG  ❌ Caractères invalides (G n'est pas hexadécimal)
rgb(255,0,0) ❌ Format RGB non supporté
```

## Outils de sélection

### Dans l'application

1. **Sélecteur visuel**: Input de type color pour choisir visuellement
2. **Input texte**: Saisie manuelle du code hexadécimal
3. **Synchronisation**: Les deux inputs sont synchronisés

### Outils externes recommandés

- [Coolors.co](https://coolors.co/) - Générateur de palettes
- [Adobe Color](https://color.adobe.com/) - Roue chromatique
- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - Vérification du contraste

## Affichage dans l'application

### Badges de catégorie

- **Fond**: Couleur avec 20% d'opacité (rgba)
- **Bordure**: Couleur pleine (1px)
- **Texte**: Couleur pleine
- **Forme**: Arrondie (rounded-full)

### Exemple de rendu

```
Fond: rgba(16, 185, 129, 0.2)  // Vert avec 20% opacité
Bordure: #10B981                // Vert plein
Texte: #10B981                  // Vert plein
```

## Personnalisation

### Pour créer une nouvelle catégorie

1. Choisir une couleur qui n'est pas déjà utilisée
2. S'assurer qu'elle est distincte des autres
3. Vérifier le contraste avec le fond blanc
4. Tester sur mobile et desktop

### Suggestions de couleurs disponibles

#### Couleurs chaudes

- #F97316 (Orange vif)
- #FB923C (Orange clair)
- #FBBF24 (Jaune)

#### Couleurs froides

- #3B82F6 (Bleu)
- #8B5CF6 (Violet)
- #06B6D4 (Cyan)

#### Couleurs neutres

- #64748B (Gris ardoise)
- #78716C (Gris pierre)
- #57534E (Gris chaud)

## Accessibilité

### Considérations

- Les couleurs ne doivent pas être le seul moyen d'identification
- Le libellé de la catégorie est toujours affiché
- Bon contraste entre la couleur et le fond

### Daltonisme

Les couleurs choisies par défaut sont distinguables pour la plupart des types de daltonisme :

- Protanopie (rouge-vert)
- Deutéranopie (rouge-vert)
- Tritanopie (bleu-jaune)

## Migration

### Catégories existantes sans couleur

- Affichent automatiquement le gris par défaut (#6B7280)
- Peuvent être mises à jour via l'interface de gestion
- Script de migration disponible: `update-category-colors.ts`

### Mise à jour en masse

```bash
npx tsx scripts/update-category-colors.ts
```

Ce script met à jour toutes les catégories par défaut avec leurs couleurs respectives.
