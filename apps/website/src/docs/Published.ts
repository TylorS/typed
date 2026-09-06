import { Effect, FileSystem } from "effect";
import * as path from "node:path";
import type {
  PackageExportTarget,
  PublishedGraphDiagnostic,
  PublishedPackage,
  PublicModuleTarget,
} from "./Model.js";

interface Manifest {
  readonly name?: unknown;
  readonly version?: unknown;
  readonly private?: unknown;
  readonly exports?: unknown;
}

interface ExportLeaf {
  readonly target: string;
  readonly conditions: ReadonlyArray<string>;
  readonly order: number;
}

interface ResolvedPair {
  readonly documentation: ExportLeaf;
  readonly runtime: ExportLeaf;
  readonly mediaType: PublicModuleTarget["mediaType"];
  readonly activeConditions: ReadonlyArray<string>;
}

interface ExportDefinition {
  readonly subpath: string;
  readonly pairs: ReadonlyArray<ResolvedPair>;
}

interface Candidate {
  readonly sourceSubpath: string;
  readonly exportSubpath: string;
  readonly documentationTarget: string;
  readonly runtimeTarget: string;
  readonly mediaType: PublicModuleTarget["mediaType"];
  readonly activeConditions: ReadonlyArray<string>;
}

export class PublishedGraphError extends Error {
  readonly _tag = "PublishedGraphError";

  constructor(readonly diagnostics: ReadonlyArray<PublishedGraphDiagnostic>) {
    super(diagnostics.map(formatDiagnostic).join("\n"));
    this.name = "PublishedGraphError";
  }
}

const formatDiagnostic = (diagnostic: PublishedGraphDiagnostic): string =>
  `${diagnostic.packageName} ${diagnostic.consumerSpecifier}: ${diagnostic.message}`;

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const isRecord = (input: unknown): input is Readonly<Record<string, unknown>> =>
  typeof input === "object" && input !== null && !Array.isArray(input);

const isPackageExportTarget = (input: unknown): input is PackageExportTarget => {
  if (typeof input === "string" || input === null) return true;
  if (Array.isArray(input)) return input.every(isPackageExportTarget);
  return isRecord(input) && Object.values(input).every(isPackageExportTarget);
};

const consumerSpecifier = (packageName: string, exportSubpath: string): string =>
  exportSubpath === "." ? packageName : `${packageName}/${exportSubpath.slice(2)}`;

const diagnostic = (
  pkg: Pick<PublishedPackage, "name">,
  exportSubpath: string,
  message: string,
): PublishedGraphDiagnostic => ({
  packageName: pkg.name,
  consumerSpecifier: consumerSpecifier(pkg.name, exportSubpath),
  message,
});

const normalizeExports = (
  packageName: string,
  exports: unknown,
):
  | { readonly _tag: "Success"; readonly exports: Readonly<Record<string, PackageExportTarget>> }
  | { readonly _tag: "Failure"; readonly diagnostic: PublishedGraphDiagnostic } => {
  if (!isPackageExportTarget(exports)) {
    return {
      _tag: "Failure",
      diagnostic: {
        packageName,
        consumerSpecifier: packageName,
        message: "Unsupported package exports shape.",
      },
    };
  }
  if (!isRecord(exports) || Array.isArray(exports)) {
    return { _tag: "Success", exports: { ".": exports } };
  }
  const keys = Object.keys(exports);
  if (keys.every((key) => key.startsWith("."))) {
    return {
      _tag: "Success",
      exports: exports as Readonly<Record<string, PackageExportTarget>>,
    };
  }
  if (keys.some((key) => key.startsWith("."))) {
    return {
      _tag: "Failure",
      diagnostic: {
        packageName,
        consumerSpecifier: packageName,
        message: "Package exports cannot mix subpath keys and condition keys.",
      },
    };
  }
  return {
    _tag: "Success",
    exports: { ".": exports as Readonly<Record<string, PackageExportTarget>> },
  };
};

