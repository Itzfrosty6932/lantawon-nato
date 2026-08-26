import { redirect } from "next/navigation";

export default function DocumentariesPage() {
  redirect("/discover?genre=99");
}
