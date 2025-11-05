"use server";

import { db } from "../../server/db";
import { fabrics } from "../../server/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

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