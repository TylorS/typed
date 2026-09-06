import type {
  DeclarationExposureRecord,
  ExpectedExposure,
  ExtractionDiagnostic,
  PublicApiExtraction,
} from "./Model.js";

export type CoverageDiagnosticCode =
  | ExtractionDiagnostic["code"]
  | "duplicate-expected-exposure"
  | "missing-exposure"
  | "unexpected-exposure"
  | "invalid-exposure-id"
  | "missing-declaration"
  | "alias-not-explicit"
  | "missing-import-source"
  | "missing-resource-record"
  | "unexpected-resource-record"
  | "duplicate-resource-record";

export interface CoverageDiagnostic {
  readonly code: CoverageDiagnosticCode;
  readonly packageName: string;
  readonly consumerSpecifier: string;
  readonly qualifiedName?: string;
  readonly declarationFamily?: DeclarationExposureRecord["family"];
  readonly id?: string;
  readonly message: string;
}

export type CoverageActual = Pick<
  PublicApiExtraction,
  "declarations" | "exposures" | "resources" | "diagnostics"
>;

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const sameUniqueStrings = (left: ReadonlyArray<string>, right: ReadonlyArray<string>): boolean => {
  if (new Set(left).size !== left.length || new Set(right).size !== right.length) return false;
  return (
    left.length === right.length &&
    [...left]
      .sort(compareText)
      .every((value, index) => value === [...right].sort(compareText)[index])
  );
};

const expectedDiagnostic = (
  code: CoverageDiagnosticCode,
  exposure: ExpectedExposure,
  message: string,
): CoverageDiagnostic => ({
  code,
  packageName: exposure.packageName,
  consumerSpecifier: exposure.consumerSpecifier,
  qualifiedName: exposure.qualifiedName,
  id: exposure.id,
  message,
});

const actualDiagnostic = (
  code: CoverageDiagnosticCode,
  exposure: PublicApiExtraction["exposures"][number],
  message: string,
): CoverageDiagnostic => ({
  code,
  packageName: exposure.packageName,
  consumerSpecifier: exposure.consumerSpecifier,
  qualifiedName: exposure.qualifiedName,
  ...(exposure.recordKind === "declaration" ? { declarationFamily: exposure.family } : {}),
  id: exposure.id,
  message,
});

const extractionDiagnostic = (diagnostic: ExtractionDiagnostic): CoverageDiagnostic => ({
  code: diagnostic.code,
  packageName: diagnostic.packageName,
  consumerSpecifier: diagnostic.consumerSpecifier,
  ...(diagnostic.qualifiedName === undefined
    ? {}
    : {
        qualifiedName: diagnostic.qualifiedName,
        id: `${diagnostic.consumerSpecifier}#${diagnostic.qualifiedName}`,
      }),
  ...(diagnostic.declarationFamily === undefined
    ? {}
    : { declarationFamily: diagnostic.declarationFamily }),
  message: diagnostic.message,
});

const advisoryExtractionCodes = new Set<ExtractionDiagnostic["code"]>([
  "missing-source-map-mapping",
]);

/**
 * Compares the independently discovered public exposure graph with the
 * normalized extraction and verifies the identity joins used by renderers.
 */
