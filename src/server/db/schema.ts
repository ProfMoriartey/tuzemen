import { pgTable, serial, text, integer, boolean, numeric, uniqueIndex, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// --- Main Fabric Design Table ---
export const fabrics = pgTable('fabrics', {
  // Primary key (internal database ID)
  id: serial('id').primaryKey(),

  // The external/product code (e.g., 'TZM0151')
  externalId: text('external_id').notNull().unique(), 

  // Fabric Name (e.g., 'accent')
  name: text('name').notNull(),

  // Base image filename (e.g., 'ACCENT.jpg'). Stored as a string for Uploadthing reference.
  baseImage: text('base_image').notNull(), 

  // Composition string (e.g., '%100_PES')
  composition: text('composition').notNull(),

  // Physical properties
  widthCm: integer('width_cm').notNull(),
  weightGsm: integer('weight_gsm').notNull(),
  
  // Boolean Flags (Product Features)
  isNormal: boolean('is_normal').default(false).notNull(),
  isSensitiveClean: boolean('is_sensitive_clean').default(false).notNull(),
  isDryClean: boolean('is_dry_clean').default(false).notNull(),
  
  isSemiTransparant: boolean('is_semi_transparant').default(false).notNull(),
  isTransparent: boolean('is_transparent').default(false).notNull(),
  isDrapery: boolean('is_drapery').default(false).notNull(),
  isBlackout: boolean('is_blackout').default(false).notNull(),
  hasLeadband: boolean('has_leadband').default(false).notNull(),

  // Boolean Flags (Type/Weave)
  isPlainKnit: boolean('is_plain_knit').default(false).notNull(),
  isJacquardKnit: boolean('is_jacquard_knit').default(false).notNull(),
  isPlainTulle: boolean('is_plain_tulle').default(false).notNull(),
  isJacquardTulle: boolean('is_jacquard_tulle').default(false).notNull(),
  isPlainBase: boolean('is_plain_base').default(false).notNull(),
  isJacquardBase: boolean('is_jacquard_base').default(false).notNull(),
  isKnit: boolean('is_knit').default(false).notNull(),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    nameIdx: uniqueIndex('name_idx').on(table.name),
  };
});

// --- Fabric Variants Table (Colors, Patterns, etc.) ---
export const fabricVariants = pgTable('fabric_variants', {
  id: serial('id').primaryKey(),
  
  // Foreign key linking to the main fabric design
  fabricId: integer('fabric_id')
    .references(() => fabrics.id, { onDelete: 'cascade' })
    .notNull(),
    
  // A unique identifier for the variant, often a color code or internal SKU
  variantCode: text('variant_code').notNull(), 
  
  // Variant name/color description (e.g., 'Ivory', 'Ocean Blue')
  variantName: text('variant_name').notNull(), 
  
  // Image filename for this specific variant (e.g., 'ACCENT_BLUE_01.jpg')
  variantImage: text('variant_image').notNull(), 

  // Optional fields for tracking
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  hexColorCode: text('hex_color_code'), // e.g., '#F0F8FF'
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    // Ensure that for a single fabric, variant codes are unique
    uniqueVariantPerFabric: uniqueIndex('unique_variant_per_fabric').on(table.fabricId, table.variantCode),
  };
});

// --- Defining Relations for Drizzle ORM ---
export const fabricRelations = relations(fabrics, ({ many }) => ({
  variants: many(fabricVariants),
}));

export const fabricVariantRelations = relations(fabricVariants, ({ one }) => ({
  fabric: one(fabrics, {
    fields: [fabricVariants.fabricId],
    references: [fabrics.id],
  }),
}));

// --- Type Definitions for Drizzle (useful for Next.js Server Actions) ---
export type Fabric = InferSelectModel<typeof fabrics>;
export type NewFabric = InferInsertModel<typeof fabrics>;

export type FabricVariant = InferSelectModel<typeof fabricVariants>;
export type NewFabricVariant = InferInsertModel<typeof fabricVariants>;
