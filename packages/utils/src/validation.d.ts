import { z } from 'zod';
export declare const RecipeSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    ingredients: z.ZodArray<z.ZodString, "many">;
    instructions: z.ZodArray<z.ZodString, "many">;
    prepTime: z.ZodNumber;
    cookTime: z.ZodNumber;
    servings: z.ZodNumber;
    difficulty: z.ZodDefault<z.ZodEnum<["easy", "medium", "hard"]>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    imageUrl: z.ZodOptional<z.ZodString>;
    nutrition: z.ZodOptional<z.ZodObject<{
        calories: z.ZodOptional<z.ZodNumber>;
        protein: z.ZodOptional<z.ZodNumber>;
        carbs: z.ZodOptional<z.ZodNumber>;
        fat: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        calories?: number | undefined;
        protein?: number | undefined;
        carbs?: number | undefined;
        fat?: number | undefined;
    }, {
        calories?: number | undefined;
        protein?: number | undefined;
        carbs?: number | undefined;
        fat?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    ingredients: string[];
    tags: string[];
    instructions: string[];
    prepTime: number;
    cookTime: number;
    servings: number;
    difficulty: "easy" | "medium" | "hard";
    description?: string | undefined;
    imageUrl?: string | undefined;
    nutrition?: {
        calories?: number | undefined;
        protein?: number | undefined;
        carbs?: number | undefined;
        fat?: number | undefined;
    } | undefined;
}, {
    title: string;
    ingredients: string[];
    instructions: string[];
    prepTime: number;
    cookTime: number;
    servings: number;
    tags?: string[] | undefined;
    description?: string | undefined;
    difficulty?: "easy" | "medium" | "hard" | undefined;
    imageUrl?: string | undefined;
    nutrition?: {
        calories?: number | undefined;
        protein?: number | undefined;
        carbs?: number | undefined;
        fat?: number | undefined;
    } | undefined;
}>;
export declare const PantryItemSchema: z.ZodObject<{
    id: z.ZodString;
    ingredient: z.ZodString;
    quantity: z.ZodNumber;
    unit: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    expiryDate: z.ZodOptional<z.ZodDate>;
    addedAt: z.ZodDefault<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    ingredient: string;
    quantity: number;
    addedAt: Date;
    unit?: string | undefined;
    category?: string | undefined;
    expiryDate?: Date | undefined;
}, {
    id: string;
    ingredient: string;
    quantity: number;
    unit?: string | undefined;
    category?: string | undefined;
    expiryDate?: Date | undefined;
    addedAt?: Date | undefined;
}>;
export declare const UserPreferencesSchema: z.ZodObject<{
    dietaryRestrictions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    allergies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    cuisinePreferences: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    spiceLevel: z.ZodDefault<z.ZodEnum<["mild", "medium", "hot"]>>;
    cookingSkill: z.ZodDefault<z.ZodEnum<["beginner", "intermediate", "advanced"]>>;
}, "strip", z.ZodTypeAny, {
    dietaryRestrictions: string[];
    allergies: string[];
    cuisinePreferences: string[];
    spiceLevel: "medium" | "mild" | "hot";
    cookingSkill: "beginner" | "intermediate" | "advanced";
}, {
    dietaryRestrictions?: string[] | undefined;
    allergies?: string[] | undefined;
    cuisinePreferences?: string[] | undefined;
    spiceLevel?: "medium" | "mild" | "hot" | undefined;
    cookingSkill?: "beginner" | "intermediate" | "advanced" | undefined;
}>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type PantryItem = z.infer<typeof PantryItemSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
//# sourceMappingURL=validation.d.ts.map