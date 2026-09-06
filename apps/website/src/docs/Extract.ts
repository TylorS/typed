import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import ts from "typescript-compiler";
import type {
  DeclarationExposureRecord,
  DeclarationFacet,
  DeclarationFamily,
  DeclarationRecord,
  DocumentationExample,
  ExpectedExposure,
  ExposureRecord,
  ExtractionDiagnostic,
  ModuleDocumentation,
  PackageDocumentation,
  PublicApiExtraction,
  PublicModuleTarget,
  ResourceRecord,
  SourceSpan,
  SymbolDocumentation,
} from "./Model.js";

interface PackageManifest {
  readonly name: string;
  readonly version: string;
  readonly exports: Readonly<Record<string, string | Readonly<Record<string, string>>>>;
}

const textOfTag = (tag: ts.JSDocTagInfo): string => {
  const text = tag.text as string | Array<ts.SymbolDisplayPart> | undefined;
  if (typeof text === "string") return text.trim();
  return ts.displayPartsToString(text).trim();
};

const resolveExport = (
  packageRoot: string,
  target: string | Readonly<Record<string, string>>,
): string => {
  const relative =
    typeof target === "string" ? target : (target.types ?? target.import ?? target.default);
  if (relative === undefined) {
    throw new Error("Every package export must provide a types, import, or default target.");
  }
  return path.resolve(packageRoot, relative);
};

interface DeclarationMap {
  readonly sources?: ReadonlyArray<string>;
}

/**
 * Follow the declaration map back to the authored entrypoint while retaining
 * the package export map as the definition of the public surface.
 */
const resolveAuthoredEntrypoint = (declarationFile: string): string => {
  const mapFile = `${declarationFile}.map`;
  if (!fs.existsSync(mapFile)) return declarationFile;

  const declarationMap = JSON.parse(fs.readFileSync(mapFile, "utf8")) as DeclarationMap;
  const source = declarationMap.sources?.[0];
  if (source === undefined) return declarationFile;

  const authored = path.resolve(path.dirname(mapFile), source);
  return fs.existsSync(authored) ? authored : declarationFile;
};

