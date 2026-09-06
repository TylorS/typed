import { NodeFileSystem } from "@effect/platform-node";
import { Effect } from "effect";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import type { PackageExportTarget, PublishedPackage } from "../Model.js";
import {
  discoverPublishedPackages,
  resolvePublicModules,
  type PublishedGraphError,
} from "../Published.js";

const fixtureRoot = fileURLToPath(new URL("./fixtures/published-package", import.meta.url));
const workspaceRoot = path.resolve(fixtureRoot, "../../../../../../..");
const temporaryRoots: Array<string> = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

const run = <A, E>(effect: Effect.Effect<A, E, never>): Promise<A> => Effect.runPromise(effect);

const provideFileSystem = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(Effect.provide(NodeFileSystem.layer));

const writeFile = (root: string, relativePath: string): void => {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, "");
};

const makeFixtureWorkspace = (): string => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "typed-published-"));
  temporaryRoots.push(root);
  const packageRoot = path.join(root, "packages", "published");
  fs.mkdirSync(packageRoot, { recursive: true });
  fs.copyFileSync(path.join(fixtureRoot, "package.json"), path.join(packageRoot, "package.json"));

  for (const target of [
    "dist/index.d.ts",
    "dist/index.js",
    "dist/feature.d.ts",
    "dist/feature.js",
    "dist/features/alpha.d.ts",
    "dist/features/alpha.js",
    "dist/features/internal/secret.d.ts",
    "dist/features/internal/secret.js",
    "dist/features/special/alpha.d.ts",
    "dist/features/special/alpha.js",
    "dist/special/alpha.d.ts",
    "dist/special/alpha.js",
    "dist/_public.d.ts",
    "dist/_public.js",
    "dist/unpublished.d.ts",
    "dist/unpublished.js",
    "config.json",
  ]) {
    writeFile(packageRoot, target);
  }

  const privateRoot = path.join(root, "packages", "private");
  fs.mkdirSync(privateRoot, { recursive: true });
  fs.writeFileSync(
    path.join(privateRoot, "package.json"),
    JSON.stringify({ name: "@fixture/private", version: "1.0.0", private: true, exports: "." }),
  );
  return root;
};

const fixturePackage = (
  root: string,
  exports: Readonly<Record<string, PackageExportTarget>>,
): PublishedPackage => ({
  name: "@fixture/invalid",
  version: "1.0.0",
  root,
  exports,
});

const resolveFixture = async (
  exports: Readonly<Record<string, PackageExportTarget>>,
): Promise<PublishedGraphError> => {
  const root = makeFixtureWorkspace();
  const packageRoot = path.join(root, "packages", "published");
  return run(
    provideFileSystem(resolvePublicModules(fixturePackage(packageRoot, exports))).pipe(Effect.flip),
  );
};

