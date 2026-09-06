import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import { Effect, Option, Schedule } from "effect";
import * as Fx from "../../../../../packages/fx/src/Fx/index.js";
import { renderFxMarble } from "../FxMarble.js";
import { extractFxMarbleOperators } from "../FxMarbleCoverage.js";
import {
  fxNonTemporalExports,
  fxOperatorDiagrams,
  renderFxOperatorAtlasMarkdown,
} from "../FxOperatorAtlas.js";

const repo = fileURLToPath(new URL("../../../../../", import.meta.url));

/** Follow the live barrel, including aliases; generated JSON cannot conceal a new export. */
const publicExports = (
  entry: string,
  visited = new Set<string>(),
): Set<string> => {
  const names = new Set<string>();
  if (visited.has(entry)) return names;
  visited.add(entry);
  const source = ts.createSourceFile(
    entry,
    fs.readFileSync(entry, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  for (const node of source.statements) {
    if (ts.isExportDeclaration(node)) {
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const item of node.exportClause.elements)
          names.add(item.name.text);
      } else if (
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const target = path.resolve(
          path.dirname(entry),
          node.moduleSpecifier.text.replace(/\.js$/u, ".ts"),
        );
        for (const name of publicExports(target, visited)) names.add(name);
      }
      continue;
    }
    if (
      !ts.canHaveModifiers(node) ||
      !ts
        .getModifiers(node)
        ?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    )
      continue;
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        expect(
          ts.isIdentifier(declaration.name),
          "Audit destructured public exports explicitly",
        ).toBe(true);
        names.add(declaration.name.getText(source));
      }
    } else if (
      (ts.isFunctionDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isModuleDeclaration(node) ||
        ts.isClassDeclaration(node)) &&
      node.name
    ) {
      names.add(node.name.text);
    }
  }
  return names;
};

describe("complete Fx operator atlas", () => {
  it("uses the semantic category on each live public declaration, including alias targets", () => {
    for (const entry of fxOperatorDiagrams) {
      const file = path.join(repo, entry.source);
      const source = ts.createSourceFile(
        file,
        fs.readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      const declarations = new Map<string, ts.Node>();
      const aliases = new Map<string, string>();
      for (const node of source.statements) {
        if (ts.isVariableStatement(node)) {
          for (const declaration of node.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name))
              declarations.set(declaration.name.text, node);
          }
        } else if (ts.isFunctionDeclaration(node) && node.name) {
          declarations.set(node.name.text, node);
        } else if (
          ts.isExportDeclaration(node) &&
          node.exportClause &&
          ts.isNamedExports(node.exportClause)
        ) {
          for (const alias of node.exportClause.elements)
            aliases.set(
              alias.name.text,
              alias.propertyName?.text ?? alias.name.text,
            );
        }
      }
      const target = aliases.get(entry.name) ?? entry.name;
      const declaration = declarations.get(target);
      expect(
        declaration,
        `${entry.name}: resolve its own live declaration`,
      ).toBeDefined();
      const category = ts
        .getJSDocTags(declaration!)
        .find((tag) => tag.tagName.text === "category");
      expect(
        typeof category?.comment,
        `${entry.name}: explicit source category`,
      ).toBe("string");
      expect(entry.category, entry.name).toBe(
        (category!.comment as string).trim(),
      );
    }
  });

  it("accounts for every live public export, including constructors, aliases, adapters, and runners", () => {
    const expected = publicExports(
      path.join(repo, "packages/fx/src/Fx/index.ts"),
    );
    const actual = [...fxOperatorDiagrams, ...fxNonTemporalExports].map(
      ({ name }) => name,
    );
    expect(actual.length).toBe(new Set(actual).size);
    expect(actual.toSorted()).toEqual([...expected].toSorted());
    expect(fxNonTemporalExports.every(({ reason }) => reason.length > 30)).toBe(
      true,
    );
  });

  it("renders one explicit, source-linked scenario per runtime export with no fallback", () => {
    for (const entry of fxOperatorDiagrams) {
      expect(fs.existsSync(path.join(repo, entry.source)), entry.name).toBe(
        true,
      );
      expect(entry.explanation.length, entry.name).toBeGreaterThan(20);
      expect(entry.lifecycle.length, entry.name).toBeGreaterThan(20);
      expect(renderFxMarble(entry.diagram), entry.name).toContain(
        `data-fx-operators="${entry.name}"`,
      );
      expect(
        extractFxMarbleOperators(`\`\`\`fx-marble\n${entry.diagram}\n\`\`\``),
        entry.name,
      ).toEqual([entry.name]);
      if (entry.aliasOf)
        expect(
          fxOperatorDiagrams.some(({ name }) => name === entry.aliasOf),
        ).toBe(true);
    }
    expect(
      extractFxMarbleOperators(renderFxOperatorAtlasMarkdown()).toSorted(),
    ).toEqual(fxOperatorDiagrams.map(({ name }) => name).toSorted());
  }, 60_000);

  it("keeps forwarded inner results in their causal slots", () => {
    const flatteners = new Set([
      "flatMap",
      "flatMapEffect",
      "flatMapConcurrently",
      "flatMapConcurrentlyEffect",
      "concatMap",
      "concatMapEffect",
      "switchMap",
      "switchMapEffect",
      "exhaustMap",
      "exhaustMapEffect",
      "exhaustLatestMap",
      "exhaustLatestMapEffect",
    ]);
    for (const entry of fxOperatorDiagrams.filter(({ name }) =>
      flatteners.has(name),
    )) {
      const lanes = entry.diagram
        .split("\n")
        .filter((line) => /^(inner|output)(?: |:)/u.test(line))
        .map((line) => ({
          kind: line.startsWith("inner") ? "inner" : "output",
          tokens: line
            .slice(line.indexOf(":") + 1)
            .trim()
            .split(/\s+/u),
        }));
      const sourceLine = entry.diagram
        .split("\n")
        .find((line) => line.startsWith("input:"))!;
      const sourceEvents = sourceLine
        .slice(sourceLine.indexOf(":") + 1)
        .trim()
        .split(/\s+/u);
      const sourceCompletion = sourceEvents.indexOf("|");
      expect(
        sourceCompletion,
        `${entry.name}: finite outer source has an explicit completion`,
      ).toBeGreaterThanOrEqual(0);
      const innerEvents = lanes.filter(({ kind }) => kind === "inner");
      for (const output of lanes.filter(({ kind }) => kind === "output")) {
        expect(
          output.tokens.indexOf("|"),
          `${entry.name}: completion waits for the outer source`,
        ).toBeGreaterThanOrEqual(sourceCompletion);
        output.tokens.forEach((token, slot) => {
          if ([".", "^", "|", "x"].includes(token) || token.startsWith("!"))
            return;
          expect(
            innerEvents.some(({ tokens }) => tokens[slot] === token),
            `${entry.name}: ${token} must be emitted by its inner in slot ${slot}`,
          ).toBe(true);
        });
      }
    }
  });

  it("records the Effectful alias and opposite stopping predicate decisions explicitly", () => {
    const find = (name: string) =>
      fxOperatorDiagrams.find((entry) => entry.name === name)!;
    expect(Fx.dropWhileEffect).toBe(Fx.skipWhileEffect);
    expect(find("dropWhileEffect").aliasOf).toBe("skipWhileEffect");
    expect(find("dropWhileEffect").diagram).toContain(
      "inner predicate: ^ true ^ true ^ false",
    );
    expect(find("takeUntilEffect").diagram).toContain(
      "inner predicate: ^ false ^ false ^ true",
    );
    expect(find("takeWhileEffect").diagram).toContain(
      "inner predicate: ^ true ^ true ^ false",
    );
  });

  it("does not use a multi-value inner Fx as the illustration of an Effect-returning flattening operator", () => {
    for (const name of [
      "flatMapEffect",
      "flatMapConcurrentlyEffect",
      "concatMapEffect",
      "switchMapEffect",
      "exhaustMapEffect",
      "exhaustLatestMapEffect",
    ]) {
      const entry = fxOperatorDiagrams.find((entry) => entry.name === name)!;
      expect(entry.diagram, name).not.toMatch(/\b[a-c][12]\b/u);
      expect(entry.diagram, name).toMatch(/^inner /mu);
    }
    expect(
      fxOperatorDiagrams.find(({ name }) => name === "switchMapEffect")!
        .diagram,
    ).toContain("x");
    expect(
      fxOperatorDiagrams.find(({ name }) => name === "first")!.diagram,
    ).toContain("Some(a)");
  });
});

