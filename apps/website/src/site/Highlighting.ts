import typescript from "@shikijs/langs/typescript";
import tsx from "@shikijs/langs/tsx";
import html from "@shikijs/langs/html";

type Language = (typeof typescript)[number];

const withHtmlTemplates = (language: Language): Language => {
  const grammar = structuredClone(language);
  grammar.repository!.template!.patterns!.unshift({
    begin: "(?<![$\\w])((?:[$\\w]+\\.)*html)(\\s*)(`)",
    beginCaptures: {
      1: { name: "entity.name.function.tagged-template.ts" },
      3: { name: "punctuation.definition.string.template.begin.ts" },
    },
    end: "`",
    endCaptures: { 0: { name: "punctuation.definition.string.template.end.ts" } },
    contentName: "text.html.typed",
    patterns: [
      { include: "#template-substitution-element" },
      { include: "#string-character-escape" },
      { include: "text.html.typed" },
    ],
  });
  grammar.embeddedLangs = [...(grammar.embeddedLangs ?? []), "typed-html"];
  return grammar;
};

const templateHtml = structuredClone(html.find((language) => language.name === "html")!);
templateHtml.name = "typed-html";
templateHtml.scopeName = "text.html.typed";
templateHtml.aliases = [];
// Interpolations can start in text, quoted attributes, or an open tag. The
// TypeScript grammar owns their nested braces and nested tagged templates.
const addInterpolations = (rule: unknown): void => {
  if (typeof rule !== "object" || rule === null) return;
  const value = rule as { patterns?: unknown[]; include?: string; [key: string]: unknown };
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach(addInterpolations);
    else addInterpolations(child);
  }
  if (value.include === "text.html.basic") value.include = "text.html.typed";
  if (value.patterns)
    value.patterns.unshift({ include: "source.ts#template-substitution-element" });
};
addInterpolations(templateHtml);

export const typedHighlightingLanguages = [
  withHtmlTemplates(typescript[0]!),
  withHtmlTemplates(tsx[0]!),
  ...html.filter((language) => language.name !== "html"),
  templateHtml,
];
