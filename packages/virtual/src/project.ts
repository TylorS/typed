import ts from 'typescript'

import { ExternalFileCache, ProjectFileCache } from './cache'
import type { DiagnosticWriter } from './diagnostics'
import { EnhanceProject } from './types'

export class Project {
  private cmdLine: ts.ParsedCommandLine
  private diagnostics: ts.Diagnostic[] = []

  readonly projectFiles: ProjectFileCache
  readonly externalFiles: ExternalFileCache
  public languageServiceHost: ts.LanguageServiceHost

  protected _languageService!: ts.LanguageService

  constructor(
    readonly documentRegistry: ts.DocumentRegistry,
    readonly diagnosticWriter: DiagnosticWriter,
    cmdLine: ts.ParsedCommandLine,
    enhance?: EnhanceProject,
  ) {
    this.diagnosticWriter = diagnosticWriter
    this.cmdLine = cmdLine

    this.projectFiles = new ProjectFileCache(cmdLine.fileNames)
    this.externalFiles = new ExternalFileCache()

    this.languageServiceHost = {
      getCompilationSettings: () => this.cmdLine.options,
      //getNewLine?(): string;
      //getProjectVersion?(): string;
      getScriptFileNames: () => Array.from(this.projectFiles.getFileNames()),
      //getScriptKind?(fileName: string): ts.ScriptKind;
      getScriptVersion: (fileName) => this.projectFiles.getVersion(fileName) ?? '0',
      getScriptSnapshot: (fileName) =>
        this.projectFiles.getSnapshot(fileName) ?? this.externalFiles.getSnapshot(fileName),
      getProjectReferences: (): readonly ts.ProjectReference[] | undefined =>
        cmdLine.projectReferences,
      //getLocalizedDiagnosticMessages?(): any;
      //getCancellationToken?(): HostCancellationToken;
      getCurrentDirectory: () => process.cwd(),
      getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
      //useCaseSensitiveFileNames?(): boolean;

      /*
       * LS host can optionally implement these methods to support completions for module specifiers.
       * Without these methods, only completions for ambient modules will be provided.
       */
      readDirectory: ts.sys.readDirectory,
      readFile: ts.sys.readFile,
      realpath: ts.sys.realpath,
      fileExists: ts.sys.fileExists,
      /*
       * Required for full import and type reference completions.
       * These should be unprefixed names. E.g. `getDirectories("/foo/bar")` should return `["a", "b"]`, not `["/foo/bar/a", "/foo/bar/b"]`.
       */
      getDirectories: ts.sys.getDirectories,

      directoryExists: ts.sys.directoryExists,
    }

    if (enhance) {
      enhance(this)
    }
  }

  get languageService(): ts.LanguageService {
    return (this._languageService ||= ts.createLanguageService(
      this.languageServiceHost,
      this.documentRegistry,
    ))
  }

  getCommandLine(): ts.ParsedCommandLine {
    return this.cmdLine
  }

  private getFileDiagnostics(fileName: string): ts.Diagnostic[] {
    return [
      ...this.languageService.getSyntacticDiagnostics(fileName),
      ...this.languageService.getSemanticDiagnostics(fileName),
    ]
  }

  validateFile(fileName: string): boolean {
    return this.printDiagnostics(this.getFileDiagnostics(fileName))
  }

  protected printDiagnostics(diagnostics: ts.Diagnostic[]): boolean {
    if (Array.isArray(diagnostics) && diagnostics.length > 0) {
      diagnostics.forEach((d) => this.diagnosticWriter.print(d))
      return false
    }
    return true
  }

  validate(): boolean {
    //  filter down the list of files to be checked
    const matcher = this.cmdLine.options.checkJs ? /[.][jt]sx?$/ : /[.]tsx?$/

    //  check each file
    let result = true
    for (const file of this.projectFiles.getFileNames()) {
      if (file.match(matcher)) {
        //  always validate the file, even if others have failed
        const fileResult = this.validateFile(file)
        //  combine this file's result with the aggregate result
        result = result && fileResult
      }
    }

    this.diagnostics.forEach((d) => this.diagnosticWriter.print(d))
    this.diagnostics = []

    return result
  }

  emitFile(fileName: string): boolean {
    const output = this.languageService.getEmitOutput(fileName)
    if (!output || output.emitSkipped) {
      this.validateFile(fileName)
      return false
    }
    output.outputFiles.forEach((o) => {
      ts.sys.writeFile(o.name, o.text)
    })
    return true
  }

  emit(): boolean {
    //  emit each file
    let result = true
    for (const file of this.projectFiles.getFileNames()) {
      //  always emit the file, even if others have failed
      const fileResult = this.emitFile(file)
      //  combine this file's result with the aggregate result
      result = result && fileResult
    }
    return result
  }

  hasFile(fileName: string): boolean {
    return this.projectFiles.has(fileName)
  }

  setFile(fileName: string, snapshot?: ts.IScriptSnapshot): void {
    this.projectFiles.set(fileName, snapshot)
  }

  removeFile(fileName: string): void {
    this.projectFiles.remove(fileName)
  }

  removeAllFiles(): void {
    this.projectFiles.removeAll()
  }

  dispose(): void {
    this.languageService.dispose()

    // @ts-expect-error `languageService` cannot be used after calling dispose
    this.languageService = null

    this.diagnostics = []
  }

  getProgram() {
    return this.languageService.getProgram()
  }
}