export const validateCoverage = (
  expected: ReadonlyArray<ExpectedExposure>,
  actual: CoverageActual,
): ReadonlyArray<CoverageDiagnostic> => {
  const diagnostics: Array<CoverageDiagnostic> = actual.diagnostics
    .filter(({ code }) => !advisoryExtractionCodes.has(code))
    .map(extractionDiagnostic);
  const expectedGroups = Map.groupBy(expected, ({ id }) => id);
  const actualGroups = Map.groupBy(actual.exposures, ({ id }) => id);

  for (const [id, group] of expectedGroups) {
    const exposure = group[0]!;
    if (group.length > 1) {
      diagnostics.push(
        expectedDiagnostic(
          "duplicate-expected-exposure",
          exposure,
          `The expected public graph contains ${group.length} entries for ${id}.`,
        ),
      );
    }
    if (!actualGroups.has(id)) {
      diagnostics.push(
        expectedDiagnostic(
          "missing-exposure",
          exposure,
          `The normalized model is missing public exposure ${id}.`,
        ),
      );
    }
  }

  for (const [id, group] of actualGroups) {
    const exposure = group[0]!;
    if (group.length > 1) {
      diagnostics.push(
        actualDiagnostic(
          "duplicate-exposure",
          exposure,
          `The normalized model contains ${group.length} records for ${id}.`,
        ),
      );
    }
    if (!expectedGroups.has(id)) {
      diagnostics.push(
        actualDiagnostic(
          "unexpected-exposure",
          exposure,
          `The normalized model contains non-public exposure ${id}.`,
        ),
      );
    }
    const stableId = `${exposure.consumerSpecifier}#${exposure.qualifiedName}`;
    if (exposure.id !== stableId) {
      diagnostics.push(
        actualDiagnostic(
          "invalid-exposure-id",
          exposure,
          `Exposure ID ${exposure.id} must equal ${stableId}.`,
        ),
      );
    }
  }

  const resourceExposures = Map.groupBy(
    actual.exposures.filter(({ recordKind }) => recordKind === "resource"),
    ({ id }) => id,
  );
  const resourceRecords = Map.groupBy(actual.resources, ({ id }) => id);
  for (const [id, group] of resourceExposures) {
    if (!resourceRecords.has(id)) {
      diagnostics.push(
        actualDiagnostic(
          "missing-resource-record",
          group[0]!,
          `Resource exposure ${id} is absent from the resource registry.`,
        ),
      );
    }
  }
  for (const [id, group] of resourceRecords) {
    const resource = group[0]!;
    if (group.length > 1) {
      diagnostics.push(
        actualDiagnostic(
          "duplicate-resource-record",
          resource,
          `The resource registry contains ${group.length} records for ${id}.`,
        ),
      );
    }
    if (!resourceExposures.has(id)) {
      diagnostics.push(
        actualDiagnostic(
          "unexpected-resource-record",
          resource,
          `Resource registry entry ${id} has no matching exposure.`,
        ),
      );
    }
  }

  const declarations = new Map(
    actual.declarations.map((declaration) => [declaration.declarationKey, declaration]),
  );
  const declarationExposures = actual.exposures.filter(
    (exposure): exposure is DeclarationExposureRecord => exposure.recordKind === "declaration",
  );
  for (const exposure of declarationExposures) {
    if (!declarations.has(exposure.declarationKey)) {
      diagnostics.push(
        actualDiagnostic(
          "missing-declaration",
          exposure,
          `Exposure ${exposure.id} refers to missing ${exposure.declarationKey}.`,
        ),
      );
    }
  }

  const byDeclaration = Map.groupBy(declarationExposures, ({ declarationKey }) => declarationKey);
  for (const group of byDeclaration.values()) {
    const ordered = [...group].sort((left, right) => compareText(left.id, right.id));
    for (const exposure of ordered) {
      const aliases = ordered.filter(({ id }) => id !== exposure.id).map(({ id }) => id);
      if (!sameUniqueStrings(exposure.aliases, aliases)) {
        diagnostics.push(
          actualDiagnostic(
            "alias-not-explicit",
            exposure,
            `Exposure ${exposure.id} must list every other exposure of ${exposure.declarationKey}.`,
          ),
        );
      }
      const importedDeclaration =
        exposure.importedFrom === undefined ? undefined : declarations.get(exposure.importedFrom);
      const importedExposure =
        exposure.importedFrom === undefined
          ? undefined
          : actualGroups.get(exposure.importedFrom)?.[0];
      const validDeclarationSource =
        importedDeclaration !== undefined &&
        importedDeclaration.declarationKey === exposure.declarationKey;
      const validExposureSource =
        importedExposure?.recordKind === "declaration" &&
        importedExposure.id !== exposure.id &&
        importedExposure.declarationKey === exposure.declarationKey;
      if (
        (exposure.isAlias && !validDeclarationSource && !validExposureSource) ||
        (!exposure.isAlias && exposure.importedFrom !== undefined)
      ) {
        diagnostics.push(
          actualDiagnostic(
            "missing-import-source",
            exposure,
            `Alias provenance for ${exposure.id} must join an existing exposure or its exact ${exposure.declarationKey}.`,
          ),
        );
      }
    }
  }

  const seen = new Set<string>();
  return diagnostics
    .filter((diagnostic) => {
      const key = [diagnostic.code, diagnostic.id, diagnostic.message].join("\0");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) =>
      compareText(
        `${left.packageName}\0${left.consumerSpecifier}\0${left.qualifiedName ?? ""}\0${left.code}\0${left.message}`,
        `${right.packageName}\0${right.consumerSpecifier}\0${right.qualifiedName ?? ""}\0${right.code}\0${right.message}`,
      ),
    );
};
