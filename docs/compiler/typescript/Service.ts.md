---
title: typescript/Service.ts
nav_order: 8
parent: "@typed/compiler"
---

## Service overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Service (class)](#service-class)
    - [openProject (method)](#openproject-method)
    - [documentRegistry (property)](#documentregistry-property)
    - [diagnosticWriter (property)](#diagnosticwriter-property)

---

# utils

## Service (class)

**Signature**

```ts
export declare class Service {
  constructor(write?: (message: string) => void)
}
```

Added in v1.0.0

### openProject (method)

**Signature**

```ts
openProject(
    cmdLine: ts.ParsedCommandLine,
    enhanceLanguageServiceHost?: (host: ts.LanguageServiceHost) => void
  ): Project
```

Added in v1.0.0

### documentRegistry (property)

**Signature**

```ts
readonly documentRegistry: ts.DocumentRegistry
```

Added in v1.0.0

### diagnosticWriter (property)

**Signature**

```ts
readonly diagnosticWriter: DiagnosticWriter
```

Added in v1.0.0
