import type { CurriculumFile } from "./Files.js";

export type CurriculumDiffLine =
  | {
      readonly kind: "context" | "add" | "remove";
      readonly text: string;
      readonly oldLine?: number;
      readonly newLine?: number;
    }
  | { readonly kind: "skip"; readonly text: string };

const rawDiff = (
  before: string,
  after: string,
): ReadonlyArray<CurriculumDiffLine> => {
  const oldLines = before.split("\n");
  const newLines = after.split("\n");
  const lengths = Array.from({ length: oldLines.length + 1 }, () =>
    Array<number>(newLines.length + 1).fill(0),
  );

  for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex -= 1) {
      lengths[oldIndex]![newIndex] =
        oldLines[oldIndex] === newLines[newIndex]
          ? lengths[oldIndex + 1]![newIndex + 1]! + 1
          : Math.max(
              lengths[oldIndex + 1]![newIndex]!,
              lengths[oldIndex]![newIndex + 1]!,
            );
    }
  }

  const lines: Array<CurriculumDiffLine> = [];
  let oldIndex = 0;
  let newIndex = 0;
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (
      oldIndex < oldLines.length &&
      newIndex < newLines.length &&
      oldLines[oldIndex] === newLines[newIndex]
    ) {
      lines.push({
        kind: "context",
        text: oldLines[oldIndex]!,
        oldLine: oldIndex + 1,
        newLine: newIndex + 1,
      });
      oldIndex += 1;
      newIndex += 1;
    } else if (
      newIndex < newLines.length &&
      (oldIndex === oldLines.length ||
        lengths[oldIndex]![newIndex + 1]! > lengths[oldIndex + 1]![newIndex]!)
    ) {
      lines.push({
        kind: "add",
        text: newLines[newIndex]!,
        newLine: newIndex + 1,
      });
      newIndex += 1;
    } else {
      lines.push({
        kind: "remove",
        text: oldLines[oldIndex]!,
        oldLine: oldIndex + 1,
      });
      oldIndex += 1;
    }
  }
  return lines;
};

/** Produces a compact, line-numbered patch with three unchanged lines around every edit. */
export const curriculumDiff = (
  before: string,
  after: string,
  context = 3,
): ReadonlyArray<CurriculumDiffLine> => {
  if (before === after) return [];
  const lines = rawDiff(before, after);
  const changed = lines.flatMap((line, index) =>
    line.kind === "context" ? [] : [index],
  );
  const visible = new Set<number>();
  for (const index of changed) {
    for (
      let cursor = Math.max(0, index - context);
      cursor <= Math.min(lines.length - 1, index + context);
      cursor += 1
    ) {
      visible.add(cursor);
    }
  }

  const compact: Array<CurriculumDiffLine> = [];
  let index = 0;
  while (index < lines.length) {
    if (visible.has(index)) {
      compact.push(lines[index]!);
      index += 1;
      continue;
    }
    const start = index;
    while (index < lines.length && !visible.has(index)) index += 1;
    compact.push({
      kind: "skip",
      text: `… ${index - start} unchanged lines …`,
    });
  }
  return compact;
};

/** New files are already shown in full; compare only snapshots a reader has seen. */
export const curriculumFileDiffs = (
  previous: ReadonlyArray<CurriculumFile>,
  current: ReadonlyArray<CurriculumFile>,
) => {
  const previousSources = new Map(
    previous.map(({ name, source }) => [name, source]),
  );
  return current.flatMap(({ name, source }) => {
    const before = previousSources.get(name);
    if (before === undefined) return [];
    const lines = curriculumDiff(before, source);
    return lines.length === 0 ? [] : [{ name, lines }];
  });
};
