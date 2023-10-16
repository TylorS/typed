---
title: Entry.ts
nav_order: 4
parent: "@typed/template"
---

## Entry overview

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [BrowserEntry (interface)](#browserentry-interface)
  - [Entry (type alias)](#entry-type-alias)
  - [ServerEntry (interface)](#serverentry-interface)

---

# utils

## BrowserEntry (interface)

**Signature**

```ts
export interface BrowserEntry {
  readonly _tag: 'Browser'
  readonly template: Template
  readonly content: DocumentFragment
}
```

## Entry (type alias)

**Signature**

```ts
export type Entry = BrowserEntry | ServerEntry
```

## ServerEntry (interface)

**Signature**

```ts
export interface ServerEntry {
  readonly _tag: 'Server'
  readonly template: Template
  readonly chunks: ReadonlyArray<HtmlChunk>
}
```
