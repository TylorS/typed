import { Schema } from "effect";

export type PackageExportTarget =
  | string
  | null
  | ReadonlyArray<PackageExportTarget>
  | PackageExportConditions;

export interface PackageExportConditions {
  readonly [condition: string]: PackageExportTarget;
}

export interface PublishedPackage {
  readonly name: string;
  readonly version: string;
  readonly root: string;
  readonly exports: Readonly<Record<string, PackageExportTarget>>;
}

export interface PublicModuleTarget {
  readonly packageName: string;
  readonly packageVersion: string;
  readonly packageRoot: string;
  readonly consumerSpecifier: string;
  readonly exportSubpath: string;
  readonly documentationTarget: string;
  readonly runtimeTarget: string;
  readonly mediaType: "application/json" | "text/typescript";
  readonly activeConditions: ReadonlyArray<string>;
}

export interface PublishedGraphDiagnostic {
  readonly packageName: string;
  readonly consumerSpecifier: string;
  readonly message: string;
}

export const SourceLocationSchema = Schema.Struct({
  file: Schema.String,
  line: Schema.Number,
});
export type SourceLocation = typeof SourceLocationSchema.Type;

export const DocumentationExampleSchema = Schema.Struct({
  language: Schema.String,
  code: Schema.String,
});
export type DocumentationExample = typeof DocumentationExampleSchema.Type;

export const DocumentationRelationSchema = Schema.Struct({
  kind: Schema.Literals(["glossary", "guide", "symbol"]),
  target: Schema.String,
});
export type DocumentationRelation = typeof DocumentationRelationSchema.Type;

export const SourcePositionSchema = Schema.Struct({
  line: Schema.Number,
  column: Schema.Number,
});
export type SourcePosition = typeof SourcePositionSchema.Type;

export const SourceSpanSchema = Schema.Struct({
  file: Schema.String,
  start: SourcePositionSchema,
  end: SourcePositionSchema,
});
export type SourceSpan = typeof SourceSpanSchema.Type;

export const DeclarationFamilySchema = Schema.Literals([
  "function",
  "variable",
  "class",
  "interface",
  "type-alias",
  "enum",
  "namespace",
  "constructor",
  "method",
  "property",
  "accessor",
  "call-signature",
  "construct-signature",
  "index-signature",
  "enum-member",
  "unsupported",
]);
export type DeclarationFamily = typeof DeclarationFamilySchema.Type;

export const DeclarationFacetSchema = Schema.Struct({
  family: DeclarationFamilySchema,
  syntaxKind: Schema.String,
  signatures: Schema.Array(Schema.String),
  typeParameters: Schema.Array(Schema.String),
  sourceSpans: Schema.Array(SourceSpanSchema),
  static: Schema.Boolean,
  readonly: Schema.Boolean,
  optional: Schema.Boolean,
});
export type DeclarationFacet = typeof DeclarationFacetSchema.Type;

/** Authored facts shared by every consumer-facing exposure of one declaration. */
export const DeclarationRecordSchema = Schema.Struct({
  declarationKey: Schema.String,
  name: Schema.String,
  family: DeclarationFamilySchema,
  facets: Schema.Array(DeclarationFacetSchema),
  signatures: Schema.Array(Schema.String),
  typeParameters: Schema.Array(Schema.String),
  summary: Schema.String,
  sections: Schema.Record(Schema.String, Schema.String),
  examples: Schema.Array(DocumentationExampleSchema),
  sourceSpans: Schema.Array(SourceSpanSchema),
  since: Schema.optionalKey(Schema.String),
  category: Schema.optionalKey(Schema.String),
  stability: Schema.optionalKey(Schema.String),
  deprecated: Schema.optionalKey(Schema.String),
});
export type DeclarationRecord = typeof DeclarationRecordSchema.Type;

export const ExtractionDiagnosticCodeSchema = Schema.Literals([
  "missing-tsconfig",
  "invalid-tsconfig",
  "missing-module",
  "missing-module-symbol",
  "missing-declaration-map",
  "invalid-declaration-map",
  "missing-source-map-mapping",
  "missing-source",
  "source-outside-repository",
  "published-internal",
  "unsupported-declaration",
  "duplicate-exposure",
  "invalid-resource",
]);
export type ExtractionDiagnosticCode = typeof ExtractionDiagnosticCodeSchema.Type;

