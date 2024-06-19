---
title: typescript/diagnostics.ts
nav_order: 4
parent: "@typed/compiler"
---

## diagnostics overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [DiagnosticWriter (type alias)](#diagnosticwriter-type-alias)
  - [createDiagnosticWriter](#creatediagnosticwriter)

---

# utils

## DiagnosticWriter (type alias)

**Signature**

```ts
export type DiagnosticWriter = {
  /**
   * @since 1.0.0
   */
  format: (diagnostic: ts.Diagnostic) => string
  /**
   * @since 1.0.0
   */
  print: (diagnostic: ts.Diagnostic) => void
}
```

Added in v1.0.0

## createDiagnosticWriter

**Signature**

```ts
export declare function createDiagnosticWriter(write?: (message: string) => void): DiagnosticWriter
```

Added in v1.0.0