export const discoverPublishedPackages = (root: string) =>
  Effect.gen(function* () {
    const fileSystem = yield* FileSystem.FileSystem;
    const nestedPackages = path.join(root, "packages");
    const packagesRoot = (yield* fileSystem.exists(nestedPackages)) ? nestedPackages : root;
    const directoryEntries = (yield* fileSystem.readDirectory(packagesRoot)).sort();
    const packages: Array<PublishedPackage> = [];
    const diagnostics: Array<PublishedGraphDiagnostic> = [];

    for (const directoryEntry of directoryEntries) {
      const packageRoot = path.join(packagesRoot, directoryEntry);
      if ((yield* fileSystem.stat(packageRoot)).type !== "Directory") continue;
      const manifestPath = path.join(packageRoot, "package.json");
      if (!(yield* fileSystem.exists(manifestPath))) continue;

      const source = yield* fileSystem.readFileString(manifestPath);
      let manifest: Manifest;
      try {
        manifest = JSON.parse(source) as Manifest;
      } catch (error) {
        diagnostics.push({
          packageName: directoryEntry,
          consumerSpecifier: directoryEntry,
          message: `Invalid package.json: ${String(error)}`,
        });
        continue;
      }
      if (manifest.private === true) continue;
      if (
        typeof manifest.name !== "string" ||
        manifest.name.length === 0 ||
        typeof manifest.version !== "string" ||
        manifest.version.length === 0 ||
        manifest.exports === undefined
      ) {
        diagnostics.push({
          packageName: typeof manifest.name === "string" ? manifest.name : directoryEntry,
          consumerSpecifier: typeof manifest.name === "string" ? manifest.name : directoryEntry,
          message: "A published package requires string name/version fields and an exports map.",
        });
        continue;
      }

      const normalized = normalizeExports(manifest.name, manifest.exports);
      if (normalized._tag === "Failure") {
        diagnostics.push(normalized.diagnostic);
        continue;
      }
      packages.push({
        name: manifest.name,
        version: manifest.version,
        root: packageRoot,
        exports: normalized.exports,
      });
    }

    packages.sort((left, right) => compareText(left.name, right.name));
    for (let index = 1; index < packages.length; index++) {
      if (packages[index - 1]!.name === packages[index]!.name) {
        diagnostics.push({
          packageName: packages[index]!.name,
          consumerSpecifier: packages[index]!.name,
          message: "Two published package manifests claim the same consumer package name.",
        });
      }
    }
    if (diagnostics.length > 0) return yield* Effect.fail(new PublishedGraphError(diagnostics));
    return packages as ReadonlyArray<PublishedPackage>;
  }).pipe(
    Effect.mapError((error) =>
      error instanceof PublishedGraphError
        ? error
        : new PublishedGraphError([
            {
              packageName: "<workspace>",
              consumerSpecifier: root,
              message: `Unable to discover published packages: ${String(error)}`,
            },
          ]),
    ),
  );

const declarationTarget = (target: string): boolean => /\.d\.[cm]?ts$/u.test(target);

const jsonTarget = (target: string): boolean => target.endsWith(".json");

const conditionPriority = (condition: string): number => {
  switch (condition) {
    case "types":
      return 0;
    case "import":
      return 1;
    case "browser":
      return 2;
    case "node":
      return 3;
    case "default":
      return 4;
    case "require":
      return 5;
    default:
      return 10;
  }
};

const compareConditionPaths = (left: ExportLeaf, right: ExportLeaf): number => {
  const length = Math.max(left.conditions.length, right.conditions.length);
  for (let index = 0; index < length; index++) {
    const leftRank = conditionPriority(left.conditions[index] ?? "");
    const rightRank = conditionPriority(right.conditions[index] ?? "");
    if (leftRank !== rightRank) return leftRank - rightRank;
  }
  return left.order - right.order;
};

const sharedConditionCount = (left: ExportLeaf, right: ExportLeaf): number => {
  const leftConditions = left.conditions.filter(
    (condition) => condition !== "types" && condition !== "default",
  );
  const rightConditions = new Set(
    right.conditions.filter((condition) => condition !== "types" && condition !== "default"),
  );
  return leftConditions.reduce(
    (count, condition) => count + (rightConditions.has(condition) ? 1 : 0),
    0,
  );
};

const uniqueConditions = (
  ...conditionSets: ReadonlyArray<ReadonlyArray<string>>
): ReadonlyArray<string> => {
  const conditions: Array<string> = [];
  for (const condition of conditionSets.flat()) {
    if (!conditions.includes(condition)) conditions.push(condition);
  }
  return conditions;
};

