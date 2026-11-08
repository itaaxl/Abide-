import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Plain GET form: works without JavaScript and keeps search state in the URL. */
export function SearchBar({
  t,
  edition,
  defaultValue = "",
  large = false,
}: {
  t: Dictionary["search"];
  edition: string;
  defaultValue?: string;
  large?: boolean;
}) {
  return (
    <form role="search" action="/search" method="get" className="w-full">
      <label htmlFor="q" className="sr-only">
        {t.label}
      </label>
      <div className={`flex items-center gap-2 rounded-full border border-rule bg-surface ps-5 pe-1.5 shadow-sm focus-within:border-focus ${large ? "py-1.5" : "py-1"}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="shrink-0 text-muted">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={t.placeholder}
          maxLength={200}
          autoComplete="off"
          enterKeyHint="search"
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted ${large ? "py-2 text-lg" : "py-1.5"}`}
        />
        <input type="hidden" name="edition" value={edition} />
        <button className="btn btn-primary btn-sm">{t.submit}</button>
      </div>
    </form>
  );
}
