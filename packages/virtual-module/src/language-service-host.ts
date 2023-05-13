import ts from 'typescript'

import { createOverrides } from './utils.js'

export function patchLanguageServiceHost(
  cmdLine: ts.ParsedCommandLine,
  host: ts.LanguageServiceHost,
): ts.LanguageServiceHost {
  return createOverrides(host, {
    getCompilationSettings: () => () => cmdLine.options,
    getProjectReferences: () => () => cmdLine.projectReferences,

    // TODO: Implement these overrides with virtual modules
    getScriptFileNames: (original) => original,
    getScriptKind: (original) => original,
    getScriptSnapshot: (original) => original,
    getScriptVersion: (original) => original,
    resolveModuleNameLiterals: (original) => original,
    resolveModuleNames: (original) => original,

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
}
