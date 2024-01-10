---
title: typescript/factories.ts
nav_order: 3
parent: "@typed/compiler"
---

## factories overview

Factory functiosn for creating TypeScript AST nodes

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [DocumentFragmentType](#documentfragmenttype)
  - [DocumentType](#documenttype)
  - [ElementType](#elementtype)
  - [HTMLElementType](#htmlelementtype)
  - [NodeType](#nodetype)
  - [SVGElementType](#svgelementtype)
  - [TextType](#texttype)
  - [appendChild](#appendchild)
  - [createDocumentFragment](#createdocumentfragment)
  - [createElement](#createelement)
  - [createFunctionCall](#createfunctioncall)
  - [createMethodCall](#createmethodcall)
  - [createText](#createtext)
  - [createTypeReference](#createtypereference)
  - [createVariableDeclaration](#createvariabledeclaration)
  - [insertBefore](#insertbefore)
  - [removeChild](#removechild)

---

# utils

## DocumentFragmentType

`DocumentFragment` type reference

**Signature**

```ts
export declare const DocumentFragmentType: ts.TypeReferenceNode
```

Added in v1.0.0

## DocumentType

`Document` type reference

**Signature**

```ts
export declare const DocumentType: ts.TypeReferenceNode
```

Added in v1.0.0

## ElementType

`Element` type reference

**Signature**

```ts
export declare const ElementType: ts.TypeReferenceNode
```

Added in v1.0.0

## HTMLElementType

`HTMLElement` type reference

**Signature**

```ts
export declare const HTMLElementType: ts.TypeReferenceNode
```

Added in v1.0.0

## NodeType

`Node` type reference

**Signature**

```ts
export declare const NodeType: ts.TypeReferenceNode
```

Added in v1.0.0

## SVGElementType

`SVGElement` type reference

**Signature**

```ts
export declare const SVGElementType: ts.TypeReferenceNode
```

Added in v1.0.0

## TextType

`Text` type reference

**Signature**

```ts
export declare const TextType: ts.TypeReferenceNode
```

Added in v1.0.0

## appendChild

Append child

**Signature**

```ts
export declare function appendChild(parent: string, child: string)
```

Added in v1.0.0

## createDocumentFragment

Create document fragment

**Signature**

```ts
export declare function createDocumentFragment()
```

Added in v1.0.0

## createElement

Create element

**Signature**

```ts
export declare function createElement(tagName: string)
```

Added in v1.0.0

## createFunctionCall

Creates a TypeScript function call

**Signature**

```ts
export declare function createFunctionCall(name: string, args: Array<ts.Expression>): ts.CallExpression
```

Added in v1.0.0

## createMethodCall

Creates a TypeScript method call

**Signature**

```ts
export declare function createMethodCall(
  object: string,
  methodName: string,
  args: Array<ts.Expression>
): ts.CallExpression
```

Added in v1.0.0

## createText

Create text node

**Signature**

```ts
export declare function createText(text: string)
```

Added in v1.0.0

## createTypeReference

Creates a TypeScript type reference by name

**Signature**

```ts
export declare function createTypeReference(name: string, ...args: Array<ts.TypeNode>): ts.TypeReferenceNode
```

Added in v1.0.0

## createVariableDeclaration

Creates a TypeScript variable declaration

**Signature**

```ts
export declare function createVariableDeclaration(
  name: string,
  type?: ts.TypeNode,
  initializer?: ts.Expression
): ts.VariableDeclaration
```

Added in v1.0.0

## insertBefore

Insert before

**Signature**

```ts
export declare function insertBefore(parent: string, child: string, reference?: string | null)
```

Added in v1.0.0

## removeChild

Remove child

**Signature**

```ts
export declare function removeChild(parent: string, child: string)
```

Added in v1.0.0