const moduleNameOf = (exportPath: string): string =>
  exportPath === "." ? "." : exportPath.replace(/^\.\//, "");

const parseSections = (remarks: string): Readonly<Record<string, string>> => {
  const sections: Record<string, string> = {};
  const headings = [...remarks.matchAll(/^##\s+(.+?)\s*$/gm)];
  for (const [index, heading] of headings.entries()) {
    const bodyStart = heading.index! + heading[0].length;
    const bodyEnd = headings[index + 1]?.index ?? remarks.length;
    sections[heading[1]!.trim()] = remarks.slice(bodyStart, bodyEnd).trim();
  }
  return sections;
};

const parseExample = (text: string): DocumentationExample => {
  const fenced = text.match(/^```([^\n]*)\n([\s\S]*?)\n?```$/);
  return fenced === null
    ? { language: "text", code: text.trim() }
    : { language: fenced[1]!.trim() || "text", code: fenced[2]!.trim() };
};

const kindOf = (declaration: ts.Declaration): SymbolDocumentation["kind"] | undefined => {
  if (ts.isFunctionDeclaration(declaration)) return "function";
  if (ts.isClassDeclaration(declaration)) return "class";
  if (ts.isInterfaceDeclaration(declaration)) return "interface";
  if (ts.isTypeAliasDeclaration(declaration)) return "type";
  if (ts.isVariableDeclaration(declaration)) return "constant";
  return undefined;
};

const declarationsOf = (symbol: ts.Symbol): ReadonlyArray<ts.Declaration> =>
  symbol.getDeclarations() ?? [];

const aliasedSymbol = (checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol =>
  symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;

const signatureDeclarations = (
  declarations: ReadonlyArray<ts.Declaration>,
): ReadonlyArray<ts.SignatureDeclaration> => {
  const functions = declarations.filter(ts.isFunctionDeclaration);
  if (functions.length === 0) return [];
  const overloads = functions.filter((declaration) => declaration.body === undefined);
  return overloads.length === 0 ? functions : overloads;
};

const signaturesOf = (
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
  declarations: ReadonlyArray<ts.Declaration>,
): ReadonlyArray<string> => {
  const functionDeclarations = signatureDeclarations(declarations);
  if (functionDeclarations.length > 0) {
    return functionDeclarations.map((declaration) => {
      const signature = checker.getSignatureFromDeclaration(declaration);
      return signature === undefined
        ? declaration.getText()
        : `${symbol.getName()}${checker.signatureToString(signature, declaration, ts.TypeFormatFlags.NoTruncation)}`;
    });
  }

  const declaration = declarations[0];
  if (declaration === undefined) return [];
  if (ts.isInterfaceDeclaration(declaration) || ts.isClassDeclaration(declaration)) {
    const typeParameters =
      declaration.typeParameters?.map((parameter) => parameter.getText()) ?? [];
    const heritage = declaration.heritageClauses?.map((clause) => clause.getText()) ?? [];
    const keyword = ts.isInterfaceDeclaration(declaration) ? "interface" : "class";
    return [
      `${keyword} ${symbol.getName()}${typeParameters.length === 0 ? "" : `<${typeParameters.join(", ")}>`}${heritage.length === 0 ? "" : ` ${heritage.join(" ")}`}`,
    ];
  }
  if (ts.isTypeAliasDeclaration(declaration)) {
    const typeParameters =
      declaration.typeParameters?.map((parameter) => parameter.getText()) ?? [];
    return [
      `type ${symbol.getName()}${typeParameters.length === 0 ? "" : `<${typeParameters.join(", ")}>`} = ${declaration.type.getText()}`,
    ];
  }
  return [
    checker.typeToString(
      checker.getTypeOfSymbolAtLocation(symbol, declaration),
      declaration,
      ts.TypeFormatFlags.NoTruncation,
    ),
  ];
};

const extractSymbol = (
  checker: ts.TypeChecker,
  repositoryRoot: string,
  packageName: string,
  moduleName: string,
  exported: ts.Symbol,
): SymbolDocumentation | undefined => {
  const symbol = aliasedSymbol(checker, exported);
  const declarations = declarationsOf(symbol);
  const declaration = declarations[0];
  if (declaration === undefined) return undefined;
  const kind = kindOf(declaration);
  if (kind === undefined) return undefined;

  const tags = symbol.getJsDocTags(checker);
  if (tags.some((tag) => tag.name === "internal")) return undefined;
  const tag = (name: string): string | undefined => {
    const found = tags.find((candidate) => candidate.name === name);
    return found === undefined ? undefined : textOfTag(found);
  };
  const sourceFile = declaration.getSourceFile();
  const line = sourceFile.getLineAndCharacterOfPosition(declaration.getStart()).line + 1;
  const remarks = tag("remarks") ?? "";

  return {
    id: `${packageName}${moduleName === "." ? "" : `/${moduleName}`}#${exported.getName()}`,
    packageName,
    moduleName,
    exportName: exported.getName(),
    kind,
    signatures: signaturesOf(checker, symbol, declarations),
    summary: ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim(),
    sections: parseSections(remarks),
    examples: tags
      .filter((candidate) => candidate.name === "example")
      .map((candidate) => parseExample(textOfTag(candidate))),
    relations: [],
    source: { file: path.relative(repositoryRoot, sourceFile.fileName), line },
    ...(tag("since") === undefined ? {} : { since: tag("since") }),
    ...(tag("category") === undefined ? {} : { category: tag("category") }),
  };
};

export const extractPackage = (packageRoot: string): PackageDocumentation => {
  const repositoryRoot = path.resolve(packageRoot, "../..");
  const manifest = JSON.parse(
    fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
  ) as PackageManifest;
  const entries = Object.entries(manifest.exports).map(([exportPath, target]) => {
    const publishedFile = resolveExport(packageRoot, target);
    return {
      exportPath,
      file: resolveAuthoredEntrypoint(publishedFile),
    };
  });
  const program = ts.createProgram(
    entries.map(({ file }) => file),
    {
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      target: ts.ScriptTarget.ES2022,
    },
  );
  const checker = program.getTypeChecker();
  const modules: Array<ModuleDocumentation> = [];
  const symbols: Array<SymbolDocumentation> = [];

  for (const entry of entries) {
    const sourceFile = program.getSourceFile(entry.file);
    if (sourceFile === undefined) continue;
    const moduleName = moduleNameOf(entry.exportPath);
    modules.push({
      name: moduleName,
      exportPath: entry.exportPath,
      sourceFile: path.relative(repositoryRoot, entry.file),
    });
    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    if (moduleSymbol === undefined) continue;
    for (const exported of checker.getExportsOfModule(moduleSymbol)) {
      const documentation = extractSymbol(
        checker,
        repositoryRoot,
        manifest.name,
        moduleName,
        exported,
      );
      if (documentation !== undefined) {
        symbols.push(documentation);
        continue;
      }

      const namespace = aliasedSymbol(checker, exported);
      if (exported.getName() !== moduleName || !(namespace.flags & ts.SymbolFlags.Module)) {
        continue;
      }
      for (const member of checker.getExportsOfModule(namespace)) {
        const memberDocumentation = extractSymbol(
          checker,
          repositoryRoot,
          manifest.name,
          moduleName,
          member,
        );
        if (memberDocumentation !== undefined) symbols.push(memberDocumentation);
      }
    }
  }

  return {
    packageName: manifest.name,
    version: manifest.version,
    modules: modules.sort((left, right) => left.exportPath.localeCompare(right.exportPath)),
    symbols: symbols.sort((left, right) => left.id.localeCompare(right.id)),
  };
};

export interface ExtractPublicModulesOptions {
  readonly repositoryRoot?: string;
}

interface RawDeclarationMap {
  readonly version?: number;
  readonly file?: string;
  readonly sourceRoot?: string;
  readonly sources?: ReadonlyArray<string>;
  readonly mappings?: string;
}

interface DecodedMapping {
  readonly generatedColumn: number;
  readonly sourceIndex: number;
  readonly originalLine: number;
  readonly originalColumn: number;
}

interface DeclarationMapLookup {
  readonly sources: ReadonlyArray<string>;
  readonly lines: ReadonlyArray<ReadonlyArray<DecodedMapping>>;
}

interface AuthoredSourceLookup {
  readonly sourceFile: ts.SourceFile;
  readonly lines: ReadonlyArray<string>;
  readonly nodesByKind: ReadonlyMap<ts.SyntaxKind, ReadonlyArray<ts.Node>>;
}

interface MutableExtraction {
  readonly declarations: Map<string, DeclarationRecord>;
  readonly exposures: Map<string, DeclarationExposureRecord>;
  readonly resources: Array<ResourceRecord>;
  readonly expected: Map<string, ExpectedExposure>;
  readonly diagnostics: Array<ExtractionDiagnostic>;
  readonly diagnosticKeys: Set<string>;
}

interface ProgramContext {
  readonly checker: ts.TypeChecker;
  readonly repositoryRoot: string;
  readonly target: PublicModuleTarget;
  readonly output: MutableExtraction;
  readonly declarationMaps: Map<string, DeclarationMapLookup | undefined>;
  readonly authoredSources: Map<string, AuthoredSourceLookup | undefined>;
  readonly symbolIds: Map<ts.Symbol, number>;
  readonly visited: Set<string>;
}

interface ExpectedGraphContext {
  readonly checker: ts.TypeChecker;
  readonly target: PublicModuleTarget;
  readonly output: MutableExtraction;
}

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const unique = <A>(values: ReadonlyArray<A>): ReadonlyArray<A> => [...new Set(values)];

const normalizedRelativePath = (
  repositoryRoot: string,
  absoluteFile: string,
): string | undefined => {
  const relative = path.relative(repositoryRoot, absoluteFile);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) return undefined;
  return relative.split(path.sep).join("/");
};

const sanitizedCompilerDiagnostic = (
  messageText: string | ts.DiagnosticMessageChain,
  repositoryRoot: string,
): string =>
  ts
    .flattenDiagnosticMessageText(messageText, "\n")
    .replace(
      /(['"`])((?:\/|[A-Za-z]:[\\/])[^'"`\r\n]*)\1/gu,
      (_quoted, quote: string, absoluteFile: string) => {
        const relative = path.isAbsolute(absoluteFile)
          ? normalizedRelativePath(repositoryRoot, absoluteFile)
          : undefined;
        const basename = path.win32.isAbsolute(absoluteFile)
          ? path.win32.basename(absoluteFile)
          : path.basename(absoluteFile);
        return `${quote}${relative ?? basename}${quote}`;
      },
    );

const moduleNameFromTarget = (target: PublicModuleTarget): string =>
  target.exportSubpath === "." ? "." : target.exportSubpath.replace(/^\.\//u, "");

const pushExtractionDiagnostic = (
  output: MutableExtraction,
  target: PublicModuleTarget,
  code: ExtractionDiagnostic["code"],
  message: string,
  qualifiedName?: string,
  declarationFamily?: DeclarationFamily,
): void => {
  const key = [code, target.packageName, target.consumerSpecifier, qualifiedName, message].join(
    "\0",
  );
  if (output.diagnosticKeys.has(key)) return;
  output.diagnosticKeys.add(key);
  output.diagnostics.push({
    code,
    packageName: target.packageName,
    consumerSpecifier: target.consumerSpecifier,
    message,
    ...(qualifiedName === undefined ? {} : { qualifiedName }),
    ...(declarationFamily === undefined ? {} : { declarationFamily }),
  });
};

const base64Values = new Map(
  [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"].map(
    (character, index) => [character, index],
  ),
);

const decodeVlq = (segment: string): ReadonlyArray<number> => {
  const values: Array<number> = [];
  let value = 0;
  let shift = 0;
  for (const character of segment) {
    const digit = base64Values.get(character);
    if (digit === undefined) throw new Error(`Invalid base64 VLQ digit ${character}.`);
    value += (digit & 31) << shift;
    if ((digit & 32) !== 0) {
      shift += 5;
      continue;
    }
    values.push((value & 1) === 0 ? value >> 1 : -(value >> 1));
    value = 0;
    shift = 0;
  }
  if (shift !== 0) throw new Error("Incomplete base64 VLQ segment.");
  return values;
};

const decodeMappings = (mappings: string): ReadonlyArray<ReadonlyArray<DecodedMapping>> => {
  let sourceIndex = 0;
  let originalLine = 0;
  let originalColumn = 0;
  return mappings.split(";").map((line) => {
    let generatedColumn = 0;
    const decoded: Array<DecodedMapping> = [];
    for (const segment of line.split(",")) {
      if (segment.length === 0) continue;
      const values = decodeVlq(segment);
      generatedColumn += values[0] ?? 0;
      if (values.length < 4) continue;
      sourceIndex += values[1]!;
      originalLine += values[2]!;
      originalColumn += values[3]!;
      decoded.push({ generatedColumn, sourceIndex, originalLine, originalColumn });
    }
    return decoded;
  });
};

const loadDeclarationMap = (
  context: ProgramContext,
  declarationFile: string,
): DeclarationMapLookup | undefined => {
  if (context.declarationMaps.has(declarationFile)) {
    return context.declarationMaps.get(declarationFile);
  }
  const mapFile = `${declarationFile}.map`;
  if (!fs.existsSync(mapFile)) {
    pushExtractionDiagnostic(
      context.output,
      context.target,
      "missing-declaration-map",
      `Missing declaration map for ${path.basename(declarationFile)}.`,
    );
    context.declarationMaps.set(declarationFile, undefined);
    return undefined;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(mapFile, "utf8")) as RawDeclarationMap;
    if (
      parsed.version !== 3 ||
      !Array.isArray(parsed.sources) ||
      typeof parsed.mappings !== "string"
    ) {
      throw new Error("Expected a version 3 source map with sources and mappings.");
    }
    const sourceRoot = parsed.sourceRoot ?? "";
    const sources = parsed.sources.map((source) =>
      path.resolve(path.dirname(mapFile), sourceRoot, source),
    );
    for (const source of sources) {
      if (!fs.existsSync(source)) {
        pushExtractionDiagnostic(
          context.output,
          context.target,
          "missing-source",
          `Declaration map source does not exist: ${path.basename(source)}.`,
        );
      }
      if (normalizedRelativePath(context.repositoryRoot, source) === undefined) {
        pushExtractionDiagnostic(
          context.output,
          context.target,
          "source-outside-repository",
          "Declaration map resolved a source outside the repository root.",
        );
      }
    }
    const lookup = { sources, lines: decodeMappings(parsed.mappings) };
    context.declarationMaps.set(declarationFile, lookup);
    return lookup;
  } catch {
    pushExtractionDiagnostic(
      context.output,
      context.target,
      "invalid-declaration-map",
      `Invalid declaration map for ${path.basename(declarationFile)}.`,
    );
    context.declarationMaps.set(declarationFile, undefined);
    return undefined;
  }
};

const mappingAt = (
  lookup: DeclarationMapLookup,
  line: number,
  column: number,
): DecodedMapping | undefined => {
  const mappings = lookup.lines[line];
  if (mappings === undefined) return undefined;
  let selected: DecodedMapping | undefined;
  for (const mapping of mappings) {
    if (mapping.generatedColumn > column) break;
    selected = mapping;
  }
  return selected;
};

const scriptKindOf = (source: string): ts.ScriptKind => {
  if (source.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (source.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (/\.[cm]?js$/u.test(source)) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
};

const loadAuthoredSource = (
  context: ProgramContext,
  source: string,
): AuthoredSourceLookup | undefined => {
  if (context.authoredSources.has(source)) return context.authoredSources.get(source);
  try {
    const text = fs.readFileSync(source, "utf8");
    const sourceFile = ts.createSourceFile(
      source,
      text,
      ts.ScriptTarget.Latest,
      true,
      scriptKindOf(source),
    );
    const mutableNodes = new Map<ts.SyntaxKind, Array<ts.Node>>();
    const visit = (node: ts.Node): void => {
      const nodes = mutableNodes.get(node.kind);
      if (nodes === undefined) mutableNodes.set(node.kind, [node]);
      else nodes.push(node);
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    const lookup: AuthoredSourceLookup = {
      sourceFile,
      lines: text.split(/\r\n|[\n\r\u2028\u2029]/u),
      nodesByKind: mutableNodes,
    };
    context.authoredSources.set(source, lookup);
    return lookup;
  } catch {
    context.authoredSources.set(source, undefined);
    return undefined;
  }
};

const syntaxNameOf = (node: ts.Node): string | undefined => {
  const name = (node as ts.NamedDeclaration).name;
  return name === undefined ? undefined : name.getText(node.getSourceFile());
};

const namedOwnerChain = (node: ts.Node): ReadonlyArray<string> => {
  const owners: Array<string> = [];
  for (
    let owner = node.parent;
    owner !== undefined && !ts.isSourceFile(owner);
    owner = owner.parent
  ) {
    const name = syntaxNameOf(owner);
    if (name !== undefined) owners.push(`${ts.SyntaxKind[owner.kind]}:${name}`);
  }
  return owners.reverse();
};

const sameStrings = (left: ReadonlyArray<string>, right: ReadonlyArray<string>): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const authoredDeclarationAt = (
  lookup: AuthoredSourceLookup,
  mapping: DecodedMapping,
  declaration: ts.Declaration,
): ts.Node | undefined => {
  const sourceLine = lookup.lines[mapping.originalLine];
  if (sourceLine === undefined || mapping.originalColumn > sourceLine.length) return undefined;
  const anchor = lookup.sourceFile.getPositionOfLineAndCharacter(
    mapping.originalLine,
    mapping.originalColumn,
  );
  const expectedName = syntaxNameOf(declaration);
  const expectedOwners = namedOwnerChain(declaration);
  const candidates = (lookup.nodesByKind.get(declaration.kind) ?? []).filter((node) => {
    if (syntaxNameOf(node) !== expectedName) return false;
    if (!sameStrings(namedOwnerChain(node), expectedOwners)) return false;
    const start = node.getStart(lookup.sourceFile, false);
    const startLine = lookup.sourceFile.getLineAndCharacterOfPosition(start).line;
    return (
      startLine === mapping.originalLine ||
      (node.getFullStart() <= anchor && anchor <= node.getEnd())
    );
  });
  return candidates.length === 1 ? candidates[0] : undefined;
};

const directSourceSpan = (
  context: ProgramContext,
  sourceFile: ts.SourceFile,
  startPosition: number,
  endPosition: number,
  qualifiedName?: string,
  declarationFamily?: DeclarationFamily,
): SourceSpan => {
  const start = sourceFile.getLineAndCharacterOfPosition(startPosition);
  const end = sourceFile.getLineAndCharacterOfPosition(endPosition);
  const relative = normalizedRelativePath(context.repositoryRoot, sourceFile.fileName);
  if (relative === undefined) {
    pushExtractionDiagnostic(
      context.output,
      context.target,
      "source-outside-repository",
      "A declaration source is outside the repository root.",
      qualifiedName,
      declarationFamily,
    );
  }
  return {
    file: relative ?? path.basename(sourceFile.fileName),
    start: { line: start.line + 1, column: start.character + 1 },
    end: { line: end.line + 1, column: end.character + 1 },
  };
};

const sourceSpanOf = (
  context: ProgramContext,
  declaration: ts.Declaration,
  qualifiedName: string,
  declarationFamily: DeclarationFamily,
): SourceSpan => {
  const sourceFile = declaration.getSourceFile();
  const generated = directSourceSpan(
    context,
    sourceFile,
    declaration.getStart(sourceFile, false),
    declaration.getEnd(),
    qualifiedName,
    declarationFamily,
  );
  if (!/\.d\.[cm]?ts$/u.test(sourceFile.fileName)) return generated;
  const lookup = loadDeclarationMap(context, sourceFile.fileName);
  if (lookup === undefined) return generated;

  const startGenerated = sourceFile.getLineAndCharacterOfPosition(declaration.getStart(sourceFile));
  const startMapping = mappingAt(lookup, startGenerated.line, startGenerated.character);
  if (startMapping === undefined) {
    pushExtractionDiagnostic(
      context.output,
      context.target,
      "missing-source-map-mapping",
      "The published declaration has no authored-source start mapping; provenance fell back to the published declaration span.",
      qualifiedName,
      declarationFamily,
    );
    return generated;
  }
  const source = lookup.sources[startMapping.sourceIndex];
  if (source === undefined) {
    pushExtractionDiagnostic(
      context.output,
      context.target,
      "invalid-declaration-map",
      "A declaration-map segment refers to an unknown source index.",
      qualifiedName,
      declarationFamily,
    );
    return generated;
  }
  if (!fs.existsSync(source)) {
    pushExtractionDiagnostic(
      context.output,
      context.target,
      "missing-source",
      `Declaration map source does not exist: ${path.basename(source)}.`,
      qualifiedName,
      declarationFamily,
    );
    return generated;
  }
  const relative = normalizedRelativePath(context.repositoryRoot, source);
  if (relative === undefined) {
    pushExtractionDiagnostic(
      context.output,
      context.target,
      "source-outside-repository",
      "Declaration map resolved a source outside the repository root.",
      qualifiedName,
      declarationFamily,
    );
    return generated;
  }
  const authoredSource = loadAuthoredSource(context, source);
  const authoredDeclaration =
    authoredSource === undefined
      ? undefined
      : authoredDeclarationAt(authoredSource, startMapping, declaration);
  if (authoredSource === undefined || authoredDeclaration === undefined) {
    pushExtractionDiagnostic(
      context.output,
      context.target,
      "missing-source-map-mapping",
      "The declaration-map start does not identify one authored declaration; provenance fell back to the published declaration span.",
      qualifiedName,
      declarationFamily,
    );
    return generated;
  }
  return directSourceSpan(
    context,
    authoredSource.sourceFile,
    authoredDeclaration.getStart(authoredSource.sourceFile, false),
    authoredDeclaration.getEnd(),
    qualifiedName,
    declarationFamily,
  );
};

const declarationFamilyOf = (declaration: ts.Declaration): DeclarationFamily => {
  if (ts.isFunctionDeclaration(declaration)) return "function";
  if (ts.isVariableDeclaration(declaration)) return "variable";
  if (ts.isClassDeclaration(declaration)) return "class";
  if (ts.isInterfaceDeclaration(declaration)) return "interface";
  if (ts.isTypeAliasDeclaration(declaration)) return "type-alias";
  if (ts.isEnumDeclaration(declaration)) return "enum";
  if (ts.isModuleDeclaration(declaration) || ts.isSourceFile(declaration)) return "namespace";
  if (ts.isConstructorDeclaration(declaration)) return "constructor";
  if (ts.isMethodDeclaration(declaration) || ts.isMethodSignature(declaration)) return "method";
  if (
    ts.isParameter(declaration) &&
    ts.isParameterPropertyDeclaration(declaration, declaration.parent)
  ) {
    return "property";
  }
  if (ts.isPropertyDeclaration(declaration) || ts.isPropertySignature(declaration))
    return "property";
  if (ts.isGetAccessorDeclaration(declaration) || ts.isSetAccessorDeclaration(declaration)) {
    return "accessor";
  }
  if (ts.isCallSignatureDeclaration(declaration)) return "call-signature";
  if (ts.isConstructSignatureDeclaration(declaration)) return "construct-signature";
  if (ts.isIndexSignatureDeclaration(declaration)) return "index-signature";
  if (ts.isEnumMember(declaration)) return "enum-member";
  if (ts.isExportAssignment(declaration)) return "variable";
  return "unsupported";
};

const hasModifier = (declaration: ts.Declaration, kind: ts.SyntaxKind): boolean =>
  ts.canHaveModifiers(declaration) &&
  (ts.getModifiers(declaration)?.some((modifier) => modifier.kind === kind) ?? false);

const isStaticDeclaration = (declaration: ts.Declaration): boolean =>
  hasModifier(declaration, ts.SyntaxKind.StaticKeyword);

const isReadonlyDeclaration = (declaration: ts.Declaration): boolean =>
  hasModifier(declaration, ts.SyntaxKind.ReadonlyKeyword);

const isOptionalDeclaration = (declaration: ts.Declaration): boolean =>
  "questionToken" in declaration && declaration.questionToken !== undefined;

const typeParametersOf = (declarations: ReadonlyArray<ts.Declaration>): ReadonlyArray<string> =>
  unique(
    declarations.flatMap((declaration) => {
      const parameters = (
        declaration as ts.Declaration & {
          readonly typeParameters?: ts.NodeArray<ts.TypeParameterDeclaration>;
        }
      ).typeParameters;
      return parameters?.map((parameter) => parameter.getText()) ?? [];
    }),
  );

const signaturePrinter = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  removeComments: true,
});

const maximumSignatureLineLength = 800;

const signatureBreakTokens = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.CommaToken,
  ts.SyntaxKind.SemicolonToken,
  ts.SyntaxKind.BarToken,
  ts.SyntaxKind.AmpersandToken,
  ts.SyntaxKind.EqualsGreaterThanToken,
  ts.SyntaxKind.CloseParenToken,
  ts.SyntaxKind.CloseBracketToken,
]);

const wrapSignatureLine = (line: string): string => {
  if (line.length <= maximumSignatureLineLength) return line;
  const leading = line.match(/^\s*/u)?.[0] ?? "";
  const continuation = `${leading}    `;
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, line);
  const breaks: Array<number> = [];
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if (signatureBreakTokens.has(token)) breaks.push(scanner.getTokenEnd());
  }
  const parts: Array<string> = [];
  let start = 0;
  while (line.length - start > maximumSignatureLineLength) {
    const limit = start + maximumSignatureLineLength;
    const split =
      breaks.findLast((position) => position > start && position <= limit) ??
      breaks.find((position) => position > limit);
    if (split === undefined) break;
    parts.push(line.slice(start, split).trimEnd());
    start = split;
    while (line[start] === " ") start += 1;
  }
  if (parts.length === 0) return line;
  parts.push(line.slice(start));
  return parts.map((part, index) => (index === 0 ? part : `${continuation}${part}`)).join("\n");
};

const wrapSignature = (signature: string): string =>
  signature.split("\n").map(wrapSignatureLine).join("\n");

const publicSignatureDeclaration = (declaration: ts.Declaration): ts.Declaration => {
  const transformed = ts.transform(declaration, [
    (transformationContext): ts.Transformer<ts.Declaration> => {
      const visit: ts.Visitor = (node) => {
        if (ts.isClassDeclaration(node)) {
          return ts.factory.updateClassDeclaration(
            node,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            node.members
              .filter((member) => !isNonPublicMember(member))
              .map((member) => ts.visitNode(member, visit) as ts.ClassElement),
          );
        }
        if (ts.isInterfaceDeclaration(node)) {
          return ts.factory.updateInterfaceDeclaration(
            node,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            node.members
              .filter((member) => !isNonPublicMember(member))
              .map((member) => ts.visitNode(member, visit) as ts.TypeElement),
          );
        }
        if (ts.isTypeLiteralNode(node)) {
          return ts.factory.updateTypeLiteralNode(
            node,
            ts.factory.createNodeArray(
              node.members
                .filter((member) => !isNonPublicMember(member))
                .map((member) => ts.visitNode(member, visit) as ts.TypeElement),
            ),
          );
        }
        if (ts.isEnumDeclaration(node)) {
          return ts.factory.updateEnumDeclaration(
            node,
            node.modifiers,
            node.name,
            node.members
              .filter((member) => !isNonPublicMember(member))
              .map((member) => ts.visitNode(member, visit) as ts.EnumMember),
          );
        }
        if (ts.isModuleBlock(node)) {
          return ts.factory.updateModuleBlock(
            node,
            node.statements
              .filter((statement) => !hasDocumentationExclusionTag(statement))
              .map((statement) => ts.visitNode(statement, visit) as ts.Statement),
          );
        }
        return ts.visitEachChild(node, visit, transformationContext);
      };
      return (node) => ts.visitNode(node, visit) as ts.Declaration;
    },
  ]);
  const publicDeclaration = transformed.transformed[0] as ts.Declaration;
  transformed.dispose();
  return publicDeclaration;
};

const declarationText = (declaration: ts.Declaration): string =>
  wrapSignature(
    signaturePrinter
      .printNode(
        ts.EmitHint.Unspecified,
        publicSignatureDeclaration(declaration),
        declaration.getSourceFile(),
      )
      .trim(),
  );

const replaceDeclarationNameInText = (
  declaration: ts.Declaration & { readonly name?: ts.DeclarationName },
  text: string,
  name: string,
): string => {
  if (declaration.name === undefined) return text;
  const authoredName = declaration.name.getText();
  const nameStart = text.indexOf(authoredName);
  if (nameStart < 0) return text;
  return `${text.slice(0, nameStart)}${name}${text.slice(nameStart + authoredName.length)}`;
};

const replaceNamedDeclaration = (
  declaration: ts.Declaration & { readonly name?: ts.DeclarationName },
  name: string,
): string => replaceDeclarationNameInText(declaration, declarationText(declaration), name);

const structuralDeclaration = (
  declaration: ts.ClassDeclaration | ts.InterfaceDeclaration | ts.EnumDeclaration,
  name: string,
): string => replaceDeclarationNameInText(declaration, declarationText(declaration), name);

const moduleDeclaration = (declaration: ts.ModuleDeclaration, name: string): string =>
  replaceDeclarationNameInText(declaration, declarationText(declaration), name);

const variableSignature = (declaration: ts.VariableDeclaration, name: string): string => {
  const list = declaration.parent;
  const statement = ts.isVariableDeclarationList(list) ? list.parent : undefined;
  const modifiers =
    statement !== undefined && ts.isVariableStatement(statement)
      ? (statement.modifiers?.map((modifier) => modifier.getText()) ?? [])
      : [];
  const keyword =
    ts.isVariableDeclarationList(list) && (list.flags & ts.NodeFlags.Const) !== 0
      ? "const"
      : ts.isVariableDeclarationList(list) && (list.flags & ts.NodeFlags.Let) !== 0
        ? "let"
        : "var";
  const declarationText = replaceNamedDeclaration(declaration, name);
  const semicolon =
    statement !== undefined &&
    ts.isVariableStatement(statement) &&
    /;\s*$/u.test(statement.getText())
      ? ";"
      : "";
  return `${modifiers.length === 0 ? "" : `${modifiers.join(" ")} `}${keyword} ${declarationText}${semicolon}`;
};

const signatureText = (
  _checker: ts.TypeChecker,
  declaration: ts.SignatureDeclaration,
  name: string,
  prefix = name,
): string => {
  const raw = declarationText(declaration);
  if (
    ts.isFunctionDeclaration(declaration) ||
    ts.isMethodDeclaration(declaration) ||
    ts.isMethodSignature(declaration)
  ) {
    if (declaration.name !== undefined) return replaceNamedDeclaration(declaration, name);
    const functionStart = raw.search(/\bfunction\b/u);
    if (functionStart < 0) return `${prefix}${raw}`;
    const nameStart = functionStart + "function".length;
    return `${raw.slice(0, nameStart)} ${name}${raw.slice(nameStart).trimStart()}`;
  }
  if (ts.isConstructorDeclaration(declaration)) {
    return raw;
  }
  if (ts.isCallSignatureDeclaration(declaration)) {
    return prefix.length === 0 ? raw : `${prefix}${raw}`;
  }
  if (ts.isConstructSignatureDeclaration(declaration)) {
    return prefix.length === 0 ? raw : `${prefix}${raw.replace(/^new\s*/u, "")}`;
  }
  return raw;
};

/**
 * Public signatures come from the published declaration AST. Declaration maps
 * provide provenance only: they never replace `.d.ts` syntax with source text.
 * Whitespace, modifiers, and trailing semicolons are retained; only the
 * consumer-facing name is substituted for an alias exposure.
 */
const signaturesFor = (
  checker: ts.TypeChecker,
  symbol: ts.Symbol | undefined,
  name: string,
  family: DeclarationFamily,
  declarations: ReadonlyArray<ts.Declaration>,
): ReadonlyArray<string> => {
  // `default` names an export slot, not a declaration identifier. Keep the
  // authored binding (or anonymous default declaration) and expose that binding.
  if (name === "default") {
    const declaration = declarations[0] as ts.NamedDeclaration | undefined;
    const authoredName = declaration?.name?.getText();
    if (authoredName === undefined || authoredName === "default") {
      return declarations.map(declarationText);
    }
    const signatures = signaturesFor(checker, symbol, authoredName, family, declarations);
    const hasDefaultModifier = declarations.some((candidate) =>
      ts.canHaveModifiers(candidate) &&
      ts.getModifiers(candidate)?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword),
    );
    return hasDefaultModifier
      ? signatures
      : signatures.map((signature) => `${signature}\nexport default ${authoredName};`);
  }
  switch (family) {
    case "function": {
      const functions = declarations.filter(ts.isFunctionDeclaration);
      const overloads = functions.filter((declaration) => declaration.body === undefined);
      return (overloads.length === 0 ? functions : overloads).map((declaration) =>
        signatureText(checker, declaration, name),
      );
    }
    case "variable": {
      const declaration = declarations.find(ts.isVariableDeclaration);
      if (declaration === undefined || symbol === undefined) {
        return declarations.map(declarationText);
      }
      return [variableSignature(declaration, name)];
    }
    case "class":
    case "interface": {
      const declaration = declarations.find((candidate) =>
        family === "class"
          ? ts.isClassDeclaration(candidate)
          : ts.isInterfaceDeclaration(candidate),
      ) as ts.ClassDeclaration | ts.InterfaceDeclaration | undefined;
      if (declaration === undefined) return declarations.map(declarationText);
      return [structuralDeclaration(declaration, name)];
    }
    case "type-alias": {
      const declaration = declarations.find(ts.isTypeAliasDeclaration);
      if (declaration === undefined) return declarations.map(declarationText);
      return [replaceNamedDeclaration(declaration, name)];
    }
    case "enum": {
      const declaration = declarations.find(ts.isEnumDeclaration);
      return declaration === undefined
        ? declarations.map(declarationText)
        : [structuralDeclaration(declaration, name)];
    }
    case "namespace": {
      const declaration = declarations.find(ts.isModuleDeclaration);
      if (declaration !== undefined) return [moduleDeclaration(declaration, name)];
      if (declarations.some(ts.isSourceFile)) return [`namespace ${name}`];
      return declarations.map(declarationText);
    }
    case "constructor":
      return declarations
        .filter(ts.isConstructorDeclaration)
        .map((declaration) => signatureText(checker, declaration, name, "constructor"));
    case "method":
      return declarations
        .filter(
          (declaration): declaration is ts.MethodDeclaration | ts.MethodSignature =>
            ts.isMethodDeclaration(declaration) || ts.isMethodSignature(declaration),
        )
        .map((declaration) => signatureText(checker, declaration, name));
    case "property": {
      const declaration = declarations[0];
      if (declaration === undefined) return [];
      return [
        replaceNamedDeclaration(
          declaration as ts.Declaration & { readonly name?: ts.DeclarationName },
          name,
        ),
      ];
    }
    case "accessor":
      return declarations.map((declaration) =>
        replaceNamedDeclaration(
          declaration as ts.Declaration & { readonly name?: ts.DeclarationName },
          name,
        ),
      );
    case "call-signature":
      return declarations
        .filter(ts.isCallSignatureDeclaration)
        .map((declaration) => signatureText(checker, declaration, "", ""));
    case "construct-signature":
      return declarations
        .filter(ts.isConstructSignatureDeclaration)
        .map((declaration) => signatureText(checker, declaration, "", "new "));
    case "index-signature":
    case "enum-member":
    case "unsupported":
      return declarations.map(declarationText);
  }
};

const signaturesForFacets = (
  checker: ts.TypeChecker,
  symbol: ts.Symbol | undefined,
  name: string,
  declarations: ReadonlyArray<ts.Declaration>,
): ReadonlyArray<string> => {
  const grouped = new Map<DeclarationFamily, Array<ts.Declaration>>();
  for (const declaration of declarations) {
    const family = declarationFamilyOf(declaration);
    const existing = grouped.get(family);
    if (existing === undefined) grouped.set(family, [declaration]);
    else existing.push(declaration);
  }
  return [...grouped].flatMap(([family, facetDeclarations]) =>
    signaturesFor(checker, symbol, name, family, facetDeclarations).map(wrapSignature),
  );
};

const facadeSignature = (
  exportedSymbol: ts.Symbol | undefined,
  name: string,
): string | undefined => {
  for (const declaration of exportedSymbol?.declarations ?? []) {
    if (!ts.isNamespaceExport(declaration) || !ts.isExportDeclaration(declaration.parent)) continue;
    return replaceDeclarationNameInText(declaration, declarationText(declaration.parent), name);
  }
  return undefined;
};

const aliasSignature = (
  exportedSymbol: ts.Symbol | undefined,
  name: string,
): string | undefined => {
  for (const declaration of exportedSymbol?.declarations ?? []) {
    if (!ts.isExportSpecifier(declaration)) continue;
    const exportDeclaration = declaration.parent.parent;
    if (!ts.isExportDeclaration(exportDeclaration)) continue;
    const importedName = declaration.propertyName?.getText() ?? declaration.name.getText();
    const moduleSpecifier = exportDeclaration.moduleSpecifier?.getText();
    return `export { ${importedName} as ${name} }${moduleSpecifier === undefined ? "" : ` from ${moduleSpecifier}`};`;
  }
  return undefined;
};

const canAppearAsDeclarationName = (name: string): boolean => {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, name);
  return (
    scanner.scan() === ts.SyntaxKind.Identifier && scanner.scan() === ts.SyntaxKind.EndOfFileToken
  );
};

