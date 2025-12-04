# Custom Categories - Quick Start Guide

## For Administrators

### Initial Setup

If you're setting up a new tenant or the categories haven't been initialized yet:

```bash
npx tsx scripts/seed-default-categories.ts
```

This creates the 7 default categories for all tenants.

### Managing Categories

1. **Access the Categories Page**

   - Log in as an admin
   - Navigate to "Catégories" in the menu

2. **Create a Custom Category**

   - Click "Ajouter une catégorie"
   - Enter a code (e.g., `MARKETING`)
     - Must be uppercase letters, numbers, and underscores only
     - Must be unique for your organization
   - Enter a label (e.g., `Marketing`)
   - Click "Ajouter"

3. **Edit a Category**

   - Click "Modifier" next to any category
   - Update the label
   - Click "Modifier" to save
   - Note: You cannot change the code after creation

4. **Deactivate a Category**

   - Click "Désactiver" next to an active category
   - The category will no longer appear in the movement form
   - Existing movements keep their category

5. **Reactivate a Category**

   - Click "Activer" next to an inactive category
   - The category will appear again in the movement form

6. **Delete a Custom Category**
   - Click "Supprimer" next to a custom category
   - Confirm the deletion
   - Note: You cannot delete:
     - Default categories
     - Categories that are used by any movements

## For All Users

### Using Categories in Movements

1. **Add a Movement with Category**

   - Click "Ajouter un mouvement"
   - Fill in the required fields (date, intervenant, type, amount)
   - Select a category from the dropdown (optional)
   - Click "Ajouter"

2. **Filter Movements by Category**

   - Go to the Mouvements page
   - Use the "Catégorie" filter dropdown
   - Select a category to see only movements in that category
   - Combine with other filters (date, type, etc.)

3. **View Movement Categories**
   - Categories appear in the movements table
   - On mobile, categories show in the card details
   - If no category is set, "-" is displayed

## Default Categories

Every tenant starts with these 7 categories:

| Code             | Label            |
| ---------------- | ---------------- |
| SALAIRES         | Salaires         |
| ACHATS_STOCK     | Achats de stock  |
| FRAIS_GENERAUX   | Frais généraux   |
| AVANCES_ASSOCIES | Avances associés |
| VENTES           | Ventes           |
| CHARGES_FIXES    | Charges fixes    |
| AUTRES           | Autres           |

## Common Use Cases

### Example: Adding Marketing Category

```
Code: MARKETING
Label: Marketing & Communication
```

### Example: Adding R&D Category

```
Code: RD
Label: Recherche & Développement
```

### Example: Adding IT Category

```
Code: IT
Label: Informatique
```

## Tips

- **Use descriptive codes**: Make codes easy to understand (e.g., `MARKETING` not `MKT`)
- **Keep labels clear**: Use full names for better readability
- **Don't delete categories**: Deactivate instead if you might need them later
- **Plan your categories**: Think about reporting needs before creating many categories
- **Use sort order**: Categories appear in the order you set (lower numbers first)

## Troubleshooting

### "A category with this code already exists"

- Each code must be unique within your organization
- Try a different code or check if the category already exists

### "Cannot delete category. It is used by X movement(s)"

- The category is being used by movements
- You can deactivate it instead of deleting it
- Or reassign the movements to a different category first

### "Accès réservé aux administrateurs"

- Only admins can manage categories
- Contact your administrator to create or modify categories

### Categories not showing in movement form

- Check if the category is active
- Refresh the page
- Verify you're logged in to the correct tenant

## Testing

To verify the feature is working correctly:

```bash
# Run the E2E test suite
npx tsx scripts/test-custom-categories-e2e.ts
```

This runs 16 comprehensive tests covering all functionality.

## API Reference

For developers integrating with the API:

### Get all categories

```
GET /api/categories
Authorization: Bearer <token>
```

### Create category (Admin)

```
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "MARKETING",
  "label": "Marketing",
  "sortOrder": 10
}
```

### Update category (Admin)

```
PATCH /api/categories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "Marketing & Communication",
  "active": true
}
```

### Delete category (Admin)

```
DELETE /api/categories/:id
Authorization: Bearer <token>
```

## Support

For issues or questions:

1. Check this guide first
2. Review the full documentation in `IMPLEMENTATION.md`
3. Contact your system administrator
4. Check the test suite for examples
