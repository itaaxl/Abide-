import type { ResolvedPassage } from "@/lib/bible/passage";

/** Exact Scripture rendered from the authoritative dataset, with its reference and edition. */
export function ScriptureQuote({ passage, size = "lg" }: { passage: ResolvedPassage; size?: "md" | "lg" }) {
  const multi = passage.verses.length > 1;
  return (
    <figure>
      <blockquote
        dir={passage.edition.direction}
        lang={passage.edition.language}
        className={`font-serif leading-relaxed ${size === "lg" ? "text-2xl sm:text-[1.7rem]" : "text-xl"}`}
      >
        {passage.verses.map((v) => (
          <span key={`${v.v}`}>
            {multi && <sup className="verse-num">{v.v}</sup>}
            {v.t}{" "}
          </span>
        ))}
      </blockquote>
      <figcaption className="mt-3 text-sm text-muted">
        — <span className="font-semibold text-gold">{passage.label}</span> · {passage.edition.abbreviation}
        {passage.mapping === "psalm-title-offset" && <span> · numbering adjusted for this edition’s Psalm titles</span>}
        {passage.fallbackFrom && <span> · shown in {passage.edition.name} because this passage’s numbering differs in the translation you selected</span>}
      </figcaption>
    </figure>
  );
}
