// "use server";

// import { db } from "../../server/db";
// import { fabrics, fabricVariants } from "../../server/db/schema";
// import { coreFabricSchema, fabricSchema, type FabricFormInput, type VariantFormInput } from "../../lib/types";
// import { revalidatePath } from "next/cache";
// import { eq, and, notInArray, desc } from "drizzle-orm"; // Added desc for ordering

// // ===================================
// // --- 1. CREATE FABRIC ACTION ---
// // ... (createFabric function remains unchanged) ...

// export async function createFabric(formData: FabricFormInput) {
//   const validation = fabricSchema.safeParse(formData);

//   if (!validation.success) {
//     const errors = validation.error.flatten().fieldErrors;
//     return {
//       success: false,
//       message: "Validation failed. Please check the form data.",
//       errors: errors,
//     };
//   }

//   const { variants, ...fabricData } = validation.data;

//   try {
//     await db.transaction(async (tx) => {
//       // Insert the main Fabric record
//       const [newFabric] = await tx.insert(fabrics).values({
//         ...fabricData,
//       }).returning({ id: fabrics.id });

//       const fabricId = newFabric?.id;

//       if (!fabricId) {
//         tx.rollback(); 
//         throw new Error("Failed to retrieve new fabric ID after insertion.");
//       }

//       // Prepare and insert Fabric Variants
//       const variantInserts = variants.map((variant) => ({
//         ...variant,
//         fabricId: fabricId,
//         stockQuantity: Number(variant.stockQuantity), 
//       }));

//       await tx.insert(fabricVariants).values(variantInserts);

//     });

//     revalidatePath("/fabrics");
    
//     return {
//       success: true,
//       message: `Successfully created Fabric: ${fabricData.name} (${fabricData.externalId}) with ${variants.length} variants.`,
//     };

//   } catch (error) {
//     // Check for duplicate key error (Postgres error code 23505 for unique violation)
//     if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
//        return {
//             success: false,
//             message: `A fabric with the External ID '${fabricData.externalId}' already exists.`,
//             error: "Duplicate key violation.",
//         };
//     }

//     console.error("Database Transaction Error:", error);
//     return {
//       success: false,
//       message: `Failed to create fabric due to a database error.`,
//       error: error instanceof Error ? error.message : "An unknown error occurred.",
//     };
//   }
// }

// // ===================================
// // --- 2. READ ACTIONS ---
// // ... (getFabrics and getFabricForEdit functions remain unchanged) ...

// export async function getFabrics() {
//     const fabricList = await db.query.fabrics.findMany({
//         orderBy: (fabrics) => [desc(fabrics.createdAt)],
//         with: {
//             variants: {
//                 orderBy: (variants, { asc }) => [asc(variants.variantCode)],
//             }
//         },
//     });
//     return fabricList;
// }

// export async function getFabricForEdit(id: number) {
//     const fabric = await db.query.fabrics.findFirst({
//         where: eq(fabrics.id, id),
//         with: {
//             variants: true,
//         },
//     });
//     return fabric;
// }

// // ===================================
// // --- 3. UPDATE FABRIC ACTION ---
// // ===================================

// export async function updateFabric(fabricId: number, formData: FabricFormInput) {
//     // 1. Input Validation
//     const validation = coreFabricSchema.safeParse(formData);
    
//     if (!validation.success) {
//         const errors = validation.error.flatten().fieldErrors;
//         return {
//             success: false,
//             message: "Validation failed. Please check the form data.",
//             errors: errors,
//         };
//     }

//  const dataToUpdate = validation.data; // This data now only contains core fabric fields
//     try {
//         await db.transaction(async (tx) => {
//             // 2. Update the main Fabric record
//             await tx.update(fabrics)
//                 .set(dataToUpdate) // Set only the core fields
//                 .where(eq(fabrics.id, fabricId));

//             // CRITICAL: Since we separated the forms, we SKIP all variant logic here.
//             // Variants are updated only via the VariantManagerDialog.
//         });

//         revalidatePath("/fabrics"); 
//         return {
//             success: true,
//             message: `Successfully updated Fabric: ${dataToUpdate.name}.`,
//         };

//     } catch (error) {
//         console.error("Database Transaction Error:", error);
        
//         // Custom check for duplicate key violation (23505)
//         if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
//             const detail = (error as { detail?: string }).detail;
//             const regex = /Key \(fabric_id, variant_code\)=\(.*, (.*)\) already exists./;
//             const match = detail ? regex.exec(detail) : null;
            
//             const duplicateCode = match ? match[1] : 'an existing variant code';
            
//             return {
//                 success: false,
//                 message: `Failed to update: Variant code '${duplicateCode}' is already used by another variant in this fabric. Please check for duplicates or conflicts in variant codes.`,
//                 error: "Duplicate key violation.",
//             };
//         }
        
//         return {
//             success: false,
//             message: `Failed to update fabric due to a database error.`,
//             error: error instanceof Error ? error.message : "An unknown error occurred.",
//         };
//     }
// }

// // ===================================
// // --- 4. DELETE FABRIC ACTION ---
// // ... (deleteFabric function remains unchanged) ...

// export async function deleteFabric(id: number) {
//     try {
//         await db.delete(fabrics).where(eq(fabrics.id, id));
//         revalidatePath("/fabrics");
//         return { success: true, message: "Fabric successfully deleted." };
//     } catch (error) {
//         console.error("Delete Error:", error);
//         return { success: false, message: "Failed to delete fabric." };
//     }
// }