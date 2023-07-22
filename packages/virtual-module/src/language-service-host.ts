import ts from 'typescript'

import { VirtualModuleManager } from './VirtualModuleManager.js'
import { createOverrides } from './utils.js'

export function patchLanguageServiceHost(
  cmdLine: ts.ParsedCommandLine,
  host: ts.LanguageServiceHost,
  manager: VirtualModuleManager,
  workingDirectory: string,
  saveGeneratedFiles: boolean,
  options: ts.CompilerOptions,
): ts.LanguageServiceHost {
  const moduleResolutionCache = createModuleResolutionCache(workingDirectory, options)
  const createModuleResolver =
    (
      containingFile: string,
      options: ts.CompilerOptions,
      redirectedReference?: ts.ResolvedProjectReference,
    ) =>
    (name: string): ts.ResolvedModuleWithFailedLookupLocations => {
      if (manager.matches(name, containingFile)) {
        manager.log(`Resolving ${name} from ${containingFile}...`)

        const resolvedFileName = manager.resolveFileName(name, containingFile)

        const resolved: ts.ResolvedModuleWithFailedLookupLocations = {
          resolvedModule: {
            extension: ts.Extension.Ts,
            resolvedFileName,
            isExternalLibraryImport: !saveGeneratedFiles,
            resolvedUsingTsExtension: false,
          },
        }

        return resolved
      }

      return ts.resolveModuleName(
        name,
        containingFile,
        options,
        languageServiceHost,
        moduleResolutionCache,
        redirectedReference,
        getModuleResolutionKind(options),
      )
    }

  const languageServiceHost = createOverrides(host, {
    getCompilationSettings: () => () => cmdLine.options,
    getProjectReferences: () => () => cmdLine.projectReferences,

    getScriptFileNames: (original) => () => [...original(), ...manager.cache.getScriptFileNames()],
    getScriptKind: (original) => (fileName) =>
      manager.cache.getScriptKind(fileName) || original?.(fileName) || ts.ScriptKind.Unknown,
    getScriptSnapshot: (original) => (fileName) =>
      manager.cache.getSnapshot(fileName) || original(fileName),
    getScriptVersion: (original) => (fileName) =>
      manager.cache.getScriptVersion(fileName) || original(fileName),
    resolveModuleNameLiterals:
      (original) =>
      (moduleNames, containingFile, redirectedReference, options, ...rest) => {
        const resolver = createModuleResolver(containingFile, options, redirectedReference)

        return (
          original?.(moduleNames, containingFile, redirectedReference, options, ...rest).map(
            (resolved, i) => {
              if (resolved.resolvedModule) {
                return resolved
              }

              return resolver(moduleNames[i].text)
            },
          ) ?? moduleNames.map((n) => resolver(n.text))
        )
      },
    resolveModuleNames:
      (original) =>
      (moduleNames, containingFile, reusedNames, redirectedReference, options, ...rest) => {
        const resolver = createModuleResolver(containingFile, options, redirectedReference)

        return (
          original?.(
            moduleNames,
            containingFile,
            reusedNames,
            redirectedReference,
            options,
            ...rest,
          ).map((resolved, i) => {
            if (resolved) {
              return resolved
            }

            return resolver(moduleNames[i]).resolvedModule
          }) ?? moduleNames.map((n) => resolver(n).resolvedModule)
        )
      },

    /*
     * LS host can optionally implement these methods to support completions for module specifiers.
     * Without these methods, only completions for ambient modules will be provided.
     */
    readDirectory: (original) => original || ts.sys.readDirectory,
    readFile: (original) => original || ts.sys.readFile,
    realpath: (original) => original || ts.sys.realpath,
    fileExists: (original) => original || ts.sys.fileExists,
    /*
     * Required for full import and type reference completions.
     * These should be unprefixed names. E.g. `getDirectories("/foo/bar")` should return `["a", "b"]`, not `["/foo/bar/a", "/foo/bar/b"]`.
     */
    getDirectories: (original) => original || ts.sys.getDirectories,
    directoryExists: (original) => original || ts.sys.directoryExists,
  })

  return languageServiceHost
}

export function getModuleResolutionKind(options: ts.CompilerOptions): ts.ResolutionMode {
  switch (options.moduleResolution) {
    case ts.ModuleResolutionKind.NodeJs:
      return ts.ModuleKind.CommonJS
    case ts.ModuleResolutionKind.Bundler:
    case ts.ModuleResolutionKind.Node16:
    case ts.ModuleResolutionKind.NodeNext:
      return ts.ModuleKind.ESNext
  }
}

export function getCanonicalFileName(fileName: string): string {
  return ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase()
}

export function createModuleResolutionCache(cwd: string, options: ts.CompilerOptions) {
  return ts.createModuleResolutionCache(cwd, getCanonicalFileName, options)
}
