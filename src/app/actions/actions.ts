"use server";

// Use relative paths to resolve import errors
import { db } from "../../server/db";
import { fabrics, fabricVariants } from "../../server/db/schema";
import { fabricSchema, type FabricFormInput } from "../../lib/types";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

// --- CREATE FABRIC ACTION ---

/**
 * Server Action to create a new Fabric design and its associated Variants in a single transaction.
 * @param formData - The validated input data for the new fabric and its variants.
 * @returns A status message indicating success or failure.
 */
export async function createFabric(formData: FabricFormInput) {
  // 1. Input Validation using Zod
  const validation = fabricSchema.safeParse(formData);

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    console.error("Validation Error:", errors);
    return {
      success: false,
      message: "Validation failed. Please check the form data.",
      errors: errors,
    };
  }

  const { variants, ...fabricData } = validation.data;

  try {
    // 2. Start a Drizzle transaction for atomicity
    await db.transaction(async (tx) => {
      // 3. Insert the main Fabric record
      const [newFabric] = await tx.insert(fabrics).values({
        ...fabricData,
      }).returning({ id: fabrics.id });

      const fabricId = newFabric?.id;

      if (!fabricId) {
        tx.rollback(); 
        throw new Error("Failed to retrieve new fabric ID after insertion.");
      }

      // 4. Prepare and insert Fabric Variants
      const variantInserts = variants.map((variant) => ({
        ...variant,
        fabricId: fabricId,
        stockQuantity: Number(variant.stockQuantity), 
      }));

      await tx.insert(fabricVariants).values(variantInserts);

    });

    // 5. Success cleanup
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
      message: `Failed to create fabric due to a database error. Check server logs.`,
      error: error instanceof Error ? error.message : "An unknown error occurred.",
    };
  }
}


// --- READ FABRIC ACTION ---

/**
 * Server Action to fetch all fabrics along with their associated variants.
 * This is an async component data fetcher.
 * @returns An array of fabrics with embedded variants.
 */
export async function getFabrics() {
    // 1. Fetch fabrics and eagerly load variants using Drizzle's relations
    const fabricList = await db.query.fabrics.findMany({
        orderBy: (fabrics, { desc }) => [desc(fabrics.createdAt)],
        with: {
            variants: {
                orderBy: (variants, { asc }) => [asc(variants.variantCode)],
            }
        },
    });

    // 2. Return the structured list
    return fabricList;
}


// --- DELETE FABRIC ACTION ---

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
