import { getFabrics } from "../app/actions/actions";

/**
 * Server-side function to fetch fabric data.
 * Keeps the heavy data fetching on the server.
 */
export async function fetchFabricData() {
    return await getFabrics();
}