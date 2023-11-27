---
title: CustomElementRegistry.ts
nav_order: 1
parent: "@typed/dom"
---

## CustomElementRegistry overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [CustomElementConstructor (type alias)](#customelementconstructor-type-alias)
  - [CustomElementRegistry](#customelementregistry)
  - [CustomElementRegistry (interface)](#customelementregistry-interface)
  - [ElementDefinitionOptions (type alias)](#elementdefinitionoptions-type-alias)
  - [define](#define)
  - [get](#get)
  - [upgrade](#upgrade)
  - [whenDefined](#whendefined)

---

# utils

## CustomElementConstructor (type alias)

**Signature**

```ts
export type CustomElementConstructor = globalThis.CustomElementConstructor
```

Added in v1.0.0

## CustomElementRegistry

**Signature**

```ts
export declare const CustomElementRegistry: Tagged<CustomElementRegistry, CustomElementRegistry>
```

Added in v1.0.0

## CustomElementRegistry (interface)

**Signature**

```ts
export interface CustomElementRegistry extends globalThis.CustomElementRegistry {}
```

Added in v1.0.0

## ElementDefinitionOptions (type alias)

**Signature**

```ts
export type ElementDefinitionOptions = globalThis.ElementDefinitionOptions
```

Added in v1.0.0

## define

**Signature**

```ts
export declare const define: <K extends keyof HTMLElementTagNameMap>(
  name: K,
  constructor: CustomElementConstructor,
  options?: ElementDefinitionOptions
) => Effect.Effect<CustomElementRegistry, never, void>
```

Added in v1.0.0

## get

**Signature**

```ts
export declare const get: <K extends keyof HTMLElementTagNameMap>(
  name: K
) => Effect.Effect<CustomElementRegistry, NoSuchElementException, CustomElementConstructor>
```

Added in v1.0.0

## upgrade

**Signature**

```ts
export declare const upgrade: (node: Node) => Effect.Effect<CustomElementRegistry, never, void>
```

Added in v1.0.0

## whenDefined

**Signature**

```ts
export declare const whenDefined: <K extends keyof HTMLElementTagNameMap>(
  name: K
) => Effect.Effect<CustomElementRegistry, never, CustomElementConstructor>
```

Added in v1.0.0
