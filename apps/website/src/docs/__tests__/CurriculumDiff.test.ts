import { describe, expect, it } from "vitest";
import { curriculumDiff, curriculumFileDiffs } from "../../tutorial/Diff.js";

describe("curriculumDiff", () => {
  it("marks additions and removals with both line-number spaces", () => {
    const lines = curriculumDiff(
      "const count = 0\nrender(count)",
      "const count = 1\nrender(count)",
    );

    expect(lines).toContainEqual({
      kind: "remove",
      text: "const count = 0",
      oldLine: 1,
    });
    expect(lines).toContainEqual({
      kind: "add",
      text: "const count = 1",
      newLine: 1,
    });
    expect(lines).toContainEqual({
      kind: "context",
      text: "render(count)",
      oldLine: 2,
      newLine: 2,
    });
  });

  it("collapses unchanged regions outside the requested context", () => {
    const before = Array.from(
      { length: 12 },
      (_, index) => `line ${index}`,
    ).join("\n");
    const after = before.replace("line 6", "changed 6");
    const lines = curriculumDiff(before, after, 1);

    expect(lines.filter(({ kind }) => kind === "skip")).toHaveLength(2);
    expect(
      lines.some((line) => line.kind === "context" && line.text === "line 0"),
    ).toBe(false);
    expect(
      lines.some((line) => line.kind === "context" && line.text === "line 5"),
    ).toBe(true);
  });

  it("compares existing files with their last snapshot and leaves new or unchanged files in the full chapter", () => {
    const previous = [
      {
        name: "domain.ts",
        language: "ts" as const,
        source: "export const name = 'Todo'",
      },
      {
        name: "application.ts",
        language: "ts" as const,
        source: "export const count = 0",
      },
    ];
    const current = [
      previous[0]!,
      { ...previous[1]!, source: "export const count = 1" },
      {
        name: "presentation.ts",
        language: "ts" as const,
        source: "export const view = 'Todo'",
      },
    ];

    const diffs = curriculumFileDiffs(previous, current);
    expect(diffs.map(({ name }) => name)).toEqual(["application.ts"]);
    expect(diffs[0]!.lines).toEqual([
      { kind: "remove", text: "export const count = 0", oldLine: 1 },
      { kind: "add", text: "export const count = 1", newLine: 1 },
    ]);
    expect(curriculumFileDiffs([], current)).toEqual([]);
    expect(curriculumFileDiffs(previous, previous)).toEqual([]);
  });
});