export const ExtractionDiagnosticSchema = Schema.Struct({
  code: ExtractionDiagnosticCodeSchema,
  packageName: Schema.String,
  consumerSpecifier: Schema.String,
  qualifiedName: Schema.optionalKey(Schema.String),
  declarationFamily: Schema.optionalKey(DeclarationFamilySchema),
  message: Schema.String,
});
export type ExtractionDiagnostic = typeof ExtractionDiagnosticSchema.Type;

export const ExpectedExposureSchema = Schema.Struct({
  id: Schema.String,
  packageName: Schema.String,
  consumerSpecifier: Schema.String,
  qualifiedName: Schema.String,
});
export type ExpectedExposure = typeof ExpectedExposureSchema.Type;

/** A public path to a declaration. Prose remains canonical on `DeclarationRecord`. */
export const DeclarationExposureRecordSchema = Schema.Struct({
  recordKind: Schema.Literal("declaration"),
  id: Schema.String,
  packageName: Schema.String,
  packageVersion: Schema.String,
  moduleName: Schema.String,
  consumerSpecifier: Schema.String,
  exportName: Schema.String,
  qualifiedName: Schema.String,
  declarationKey: Schema.String,
  family: DeclarationFamilySchema,
  signatures: Schema.Array(Schema.String),
  sourceSpans: Schema.Array(SourceSpanSchema),
  aliases: Schema.Array(Schema.String),
  isAlias: Schema.Boolean,
  importedFrom: Schema.optionalKey(Schema.String),
  parentId: Schema.optionalKey(Schema.String),
  static: Schema.Boolean,
});
export type DeclarationExposureRecord = typeof DeclarationExposureRecordSchema.Type;

/** A non-TypeScript published artifact represented as the `$resource` exposure. */
export const ResourceRecordSchema = Schema.Struct({
  recordKind: Schema.Literal("resource"),
  id: Schema.String,
  packageName: Schema.String,
  packageVersion: Schema.String,
  moduleName: Schema.String,
  consumerSpecifier: Schema.String,
  exportName: Schema.Literal("$resource"),
  qualifiedName: Schema.Literal("$resource"),
  family: Schema.Literal("resource"),
  mediaType: Schema.String,
  raw: Schema.String,
  structured: Schema.Unknown,
  extends: Schema.Array(Schema.String),
  compilerOptions: Schema.Record(Schema.String, Schema.Unknown),
  usage: Schema.String,
  sourceSpans: Schema.Array(SourceSpanSchema),
  aliases: Schema.Array(Schema.String),
  isAlias: Schema.Boolean,
});
export type ResourceRecord = typeof ResourceRecordSchema.Type;

export const ExposureRecordSchema = Schema.Union([
  DeclarationExposureRecordSchema,
  ResourceRecordSchema,
]);
export type ExposureRecord = typeof ExposureRecordSchema.Type;

export const PublicApiExtractionSchema = Schema.Struct({
  declarations: Schema.Array(DeclarationRecordSchema),
  exposures: Schema.Array(ExposureRecordSchema),
  resources: Schema.Array(ResourceRecordSchema),
  expectedExposures: Schema.Array(ExpectedExposureSchema),
  diagnostics: Schema.Array(ExtractionDiagnosticSchema),
});
export type PublicApiExtraction = typeof PublicApiExtractionSchema.Type;

export const GuideDocumentationSchema = Schema.Struct({
  slug: Schema.String,
  title: Schema.String,
  summary: Schema.String,
  section: Schema.optionalKey(Schema.String),
  kind: Schema.optionalKey(Schema.Literals(["concept", "guide", "deep-dive"])),
  order: Schema.optionalKey(Schema.Number),
  headings: Schema.Array(Schema.String),
  body: Schema.String,
  relations: Schema.Array(DocumentationRelationSchema),
});
export type GuideDocumentation = typeof GuideDocumentationSchema.Type;

export const GlossaryEntrySchema = Schema.Struct({
  id: Schema.String,
  term: Schema.String,
  aliases: Schema.Array(Schema.String),
  definition: Schema.String,
  details: Schema.String,
  related: Schema.Array(Schema.String),
  links: Schema.Array(Schema.String),
});
export type GlossaryEntry = typeof GlossaryEntrySchema.Type;

export const ModuleDocumentationSchema = Schema.Struct({
  name: Schema.String,
  exportPath: Schema.String,
  sourceFile: Schema.String,
});
export type ModuleDocumentation = typeof ModuleDocumentationSchema.Type;

