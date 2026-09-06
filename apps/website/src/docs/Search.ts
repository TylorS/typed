import type { DocumentationModel, ReferenceInventory } from "./Model.js";
import { referencePath } from "./Reference.js";

export type SearchEntryKind = "package" | "module" | "exposure" | "resource" | "guide" | "glossary";

export interface SearchEntry {
  readonly id: string;
  readonly canonicalId?: string;
  readonly declarationKey?: string;
  readonly title: string;
  readonly kind: SearchEntryKind;
  readonly text: string;
  readonly href: string;
  readonly specifier?: string;
  readonly description?: string;
  readonly section?: string;
  /** Related destinations for a module's concept; never a declaration identity. */
  readonly topicId?: string;
  readonly destination?: string;
}

export const canonicalExposureIds = (inventory: ReferenceInventory): ReadonlyMap<string, string> =>
  new Map(
    [
      ...Map.groupBy(
        inventory.exposures.filter(
          (
            exposure,
          ): exposure is Extract<
            ReferenceInventory["exposures"][number],
            { readonly recordKind: "declaration" }
          > => exposure.recordKind === "declaration",
        ),
        (exposure) => exposure.declarationKey,
      ),
    ].map(([declarationKey, exposures]) => {
      const candidates = exposures.some(({ isAlias }) => !isAlias)
        ? exposures.filter(({ isAlias }) => !isAlias)
        : exposures;
      return [
        declarationKey,
        candidates.toSorted(
          (left, right) => left.id.length - right.id.length || left.id.localeCompare(right.id),
        )[0]!.id,
      ];
    }),
  );

export interface SearchResult extends SearchEntry {
  readonly score: number;
  readonly related?: ReadonlyArray<SearchEntry>;
}

export interface SearchArtifact {
  readonly schemaVersion: 1;
  readonly entries: ReadonlyArray<SearchEntry>;
  readonly prefixes: Readonly<Record<string, ReadonlyArray<number>>>;
  readonly trigrams: Readonly<Record<string, ReadonlyArray<number>>>;
}

const normalize = (value: string): string =>
  value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9@]+/g, " ")
    .trim();

const distance = (left: string, right: string): number => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from<number>({ length: right.length + 1 });

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
    current[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1]! + 1,
        previous[rightIndex]! + 1,
        previous[rightIndex - 1]! + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length]!;
};

const similarity = (left: string, right: string): number => {
  if (left === right) return 1;
  if (right.startsWith(left)) {
    const lengthRatio = Math.min(left.length, right.length) / Math.max(left.length, right.length);
    return 0.75 + lengthRatio * 0.25;
  }
  if (left.startsWith(right)) return right.length / left.length;
  // Length alone rules out this fuzzy match. Avoid an edit-distance matrix for
  // the many prose words that could never meet the search threshold.
  if (Math.min(left.length, right.length) / Math.max(left.length, right.length) < 0.65) return 0;
  return 1 - distance(left, right) / Math.max(left.length, right.length);
};

const fuzzyScore = (
  queryTokens: ReadonlyArray<string>,
  candidateTokens: ReadonlyArray<string>,
): number | undefined => {
  let score = 0;
  for (const queryToken of queryTokens) {
    if (candidateTokens.includes(queryToken)) {
      score += 25;
      continue;
    }
    let best = 0;
    for (const candidate of candidateTokens)
      best = Math.max(best, similarity(queryToken, candidate));
    if (best < 0.65) return undefined;
    score += best * 25;
  }
  return score;
};

