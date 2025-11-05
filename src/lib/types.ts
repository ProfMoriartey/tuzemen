import { z } from "zod";

/**
 * Zod Schema for a single Fabric Variant (Color/Pattern)
 */
export const variantSchema = z.object({
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
  
  // These fields are defined with coerce for initial data ingestion
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

// FIX: Create a schema for UPDATE that makes the mandatory number fields optional.
export const coreFabricSchema = fabricSchema.omit({ variants: true }).extend({
  // Enforce required string fields using the original string schema
  externalId: z.string().min(3, "External ID is required."), 
  name: z.string().min(1, "Fabric Name is required."),
  composition: z.string().min(1, "Composition is required."),
  baseImage: z.string().min(1, "Base Image URL is required (Uploadthing)."), 
  
  // FIX: Override the coercive number fields to be standard numbers AND optional.
  // The client side (EditFabricForm) already coerces the value before submission.
  widthCm: z.number().int().min(50, "Width must be at least 50 cm.").optional(),
  weightGsm: z.number().int().min(10, "Weight must be at least 10 gsm.").optional(),
  
  // Make all boolean flags optional as well, just in case the form is incomplete
  isNormal: z.boolean().optional(),
  isSensitiveClean: z.boolean().optional(),
  isDryClean: z.boolean().optional(),
  isSemiTransparant: z.boolean().optional(),
  isTransparent: z.boolean().optional(),
  isDrapery: z.boolean().optional(),
  isBlackout: z.boolean().optional(),
  hasLeadband: z.boolean().optional(),
  isPlainKnit: z.boolean().optional(),
  isJacquardKnit: z.boolean().optional(),
  isPlainTulle: z.boolean().optional(),
  isJacquardTulle: z.boolean().optional(),
  isPlainBase: z.boolean().optional(),
  isJacquardBase: z.boolean().optional(),
  isKnit: z.boolean().optional(),
});

export type CoreFabricFormInput = z.infer<typeof coreFabricSchema>;

// --- Type Definitions for Drizzle (updated to reflect Zod schema change) ---
export type FabricFormInput = z.infer<typeof fabricSchema>;
export type VariantFormInput = z.infer<typeof variantSchema>;