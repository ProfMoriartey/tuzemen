"use server";

import { db } from "../../server/db";
import { fabrics, fabricVariants } from "../../server/db/schema";
import { fabricSchema, type FabricFormInput, type VariantFormInput } from "../../lib/types";
import { revalidatePath } from "next/cache";
import { eq, and, notInArray, desc } from "drizzle-orm"; // Added desc for ordering

// ===================================
// --- 1. CREATE FABRIC ACTION ---
// ===================================

/**
 * Server Action to create a new Fabric design and its associated Variants in a single transaction.
 */
export async function createFabric(formData: FabricFormInput) {
  const validation = fabricSchema.safeParse(formData);

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return {
      success: false,
      message: "Validation failed. Please check the form data.",
      errors: errors,
    };
  }

  const { variants, ...fabricData } = validation.data;

  try {
    await db.transaction(async (tx) => {
      // Insert the main Fabric record
      const [newFabric] = await tx.insert(fabrics).values({
        ...fabricData,
      }).returning({ id: fabrics.id });

      const fabricId = newFabric?.id;

      if (!fabricId) {
        tx.rollback(); 
        throw new Error("Failed to retrieve new fabric ID after insertion.");
      }

      // Prepare and insert Fabric Variants
      const variantInserts = variants.map((variant) => ({
        ...variant,
        fabricId: fabricId,
        stockQuantity: Number(variant.stockQuantity), 
      }));

      await tx.insert(fabricVariants).values(variantInserts);

    });

    revalidatePath("/fabrics");
    
    return {
      success: true,
      message: `Successfully created Fabric: ${fabricData.name} (${fabricData.externalId}) with ${variants.length} variants.`,
    };

  } catch (error) {
    // Check for duplicate key error (Postgres error code 23505 for unique violation)
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
       return {
            success: false,
            message: `A fabric with the External ID '${fabricData.externalId}' already exists.`,
            error: "Duplicate key violation.",
        };
    }

    console.error("Database Transaction Error:", error);
    return {
      success: false,
      message: `Failed to create fabric due to a database error.`,
      error: error instanceof Error ? error.message : "An unknown error occurred.",
    };
  }
}

// ===================================
// --- 2. READ ACTIONS ---
// ===================================

/**
 * Server Action to fetch all fabrics along with their associated variants.
 */
export async function getFabrics() {
    const fabricList = await db.query.fabrics.findMany({
        orderBy: (fabrics) => [desc(fabrics.createdAt)],
        with: {
            variants: {
                orderBy: (variants, { asc }) => [asc(variants.variantCode)],
            }
        },
    });
    return fabricList;
}

/**
 * Server Action to fetch a single fabric record for pre-filling an edit form.
 */
export async function getFabricForEdit(id: number) {
    const fabric = await db.query.fabrics.findFirst({
        where: eq(fabrics.id, id),
        with: {
            variants: true,
        },
    });
    return fabric;
}

// ===================================
// --- 3. UPDATE FABRIC ACTION ---
// ===================================

/**
 * Server Action to update an existing Fabric design and manage its Variants.
 */
export async function updateFabric(fabricId: number, formData: FabricFormInput) {
    // 1. Input Validation using Zod
    const validation = fabricSchema.safeParse(formData);

    if (!validation.success) {
        const errors = validation.error.flatten().fieldErrors;
        return {
            success: false,
            message: "Validation failed. Please check the form data.",
            errors: errors,
        };
    }

    const { variants, ...fabricData } = validation.data;

    try {
        await db.transaction(async (tx) => {
            // 2. Update the main Fabric record
            await tx.update(fabrics)
                .set(fabricData)
                .where(eq(fabrics.id, fabricId));

            // 3. Separate variants: existing (with ID) vs. new (no ID)
            const existingVariants = variants.filter(v => typeof v.id === 'number');
            const newVariants = variants.filter(v => typeof v.id !== 'number');

            // 4. Handle Existing Variants (Update)
            for (const variant of existingVariants) {
                const updateData = {
                    variantCode: variant.variantCode,
                    variantName: variant.variantName,
                    variantImage: variant.variantImage,
                    stockQuantity: variant.stockQuantity,
                    hexColorCode: variant.hexColorCode,
                };

                await tx.update(fabricVariants)
                    .set(updateData)
                    .where(eq(fabricVariants.id, variant.id as number)); // Cast added for type safety
            }

            // 5. Handle New Variants (Insert)
            if (newVariants.length > 0) {
                const variantInserts = newVariants.map((variant) => ({
                    ...variant,
                    fabricId: fabricId,
                    stockQuantity: Number(variant.stockQuantity),
                }));
                await tx.insert(fabricVariants).values(variantInserts);
            }

            // 6. Handle Deleted/Cleared Variants (Delete rows whose IDs were NOT in the submitted list)
            const variantIdsToKeep = existingVariants.map(v => v.id as number);

            // Delete variants for this fabric whose IDs are NOT in the 'keep' list
            await tx.delete(fabricVariants).where(
                and(
                    eq(fabricVariants.fabricId, fabricId),
                    // If variantIdsToKeep is empty, delete all variants for this fabric
                    variantIdsToKeep.length > 0 ? notInArray(fabricVariants.id, variantIdsToKeep) : eq(fabricVariants.fabricId, fabricId)
                )
            );

        });

        revalidatePath("/fabrics"); 
        return {
            success: true,
            message: `Successfully updated Fabric: ${fabricData.name}.`,
        };

    } catch (error) {
        console.error("Database Transaction Error:", error);
        
        // Custom check for duplicate key violation
        if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
            const detail = (error as { detail?: string }).detail;
            const match = detail ? detail.match(/Key \(fabric_id, variant_code\)=\(.*, (.*)\) already exists./) : null;
            const duplicateCode = match ? match[1] : 'an existing variant code';
            return {
                success: false,
                message: `Failed to update: Variant code '${duplicateCode}' is already used by another variant in this fabric. Variant codes must be unique per fabric design.`,
                error: "Duplicate key violation.",
            };
        }
        
        return {
            success: false,
            message: `Failed to update fabric due to a database error.`,
            error: error instanceof Error ? error.message : "An unknown error occurred.",
        };
    }
}

// ===================================
// --- 4. DELETE FABRIC ACTION ---
// ===================================

/**
 * Server Action to delete a fabric and all its variants (due to onDelete: 'cascade').
 */
export async function deleteFabric(id: number) {
    try {
        await db.delete(fabrics).where(eq(fabrics.id, id));
        revalidatePath("/fabrics");
        return { success: true, message: "Fabric successfully deleted." };
    } catch (error) {
        console.error("Delete Error:", error);
        return { success: false, message: "Failed to delete fabric." };
    }
}