---
title: Parser.ts
nav_order: 12
parent: "@typed/template"
---

## Parser overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Parser (interface)](#parser-interface)
  - [parser](#parser)

---

# utils

## Parser (interface)

**Signature**

```ts
export interface Parser {
  parse(template: ReadonlyArray<string>, tokenStream?: Iterator<Token>): Template.Template
}
```

Added in v1.0.0

## parser

**Signature**

```ts
export declare const parser: Parser
```

Added in v1.0.0
