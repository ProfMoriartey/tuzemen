"use server";

import { db } from "../../server/db";
import { fabrics, fabricVariants } from "../../server/db/schema";
import { fabricSchema, type FabricFormInput } from "../../lib/types";
import { revalidatePath } from "next/cache";

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