export const buildSearchIndex = (
  model: DocumentationModel,
  inventory?: ReferenceInventory,
  additionalEntries: ReadonlyArray<SearchEntry> = [],
): ReadonlyArray<SearchEntry> => {
  const editorial: ReadonlyArray<SearchEntry> = [
    ...model.guides.map((guide) => ({
      id: `guide:${guide.slug}`,
      title: guide.title,
      kind: "guide" as const,
      href: `/explore/${guide.slug}`,
      text: [guide.title, guide.summary, ...guide.headings].join(" "),
      description: guide.summary,
      section: guide.section,
    })),
    ...model.glossary.map((entry) => ({
      id: `glossary:${entry.id}`,
      title: entry.term,
      kind: "glossary" as const,
      href: `/glossary#${entry.id}`,
      text: [entry.term, ...entry.aliases, entry.definition].join(" "),
      description: entry.definition,
      destination: "Definition",
    })),
  ];
  if (inventory === undefined) {
    return [
      ...editorial,
      ...model.symbols.map((symbol) => ({
        id: symbol.id,
        title: symbol.exportName,
        kind: (symbol.kind === "resource" ? "resource" : "exposure") as SearchEntryKind,
        href: referencePath(symbol.id),
        text: [symbol.id, symbol.exportName, symbol.summary, symbol.category ?? ""].join(" "),
      })),
      ...additionalEntries,
    ];
  }
  const declarations = new Map(
    inventory.declarations.map((declaration) => [declaration.declarationKey, declaration]),
  );
  const canonicalByDeclaration = canonicalExposureIds(inventory);
  const modules = new Map(inventory.modules.map((module) => [module.consumerSpecifier, module]));
  const moduleTitles = Map.groupBy(inventory.modules, ({ consumerSpecifier }) =>
    consumerSpecifier.split("/").at(-1)!,
  );
  // A namespace export points at a module, while its same-named type describes that
  // module's main value. Show their separate destinations together without claiming
  // they are the same declaration. Resolve the export, not just its display name.
  const namespaceModule = (
    exposure: ReferenceInventory["exposures"][number],
  ): string | undefined => {
    if (
      exposure.recordKind !== "declaration" ||
      exposure.family !== "namespace" ||
      !exposure.isAlias
    )
      return;
    for (const signature of exposure.signatures) {
      const relative = /^export\s+\*\s+as\s+\w+\s+from\s+["'](\.[^"']+)["']/u.exec(signature)?.[1];
      if (relative === undefined) continue;
      const parts = (
        exposure.consumerSpecifier === exposure.packageName
          ? exposure.packageName
          : exposure.consumerSpecifier.slice(0, exposure.consumerSpecifier.lastIndexOf("/"))
      ).split("/");
      for (const part of relative.replace(/\.[cm]?[jt]s$/u, "").split("/")) {
        if (part === "..") parts.pop();
        else if (part !== ".") parts.push(part);
      }
      const target = parts.join("/");
      if (modules.has(target)) return `module:${target}`;
    }
  };
  return [
    ...editorial.map((entry) => {
      // A glossary definition may accompany a uniquely named module concept. If
      // more than one package uses that name, keep the definition independent.
      const candidates = entry.kind === "glossary" ? moduleTitles.get(entry.title) : undefined;
      return candidates?.length === 1
        ? { ...entry, topicId: `module:${candidates[0]!.consumerSpecifier}` }
        : entry;
    }),
    ...inventory.packages.map((pkg) => ({
      id: `package:${pkg.packageName}`,
      title: pkg.packageName,
      kind: "package" as const,
      href: `/reference/packages/${encodeURI(pkg.packageName)}`,
      text: `${pkg.packageName} ${pkg.packageVersion}`,
    })),
    ...inventory.modules.map((module) => ({
      id: `module:${module.consumerSpecifier}`,
      title: module.consumerSpecifier.split("/").at(-1)!,
      kind: "module" as const,
      topicId: `module:${module.consumerSpecifier}`,
      specifier: module.consumerSpecifier,
      destination: "Module",
      href: `/reference/modules/${encodeURI(module.consumerSpecifier)}`,
      text: [
        module.consumerSpecifier,
        module.packageName,
        module.exportSubpath,
        ...module.categories.map(({ name }) => name),
      ].join(" "),
    })),
    ...inventory.exposures.map((exposure) => {
      const declaration =
        exposure.recordKind === "declaration"
          ? declarations.get(exposure.declarationKey)
          : undefined;
      return {
        id: exposure.id,
        canonicalId:
          exposure.recordKind === "resource"
            ? exposure.id
            : canonicalByDeclaration.get(exposure.declarationKey),
        declarationKey: exposure.recordKind === "declaration" ? exposure.declarationKey : undefined,
        title: exposure.qualifiedName,
        kind: exposure.recordKind === "resource" ? ("resource" as const) : ("exposure" as const),
        href: referencePath(exposure.id),
        specifier: exposure.consumerSpecifier,
        description: declaration?.summary,
        section: declaration?.category,
        topicId:
          namespaceModule(exposure) ??
          (exposure.qualifiedName === exposure.consumerSpecifier.split("/").at(-1)
            ? `module:${exposure.consumerSpecifier}`
            : undefined),
        destination:
          exposure.recordKind === "declaration" && exposure.family === "namespace"
            ? `Import from ${exposure.consumerSpecifier}`
            : "API reference",
        text: [
          exposure.id,
          exposure.packageName,
          exposure.consumerSpecifier,
          exposure.exportName,
          exposure.qualifiedName,
          exposure.family,
          ...exposure.aliases,
          declaration?.name ?? "",
          declaration?.summary ?? "",
          declaration?.category ?? "",
          declaration?.since ?? "",
          declaration?.stability ?? "",
        ].join(" "),
      };
    }),
    ...additionalEntries,
  ];
};