const symbolTags = (
  checker: ts.TypeChecker,
  ...symbols: ReadonlyArray<ts.Symbol | undefined>
): ReadonlyArray<DocumentationTag> => {
  const tags = symbols.flatMap((symbol) =>
    (symbol?.getJsDocTags(checker) ?? []).map((tag) => ({
      name: tag.name,
      text: textOfTag(tag),
    })),
  );
  return tags.filter(
    (tag, index) =>
      tags.findIndex((candidate) => candidate.name === tag.name && candidate.text === tag.text) ===
      index,
  );
};

interface DocumentationTag {
  readonly name: string;
  readonly text: string;
}

const declarationTags = (
  declarations: ReadonlyArray<ts.Declaration>,
): ReadonlyArray<DocumentationTag> => {
  const tags = declarations.flatMap((declaration) =>
    ts.getJSDocTags(declaration).map((tag) => ({
      name: tag.tagName.text,
      text: ts.getTextOfJSDocComment(tag.comment)?.trim() ?? "",
    })),
  );
  return tags.filter(
    (tag, index) =>
      tags.findIndex((candidate) => candidate.name === tag.name && candidate.text === tag.text) ===
      index,
  );
};

const hasDocumentationExclusionTag = (node: ts.Node): boolean =>
  ts
    .getJSDocTags(node)
    .some(({ tagName }) => tagName.text === "internal" || tagName.text === "ignore");

