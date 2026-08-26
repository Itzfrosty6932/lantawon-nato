import { fetchTmdb } from "@/lib/api/tmdb";
import type { FranchiseCollection, PersonDetails } from "@/types/media";

export class GraphService {
  static async getPerson(id: string | number): Promise<PersonDetails | null> {
    return fetchTmdb<PersonDetails>(`person/${id}`, { append_to_response: "combined_credits" });
  }

  static async getCollection(id: string | number): Promise<FranchiseCollection | null> {
    const data = await fetchTmdb<FranchiseCollection>(`collection/${id}`);
    if (data && data.parts) {
      data.parts.sort((a, b) => {
        const yearA = (a.release_date || "").split("-")[0] || "9999";
        const yearB = (b.release_date || "").split("-")[0] || "9999";
        return parseInt(yearA, 10) - parseInt(yearB, 10);
      });
    }
    return data;
  }
}
