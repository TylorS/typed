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
    "Every public Fx constructor, combinator, function builder, interop adapter, and runner has an explicit scenario below. Aliases have their own entries and name the implementation they share. Type contracts and synchronous inspection helpers are listed separately at the end.",
    "Read each figure as one concrete execution, not a promise of exact scheduler interleaving. Open **Read this diagram** below any figure for a visual key using the same shapes as its lanes: value pills, start chevrons, return bars, cause exclamation marks, and interruption crosses. Empty stretches contain no event; they do not mean the run has ended. Timed figures state their slot duration; other slots show causal order. Service, state, callback, and consumer lanes describe control activity rather than additional Fx values. Effect callback examples use serialized input unless their caption explicitly describes concurrency.",
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
    "These exports do not create or transform an execution timeline. Nested Fx and fn namespace members are type contracts covered by their parent namespace; they do not hide additional operators.",
    ...fxNonTemporalExports.map(
      (entry) =>
        `- **${entry.name}** — ${entry.reason} [Source](${sourceLink(entry)})`,
    ),
  ].join("\n\n");
};
