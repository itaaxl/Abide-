import { redirect } from "next/navigation";

/** Old daily-verse date links open that day's verse as the first card. */
export default async function DailyDatePage({ params }: PageProps<"/daily/[date]">) {
  const { date } = await params;
  redirect(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `/flashcards?date=${date}` : "/flashcards");
}