const collectLeaves = (
  value: PackageExportTarget,
  pkg: PublishedPackage,
  exportSubpath: string,
  diagnostics: Array<PublishedGraphDiagnostic>,
  conditions: ReadonlyArray<string> = [],
  leaves: Array<ExportLeaf> = [],
): ReadonlyArray<ExportLeaf> => {
  if (value === null) return leaves;
  if (typeof value === "string") {
    leaves.push({ target: value, conditions, order: leaves.length });
    return leaves;
  }
  if (Array.isArray(value)) {
    for (const fallback of value) {
      const leafCount = leaves.length;
      collectLeaves(fallback, pkg, exportSubpath, diagnostics, conditions, leaves);
      if (leaves.length > leafCount) break;
    }
    return leaves;
  }
  if (!isRecord(value)) {
    diagnostics.push(diagnostic(pkg, exportSubpath, "Unsupported export condition shape."));
    return leaves;
  }
  const entries = Object.entries(value);
  if (entries.length === 0 || entries.some(([condition]) => condition.startsWith("."))) {
    diagnostics.push(diagnostic(pkg, exportSubpath, "Unsupported export condition shape."));
    return leaves;
  }
  for (const [condition, target] of entries) {
    if (!isPackageExportTarget(target)) {
      diagnostics.push(diagnostic(pkg, exportSubpath, "Unsupported export condition shape."));
      continue;
    }
    collectLeaves(target, pkg, exportSubpath, diagnostics, [...conditions, condition], leaves);
  }
  return leaves;
};

const resolveBranch = (
  value: PackageExportTarget,
  pkg: PublishedPackage,
  exportSubpath: string,
  diagnostics: Array<PublishedGraphDiagnostic>,
): ResolvedPair | undefined => {
  const leaves = collectLeaves(value, pkg, exportSubpath, diagnostics);
  if (leaves.length === 0) return undefined;

  const resourceLeaves = leaves.filter(({ target }) => jsonTarget(target));
  if (resourceLeaves.length > 0) {
    const targets = new Set(resourceLeaves.map(({ target }) => target));
    if (resourceLeaves.length !== leaves.length || targets.size !== 1) {
      diagnostics.push(
        diagnostic(pkg, exportSubpath, "Multiple resource targets claim one consumer specifier."),
      );
      return undefined;
    }
    const resource = [...resourceLeaves].sort(compareConditionPaths)[0]!;
    return {
      documentation: resource,
      runtime: resource,
      mediaType: "application/json",
      activeConditions: resource.conditions,
    };
  }

  const documentation = [...leaves]
    .filter((leaf) => leaf.conditions.includes("types") || declarationTarget(leaf.target))
    .sort(compareConditionPaths)[0];
  if (documentation === undefined) {
    diagnostics.push(diagnostic(pkg, exportSubpath, "Missing documentation target."));
    return undefined;
  }
  const runtime = [...leaves]
    .filter((leaf) => !leaf.conditions.includes("types") && !declarationTarget(leaf.target))
    .sort((left, right) => {
      const shared =
        sharedConditionCount(documentation, right) - sharedConditionCount(documentation, left);
      return shared === 0 ? compareConditionPaths(left, right) : shared;
    })[0];
  if (runtime === undefined) {
    diagnostics.push(diagnostic(pkg, exportSubpath, "Missing runtime target."));
    return undefined;
  }
  return {
    documentation,
    runtime,
    mediaType: "text/typescript",
    activeConditions: uniqueConditions(documentation.conditions, runtime.conditions),
  };
};

const resolvePairs = (
  target: PackageExportTarget,
  pkg: PublishedPackage,
  exportSubpath: string,
  diagnostics: Array<PublishedGraphDiagnostic>,
): ReadonlyArray<ResolvedPair> => {
  if (!Array.isArray(target)) {
    const pair = resolveBranch(target, pkg, exportSubpath, diagnostics);
    return pair === undefined ? [] : [pair];
  }
  const pairs = target.flatMap((branch) => {
    if (branch === null) return [];
    const pair = resolveBranch(branch, pkg, exportSubpath, diagnostics);
    return pair === undefined ? [] : [pair];
  });
  if (pairs.length <= 1) return pairs;
  diagnostics.push(diagnostic(pkg, exportSubpath, "Two targets claim one consumer specifier."));
  return [];
};

const starCount = (value: string): number =>
  [...value].filter((character) => character === "*").length;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

const wildcardRegExp = (pattern: string): RegExp => {
  const star = pattern.indexOf("*");
  return new RegExp(
    `^${escapeRegExp(pattern.slice(0, star))}(.+)${escapeRegExp(pattern.slice(star + 1))}$`,
    "u",
  );
};

const substituteCapture = (pattern: string, capture: string): string =>
  pattern.replace("*", capture);

