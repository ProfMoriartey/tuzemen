"use server";

import { db } from "../../server/db";
import { fabrics } from "../../server/db/schema";
import { eq, desc } from "drizzle-orm";

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