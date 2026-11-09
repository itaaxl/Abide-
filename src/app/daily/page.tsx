import { redirect } from "next/navigation";

/** Daily Verse now lives in Verses (Flashcards) as the first card. */
export default function DailyPage() {
  redirect("/flashcards");
}