const absoluteTarget = (pkg: PublishedPackage, target: string): string | undefined => {
  if (!target.startsWith("./")) return undefined;
  const resolved = path.resolve(pkg.root, target);
  const relative = path.relative(pkg.root, resolved);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))
    ? resolved
    : undefined;
};

const matchExportSubpath = (exportSubpath: string, pattern: string): boolean => {
  if (!pattern.includes("*")) return exportSubpath === pattern;
  return wildcardRegExp(pattern).test(exportSubpath);
};

const compareExportPrecedence = (left: string, right: string): number => {
  const leftStar = left.indexOf("*");
  const rightStar = right.indexOf("*");
  if (leftStar < 0) return rightStar < 0 ? compareText(left, right) : -1;
  if (rightStar < 0) return 1;
  if (leftStar !== rightStar) return rightStar - leftStar;
  if (left.length !== right.length) return right.length - left.length;
  return compareText(left, right);
};

const winningExportSubpath = (
  exportSubpath: string,
  definitions: ReadonlyArray<ExportDefinition>,
): string | undefined =>
  definitions
    .map(({ subpath }) => subpath)
    .filter((pattern) => matchExportSubpath(exportSubpath, pattern))
    .sort(compareExportPrecedence)[0];

const validatePairShape = (
  pkg: PublishedPackage,
  exportSubpath: string,
  pair: ResolvedPair,
  diagnostics: Array<PublishedGraphDiagnostic>,
): boolean => {
  const exportStars = starCount(exportSubpath);
  const documentationStars = starCount(pair.documentation.target);
  const runtimeStars = starCount(pair.runtime.target);
  if (exportStars > 1 || documentationStars !== exportStars || runtimeStars !== exportStars) {
    diagnostics.push(
      diagnostic(
        pkg,
        exportSubpath,
        "Export, documentation, and runtime wildcard captures must correspond exactly.",
      ),
    );
    return false;
  }
  if (
    absoluteTarget(pkg, pair.documentation.target) === undefined ||
    absoluteTarget(pkg, pair.runtime.target) === undefined
  ) {
    diagnostics.push(
      diagnostic(pkg, exportSubpath, "Published targets must stay within the package root."),
    );
    return false;
  }
  return true;
};

const expandWildcardPair = (
  fileSystem: FileSystem.FileSystem,
  pkg: PublishedPackage,
  exportSubpath: string,
  pair: ResolvedPair,
  diagnostics: Array<PublishedGraphDiagnostic>,
) =>
  Effect.gen(function* () {
    const documentationPattern = pair.documentation.target;
    const star = documentationPattern.indexOf("*");
    const prefix = documentationPattern.slice(0, star);
    const scanRoot = path.resolve(pkg.root, path.dirname(prefix));
    if (!(yield* fileSystem.exists(scanRoot))) {
      diagnostics.push(diagnostic(pkg, exportSubpath, "Missing documentation target pattern."));
      return [] as ReadonlyArray<Candidate>;
    }
    const documentationExpression = wildcardRegExp(documentationPattern);
    const entries = (yield* fileSystem.readDirectory(scanRoot, { recursive: true })).sort();
    const candidates: Array<Candidate> = [];
    for (const entry of entries) {
      const documentationTarget = path.resolve(scanRoot, entry);
      const relativeDocumentation = `./${path.relative(pkg.root, documentationTarget).split(path.sep).join("/")}`;
      const capture = documentationExpression.exec(relativeDocumentation)?.[1];
      if (capture === undefined) continue;
      const concreteSubpath = substituteCapture(exportSubpath, capture);
      const runtimeRelative = substituteCapture(pair.runtime.target, capture);
      const runtimeTarget = absoluteTarget(pkg, runtimeRelative)!;
      if (!(yield* fileSystem.exists(runtimeTarget))) {
        diagnostics.push(
          diagnostic(pkg, concreteSubpath, `Missing runtime target ${runtimeRelative}.`),
        );
        continue;
      }
      candidates.push({
        sourceSubpath: exportSubpath,
        exportSubpath: concreteSubpath,
        documentationTarget,
        runtimeTarget,
        mediaType: pair.mediaType,
        activeConditions: pair.activeConditions,
      });
    }
    if (candidates.length === 0) {
      diagnostics.push(diagnostic(pkg, exportSubpath, "Missing documentation target pattern."));
    }
    return candidates;
  });