describe("atlas emission contracts against live implementations", () => {
  it("distinguishes empty completion, undefined pulses, and optional first results", async () => {
    expect(await Effect.runPromise(Fx.collectAll(Fx.empty))).toEqual([]);
    expect(await Effect.runPromise(Fx.collectAll(Fx.succeedUndefined))).toEqual(
      [undefined],
    );
    expect(await Effect.runPromise(Fx.first(Fx.empty))).toEqual(Option.none());
    expect(await Effect.runPromise(Fx.first(Fx.succeed("a")))).toEqual(
      Option.some("a"),
    );
    expect(
      await Effect.runPromise(
        Fx.collectAll(Fx.fromSchedule(Schedule.recurs(2))),
      ),
    ).toEqual([undefined, undefined]);
  });

  it("retains deliveries from an attempt that subsequently fails before retrying", async () => {
    let attempts = 0;
    const source = Fx.suspend(() =>
      ++attempts === 1
        ? Fx.concat(Fx.succeed("partial"), Fx.fail("offline"))
        : Fx.succeed("ready"),
    );
    expect(
      await Effect.runPromise(
        Fx.collectAll(Fx.retry(source, Schedule.recurs(1))),
      ),
    ).toEqual(["partial", "ready"]);
  });

  it("emits one result per successful callback Effect in merged and serialized flattening", async () => {
    const source = Fx.fromIterable(["a", "b", "c"]);
    const callback = (value: string) => Effect.succeed(value.toUpperCase());
    expect(
      await Effect.runPromise(
        Effect.scoped(Fx.collectAll(Fx.concatMapEffect(source, callback))),
      ),
    ).toEqual(["A", "B", "C"]);
    const merged = await Effect.runPromise(
      Effect.scoped(Fx.collectAll(Fx.flatMapEffect(source, callback))),
    );
    expect(merged.toSorted()).toEqual(["A", "B", "C"]);
  });
});
