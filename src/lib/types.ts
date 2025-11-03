import { z } from "zod";

/**
 * Zod Schema for a single Fabric Variant (Color/Pattern)
 */
export const variantSchema = z.object({
  // *** ADDED: ID is optional for form input (required for updates, absent for inserts) ***
  id: z.number().int().optional(), 
  variantCode: z.string().min(1, "Variant Code is required."),
  variantName: z.string().min(1, "Variant Name is required."),
  variantImage: z.string().min(1, "Variant Image URL is required."),
  stockQuantity: z.number().int().min(0).default(0),
  hexColorCode: z.string().nullable().optional(),
});

/**
 * Zod Schema for the main Fabric creation form (remains unchanged)
 */
export const fabricSchema = z.object({
  externalId: z.string().min(3, "External ID is required (e.g., TZM0151)."),
  name: z.string().min(1, "Fabric Name is required."),
  baseImage: z.string().min(1, "Base Image URL is required (Uploadthing)."), 
  composition: z.string().min(1, "Composition is required (e.g., %100 PES)."),
  widthCm: z.coerce.number().int().min(50, "Width must be at least 50 cm."),
  weightGsm: z.coerce.number().int().min(10, "Weight must be at least 10 gsm."),
  isNormal: z.boolean().default(false),
  isSensitiveClean: z.boolean().default(false),
  isDryClean: z.boolean().default(false),
  isSemiTransparant: z.boolean().default(false),
  isTransparent: z.boolean().default(false),
  isDrapery: z.boolean().default(false),
  isBlackout: z.boolean().default(false),
  hasLeadband: z.boolean().default(false),
  isPlainKnit: z.boolean().default(false),
  isJacquardKnit: z.boolean().default(false),
  isPlainTulle: z.boolean().default(false),
  isJacquardTulle: z.boolean().default(false),
  isPlainBase: z.boolean().default(false),
  isJacquardBase: z.boolean().default(false),
  isKnit: z.boolean().default(false),
  variants: z.array(variantSchema).min(1, "At least one variant must be added."),
});

// --- Type Definitions for Drizzle (updated to reflect Zod schema change) ---
export type FabricFormInput = z.infer<typeof fabricSchema>;
export type VariantFormInput = z.infer<typeof variantSchema>; 