const grams = (token: string): ReadonlyArray<string> => {
  const padded = `  ${token}  `;
  return token.length < 3
    ? [token]
    : [
        ...new Set(
          Array.from({ length: padded.length - 2 }, (_, index) => padded.slice(index, index + 3)),
        ),
      ];
};

const addPosting = (index: Map<string, Set<number>>, key: string, entry: number): void => {
  const existing = index.get(key);
  if (existing === undefined) index.set(key, new Set([entry]));
  else existing.add(entry);
};

const postings = (
  index: Map<string, Set<number>>,
): Readonly<Record<string, ReadonlyArray<number>>> =>
  Object.fromEntries(
    [...index]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, values]) => [key, [...values].sort((left, right) => left - right)]),
  );

/** Precomputes bounded candidate indexes so consumers never scan the full corpus per query. */
export const buildSearchArtifact = (
  model: DocumentationModel,
  inventory?: ReferenceInventory,
  additionalEntries: ReadonlyArray<SearchEntry> = [],
): SearchArtifact => {
  const entries = buildSearchIndex(model, inventory, additionalEntries);
  const prefixes = new Map<string, Set<number>>();
  const trigrams = new Map<string, Set<number>>();
  entries.forEach((entry, entryIndex) => {
    const titleTokens = [
      ...new Set(normalize(`${entry.id} ${entry.title}`).split(" ").filter(Boolean)),
    ];
    const tokens = [
      ...new Set([...titleTokens, ...normalize(entry.text).split(" ").filter(Boolean)]),
    ];
    for (const token of tokens) {
      for (let length = 1; length <= Math.min(token.length, 8); length++) {
        addPosting(prefixes, token.slice(0, length), entryIndex);
      }
    }
    for (const token of titleTokens)
      for (const gram of grams(token)) addPosting(trigrams, gram, entryIndex);
  });
  return { schemaVersion: 1, entries, prefixes: postings(prefixes), trigrams: postings(trigrams) };
};

const candidatesFor = (
  artifact: SearchArtifact,
  tokens: ReadonlyArray<string>,
): ReadonlyArray<SearchEntry> => {
  const candidates = new Set<number>();
  for (const token of tokens) {
    for (const index of artifact.prefixes[token.slice(0, 8)] ?? artifact.prefixes[token] ?? [])
      candidates.add(index);
    for (const gram of grams(token)) {
      for (const index of artifact.trigrams[gram] ?? []) candidates.add(index);
    }
  }
  return [...candidates]
    .sort((left, right) => left - right)
    .flatMap((index) => {
      const entry = artifact.entries[index];
      return entry === undefined ? [] : [entry];
    });
};