const expandExactPair = (
  fileSystem: FileSystem.FileSystem,
  pkg: PublishedPackage,
  exportSubpath: string,
  pair: ResolvedPair,
  diagnostics: Array<PublishedGraphDiagnostic>,
) =>
  Effect.gen(function* () {
    const documentationTarget = absoluteTarget(pkg, pair.documentation.target)!;
    const runtimeTarget = absoluteTarget(pkg, pair.runtime.target)!;
    let valid = true;
    if (!(yield* fileSystem.exists(documentationTarget))) {
      diagnostics.push(
        diagnostic(
          pkg,
          exportSubpath,
          `Missing documentation target ${pair.documentation.target}.`,
        ),
      );
      valid = false;
    }
    if (!(yield* fileSystem.exists(runtimeTarget))) {
      diagnostics.push(
        diagnostic(pkg, exportSubpath, `Missing runtime target ${pair.runtime.target}.`),
      );
      valid = false;
    }
    return valid
      ? [
          {
            sourceSubpath: exportSubpath,
            exportSubpath,
            documentationTarget,
            runtimeTarget,
            mediaType: pair.mediaType,
            activeConditions: pair.activeConditions,
          } satisfies Candidate,
        ]
      : [];
  });

export const resolvePublicModules = (pkg: PublishedPackage) =>
  Effect.gen(function* () {
    const fileSystem = yield* FileSystem.FileSystem;
    const diagnostics: Array<PublishedGraphDiagnostic> = [];
    const definitions = Object.entries(pkg.exports)
      .sort(([left], [right]) => compareText(left, right))
      .map(([subpath, target]): ExportDefinition => {
        if (subpath !== "." && !subpath.startsWith("./")) {
          diagnostics.push(diagnostic(pkg, subpath, "Invalid package export subpath."));
          return { subpath, pairs: [] };
        }
        return { subpath, pairs: resolvePairs(target, pkg, subpath, diagnostics) };
      });

    const candidates: Array<Candidate> = [];
    for (const definition of definitions) {
      for (const pair of definition.pairs) {
        if (!validatePairShape(pkg, definition.subpath, pair, diagnostics)) continue;
        const expanded = definition.subpath.includes("*")
          ? yield* expandWildcardPair(fileSystem, pkg, definition.subpath, pair, diagnostics)
          : yield* expandExactPair(fileSystem, pkg, definition.subpath, pair, diagnostics);
        candidates.push(...expanded);
      }
    }

    const selected = candidates.filter(
      (candidate) =>
        winningExportSubpath(candidate.exportSubpath, definitions) === candidate.sourceSubpath,
    );
    const bySpecifier = new Map<string, Array<Candidate>>();
    for (const candidate of selected) {
      const specifier = consumerSpecifier(pkg.name, candidate.exportSubpath);
      const existing = bySpecifier.get(specifier);
      if (existing === undefined) bySpecifier.set(specifier, [candidate]);
      else existing.push(candidate);
    }

    const modules: Array<PublicModuleTarget> = [];
    for (const [specifier, claimed] of [...bySpecifier].sort(([left], [right]) =>
      compareText(left, right),
    )) {
      const uniqueClaims = new Map(
        claimed.map((candidate) => [
          `${candidate.documentationTarget}\0${candidate.runtimeTarget}\0${candidate.activeConditions.join("\0")}`,
          candidate,
        ]),
      );
      if (uniqueClaims.size > 1) {
        diagnostics.push({
          packageName: pkg.name,
          consumerSpecifier: specifier,
          message: "Two targets claim one consumer specifier.",
        });
        continue;
      }
      const candidate = uniqueClaims.values().next().value!;
      modules.push({
        packageName: pkg.name,
        packageVersion: pkg.version,
        packageRoot: pkg.root,
        consumerSpecifier: specifier,
        exportSubpath: candidate.exportSubpath,
        documentationTarget: candidate.documentationTarget,
        runtimeTarget: candidate.runtimeTarget,
        mediaType: candidate.mediaType,
        activeConditions: candidate.activeConditions,
      });
    }

    if (diagnostics.length > 0) return yield* Effect.fail(new PublishedGraphError(diagnostics));
    return modules as ReadonlyArray<PublicModuleTarget>;
  }).pipe(
    Effect.mapError((error) =>
      error instanceof PublishedGraphError
        ? error
        : new PublishedGraphError([
            {
              packageName: pkg.name,
              consumerSpecifier: pkg.name,
              message: `Unable to resolve public modules: ${String(error)}`,
            },
          ]),
    ),
  );
