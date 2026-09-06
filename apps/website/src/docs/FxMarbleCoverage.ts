import { renderFxMarble } from "./FxMarble.js";

export interface FxMarbleAppearance {
  readonly guideSlug: string;
  readonly operator: string;
}

export interface FxMarbleCoverageReport {
  readonly appearances: ReadonlyArray<FxMarbleAppearance>;
  readonly duplicates: ReadonlyArray<string>;
  readonly missing: ReadonlyArray<string>;
  readonly unexpected: ReadonlyArray<string>;
}

const fxMarbleFence = /^```fx-marble\s*\n([\s\S]*?)^```\s*$/gmu;
const coversLine = /^covers:\s*(.+)$/mu;

export const extractFxMarbleOperators = (
  markdown: string,
): ReadonlyArray<string> =>
  [...markdown.matchAll(fxMarbleFence)].flatMap(([, source]) => {
    if (renderFxMarble(source!) === undefined) return [];
    const covers = coversLine.exec(source!)?.[1];
    return covers === undefined
      ? []
      : covers
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean);
  });

export const validateFxMarbleCoverage = (
  publicOperators: ReadonlyArray<string>,
  guides: ReadonlyArray<{ readonly body: string; readonly slug: string }>,
): FxMarbleCoverageReport => {
  const expected = new Set(publicOperators);
  const appearances = guides.flatMap(({ body, slug }) =>
    extractFxMarbleOperators(body).map((operator) => ({
      guideSlug: slug,
      operator,
    })),
  );
  const counts = Map.groupBy(appearances, ({ operator }) => operator);

  return {
    appearances,
    duplicates: [...counts]
      .filter(([, entries]) => entries.length > 1)
      .map(([operator]) => operator)
      .sort(),
    missing: publicOperators.filter((operator) => !counts.has(operator)).sort(),
    unexpected: [...counts.keys()]
      .filter((operator) => !expected.has(operator))
      .sort(),
  };
};
