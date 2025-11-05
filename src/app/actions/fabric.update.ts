"use server";

import { db } from "../../server/db";
import { fabrics, fabricVariants } from "../../server/db/schema";
import { coreFabricSchema, type FabricFormInput } from "../../lib/types";
import { revalidatePath } from "next/cache";
import { eq, and, notInArray } from "drizzle-orm";

/**
 * Server Action to update an existing Fabric design (Core Details or Variants).
 * This function handles both core data update and variant array update depending on payload.
 */
export async function updateFabric(fabricId: number, formData: FabricFormInput) {
    // 1. Input Validation: Use coreFabricSchema as variants are optional/managed separately
    const validation = coreFabricSchema.safeParse(formData);
    
    if (!validation.success) {
        const errors = validation.error.flatten().fieldErrors;
        return {
            success: false,
            message: "Validation failed on core fields. Please check the form data.",
            errors: errors,
        };
    }

    // Since we omit 'variants' in coreFabricSchema, validation.data only contains core fields
    const dataToUpdate = validation.data;
    
    // Check if variants were explicitly passed (only happens in VariantManagerDialog)
    const variants = (formData as any).variants; 

    try {
        await db.transaction(async (tx) => {
            // 2. Update the main Fabric core record
            await tx.update(fabrics)
                .set(dataToUpdate)
                .where(eq(fabrics.id, fabricId));

            // 3. Handle Variants (Only runs if variants array is explicitly passed from VariantManager)
            if (Array.isArray(variants)) {
                // Separate variants: existing (with ID) vs. new (no ID)
                const existingVariants = variants.filter(v => v.id);
                const newVariants = variants.filter(v => !v.id);

                // Update Existing Variants
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
                        .where(eq(fabricVariants.id, variant.id!));
                }

                // Insert New Variants
                if (newVariants.length > 0) {
                    const variantInserts = newVariants.map((variant) => ({
                        ...variant,
                        fabricId: fabricId,
                        stockQuantity: Number(variant.stockQuantity),
                    }));
                    await tx.insert(fabricVariants).values(variantInserts);
                }

                // Delete Cleared Variants
                const variantIdsToKeep = existingVariants.map(v => v.id!);
                await tx.delete(fabricVariants).where(
                    and(
                        eq(fabricVariants.fabricId, fabricId),
                        variantIdsToKeep.length > 0 ? notInArray(fabricVariants.id, variantIdsToKeep) : eq(fabricVariants.fabricId, fabricId)
                    )
                );
            }
        });

        revalidatePath("/fabrics"); 
        return {
            success: true,
            message: `Successfully updated Fabric: ${dataToUpdate.name || 'Details'}.`,
        };

    } catch (error) {
        console.error("Database Transaction Error:", error);
        
        if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
            const detail = (error as { detail?: string }).detail;
            const regex = /Key \(fabric_id, variant_code\)=\(.*, (.*)\) already exists./;
            const match = detail ? regex.exec(detail) : null;
            const duplicateCode = match ? match[1] : 'an existing variant code';
            
            return {
                success: false,
                message: `Failed to update: Variant code '${duplicateCode}' is already used by another variant in this fabric.`,
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