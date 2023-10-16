---
title: Parser.ts
nav_order: 10
parent: "@typed/template"
---

## Parser overview

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Parser (interface)](#parser-interface)
  - [parser](#parser)
  - [templateHash](#templatehash)

---

# utils

## Parser (interface)

**Signature**

```ts
export interface Parser {
  parse(template: ReadonlyArray<string>, tokenStream?: Iterator<Token>): Template.Template
}
```

## parser

**Signature**

```ts
export declare const parser: Parser
```

## templateHash

Generates a hash for an ordered list of strings. Intended for the purposes
of server-side rendering with hydration.

**Signature**

```ts
export declare function templateHash(strings: ReadonlyArray<string>)
```
