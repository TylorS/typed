/**
 * @since 1.0.0
 */

import ts from "typescript"
import { ExternalFileCache, ProjectFileCache } from "./cache.js"
import type { DiagnosticWriter } from "./diagnostics.js"

/**
 * @since 1.0.0
 */
export class Project {
  private cmdLine: ts.ParsedCommandLine

  /**
   * @since 1.0.0
   */
  readonly projectFiles: ProjectFileCache

  /**
   * @since 1.0.0
   */
  readonly externalFiles: ExternalFileCache

  /**
   * @since 1.0.0
   */
  readonly languageService: ts.LanguageService

  /**
   * @since 1.0.0
   */
  readonly program: ts.Program

  /**
   * @since 1.0.0
   */
  readonly typeChecker: ts.TypeChecker

  /**
   * @since 1.0.0
   */
  readonly languageServiceHost: ts.LanguageServiceHost

  constructor(
    documentRegistry: ts.DocumentRegistry,
    readonly diagnosticWriter: DiagnosticWriter,
    cmdLine: ts.ParsedCommandLine,
    enhanceLanguageServiceHost?: (host: ts.LanguageServiceHost) => void
  ) {
    this.cmdLine = cmdLine

    this.projectFiles = new ProjectFileCache(cmdLine.fileNames)
    this.externalFiles = new ExternalFileCache()

    const languageServiceHost: ts.LanguageServiceHost = (this.languageServiceHost = {
      getCompilationSettings: () => this.cmdLine.options,
      // getNewLine?(): string;
      // getProjectVersion?(): string;
      getScriptFileNames: () => this.projectFiles.getFileNames(),
      // getScriptKind?(fileName: string): ts.ScriptKind;
      getScriptVersion: (fileName) => this.projectFiles.getVersion(fileName) ?? "0",
      getScriptSnapshot: (fileName) =>
        this.projectFiles.getSnapshot(fileName) ??
          this.externalFiles.getSnapshot(fileName),
      getProjectReferences: ():
        | ReadonlyArray<ts.ProjectReference>
        | undefined => cmdLine.projectReferences,
      // getLocalizedDiagnosticMessages?(): any;
      // getCancellationToken?(): HostCancellationToken;
      getCurrentDirectory: () => process.cwd(),
      getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
      // log: (s: string): void;
      // trace: (s: string): void;
      // error: (s: string): void;
      // useCaseSensitiveFileNames?(): boolean;

      /*
       * LS host can optionally implement these methods to support completions for module specifiers.
       * Without these methods, only completions for ambient modules will be provided.
       */
      readDirectory: ts.sys.readDirectory,
      readFile: ts.sys.readFile,
      realpath: ts.sys.realpath || ((x) => x),
      fileExists: ts.sys.fileExists,

      /*
       * LS host can optionally implement these methods to support automatic updating when new type libraries are installed
       */
      // getTypeRootsVersion?(): number;

      /*
       * LS host can optionally implement this method if it wants to be completely in charge of module name resolution.
       * if implementation is omitted then language service will use built-in module resolution logic and get answers to
       * host specific questions using 'getScriptSnapshot'.
       *
       * If this is implemented, `getResolvedModuleWithFailedLookupLocationsFromCache` should be too.
       */
      // resolveModuleNames?(moduleNames: string[], containingFile: string, reusedNames: string[] | undefined, redirectedReference: ResolvedProjectReference | undefined, options: CompilerOptions): (ResolvedModule | undefined)[];
      // getResolvedModuleWithFailedLookupLocationsFromCache?(modulename: string, containingFile: string): ResolvedModuleWithFailedLookupLocations | undefined;
      // resolveTypeReferenceDirectives?(typeDirectiveNames: string[], containingFile: string, redirectedReference: ResolvedProjectReference | undefined, options: CompilerOptions): (ResolvedTypeReferenceDirective | undefined)[];

      /*
       * Required for full import and type reference completions.
       * These should be unprefixed names. E.g. `getDirectories("/foo/bar")` should return `["a", "b"]`, not `["/foo/bar/a", "/foo/bar/b"]`.
       */
      getDirectories: ts.sys.getDirectories,

      /**
       * Gets a set of custom transformers to use during emit.
       */
      // getCustomTransformers?(): CustomTransformers | undefined;

      // isKnownTypesPackageName?(name: string): boolean;
      // installPackage?(options: InstallPackageOptions): Promise<ApplyCodeActionCommandResult>;
      // writeFile?(fileName: string, content: string): void;

      // getParsedCommandLine?(fileName: string): ParsedCommandLine | undefined;

      directoryExists: ts.sys.directoryExists
    })

    if (enhanceLanguageServiceHost) {
      enhanceLanguageServiceHost(languageServiceHost)
    }

    this.languageService = ts.createLanguageService(
      languageServiceHost,
      documentRegistry
    )
    this.program = this.languageService.getProgram()!
    this.typeChecker = this.program.getTypeChecker()
  }

  /**
   * @since 1.0.0
   */
  addFile(filePath: string) {
    console.log("addFile", { filePath })
    // Add snapshot
    this.projectFiles.getSnapshot(filePath)
    return this.program.getSourceFile(filePath)!
  }

  /**
   * @since 1.0.0
   */
  setFile(fileName: string, snapshot: ts.IScriptSnapshot): void {
    this.projectFiles.set(fileName, snapshot)
  }

  /**
   * @since 1.0.0
   */
  getSnapshot(filePath: string) {
    return this.languageServiceHost.getScriptSnapshot(filePath)
  }
  /**
   * @since 1.0.0
   */
  getType(node: ts.Node): ts.Type {
    return this.typeChecker.getTypeAtLocation(node)
  }
  /**
   * @since 1.0.0
   */
  getSymbol(node: ts.Node): ts.Symbol | undefined {
    return this.typeChecker.getSymbolAtLocation(node)
  }
  /**
   * @since 1.0.0
   */
  getFileDiagnostics(fileName: string): ReadonlyArray<ts.Diagnostic> {
    return [
      ...this.languageService.getSyntacticDiagnostics(fileName),
      ...this.languageService.getSemanticDiagnostics(fileName),
      ...this.languageService.getSuggestionDiagnostics(fileName)
    ]
  }
  /**
   * @since 1.0.0
   */
  validateFile(fileName: string): boolean {
    const diagnostics = this.getFileDiagnostics(fileName).filter(
      (d) => d.category !== ts.DiagnosticCategory.Suggestion
    )
    if (Array.isArray(diagnostics) && diagnostics.length > 0) {
      diagnostics.forEach((d) => this.diagnosticWriter.print(d))
      return false
    }
    return true
  }
  /**
   * @since 1.0.0
   */
  emitFile(fileName: string): Array<ts.OutputFile> {
    const output = this.languageService.getEmitOutput(fileName)
    if (!output || output.emitSkipped) {
      this.validateFile(fileName)
      return []
    }

    return output.outputFiles
  }
  /**
   * @since 1.0.0
   */
  dispose(): void {
    this.languageService.dispose()

    // @ts-expect-error `languageService` cannot be used after calling dispose
    this.languageService = null
  }
}
