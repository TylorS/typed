---
title: typescript/Project.ts
nav_order: 7
parent: "@typed/compiler"
---

## Project overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Project (class)](#project-class)
    - [addFile (method)](#addfile-method)
    - [setFile (method)](#setfile-method)
    - [getSnapshot (method)](#getsnapshot-method)
    - [getType (method)](#gettype-method)
    - [getSymbol (method)](#getsymbol-method)
    - [getFileDiagnostics (method)](#getfilediagnostics-method)
    - [validateFile (method)](#validatefile-method)
    - [emitFile (method)](#emitfile-method)
    - [dispose (method)](#dispose-method)
    - [projectFiles (property)](#projectfiles-property)
    - [externalFiles (property)](#externalfiles-property)
    - [languageService (property)](#languageservice-property)
    - [program (property)](#program-property)
    - [typeChecker (property)](#typechecker-property)
    - [languageServiceHost (property)](#languageservicehost-property)

---

# utils

## Project (class)

**Signature**

```ts
export declare class Project { constructor(
    documentRegistry: ts.DocumentRegistry,
    readonly diagnosticWriter: DiagnosticWriter,
    cmdLine: ts.ParsedCommandLine,
    enhanceLanguageServiceHost?: (host: ts.LanguageServiceHost) => void
  ) }
```

Added in v1.0.0

### addFile (method)

**Signature**

```ts
addFile(filePath: string)
```

Added in v1.0.0

### setFile (method)

**Signature**

```ts
setFile(fileName: string, snapshot: ts.IScriptSnapshot): void
```

Added in v1.0.0

### getSnapshot (method)

**Signature**

```ts
getSnapshot(filePath: string)
```

Added in v1.0.0

### getType (method)

**Signature**

```ts
getType(node: ts.Node): ts.Type
```

Added in v1.0.0

### getSymbol (method)

**Signature**

```ts
getSymbol(node: ts.Node): ts.Symbol | undefined
```

Added in v1.0.0

### getFileDiagnostics (method)

**Signature**

```ts
getFileDiagnostics(fileName: string): ReadonlyArray<ts.Diagnostic>
```

Added in v1.0.0

### validateFile (method)

**Signature**

```ts
validateFile(fileName: string): boolean
```

Added in v1.0.0

### emitFile (method)

**Signature**

```ts
emitFile(fileName: string): Array<ts.OutputFile>
```

Added in v1.0.0

### dispose (method)

**Signature**

```ts
dispose(): void
```

Added in v1.0.0

### projectFiles (property)

**Signature**

```ts
readonly projectFiles: ProjectFileCache
```

Added in v1.0.0

### externalFiles (property)

**Signature**

```ts
readonly externalFiles: ExternalFileCache
```

Added in v1.0.0

### languageService (property)

**Signature**

```ts
readonly languageService: ts.LanguageService
```

Added in v1.0.0

### program (property)

**Signature**

```ts
readonly program: ts.Program
```

Added in v1.0.0

### typeChecker (property)

**Signature**

```ts
readonly typeChecker: ts.TypeChecker
```

Added in v1.0.0

### languageServiceHost (property)

**Signature**

```ts
readonly languageServiceHost: ts.LanguageServiceHost
```

Added in v1.0.0
