import { z } from "zod";

/**
 * Zod Schema for a single Fabric Variant (Color/Pattern)
 */
export const variantSchema = z.object({
  variantCode: z.string().min(1, "Variant Code is required."),
  variantName: z.string().min(1, "Variant Name is required."),
  variantImage: z.string().min(1, "Variant Image URL is required."),
  stockQuantity: z.number().int().min(0).default(0),
  hexColorCode: z.string().nullable().optional(),
});

/**
 * Zod Schema for the main Fabric creation form
 */
export const fabricSchema = z.object({
  // Core Identifiers
  externalId: z.string().min(3, "External ID is required (e.g., TZM0151)."),
  name: z.string().min(1, "Fabric Name is required."),
  
  // Image & Composition
  baseImage: z.string().min(1, "Base Image URL is required (Uploadthing)."), 
  composition: z.string().min(1, "Composition is required (e.g., %100 PES)."),

  // Physical Properties
  widthCm: z.coerce.number().int().min(50, "Width must be at least 50 cm."),
  weightGsm: z.coerce.number().int().min(10, "Weight must be at least 10 gsm."),
  
  // Features (Booleans, defaulted to false if not present in form data)
  isNormal: z.boolean().default(false),
  isSensitiveClean: z.boolean().default(false),
  isDryClean: z.boolean().default(false),
  isSemiTransparant: z.boolean().default(false),
  isTransparent: z.boolean().default(false),
  isDrapery: z.boolean().default(false),
  isBlackout: z.boolean().default(false),
  hasLeadband: z.boolean().default(false),

  // Weave/Type (Booleans, defaulted to false)
  isPlainKnit: z.boolean().default(false),
  isJacquardKnit: z.boolean().default(false),
  isPlainTulle: z.boolean().default(false),
  isJacquardTulle: z.boolean().default(false),
  isPlainBase: z.boolean().default(false),
  isJacquardBase: z.boolean().default(false),
  isKnit: z.boolean().default(false),
  
  // Variants (Array of variantSchema)
  variants: z.array(variantSchema).min(1, "At least one variant must be added."),
});

export type FabricFormInput = z.infer<typeof fabricSchema>;
export type VariantFormInput = z.infer<typeof variantSchema>;
