import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ts from "typescript-compiler";
import { Window } from "happy-dom";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences } from "../Recipes.js";
import { renderMarkdown } from "../../site/Markdown.js";
import { extractFxMarbleOperators } from "../FxMarbleCoverage.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));

const operatorGuides = [
  {
    file: "fx-dynamic-producers.md",
    order: 1.15,
    operators: ["Fx.gen", "Fx.unwrap", "Fx.unwrapScoped"],
  },
  {
    file: "fx-selection-and-cardinality.md",
    order: 1.6,
    operators: ["Fx.filterMap", "Fx.take", "Fx.slice", "Fx.takeUntil"],
  },
  {
    file: "fx-time-and-rate.md",
    order: 1.7,
    operators: ["Fx.periodic", "Fx.debounce", "Fx.throttle", "Fx.repeat"],
  },
  {
    file: "fx-higher-order-and-concurrency.md",
    order: 1.4,
    operators: ["Fx.flatMap", "Fx.switchMap", "Fx.concatMap", "Fx.flatMapConcurrently"],
  },
  {
    file: "fx-errors-and-recovery.md",
    order: 1.8,
    operators: ["Fx.catchTag", "Fx.catchCause", "Fx.retry", "Fx.result"],
  },
  {
    file: "fx-services-and-lifetime.md",
    order: 1.9,
    operators: ["Fx.provide", "Fx.genScoped", "Fx.drainLayer", "Fx.observeLayer"],
  },
  {
    file: "fx-stateful-transforms.md",
    order: 1.3,
    operators: ["Fx.scan", "Fx.pairwise", "Fx.grouped", "Fx.skipRepeats"],
  },
] as const;

const fxSectionFiles = [
  "fx-push-reactivity.md",
  "building-fx.md",
  "fx-dynamic-producers.md",
  "transforming-fx.md",
  "fx-stateful-transforms.md",
  "fx-higher-order-and-concurrency.md",
  "composing-fx.md",
  "fx-selection-and-cardinality.md",
  "fx-time-and-rate.md",
  "fx-errors-and-recovery.md",
  "fx-services-and-lifetime.md",
  "consuming-fx.md",
] as const;