const isDocumentationExcluded = (declaration: ts.Declaration): boolean => {
  if (hasDocumentationExclusionTag(declaration)) return true;
  let parent = declaration.parent;
  while (parent !== undefined && !ts.isSourceFile(parent)) {
    if (
      (ts.isExportDeclaration(parent) || ts.isExportAssignment(parent)) &&
      hasDocumentationExclusionTag(parent)
    ) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
};

const documentationTags = (
  checker: ts.TypeChecker,
  symbol: ts.Symbol | undefined,
  declarations: ReadonlyArray<ts.Declaration>,
): ReadonlyArray<DocumentationTag> => {
  const tags = [...symbolTags(checker, symbol), ...declarationTags(declarations)];
  return tags.filter(
    (tag, index) =>
      tags.findIndex((candidate) => candidate.name === tag.name && candidate.text === tag.text) ===
      index,
  );
};

const declarationSummary = (declarations: ReadonlyArray<ts.Declaration>): string => {
  for (const declaration of declarations) {
    for (const comment of ts.getJSDocCommentsAndTags(declaration)) {
      if (!ts.isJSDoc(comment)) continue;
      const summary = ts.getTextOfJSDocComment(comment.comment)?.trim() ?? "";
      if (summary !== "") return summary;
    }
  }
  return "";
};

const tagText = (tags: ReadonlyArray<DocumentationTag>, name: string): string | undefined => {
  const tag = tags.find((candidate) => candidate.name === name);
  return tag?.text;
};

const recordFor = (
  context: ProgramContext,
  symbol: ts.Symbol | undefined,
  name: string,
  declarations: ReadonlyArray<ts.Declaration>,
  qualifiedName: string,
  members: ReadonlyArray<MemberGroup>,
): DeclarationRecord => {
  const grouped = new Map<DeclarationFamily, Array<ts.Declaration>>();
  for (const declaration of declarations) {
    const family = declarationFamilyOf(declaration);
    const existing = grouped.get(family);
    if (existing === undefined) grouped.set(family, [declaration]);
    else existing.push(declaration);
  }
  const facet = (
    facetSymbol: ts.Symbol | undefined,
    facetName: string,
    facetQualifiedName: string,
    family: DeclarationFamily,
    facetDeclarations: ReadonlyArray<ts.Declaration>,
  ): DeclarationFacet => ({
    family,
    syntaxKind: ts.SyntaxKind[facetDeclarations[0]!.kind],
    signatures: signaturesFor(context.checker, facetSymbol, facetName, family, facetDeclarations),
    typeParameters: typeParametersOf(facetDeclarations),
    sourceSpans: facetDeclarations.map((declaration) =>
      sourceSpanOf(context, declaration, facetQualifiedName, family),
    ),
    static: facetDeclarations.some(isStaticDeclaration),
    readonly: facetDeclarations.some(isReadonlyDeclaration),
    optional: facetDeclarations.some(isOptionalDeclaration),
  });
  const declarationFacets = [...grouped].map(([family, facetDeclarations]) =>
    facet(symbol, name, qualifiedName, family, facetDeclarations),
  );
  const memberFacets = members.map((member) =>
    facet(
      member.symbol,
      member.signatureName,
      member.qualifiedName,
      declarationFamilyOf(member.declarations[0]!),
      member.declarations,
    ),
  );
  const facets: Array<DeclarationFacet> = [...declarationFacets, ...memberFacets];
  const family = facets[0]?.family ?? "unsupported";
  const sourceSpans = unique(
    facets.flatMap(({ sourceSpans }) => sourceSpans.map((span) => JSON.stringify(span))),
  ).map((span) => JSON.parse(span) as SourceSpan);
  const declarationKey = `declaration:${createHash("sha256")
    .update(JSON.stringify({ name, sourceSpans, facets: facets.map(({ family }) => family) }))
    .digest("hex")
    .slice(0, 24)}`;
  const existing = context.output.declarations.get(declarationKey);
  if (existing !== undefined) return existing;
  const documentationDeclarations = unique([
    ...declarations,
    ...members.flatMap(({ declarations }) => declarations),
  ]);
  const completeSymbol =
    symbol === undefined ||
    declarationsOf(symbol).every((declaration) => documentationDeclarations.includes(declaration));
  const tags = documentationTags(
    context.checker,
    completeSymbol ? symbol : undefined,
    documentationDeclarations,
  );
  const remarks = tagText(tags, "remarks") ?? "";
  const summary = declarationSummary(documentationDeclarations);
  const sections: Record<string, string> = { ...parseSections(remarks) };
  const addSection = (heading: string, body: string, memberHeading: string): void => {
    if (body === "") return;
    const existing = sections[heading];
    if (existing === undefined) {
      sections[heading] = body;
    } else if (existing !== body) {
      sections[`${memberHeading}: ${heading}`] = body;
    }
  };
  for (const member of members) {
    const family = declarationFamilyOf(member.declarations[0]!);
    const relativeName = member.qualifiedName
      .slice(qualifiedName.length + 1)
      .replace(/^prototype\./u, "");
    const memberHeading =
      family === "call-signature"
        ? "Call signatures"
        : family === "construct-signature"
          ? "Construct signatures"
          : family === "index-signature"
            ? "Index signature"
            : family === "constructor"
              ? "Constructor"
              : `${family[0]!.toUpperCase()}${family.slice(1)}: ${relativeName}`;
    const summaries = unique(
      member.declarations.map((declaration) => declarationSummary([declaration])).filter(Boolean),
    );
    addSection(memberHeading, summaries.join("\n\n"), memberHeading);
    const memberRemarks = unique(
      declarationTags(member.declarations)
        .filter(({ name }) => name === "remarks")
        .map(({ text }) => text)
        .filter(Boolean),
    );
    for (const memberRemark of memberRemarks) {
      const parsed = Object.entries(parseSections(memberRemark));
      if (parsed.length === 0) addSection(memberHeading, memberRemark, memberHeading);
      else {
        for (const [heading, body] of parsed) addSection(heading, body, memberHeading);
      }
    }
  }
  const record: DeclarationRecord = {
    declarationKey,
    name,
    family,
    facets,
    signatures: declarationFacets.flatMap(({ signatures }) => signatures),
    typeParameters: unique(facets.flatMap(({ typeParameters }) => typeParameters)),
    summary:
      summary ||
      (completeSymbol
        ? ts.displayPartsToString(symbol?.getDocumentationComment(context.checker) ?? []).trim()
        : ""),
    sections,
    examples: tags
      .filter((candidate) => candidate.name === "example")
      .map((candidate) => parseExample(candidate.text)),
    sourceSpans,
    ...(tagText(tags, "since") === undefined ? {} : { since: tagText(tags, "since") }),
    ...(tagText(tags, "category") === undefined ? {} : { category: tagText(tags, "category") }),
    ...(tagText(tags, "stability") === undefined ? {} : { stability: tagText(tags, "stability") }),
    ...(tagText(tags, "deprecated") === undefined
      ? {}
      : { deprecated: tagText(tags, "deprecated") }),
  };
  context.output.declarations.set(declarationKey, record);
  return record;
};

const exposureId = (target: PublicModuleTarget, qualifiedName: string): string =>
  `${target.consumerSpecifier}#${qualifiedName}`;

const expectedExposure = (target: PublicModuleTarget, qualifiedName: string): ExpectedExposure => ({
  id: exposureId(target, qualifiedName),
  packageName: target.packageName,
  consumerSpecifier: target.consumerSpecifier,
  qualifiedName,
});

const addExpected = (
  output: MutableExtraction,
  target: PublicModuleTarget,
  qualifiedName: string,
): ExpectedExposure => {
  const expected = expectedExposure(target, qualifiedName);
  if (!output.expected.has(expected.id)) output.expected.set(expected.id, expected);
  return expected;
};

const safeAliasedSymbol = (checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol => {
  if (!(symbol.flags & ts.SymbolFlags.Alias)) return symbol;
  try {
    return checker.getAliasedSymbol(symbol);
  } catch {
    return symbol;
  }
};

interface PublicExportedDeclarations {
  readonly resolved: ts.Symbol;
  readonly declarations: ReadonlyArray<ts.Declaration>;
}

const publicExportedDeclarations = (
  checker: ts.TypeChecker,
  exported: ts.Symbol,
): PublicExportedDeclarations => {
  const resolved = safeAliasedSymbol(checker, exported);
  if (
    exported !== resolved &&
    declarationsOf(exported).some((declaration) => isDocumentationExcluded(declaration))
  ) {
    return { resolved, declarations: [] };
  }
  return {
    resolved,
    declarations: declarationsOf(resolved).filter(
      (declaration) => !isDocumentationExcluded(declaration),
    ),
  };
};

const publicExportName = (name: string): string => (name === "export=" ? "default" : name);

const exportsOfModule = (
  checker: ts.TypeChecker,
  moduleSymbol: ts.Symbol,
): ReadonlyArray<ts.Symbol> => {
  const exports = checker.getExportsOfModule(moduleSymbol);
  const exportAssignment = moduleSymbol.exports?.get(ts.InternalSymbolName.ExportEquals);
  return exportAssignment === undefined || exports.includes(exportAssignment)
    ? exports
    : [...exports, exportAssignment];
};

const symbolIdentity = (context: ProgramContext, symbol: ts.Symbol): number => {
  const existing = context.symbolIds.get(symbol);
  if (existing !== undefined) return existing;
  const identity = context.symbolIds.size;
  context.symbolIds.set(symbol, identity);
  return identity;
};

const addDeclarationExposure = (
  context: ProgramContext,
  qualifiedName: string,
  symbol: ts.Symbol | undefined,
  declarations: ReadonlyArray<ts.Declaration>,
  name: string,
  isAlias: boolean,
  parentId?: string,
  staticMember = false,
  exportedSymbol?: ts.Symbol,
  signatureName = name,
  members: ReadonlyArray<MemberGroup> = [],
): DeclarationExposureRecord | undefined => {
  if (declarations.length === 0) {
    pushExtractionDiagnostic(
      context.output,
      context.target,
      "unsupported-declaration",
      "The exported symbol has no reachable declaration.",
      qualifiedName,
      "unsupported",
    );
    return undefined;
  }
  const rawSymbolName = symbol?.getName();
  const unquotedSymbolName = rawSymbolName?.replace(/^"|"$/gu, "");
  const syntheticModuleName =
    declarations.some(ts.isSourceFile) ||
    (unquotedSymbolName !== undefined && path.isAbsolute(unquotedSymbolName));
  const declarationName =
    rawSymbolName === undefined || syntheticModuleName ? name : publicExportName(rawSymbolName);
  const record = recordFor(context, symbol, declarationName, declarations, qualifiedName, members);
  if (record.facets.some(({ family }) => family === "unsupported")) {
    pushExtractionDiagnostic(
      context.output,
      context.target,
      "unsupported-declaration",
      `Unsupported declaration kind: ${record.facets
        .filter(({ family }) => family === "unsupported")
        .map(({ syntaxKind }) => syntaxKind)
        .join(", ")}.`,
      qualifiedName,
      "unsupported",
    );
  }
  const family = record.family;
  const authoredFacade = syntheticModuleName ? facadeSignature(exportedSymbol, name) : undefined;
  const authoredAlias =
    isAlias && !canAppearAsDeclarationName(name) ? aliasSignature(exportedSymbol, name) : undefined;
  const exposure: DeclarationExposureRecord = {
    recordKind: "declaration",
    id: exposureId(context.target, qualifiedName),
    packageName: context.target.packageName,
    packageVersion: context.target.packageVersion,
    moduleName: moduleNameFromTarget(context.target),
    consumerSpecifier: context.target.consumerSpecifier,
    exportName: qualifiedName.split(".")[0]!,
    qualifiedName,
    declarationKey: record.declarationKey,
    family,
    signatures:
      authoredFacade !== undefined
        ? [authoredFacade]
        : authoredAlias !== undefined
          ? [
              authoredAlias,
              ...signaturesForFacets(context.checker, symbol, declarationName, declarations),
            ]
          : signaturesForFacets(context.checker, symbol, signatureName, declarations),
    sourceSpans: record.sourceSpans,
    aliases: [],
    isAlias,
    ...(parentId === undefined ? {} : { parentId }),
    static: staticMember,
  };
  const collision = context.output.exposures.get(exposure.id);
  if (collision !== undefined) {
    if (collision.declarationKey !== exposure.declarationKey) {
      pushExtractionDiagnostic(
        context.output,
        context.target,
        "duplicate-exposure",
        `Two declarations claim ${exposure.id}.`,
        qualifiedName,
        family,
      );
    }
    return collision;
  }
  context.output.exposures.set(exposure.id, exposure);
  return exposure;
};

const propertyName = (name: ts.PropertyName): string | undefined => {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return undefined;
};

interface MemberGroup {
  readonly name: string;
  readonly signatureName: string;
  readonly qualifiedName: string;
  readonly parentQualifiedName: string;
  readonly declarations: Array<ts.Declaration>;
  readonly symbol?: ts.Symbol;
  readonly staticMember: boolean;
}

const memberGroups = (
  context: ProgramContext,
  containerName: string,
  declarations: ReadonlyArray<ts.Declaration>,
): ReadonlyArray<MemberGroup> => {
  const groups = new Map<string, MemberGroup>();
  const classContainer = declarations.some(ts.isClassDeclaration);
  const addGroup = (
    declaration: ts.Declaration,
    name: string,
    signatureName: string,
    qualifiedName: string,
    parentQualifiedName: string,
    staticMember: boolean,
    symbol?: ts.Symbol,
  ): void => {
    const existing = groups.get(qualifiedName);
    if (existing === undefined) {
      groups.set(qualifiedName, {
        name,
        signatureName,
        qualifiedName,
        parentQualifiedName,
        declarations: [declaration],
        ...(symbol === undefined ? {} : { symbol }),
        staticMember,
      });
    } else {
      existing.declarations.push(declaration);
    }
  };
  const addNamedMember = (
    member: ts.Declaration & { readonly name?: ts.PropertyName },
    parentQualifiedName: string,
    staticMember: boolean,
    instanceMember: boolean,
  ): string => {
    if (member.name === undefined) {
      const name = `[[${ts.SyntaxKind[member.kind]}]]`;
      const qualifiedName = `${parentQualifiedName}.${name}`;
      addGroup(member, name, name, qualifiedName, parentQualifiedName, staticMember);
      return qualifiedName;
    }
    const named = propertyName(member.name);
    const name = named ?? `[[computed:${member.name.getText()}]]`;
    const signatureName = ts.isIdentifier(member.name) ? member.name.text : member.name.getText();
    const qualifiedName =
      instanceMember && !staticMember
        ? `${containerName}.prototype.${name}`
        : `${parentQualifiedName}.${name}`;
    addGroup(
      member,
      name,
      signatureName,
      qualifiedName,
      parentQualifiedName,
      staticMember,
      context.checker.getSymbolAtLocation(member.name),
    );
    return qualifiedName;
  };
  const visitTypeLiteral = (type: ts.TypeNode | undefined, ownerName: string): void => {
    while (type !== undefined && ts.isParenthesizedTypeNode(type)) type = type.type;
    if (type !== undefined && (ts.isIntersectionTypeNode(type) || ts.isUnionTypeNode(type))) {
      for (const branch of type.types) visitTypeLiteral(branch, ownerName);
      return;
    }
    if (type === undefined || !ts.isTypeLiteralNode(type)) return;
    for (const member of type.members) {
      if (isNonPublicMember(member)) continue;
      if (ts.isCallSignatureDeclaration(member)) {
        addGroup(member, "[[call]]", "", `${ownerName}.[[call]]`, ownerName, false);
      } else if (ts.isConstructSignatureDeclaration(member)) {
        addGroup(member, "[[construct]]", "", `${ownerName}.[[construct]]`, ownerName, false);
      } else if (ts.isIndexSignatureDeclaration(member)) {
        const keyType = member.parameters[0]?.type?.getText() ?? "key";
        const name = `[[index:${keyType.replace(/[^A-Za-z0-9_$.-]+/gu, "_")}]]`;
        addGroup(member, name, name, `${ownerName}.${name}`, ownerName, false);
      } else {
        const qualifiedName = addNamedMember(member, ownerName, false, false);
        if (ts.isPropertySignature(member)) visitTypeLiteral(member.type, qualifiedName);
      }
    }
  };

  for (const declaration of declarations) {
    if (ts.isClassDeclaration(declaration) || ts.isInterfaceDeclaration(declaration)) {
      for (const member of declaration.members) {
        if (isNonPublicMember(member)) continue;
        const staticMember = isStaticDeclaration(member);
        if (ts.isConstructorDeclaration(member)) {
          addGroup(
            member,
            "constructor",
            "constructor",
            `${containerName}.constructor`,
            containerName,
            false,
          );
          for (const parameter of member.parameters) {
            if (
              ts.isParameterPropertyDeclaration(parameter, member) &&
              !isNonPublicMember(parameter) &&
              ts.isIdentifier(parameter.name)
            ) {
              addGroup(
                parameter,
                parameter.name.text,
                parameter.name.text,
                `${containerName}.prototype.${parameter.name.text}`,
                containerName,
                false,
                context.checker.getSymbolAtLocation(parameter.name),
              );
            }
          }
        } else if (ts.isCallSignatureDeclaration(member)) {
          addGroup(member, "[[call]]", "", `${containerName}.[[call]]`, containerName, false);
        } else if (ts.isConstructSignatureDeclaration(member)) {
          addGroup(
            member,
            "[[construct]]",
            "",
            `${containerName}.[[construct]]`,
            containerName,
            false,
          );
        } else if (ts.isIndexSignatureDeclaration(member)) {
          const keyType = member.parameters[0]?.type?.getText() ?? "key";
          const name = `[[index:${keyType.replace(/[^A-Za-z0-9_$.-]+/gu, "_")}]]`;
          addGroup(member, name, name, `${containerName}.${name}`, containerName, false);
        } else {
          const qualifiedName = addNamedMember(member, containerName, staticMember, classContainer);
          if (ts.isPropertyDeclaration(member) || ts.isPropertySignature(member)) {
            visitTypeLiteral(member.type, qualifiedName);
          }
        }
      }
    }

    if (ts.isVariableDeclaration(declaration) || ts.isTypeAliasDeclaration(declaration)) {
      visitTypeLiteral(declaration.type, containerName);
    }

    if (ts.isEnumDeclaration(declaration)) {
      for (const member of declaration.members) {
        if (isNonPublicMember(member)) continue;
        const name = propertyName(member.name);
        if (name === undefined) continue;
        addGroup(
          member,
          name,
          name,
          `${containerName}.${name}`,
          containerName,
          true,
          context.checker.getSymbolAtLocation(member.name),
        );
      }
    }
  }
  return [...groups.values()].sort((left, right) =>
    compareText(left.qualifiedName, right.qualifiedName),
  );
};

const isNonPublicMember = (declaration: ts.Declaration): boolean => {
  const name = (declaration as ts.NamedDeclaration).name;
  return (
    hasModifier(declaration, ts.SyntaxKind.PrivateKeyword) ||
    hasModifier(declaration, ts.SyntaxKind.ProtectedKeyword) ||
    (name !== undefined && ts.isPrivateIdentifier(name)) ||
    isDocumentationExcluded(declaration)
  );
};

const visitExpectedExport = (
  context: ExpectedGraphContext,
  exported: ts.Symbol,
  qualifiedName: string,
  ancestors: ReadonlySet<ts.Symbol>,
): void => {
  const { resolved, declarations } = publicExportedDeclarations(context.checker, exported);
  if (declarations.length === 0) return;
  addExpected(context.output, context.target, qualifiedName);

  const isNamespace = declarations.some(
    (declaration) => ts.isModuleDeclaration(declaration) || ts.isSourceFile(declaration),
  );
  if (!isNamespace || ancestors.has(resolved)) return;
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(resolved);
  const members = [...exportsOfModule(context.checker, resolved)].sort((left, right) =>
    compareText(publicExportName(left.getName()), publicExportName(right.getName())),
  );
  for (const member of members) {
    const name = publicExportName(member.getName());
    visitExpectedExport(context, member, `${qualifiedName}.${name}`, nextAncestors);
  }
};

const collectExpectedGraph = (context: ExpectedGraphContext, moduleSymbol: ts.Symbol): void => {
  const exports = [...exportsOfModule(context.checker, moduleSymbol)].sort((left, right) =>
    compareText(publicExportName(left.getName()), publicExportName(right.getName())),
  );
  for (const exported of exports) {
    const name = publicExportName(exported.getName());
    visitExpectedExport(context, exported, name, new Set());
  }
};

const visitExport = (
  context: ProgramContext,
  exported: ts.Symbol,
  qualifiedName: string,
  parentId: string | undefined,
  ancestors: ReadonlySet<ts.Symbol>,
  inheritedAlias = false,
): void => {
  const { resolved, declarations } = publicExportedDeclarations(context.checker, exported);
  if (declarations.length === 0) return;
  const visitKey = `${symbolIdentity(context, resolved)}\0${qualifiedName}`;
  if (context.visited.has(visitKey)) return;
  context.visited.add(visitKey);
  const exportedName = publicExportName(exported.getName());
  const isAlias = inheritedAlias || resolved !== exported;
  const structuralMembers = memberGroups(context, qualifiedName, declarations);
  const exposure = addDeclarationExposure(
    context,
    qualifiedName,
    resolved,
    declarations,
    exportedName,
    isAlias,
    parentId,
    false,
    exported,
    exportedName,
    structuralMembers,
  );
  if (exposure === undefined) return;

  const isNamespace = declarations.some(
    (declaration) => ts.isModuleDeclaration(declaration) || ts.isSourceFile(declaration),
  );
  if (!isNamespace || ancestors.has(resolved)) return;
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(resolved);
  const members = exportsOfModule(context.checker, resolved);
  for (const member of [...members].sort((left, right) =>
    compareText(left.getName(), right.getName()),
  )) {
    const name = publicExportName(member.getName());
    visitExport(context, member, `${qualifiedName}.${name}`, exposure.id, nextAncestors, isAlias);
  }
};

const parsedProgram = (
  targets: ReadonlyArray<PublicModuleTarget>,
  repositoryRoot: string,
  output: MutableExtraction,
): ts.Program => {
  const packageRoot = targets[0]!.packageRoot;
  const configPath = ts.findConfigFile(packageRoot, fs.existsSync, "tsconfig.json");
  let options: ts.CompilerOptions = {};
  let projectReferences: ReadonlyArray<ts.ProjectReference> | undefined;
  if (configPath === undefined) {
    for (const target of targets) {
      pushExtractionDiagnostic(
        output,
        target,
        "missing-tsconfig",
        "The package has no discoverable tsconfig.json.",
      );
    }
  } else {
    const read = ts.readConfigFile(configPath, (file) => fs.readFileSync(file, "utf8"));
    if (read.error !== undefined) {
      for (const target of targets) {
        pushExtractionDiagnostic(
          output,
          target,
          "invalid-tsconfig",
          sanitizedCompilerDiagnostic(read.error.messageText, repositoryRoot),
        );
      }
    } else {
      const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, path.dirname(configPath));
      options = parsed.options;
      projectReferences = parsed.projectReferences;
      for (const error of parsed.errors) {
        for (const target of targets) {
          pushExtractionDiagnostic(
            output,
            target,
            "invalid-tsconfig",
            sanitizedCompilerDiagnostic(error.messageText, repositoryRoot),
          );
        }
      }
    }
  }
  return ts.createProgram({
    rootNames: unique(targets.map(({ documentationTarget }) => path.resolve(documentationTarget))),
    options,
    projectReferences,
  });
};

const extractTypeScriptTargets = (
  targets: ReadonlyArray<PublicModuleTarget>,
  repositoryRoot: string,
  output: MutableExtraction,
): void => {
  if (targets.length === 0) return;
  const program = parsedProgram(targets, repositoryRoot, output);
  const checker = program.getTypeChecker();
  const resolvedTargets: Array<{
    readonly target: PublicModuleTarget;
    readonly moduleSymbol: ts.Symbol;
  }> = [];
  for (const target of targets) {
    const absoluteTarget = path.resolve(target.documentationTarget);
    const sourceFile =
      program.getSourceFile(absoluteTarget) ??
      program
        .getSourceFiles()
        .find((candidate) => path.resolve(candidate.fileName) === absoluteTarget);
    if (sourceFile === undefined) {
      pushExtractionDiagnostic(
        output,
        target,
        "missing-module",
        "The published declaration target is absent from the TypeScript program.",
      );
      continue;
    }
    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    if (moduleSymbol === undefined) {
      pushExtractionDiagnostic(
        output,
        target,
        "missing-module-symbol",
        "The published declaration target has no module symbol.",
      );
      continue;
    }
    resolvedTargets.push({ target, moduleSymbol });
  }

  for (const { target, moduleSymbol } of resolvedTargets) {
    collectExpectedGraph({ checker, target, output }, moduleSymbol);
  }

  const declarationMaps = new Map<string, DeclarationMapLookup | undefined>();
  const authoredSources = new Map<string, AuthoredSourceLookup | undefined>();
  const symbolIds = new Map<ts.Symbol, number>();
  for (const { target, moduleSymbol } of resolvedTargets) {
    const context: ProgramContext = {
      checker,
      repositoryRoot,
      target,
      output,
      declarationMaps,
      authoredSources,
      symbolIds,
      visited: new Set(),
    };
    const exports = [...exportsOfModule(checker, moduleSymbol)].sort((left, right) =>
      compareText(publicExportName(left.getName()), publicExportName(right.getName())),
    );
    for (const exported of exports) {
      const name = publicExportName(exported.getName());
      visitExport(context, exported, name, undefined, new Set());
    }
  }
};

const isJsonRecord = (input: unknown): input is Readonly<Record<string, unknown>> =>
  typeof input === "object" && input !== null && !Array.isArray(input);

const resourceSpan = (
  repositoryRoot: string,
  target: PublicModuleTarget,
  raw: string,
  output: MutableExtraction,
): SourceSpan => {
  const lines = raw.split("\n");
  const relative = normalizedRelativePath(repositoryRoot, target.documentationTarget);
  if (relative === undefined) {
    pushExtractionDiagnostic(
      output,
      target,
      "source-outside-repository",
      "The published resource is outside the repository root.",
      "$resource",
    );
  }
  return {
    file: relative ?? path.basename(target.documentationTarget),
    start: { line: 1, column: 1 },
    end: { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 },
  };
};

const extractResource = (
  target: PublicModuleTarget,
  repositoryRoot: string,
  output: MutableExtraction,
): void => {
  let raw = "";
  let structured: unknown = null;
  try {
    raw = fs.readFileSync(target.documentationTarget, "utf8");
    structured = JSON.parse(raw) as unknown;
  } catch {
    pushExtractionDiagnostic(
      output,
      target,
      "invalid-resource",
      "Unable to read or parse the published JSON resource.",
      "$resource",
    );
  }
  const record = isJsonRecord(structured) ? structured : {};
  const extended = record.extends;
  const extensions =
    typeof extended === "string"
      ? [extended]
      : Array.isArray(extended) && extended.every((value) => typeof value === "string")
        ? extended
        : [];
  const compilerOptions = isJsonRecord(record.compilerOptions) ? record.compilerOptions : {};
  const resource: ResourceRecord = {
    recordKind: "resource",
    id: exposureId(target, "$resource"),
    packageName: target.packageName,
    packageVersion: target.packageVersion,
    moduleName: moduleNameFromTarget(target),
    consumerSpecifier: target.consumerSpecifier,
    exportName: "$resource",
    qualifiedName: "$resource",
    family: "resource",
    mediaType: target.mediaType,
    raw,
    structured,
    extends: extensions,
    compilerOptions,
    usage: `${JSON.stringify({ extends: target.consumerSpecifier }, null, 2)}\n`,
    sourceSpans: [resourceSpan(repositoryRoot, target, raw, output)],
    aliases: [],
    isAlias: false,
  };
  output.resources.push(resource);
};

const normalizeAliases = (
  exposures: ReadonlyArray<DeclarationExposureRecord>,
): ReadonlyArray<DeclarationExposureRecord> => {
  const byDeclaration = Map.groupBy(exposures, ({ declarationKey }) => declarationKey);
  return exposures.map((exposure) => {
    const group = [...(byDeclaration.get(exposure.declarationKey) ?? [])].sort((left, right) =>
      compareText(left.id, right.id),
    );
    const aliases = group.filter(({ id }) => id !== exposure.id).map(({ id }) => id);
    return {
      ...exposure,
      aliases,
      ...(exposure.isAlias ? { importedFrom: exposure.declarationKey } : {}),
    };
  });
};

/**
 * Extracts concrete published module targets into shared declaration records and
 * consumer-facing exposure records. Package manifests are intentionally outside
 * this boundary; `Published.ts` owns that graph.
 */
export const extractPublicModules = (
  targets: ReadonlyArray<PublicModuleTarget>,
  options: ExtractPublicModulesOptions = {},
): PublicApiExtraction => {
  const repositoryRoot = path.resolve(
    options.repositoryRoot ??
      (targets[0] === undefined ? process.cwd() : path.resolve(targets[0].packageRoot, "../..")),
  );
  const output: MutableExtraction = {
    declarations: new Map(),
    exposures: new Map(),
    resources: [],
    expected: new Map(),
    diagnostics: [],
    diagnosticKeys: new Set(),
  };
  const typeScriptByPackage = Map.groupBy(
    targets.filter(({ mediaType }) => mediaType === "text/typescript"),
    ({ packageRoot }) => packageRoot,
  );
  for (const packageTargets of typeScriptByPackage.values()) {
    extractTypeScriptTargets(packageTargets, repositoryRoot, output);
  }
  const resourceTargets = targets.filter(({ mediaType }) => mediaType === "application/json");
  for (const target of resourceTargets) {
    addExpected(output, target, "$resource");
  }
  for (const target of resourceTargets) {
    extractResource(target, repositoryRoot, output);
  }

  const declarationExposures = normalizeAliases([...output.exposures.values()]);
  const resources = [...output.resources].sort((left, right) => compareText(left.id, right.id));
  const exposures: ReadonlyArray<ExposureRecord> = [...declarationExposures, ...resources].sort(
    (left, right) => compareText(left.id, right.id),
  );
  return {
    declarations: [...output.declarations.values()].sort((left, right) =>
      compareText(left.declarationKey, right.declarationKey),
    ),
    exposures,
    resources,
    expectedExposures: [...output.expected.values()].sort((left, right) =>
      compareText(left.id, right.id),
    ),
    diagnostics: [...output.diagnostics].sort((left, right) =>
      compareText(
        `${left.packageName}\0${left.consumerSpecifier}\0${left.qualifiedName ?? ""}\0${left.code}`,
        `${right.packageName}\0${right.consumerSpecifier}\0${right.qualifiedName ?? ""}\0${right.code}`,
      ),
    ),
  };
};
