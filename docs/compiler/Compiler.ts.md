---
title: Compiler.ts
nav_order: 1
parent: "@typed/compiler"
---

## Compiler overview

Compiler is an all-in-one package for compile-time optimization and derivations
of Typed libraries and applications.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Compiler (class)](#compiler-class)
    - [parseTemplates (method)](#parsetemplates-method)
    - [compileTemplates (method)](#compiletemplates-method)
    - [getTransformersByFileAndTarget (method)](#gettransformersbyfileandtarget-method)
    - [replaceDom (method)](#replacedom-method)
    - [parseTemplateFromNode (method)](#parsetemplatefromnode-method)
    - [parsePart (method)](#parsepart-method)
    - [getPartType (method)](#getparttype-method)
    - [isPrimitiveType (method)](#isprimitivetype-method)
    - [project (property)](#project-property)
    - [checker (property)](#checker-property)
  - [CompilerTarget (type alias)](#compilertarget-type-alias)
  - [ParsedPart (type alias)](#parsedpart-type-alias)
  - [ParsedTemplate (interface)](#parsedtemplate-interface)
  - [ParsedTemplatePart (interface)](#parsedtemplatepart-interface)
  - [SimpleParsedPart (type alias)](#simpleparsedpart-type-alias)

---

# utils

## Compiler (class)

Compiler is an all-in-one cass for compile-time optimization and derivations
of Typed libraries and applications.

**Signature**

```ts
export declare class Compiler { constructor(
    readonly directory: string,
    readonly tsConfig?: string,
    defaultCompilerTarget: CompilerTarget = "dom"
  ) }
```

Added in v1.0.0

### parseTemplates (method)

**Signature**

```ts
parseTemplates(sourceFile: ts.SourceFile): Array<ParsedTemplate>
```

Added in v1.0.0

### compileTemplates (method)

**Signature**

```ts
compileTemplates(
    sourceFile: ts.SourceFile,
    target?: CompilerTarget
  )
```

Added in v1.0.0

### getTransformersByFileAndTarget (method)

**Signature**

```ts
private getTransformersByFileAndTarget(
    templates: Array<ParsedTemplate>,
    target: CompilerTarget
  ): Array<ts.TransformerFactory<ts.SourceFile>>
```

Added in v1.0.0

### replaceDom (method)

**Signature**

```ts
private replaceDom(
    { parts, template }: ParsedTemplate,
    remaining: Array<ParsedTemplate>,
    imports: ImportDeclarationManager
  ): ts.Node
```

Added in v1.0.0

### parseTemplateFromNode (method)

**Signature**

```ts
private parseTemplateFromNode(node: ts.TemplateLiteral): readonly [Template.Template, ReadonlyArray<ParsedPart>]
```

Added in v1.0.0

### parsePart (method)

**Signature**

```ts
private parsePart(part: ts.Expression, index: number): ParsedPart
```

Added in v1.0.0

### getPartType (method)

**Signature**

```ts
private getPartType(node: ts.Node, type: ts.Type): ParsedPart["kind"]
```

Added in v1.0.0

### isPrimitiveType (method)

**Signature**

```ts
private isPrimitiveType(type: ts.Type)
```

Added in v1.0.0

### project (property)

**Signature**

```ts
readonly project: Project
```

Added in v1.0.0

### checker (property)

**Signature**

```ts
readonly checker: ts.TypeChecker
```

Added in v1.0.0

## CompilerTarget (type alias)

**Signature**

```ts
export type CompilerTarget = "dom" | "server" | "static"
```

Added in v1.0.0

## ParsedPart (type alias)

**Signature**

```ts
export type ParsedPart = SimpleParsedPart | ParsedTemplatePart
```

Added in v1.0.0

## ParsedTemplate (interface)

**Signature**

```ts
export interface ParsedTemplate {
  readonly literal: ts.TemplateLiteral
  readonly parts: ReadonlyArray<ParsedPart>
  readonly template: Template.Template
}
```

Added in v1.0.0

## ParsedTemplatePart (interface)

**Signature**

```ts
export interface ParsedTemplatePart extends Omit<SimpleParsedPart, "kind">, ParsedTemplate {
  readonly kind: "template"
}
```

Added in v1.0.0

## SimpleParsedPart (type alias)

**Signature**

```ts
export type SimpleParsedPart = {
  readonly index: number
  readonly kind: "placeholder" | "fxEffect" | "fx" | "effect" | "primitive" | "directive"
  readonly node: ts.Expression
  readonly type: ts.Type
}
```

Added in v1.0.0
