import { z } from "zod";

// Login validation schema
export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

// User management validation schemas
export const createUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["ADMIN", "USER"], {
        errorMap: () => ({ message: "Role must be either ADMIN or USER" }),
    }),
});

export const updateUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email address").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    role: z.enum(["ADMIN", "USER"], {
        errorMap: () => ({ message: "Role must be either ADMIN or USER" }),
    }).optional(),
    active: z.boolean().optional(),
});

// Intervenant management validation schemas
export const createIntervenantSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    type: z.enum(["CLIENT", "FOURNISSEUR", "ASSOCIE", "CAISSE_BANQUE", "AUTRE"], {
        errorMap: () => ({ message: "Invalid intervenant type" }),
    }),
});

export const updateIntervenantSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    type: z.enum(["CLIENT", "FOURNISSEUR", "ASSOCIE", "CAISSE_BANQUE", "AUTRE"], {
        errorMap: () => ({ message: "Invalid intervenant type" }),
    }).optional(),
    active: z.boolean().optional(),
});

// Mouvement management validation schemas
export const createMouvementSchema = z.object({
    date: z.string().datetime("Invalid date format"),
    intervenantId: z.string().min(1, "Intervenant ID is required"),
    type: z.enum(["ENTREE", "SORTIE"], {
        errorMap: () => ({ message: "Type must be either ENTREE or SORTIE" }),
    }),
    amount: z.number().positive("Amount must be greater than 0"),
    reference: z.string().optional(),
    modality: z.enum(["ESPECES", "CHEQUE", "VIREMENT", "AUTRE"], {
        errorMap: () => ({ message: "Invalid modality" }),
    }).optional(),
    category: z.string().optional(),
    note: z.string().optional(),
});

// Mouvement filters validation schema
export const mouvementFiltersSchema = z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    intervenantId: z.string().optional(),
    type: z.enum(["ENTREE", "SORTIE"]).optional(),
});

// Type exports for TypeScript inference
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateIntervenantInput = z.infer<typeof createIntervenantSchema>;
export type UpdateIntervenantInput = z.infer<typeof updateIntervenantSchema>;
export type CreateMouvementInput = z.infer<typeof createMouvementSchema>;
export type MouvementFiltersInput = z.infer<typeof mouvementFiltersSchema>;