describe("Fx operator curriculum", () => {
  it("gives every Fx lesson runnable examples and a continuation in the learning path", () => {
    for (const file of fxSectionFiles) {
      const source = fs.readFileSync(path.join(websiteRoot, "content/guides", file), "utf8");
      expect(extractTypeScriptFences(source).length, file).toBeGreaterThan(0);
      const links = [...source.matchAll(/\]\(\/explore\/([^)#]+)(?:#[^)]*)?\)/gu)];
      expect(links.length, `${file} connects to other lessons`).toBeGreaterThan(0);
      for (const [, slug] of links)
        expect(
          fs.existsSync(path.join(websiteRoot, "content/guides", `${slug}.md`)),
          `${file} links to ${slug}`,
        ).toBe(true);
    }
  });

  it("organizes public operators by behavioral decision rather than API family", () => {
    for (const expected of operatorGuides) {
      const source = fs.readFileSync(
        path.join(websiteRoot, "content/guides", expected.file),
        "utf8",
      );
      const guide = parseGuideDocumentation(expected.file, source);

      expect(guide).toMatchObject({
        slug: expected.file.replace(/\.md$/u, ""),
        section: "Fx",
        kind: "guide",
        order: expected.order,
      });
      const examples = extractTypeScriptFences(source);
      expect(examples.join("\n")).not.toContain("declare ");
      expect(examples.length).toBeGreaterThan(0);
      for (const operator of expected.operators) expect(source).toContain(operator);
    }
  });

  it("keeps every operator example independently compilable", () => {
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".fx-operator-curriculum-check-"));

    try {
      const files = operatorGuides.flatMap(({ file }) => {
        const source = fs.readFileSync(path.join(websiteRoot, "content/guides", file), "utf8");
        return extractTypeScriptFences(source).map((code, index) => {
          const example = path.join(staging, `${file}-${index}.ts`);
          fs.writeFileSync(example, code);
          return example;
        });
      });
      const program = ts.createProgram(files, {
        esModuleInterop: true,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        noEmit: true,
        skipLibCheck: true,
        strict: true,
        target: ts.ScriptTarget.ES2022,
      });
      const diagnostics = ts.getPreEmitDiagnostics(program);

      expect(
        ts.formatDiagnosticsWithColorAndContext(diagnostics, {
          getCanonicalFileName: (fileName) => fileName,
          getCurrentDirectory: () => websiteRoot,
          getNewLine: () => "\n",
        }),
      ).toBe("");
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  });

  it("renders every higher-order policy before the secondary Effect callback variants", async () => {
    const source = fs.readFileSync(
      path.join(websiteRoot, "content/guides/fx-higher-order-and-concurrency.md"),
      "utf8",
    );
    const guide = parseGuideDocumentation("fx-higher-order-and-concurrency.md", source);
    const rendered = (await renderMarkdown(guide.body)).code;
    const operators = [
      "flatMap",
      "flatMapConcurrently",
      "concatMap",
      "switchMap",
      "exhaustMap",
      "exhaustLatestMap",
      "if",
      "race",
      "raceAll",
    ];
    const effectOperators = [
      "flatMapEffect",
      "flatMapConcurrentlyEffect",
      "concatMapEffect",
      "switchMapEffect",
      "exhaustMapEffect",
      "exhaustLatestMapEffect",
    ];
    expect(extractFxMarbleOperators(source)).toEqual(
      expect.arrayContaining([...operators, ...effectOperators]),
    );
    expect(rendered.match(/class="fx-marble"/gu)?.length).toBeGreaterThanOrEqual(
      operators.length + effectOperators.length,
    );
    const diagrams = [...source.matchAll(/```fx-marble\n([\s\S]*?)\n```/gu)].map(
      (match) => match[1]!,
    );
    const coveredBy = (block: string) =>
      block
        .match(/^covers: (.*)$/mu)?.[1]
        ?.split(",")
        .map((value) => value.trim()) ?? [];
    for (const name of effectOperators) {
      const diagram = diagrams.find((block) => coveredBy(block).includes(name));
      expect(diagram, `${name} has its own one-result timeline`).toBeDefined();
      const innerLanes = [...diagram!.matchAll(/^inner [^:]+: (.*)$/gmu)];
      expect(innerLanes.length).toBeGreaterThan(0);
      for (const [, events] of innerLanes) {
        const successes = events!
          .split(/\s+/u)
          .filter((token) => ![".", "^", "|", "x"].includes(token) && !token.startsWith("!"));
        expect(
          successes.length,
          `${name} Effect emits at most one successful value`,
        ).toBeLessThanOrEqual(1);
      }
    }
    const lastBase = Math.max(
      ...operators.map((name) => diagrams.findIndex((block) => coveredBy(block).includes(name))),
    );
    const firstEffect = Math.min(
      ...effectOperators.map((name) =>
        diagrams.findIndex((block) => coveredBy(block).includes(name)),
      ),
    );
    expect(firstEffect).toBeGreaterThan(lastBase);
  });

  it("visibly covers every public stateful transform with a marble diagram", async () => {
    const source = fs.readFileSync(
      path.join(websiteRoot, "content/guides/fx-stateful-transforms.md"),
      "utf8",
    );
    const guide = parseGuideDocumentation("fx-stateful-transforms.md", source);
    const rendered = (await renderMarkdown(guide.body)).code;
    const document = new Window().document;
    document.body.innerHTML = rendered;
    const visibleOperators = Array.from(
      document.querySelectorAll(".fx-marble__coverage code"),
      (code) => code.textContent,
    );
    const operators = [
      "filterMapLoop",
      "filterMapLoopCause",
      "filterMapLoopCauseEffect",
      "filterMapLoopEffect",
      "changesWithEffect",
      "grouped",
      "groupedWithin",
      "loop",
      "loopCause",
      "loopCauseEffect",
      "loopEffect",
      "pairwise",
      "scan",
      "scanEffect",
      "skipRepeats",
      "skipRepeatsWith",
    ] as const;

    for (const operator of operators) {
      expect(visibleOperators).toContain(operator);
    }
  });
});
