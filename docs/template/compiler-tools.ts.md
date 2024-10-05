---
title: compiler-tools.ts
nav_order: 1
parent: "@typed/template"
---

## compiler-tools overview

A collection of tools utilized by @typed/compiler to setup templates imperatively.
This is not intended for direct usage by end-users and the API surface is not guaranteed
to have the same stabilitiy as the rest of the library.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [HydrateContext (interface)](#hydratecontext-interface)
  - [HydrationElement (interface)](#hydrationelement-interface)
  - [HydrationHole (interface)](#hydrationhole-interface)
  - [HydrationLiteral (interface)](#hydrationliteral-interface)
  - [HydrationMany (interface)](#hydrationmany-interface)
  - [HydrationNode (type alias)](#hydrationnode-type-alias)
  - [HydrationTemplate (interface)](#hydrationtemplate-interface)
  - [TemplateContext (interface)](#templatecontext-interface)
  - [attemptHydration](#attempthydration)
  - [findHydratePath](#findhydratepath)
  - [findHydrationHole](#findhydrationhole)
  - [getChildNodes](#getchildnodes)
  - [makeTemplateContext](#maketemplatecontext)
  - [setupAttrPart](#setupattrpart)
  - [setupBooleanPart](#setupbooleanpart)
  - [setupClassNamePart](#setupclassnamepart)
  - [setupCommentPart](#setupcommentpart)
  - [setupDataPart](#setupdatapart)
  - [setupEventPart](#setupeventpart)
  - [setupHydratedNodePart](#setuphydratednodepart)
  - [setupNodePart](#setupnodepart)
  - [setupPropertiesPart](#setuppropertiespart)
  - [setupPropertyPart](#setuppropertypart)
  - [setupRefPart](#setuprefpart)
  - [setupSparseAttrPart](#setupsparseattrpart)
  - [setupSparseClassNamePart](#setupsparseclassnamepart)
  - [setupSparseCommentPart](#setupsparsecommentpart)
  - [setupTextPart](#setuptextpart)

---

# utils

## HydrateContext (interface)

**Signature**

```ts
export interface HydrateContext extends internalHydrateContext.HydrateContext {}
```

Added in v1.0.0

## HydrationElement (interface)

**Signature**

```ts
export interface HydrationElement extends hydrationTemplate.HydrationElement {}
```

Added in v1.0.0

## HydrationHole (interface)

**Signature**

```ts
export interface HydrationHole extends hydrationTemplate.HydrationHole {}
```

Added in v1.0.0

## HydrationLiteral (interface)

**Signature**

```ts
export interface HydrationLiteral extends hydrationTemplate.HydrationLiteral {}
```

Added in v1.0.0

## HydrationMany (interface)

**Signature**

```ts
export interface HydrationMany extends hydrationTemplate.HydrationMany {}
```

Added in v1.0.0

## HydrationNode (type alias)

**Signature**

```ts
export type HydrationNode = hydrationTemplate.HydrationNode
```

Added in v1.0.0

## HydrationTemplate (interface)

**Signature**

```ts
export interface HydrationTemplate extends hydrationTemplate.HydrationTemplate {}
```

Added in v1.0.0

## TemplateContext (interface)

**Signature**

```ts
export interface TemplateContext extends render.TemplateContext {}
```

Added in v1.0.0

## attemptHydration

**Signature**

```ts
export declare const attemptHydration: (
  ctx: TemplateContext,
  hash: string
) => Option.Option<{ readonly where: HydrationTemplate; readonly hydrateCtx: HydrateContext }>
```

Added in v1.0.0

## findHydratePath

**Signature**

```ts
export declare const findHydratePath: (node: hydrationTemplate.HydrationNode, path: Chunk.Chunk<number>) => Node
```

Added in v1.0.0

## findHydrationHole

**Signature**

```ts
export declare const findHydrationHole: (
  nodes: Array<hydrationTemplate.HydrationNode>,
  index: number
) => hydrationTemplate.HydrationHole | null
```

Added in v1.0.0

## getChildNodes

**Signature**

```ts
export declare const getChildNodes: (node: hydrationTemplate.HydrationNode) => Array<hydrationTemplate.HydrationNode>
```

Added in v1.0.0

## makeTemplateContext

**Signature**

```ts
export declare const makeTemplateContext: <Values extends ReadonlyArray<Renderable<any, any>>>(
  document: Document,
  renderContext: RenderContext,
  values: ReadonlyArray<Renderable<any, any>>,
  onCause: (cause: Cause.Cause<Placeholder.Error<Values[number]>>) => Effect.Effect<unknown, never, never>
) => Effect.Effect<TemplateContext, never, Scope.Scope | RenderQueue | Placeholder.Context<Values[number]>>
```

Added in v1.0.0

## setupAttrPart

**Signature**

```ts
export declare const setupAttrPart: (
  { index, name }: Pick<Template.AttrPartNode, "index" | "name">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) => Effect.Effect<void, any, any> | null
```

Added in v1.0.0

## setupBooleanPart

**Signature**

```ts
export declare const setupBooleanPart: (
  { index, name }: Pick<Template.BooleanPartNode, "index" | "name">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) => Effect.Effect<void, any, any> | null
```

Added in v1.0.0

## setupClassNamePart

**Signature**

```ts
export declare const setupClassNamePart: (
  { index }: Pick<Template.ClassNamePartNode, "index">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) => Effect.Effect<void, any, any> | null
```

Added in v1.0.0

## setupCommentPart

**Signature**

```ts
export declare const setupCommentPart: (
  { index }: Pick<Template.CommentPartNode, "index">,
  comment: Comment,
  ctx: render.TemplateContext,
  renderable: Renderable<any, any>
) => Effect.Effect<void, any, any> | null
```

Added in v1.0.0

## setupDataPart

**Signature**

```ts
export declare const setupDataPart: (
  { index }: Pick<Template.DataPartNode, "index">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) => Effect.Effect<void, any, any> | null
```

Added in v1.0.0

## setupEventPart

**Signature**

```ts
export declare const setupEventPart: (
  { index, name }: Pick<Template.EventPartNode, "index" | "name">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) => Effect.Effect<unknown, unknown, unknown> | null
```

Added in v1.0.0

## setupHydratedNodePart

**Signature**

```ts
export declare const setupHydratedNodePart: (
  part: Template.NodePart,
  hole: hydrationTemplate.HydrationHole,
  ctx: render.HydrateTemplateContext
) => Effect.Effect<void, any, any> | null
```

Added in v1.0.0

## setupNodePart

**Signature**

```ts
export declare const setupNodePart: (
  { index }: Template.NodePart,
  comment: Comment,
  ctx: TemplateContext,
  text: Text | null,
  nodes: Array<Node>
) => Effect.Effect<void, any, any> | null
```

Added in v1.0.0

## setupPropertiesPart

**Signature**

```ts
export declare const setupPropertiesPart: (
  element: HTMLElement | SVGElement,
  ctx: render.TemplateContext,
  renderable: Renderable<any, any>
) => Effect.Effect<Array<void>, any, any> | null
```

Added in v1.0.0

## setupPropertyPart

**Signature**

```ts
export declare const setupPropertyPart: (
  { index, name }: Pick<Template.PropertyPartNode, "index" | "name">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) => Effect.Effect<void, any, any> | null
```

Added in v1.0.0

## setupRefPart

**Signature**

```ts
export declare const setupRefPart: (
  { index }: Pick<Template.RefPartNode, "index">,
  element: HTMLElement | SVGElement,
  renderable: Renderable<any, any>
) => Effect.Effect<void, any, any> | null
```

Added in v1.0.0

## setupSparseAttrPart

**Signature**

```ts
export declare const setupSparseAttrPart: (
  { name, nodes }: Pick<Template.SparseAttrNode, "name" | "nodes">,
  element: HTMLElement | SVGElement,
  ctx: render.TemplateContext
) => Effect.Effect<void, any, any>
```

Added in v1.0.0

## setupSparseClassNamePart

**Signature**

```ts
export declare const setupSparseClassNamePart: (
  { nodes }: Pick<Template.SparseClassNameNode, "nodes">,
  element: HTMLElement | SVGElement,
  ctx: render.TemplateContext
) => Effect.Effect<void, any, any>
```

Added in v1.0.0

## setupSparseCommentPart

**Signature**

```ts
export declare const setupSparseCommentPart: (
  { nodes }: Template.SparseCommentNode,
  comment: Comment,
  ctx: render.TemplateContext
) => Effect.Effect<void, any, any>
```

Added in v1.0.0

## setupTextPart

**Signature**

```ts
export declare const setupTextPart: (
  { index }: Template.TextPartNode,
  comment: Comment,
  ctx: render.TemplateContext
) => Effect.Effect<void, any, any> | null
```

Added in v1.0.0