describe("published package graph", () => {
  it("discovers non-private publishable packages deterministically", async () => {
    const root = makeFixtureWorkspace();

    const packages = await run(provideFileSystem(discoverPublishedPackages(root)));

    expect(packages.map(({ name, version }) => ({ name, version }))).toEqual([
      { name: "@fixture/published", version: "1.2.3" },
    ]);
    expect(packages[0]?.root).toBe(path.join(root, "packages", "published"));
  });

  it("resolves exact, conditional, wildcard, exclusion, and JSON exports", async () => {
    const root = makeFixtureWorkspace();
    const [published] = await run(provideFileSystem(discoverPublishedPackages(root)));
    const modules = await run(provideFileSystem(resolvePublicModules(published!)));
    const packageRoot = path.join(root, "packages", "published");

    expect(modules).toEqual([
      {
        packageName: "@fixture/published",
        packageVersion: "1.2.3",
        packageRoot,
        consumerSpecifier: "@fixture/published",
        exportSubpath: ".",
        documentationTarget: path.join(packageRoot, "dist/index.d.ts"),
        runtimeTarget: path.join(packageRoot, "dist/index.js"),
        mediaType: "text/typescript",
        activeConditions: ["types", "import"],
      },
      {
        packageName: "@fixture/published",
        packageVersion: "1.2.3",
        packageRoot,
        consumerSpecifier: "@fixture/published/config",
        exportSubpath: "./config",
        documentationTarget: path.join(packageRoot, "config.json"),
        runtimeTarget: path.join(packageRoot, "config.json"),
        mediaType: "application/json",
        activeConditions: [],
      },
      {
        packageName: "@fixture/published",
        packageVersion: "1.2.3",
        packageRoot,
        consumerSpecifier: "@fixture/published/fallback",
        exportSubpath: "./fallback",
        documentationTarget: path.join(packageRoot, "dist/feature.d.ts"),
        runtimeTarget: path.join(packageRoot, "dist/feature.js"),
        mediaType: "text/typescript",
        activeConditions: ["types", "import"],
      },
      {
        packageName: "@fixture/published",
        packageVersion: "1.2.3",
        packageRoot,
        consumerSpecifier: "@fixture/published/feature",
        exportSubpath: "./feature",
        documentationTarget: path.join(packageRoot, "dist/feature.d.ts"),
        runtimeTarget: path.join(packageRoot, "dist/feature.js"),
        mediaType: "text/typescript",
        activeConditions: ["import", "types", "default"],
      },
      {
        packageName: "@fixture/published",
        packageVersion: "1.2.3",
        packageRoot,
        consumerSpecifier: "@fixture/published/features/alpha",
        exportSubpath: "./features/alpha",
        documentationTarget: path.join(packageRoot, "dist/features/alpha.d.ts"),
        runtimeTarget: path.join(packageRoot, "dist/features/alpha.js"),
        mediaType: "text/typescript",
        activeConditions: ["types", "import"],
      },
      {
        packageName: "@fixture/published",
        packageVersion: "1.2.3",
        packageRoot,
        consumerSpecifier: "@fixture/published/features/special/alpha",
        exportSubpath: "./features/special/alpha",
        documentationTarget: path.join(packageRoot, "dist/special/alpha.d.ts"),
        runtimeTarget: path.join(packageRoot, "dist/special/alpha.js"),
        mediaType: "text/typescript",
        activeConditions: ["types", "import"],
      },
      {
        packageName: "@fixture/published",
        packageVersion: "1.2.3",
        packageRoot,
        consumerSpecifier: "@fixture/published/nested-fallback",
        exportSubpath: "./nested-fallback",
        documentationTarget: path.join(packageRoot, "dist/feature.d.ts"),
        runtimeTarget: path.join(packageRoot, "dist/feature.js"),
        mediaType: "text/typescript",
        activeConditions: ["import", "types", "default"],
      },
    ]);
    expect(modules.some(({ consumerSpecifier }) => consumerSpecifier.includes("internal"))).toBe(
      false,
    );
  });

  it("returns package and specifier diagnostics for invalid public targets", async () => {
    const missing = await resolveFixture({
      "./missing": { types: "./dist/missing.d.ts", import: "./dist/missing.js" },
    });
    const mismatched = await resolveFixture({
      "./mismatch/*": { types: "./dist/features/*.d.ts", import: "./dist/fixed.js" },
    });
    const unsupported = await resolveFixture({
      "./unsupported": 42 as unknown as PackageExportTarget,
    });
    const collision = await resolveFixture({
      "./collision": [
        { types: "./dist/index.d.ts", import: "./dist/index.js" },
        { types: "./dist/feature.d.ts", import: "./dist/feature.js" },
      ],
    });

    for (const [error, specifier, message] of [
      [missing, "@fixture/invalid/missing", "Missing documentation target"],
      [mismatched, "@fixture/invalid/mismatch/*", "wildcard captures"],
      [unsupported, "@fixture/invalid/unsupported", "Unsupported export condition shape"],
      [collision, "@fixture/invalid/collision", "claim one consumer specifier"],
    ] as const) {
      expect(error.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            packageName: "@fixture/invalid",
            consumerSpecifier: specifier,
            message: expect.stringContaining(message),
          }),
        ]),
      );
    }
    expect(missing.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          packageName: "@fixture/invalid",
          consumerSpecifier: "@fixture/invalid/missing",
          message: expect.stringContaining("Missing runtime target"),
        }),
      ]),
    );
  });

  it("keeps explicit underscore exports public without exposing unlisted declaration files", async () => {
    const root = makeFixtureWorkspace();
    const packageRoot = path.join(root, "packages", "published");
    const modules = await run(
      provideFileSystem(
        resolvePublicModules(
          fixturePackage(packageRoot, {
            "./_public": {
              types: "./dist/_public.d.ts",
              import: "./dist/_public.js",
            },
          }),
        ),
      ),
    );

    expect(modules.map(({ consumerSpecifier }) => consumerSpecifier)).toEqual([
      "@fixture/invalid/_public",
    ]);
    expect(
      modules.some(({ documentationTarget }) => documentationTarget.includes("unpublished")),
    ).toBe(false);
  });

  it("resolves the live workspace as a dynamic, unique public specifier set", async () => {
    const packages = await run(provideFileSystem(discoverPublishedPackages(workspaceRoot)));
    const modules = (
      await run(
        provideFileSystem(
          Effect.forEach(packages, (published) => resolvePublicModules(published), {
            concurrency: 4,
          }),
        ),
      )
    ).flat();
    const specifiers = modules.map(({ consumerSpecifier }) => consumerSpecifier);

    expect(packages).toHaveLength(13);
    expect(specifiers).toEqual([...new Set(specifiers)].sort());
    expect(specifiers.every((specifier) => !specifier.includes("*"))).toBe(true);
    expect(specifiers.length).toBeGreaterThan(
      packages.reduce((count, published) => count + Object.keys(published.exports).length, 0),
    );
    expect(new Set(modules.map(({ packageName }) => packageName))).toEqual(
      new Set(packages.map(({ name }) => name)),
    );
    expect(specifiers.some((specifier) => specifier.includes("/Fx/internal/"))).toBe(false);
    expect(specifiers).toEqual(
      expect.arrayContaining([
        "@typed/id/_sha",
        "@typed/id/_uuid-stringify",
        "@typed/navigation/_core",
      ]),
    );
  });
});