export const searchDocumentation = (
  index: ReadonlyArray<SearchEntry> | SearchArtifact,
  query: string,
  limit = 20,
): ReadonlyArray<SearchResult> => {
  const normalized = normalize(query);
  if (!normalized) return [];
  const tokens = normalized.split(" ");
  const entries = Array.isArray(index) ? index : candidatesFor(index as SearchArtifact, tokens);
  const entriesById = new Map(
    (Array.isArray(index) ? index : (index as SearchArtifact).entries).map((entry) => [
      entry.id,
      entry,
    ]),
  );
  const ranked = entries
    .flatMap((entry): ReadonlyArray<SearchResult> => {
      // A namespace re-export such as RefSubject.map must not make `map` an
      // exact title match for a query about RefSubject itself.
      const canonical =
        entry.canonicalId === undefined ? undefined : entriesById.get(entry.canonicalId);
      const title = normalize(canonical?.title ?? entry.title);
      const text = normalize(`${entry.text} ${entry.id} ${entry.specifier ?? ""}`);
      const candidateTokens = [...new Set(`${title} ${text}`.split(" "))];
      const fuzzy = fuzzyScore(tokens, candidateTokens);
      if (fuzzy === undefined) return [];
      let score =
        fuzzy + tokens.reduce((sum, token) => sum + (title.startsWith(token) ? 20 : 1), 0);
      const titleFuzzy = fuzzyScore(tokens, title.split(" "));
      if (titleFuzzy !== undefined) {
        score += titleFuzzy * 4 + (entry.kind === "exposure" || entry.kind === "resource" ? 5 : 0);
      }
      if (title === normalized)
        score += 200 + (entry.kind === "exposure" || entry.kind === "resource" ? 10 : 0);
      else if (tokens.length === 1 && !title.includes(" ") && titleFuzzy !== undefined) score += 35;
      if (tokens.every((token) => title.split(" ").includes(token))) score += 30;
      if (text.includes(normalized)) score += 40;
      if (entry.kind === "guide") score += 30;
      else if (entry.kind === "glossary") score += 1;
      if (entry.id === query.trim()) score += 1000;
      else if (entry.specifier === query.trim()) score += entry.kind === "module" ? 500 : 50;
      return [{ ...entry, score }];
    })
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
  const exactIds = new Set(
    ranked
      .filter((entry) => {
        const exactQuery = query.trim();
        if (entry.id === exactQuery || entry.specifier === exactQuery) return true;
        if (entry.kind === "package") return entry.id.slice("package:".length) === exactQuery;
        if (entry.kind === "module") return entry.id.slice("module:".length) === exactQuery;
        return false;
      })
      .map(({ id }) => id),
  );
  const exactCanonicalIds = new Set(
    ranked
      .filter(({ id }) => exactIds.has(id))
      .flatMap(({ canonicalId }) => (canonicalId === undefined ? [] : [canonicalId])),
  );
  const grouped = new Map<string, SearchResult>();
  for (const result of ranked) {
    const isExact = exactIds.has(result.id);
    if (!isExact && result.canonicalId !== undefined && exactCanonicalIds.has(result.canonicalId)) {
      continue;
    }
    const key = isExact ? `exact:${result.id}` : (result.canonicalId ?? result.id);
    if (grouped.has(key)) continue;
    const preferred =
      isExact || result.canonicalId === undefined
        ? result
        : (entriesById.get(result.canonicalId) ?? result);
    grouped.set(key, { ...preferred, score: result.score });
  }
  const topics = new Map<string, SearchResult[]>();
  for (const result of grouped.values()) {
    const key = result.topicId ?? result.id;
    const existing = topics.get(key);
    if (existing === undefined) topics.set(key, [result]);
    else existing.push(result);
  }
  return [...topics.entries()]
    .map(([key, matches]) => {
      const best = matches[0]!;
      if (best.topicId === undefined) return best;
      const destinations = [...entriesById.values()].filter((entry) => entry.topicId === key);
      const exact = matches.find((entry) => entry.id === query.trim());
      const preferred = exact ?? destinations.find((entry) => entry.kind === "module") ?? best;
      const seen = new Set([preferred.canonicalId ?? preferred.id]);
      const related = destinations
        .filter((entry) => {
          const id = entry.canonicalId ?? entry.id;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        })
        .sort((left, right) => {
          const priority = (entry: SearchEntry) =>
            entry.kind === "glossary" ? 0 : entry.destination === "API reference" ? 1 : 2;
          return priority(left) - priority(right) || left.id.localeCompare(right.id);
        });
      return {
        ...preferred,
        score: Math.max(...matches.map(({ score }) => score)),
        description:
          preferred.description ??
          destinations.find((entry) => entry.kind === "glossary")?.description,
        related,
      };
    })
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, limit);
};
