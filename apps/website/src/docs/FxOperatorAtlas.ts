import {
  fxNonTemporalExports,
  fxOperatorDiagrams,
} from "./FxOperatorAtlasData.js";

export interface FxOperatorDiagram {
  readonly name: string;
  readonly category: string;
  readonly source: string;
  readonly guide: string;
  readonly explanation: string;
  readonly lifecycle: string;
  readonly diagram: string;
  readonly aliasOf?: string;
}

export interface FxNonTemporalExport {
  readonly name: string;
  readonly source: string;
  readonly reason: string;
}

export { fxNonTemporalExports, fxOperatorDiagrams };

/** One explicit record per public runtime export; there is no generic fallback. */
export const findFxOperatorDiagram = (
  name: string,
): FxOperatorDiagram | undefined =>
  fxOperatorDiagrams.find((entry) => entry.name === name);

const sourceLink = (entry: { readonly source: string }): string =>
  `https://github.com/TylorS/typed/blob/development/${entry.source}`;

export const renderFxOperatorDiagramMarkdown = (
  entry: FxOperatorDiagram,
): string =>
  `${entry.explanation}\n\n\`\`\`fx-marble\n${entry.diagram}\n\`\`\`\n\n${entry.lifecycle}\n\n[Source implementation](${sourceLink(entry)}) · [Learn the surrounding model](/explore/${entry.guide})`;

/** Markdown-first atlas for the generator; the normal Markdown renderer renders every fence. */
export const renderFxOperatorAtlasMarkdown = (): string => {
  const categories = [
    ...new Set(fxOperatorDiagrams.map(({ category }) => category)),
  ];
  return [
    "Use this reference to compare operators by values, timing, failure, and cancellation. Choose a category in **Browse marble diagrams**, or find an operator by name. For a sequence of lessons, start with [Run push-based work](/explore/fx-push-reactivity). Aliases retain their own diagrams and link to the shared contract.",
    "Each figure is one execution, not a scheduler guarantee. **Read this diagram** explains its symbols. Empty slots mean no event; a return bar marks completion. Timed figures give their slot duration; other slots show causal order. Service, state, callback, and consumer lanes show control activity rather than Fx values. Effect callback examples use serialized input unless their caption says otherwise.",
    "A Cause delivery and a run returning are distinct in the Fx/Sink protocol. Error examples use a terminal observer unless stated otherwise: ordinary observers stop on failure, while a custom Sink may handle a Cause and accept later values. A source that has been interrupted cannot emit the later candidate values shown in a selection example; those candidates describe what would have arrived without the bound.",
    ...categories.flatMap((category) => [
      `## ${category.charAt(0).toUpperCase()}${category.slice(1)}`,
      ...fxOperatorDiagrams
        .filter((entry) => entry.category === category)
        .map(
          (entry) =>
            `### ${entry.name}\n\n${renderFxOperatorDiagramMarkdown(entry)}`,
        ),
    ]),
    "## Non-temporal exports",
    "These exports start no subscription. Look up their signatures in the [Fx API reference](/reference/modules/%40typed%2Ffx%2FFx). Nested Fx and fn members are covered by their parent namespace.",
    ...fxNonTemporalExports.map(
      (entry) =>
        `- **${entry.name}**${entry.reason.startsWith("Type-level contract;") ? "" : ` — ${entry.reason}`} [Source](${sourceLink(entry)})`,
    ),
  ].join("\n\n");
};
