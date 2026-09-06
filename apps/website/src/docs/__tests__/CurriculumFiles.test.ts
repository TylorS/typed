import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  expandCurriculumSources,
  parseCurriculumFiles,
  resolveCurriculumSource,
} from "../../tutorial/Files.js";

describe("curriculum Markdown files", () => {
  it("aligns a nested source excerpt without flattening its internal indentation", () => {
    const module = "examples/todo-6/src/presentation.ts";
    const lines = readFileSync(`src/tutorial/${module}`, "utf8").split("\n");
    const start = lines.findIndex((line) => line.includes('class="clear-completed"'));
    const reference = [
      `// @source ${module}#L${start + 1}-L${start + 7}`,
      "// @expect Clear completed",
    ].join("\n");
    const excerpt = resolveCurriculumSource(reference);
    expect(excerpt).toBe(
      [
        '  class="clear-completed"',
        '  type="button"',
        "  onclick=${App.clearCompletedTodos}",
        ">",
        "  Clear completed",
        "</button>`,",
        "onFalse: Fx.null,",
      ].join("\n"),
    );
    expect(expandCurriculumSources(`\`\`\`ts\n${reference}\n\`\`\``)).toContain(excerpt);
  });

  it("gives consecutive statements in a nested test the same left margin", () => {
    const module = "examples/todo-10/src/presentation.test.ts";
    const lines = readFileSync(`src/tutorial/${module}`, "utf8").split("\n");
    const start = lines.findIndex((line) => line.includes("const draft = host.querySelector"));
    const reference = [
      `// @source ${module}#L${start + 1}-L${start + 3}`,
      "// @expect const draft =",
      "// @expect submit();",
    ].join("\n");
    expect(resolveCurriculumSource(reference)).toBe(
      [
        'const draft = host.querySelector<HTMLInputElement>(".new-todo")!;',
        'type(draft, "Same title");',
        "submit();",
      ].join("\n"),
    );
  });

  it("expands source-derived excerpts and checks their intended declarations", () => {
    const source = resolveCurriculumSource("// @source examples/todo-1/src/domain.ts");
    const reference = [
      "// @source examples/todo-1/src/domain.ts#L3-L14",
      "// @expect export const TodoId",
      "// @expect export const TodoList",
    ].join("\n");
    const excerpt = resolveCurriculumSource(reference);
    expect(excerpt).toBe(source.split("\n").slice(2, 14).join("\n").trim());
    expect(expandCurriculumSources(`\`\`\`ts\n${reference}\n\`\`\``)).toBe(
      `\`\`\`ts\n${excerpt}\n\`\`\``,
    );
    expect(() => resolveCurriculumSource(reference.replace("L3-L14", "L16-L25"))).toThrow(
      "no longer contains",
    );
    expect(() => resolveCurriculumSource(reference.replace("L3-L14", "L14-L3"))).toThrow(
      "Invalid curriculum source range",
    );
    expect(() => resolveCurriculumSource(reference.replace("L3-L14", "L3-L999"))).toThrow(
      "Invalid curriculum source range",
    );
    expect(() => resolveCurriculumSource(reference.split("\n")[0]!)).toThrow(
      "need an @expect check",
    );
  });

  it("resolves every authored TodoMVC excerpt and retains full copyable snapshots", () => {
    for (const name of readdirSync("content/tutorial").filter((name) => name.endsWith(".md"))) {
      const markdown = readFileSync(`content/tutorial/${name}`, "utf8");
      const excerpts = [...markdown.matchAll(/```ts\n(\/\/ @source [^\n]+#L[\s\S]*?)\n```/gu)];
      expect(excerpts.length, name).toBeGreaterThan(0);
      for (const [_, source] of excerpts) {
        const excerpt = resolveCurriculumSource(source!);
        expect(excerpt, name).not.toContain("@source");
        expect(excerpt, name).not.toContain("@expect");
      }
      expect(expandCurriculumSources(markdown), name).not.toContain("@source");
      const { files } = parseCurriculumFiles(name, markdown);
      for (const { name: file } of files) {
        expect(markdown, name).toContain(`<summary>${file}</summary>`);
      }
    }
  });

  it("expands the imported Counter source for Markdown and code snapshots", () => {
    const reference = "// @source examples/learn-3/src/Counter.ts";
    const source = resolveCurriculumSource(reference);
    expect(source).toContain("export const Counter = component");
    const markdown = `## src/Counter.ts\n\nExplain the state before the code.\n\n\`\`\`ts file="src/Counter.ts"\n${reference}\n\`\`\``;
    expect(parseCurriculumFiles("counter.md", markdown).files[0]?.source).toBe(source);
    expect(expandCurriculumSources(markdown)).toContain(source);
    expect(expandCurriculumSources(markdown)).not.toContain("@source");
  });

  it("reads described section and subsection fences while preserving prose and shell language", () => {
    const source = [
      "Introduce the component.",
      "",
      "## src/Counter.ts: reusable component",
      "",
      '```ts file="src/Counter.ts"',
      'export const label = "<Counter>"',
      "```",
      "",
      "Run it locally.",
      "",
      "### terminal: start the application",
      "",
      '```sh file="terminal"',
      "npm run dev",
      "```",
    ].join("\n");

    const parsed = parseCurriculumFiles("counter.md", source);
    expect(parsed.files).toEqual([
      {
        name: "src/Counter.ts",
        language: "ts",
        source: 'export const label = "<Counter>"',
      },
      { name: "terminal", language: "sh", source: "npm run dev" },
    ]);
    expect(parsed.body).toContain("Introduce the component.");
    expect(parsed.body).toContain("Run it locally.");
    expect(parsed.body).not.toContain("```ts");
    expect(parseCurriculumFiles("counter.md", source.replaceAll("\n", "\r\n"))).toEqual(parsed);
  });
});
