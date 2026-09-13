import { redirect } from "next/navigation";

/**
 * Leaderboard has been removed.
 * Redirect old bookmarks/links to the home page.
 */
export default function LeaderboardPage() {
  redirect("/home");
}