export const SymbolDocumentationSchema = Schema.Struct({
  id: Schema.String,
  packageName: Schema.String,
  moduleName: Schema.String,
  exportName: Schema.String,
  kind: Schema.Literals(["class", "constant", "function", "interface", "resource", "type"]),
  signatures: Schema.Array(Schema.String),
  summary: Schema.String,
  sections: Schema.Record(Schema.String, Schema.String),
  examples: Schema.Array(DocumentationExampleSchema),
  relations: Schema.Array(DocumentationRelationSchema),
  source: SourceLocationSchema,
  since: Schema.optionalKey(Schema.String),
  category: Schema.optionalKey(Schema.String),
});
export type SymbolDocumentation = typeof SymbolDocumentationSchema.Type;

/** Complete normalized payload for generated symbol documentation and JSON artifacts. */
export const ExposurePayloadSchema = Schema.Struct({
  id: Schema.String,
  canonicalId: Schema.String,
  symbol: SymbolDocumentationSchema,
  exposure: ExposureRecordSchema,
  declaration: Schema.optionalKey(DeclarationRecordSchema),
});
export type ExposurePayload = typeof ExposurePayloadSchema.Type;

export const PackageDocumentationSchema = Schema.Struct({
  packageName: Schema.String,
  version: Schema.String,
  modules: Schema.Array(ModuleDocumentationSchema),
  symbols: Schema.Array(SymbolDocumentationSchema),
});
export type PackageDocumentation = typeof PackageDocumentationSchema.Type;

export const ReferenceCategorySchema = Schema.Struct({
  name: Schema.String,
  exposureIds: Schema.Array(Schema.String),
});
export type ReferenceCategory = typeof ReferenceCategorySchema.Type;

export const ReferenceModuleSchema = Schema.Struct({
  packageName: Schema.String,
  packageVersion: Schema.String,
  consumerSpecifier: Schema.String,
  exportSubpath: Schema.String,
  mediaType: Schema.Literals(["application/json", "text/typescript"]),
  categories: Schema.Array(ReferenceCategorySchema),
  exposureIds: Schema.Array(Schema.String),
  uniqueExportCount: Schema.Number,
});
export type ReferenceModule = typeof ReferenceModuleSchema.Type;

export const ReferenceModuleGroupSchema = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  summary: Schema.optionalKey(Schema.String),
  modules: Schema.Array(
    Schema.Struct({
      consumerSpecifier: Schema.String,
      exposureIds: Schema.Array(Schema.String),
    }),
  ),
});
export type ReferenceModuleGroup = typeof ReferenceModuleGroupSchema.Type;

export const ReferencePackageSchema = Schema.Struct({
  packageName: Schema.String,
  packageVersion: Schema.String,
  moduleSpecifiers: Schema.Array(Schema.String),
  moduleGroups: Schema.Array(ReferenceModuleGroupSchema),
  exposureIds: Schema.Array(Schema.String),
  uniqueExportCount: Schema.Number,
});
export type ReferencePackage = typeof ReferencePackageSchema.Type;

export const ReferenceRouteSchema = Schema.Struct({
  kind: Schema.Literals(["package", "module", "exposure"]),
  id: Schema.String,
  canonicalPath: Schema.String,
  markdownPath: Schema.String,
  jsonPath: Schema.String,
});
export type ReferenceRoute = typeof ReferenceRouteSchema.Type;

export const ReferenceInventorySchema = Schema.Struct({
  uniqueExportCount: Schema.Number,
  packages: Schema.Array(ReferencePackageSchema),
  modules: Schema.Array(ReferenceModuleSchema),
  declarations: Schema.Array(DeclarationRecordSchema),
  exposures: Schema.Array(ExposureRecordSchema),
  resources: Schema.Array(ResourceRecordSchema),
  routes: Schema.Array(ReferenceRouteSchema),
});
export type ReferenceInventory = typeof ReferenceInventorySchema.Type;

export const DocumentationModelSchema = Schema.Struct({
  schemaVersion: Schema.Literal(1),
  repositoryRevision: Schema.String,
  packages: Schema.Array(PackageDocumentationSchema),
  guides: Schema.Array(GuideDocumentationSchema),
  glossary: Schema.Array(GlossaryEntrySchema),
  symbols: Schema.Array(SymbolDocumentationSchema),
});
export type DocumentationModel = typeof DocumentationModelSchema.Type;
