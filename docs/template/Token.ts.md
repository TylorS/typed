---
title: Token.ts
nav_order: 24
parent: "@typed/template"
---

## Token overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [AttributeEndToken (class)](#attributeendtoken-class)
    - [\_tag (property)](#_tag-property)
  - [AttributeStartToken (class)](#attributestarttoken-class)
    - [\_tag (property)](#_tag-property-1)
  - [AttributeToken (class)](#attributetoken-class)
    - [\_tag (property)](#_tag-property-2)
  - [BooleanAttributeEndToken (class)](#booleanattributeendtoken-class)
    - [\_tag (property)](#_tag-property-3)
  - [BooleanAttributeStartToken (class)](#booleanattributestarttoken-class)
    - [\_tag (property)](#_tag-property-4)
  - [BooleanAttributeToken (class)](#booleanattributetoken-class)
    - [\_tag (property)](#_tag-property-5)
  - [ClassNameAttributeEndToken (class)](#classnameattributeendtoken-class)
    - [\_tag (property)](#_tag-property-6)
  - [ClassNameAttributeStartToken (class)](#classnameattributestarttoken-class)
    - [\_tag (property)](#_tag-property-7)
  - [ClosingTagToken (class)](#closingtagtoken-class)
    - [\_tag (property)](#_tag-property-8)
  - [CommentEndToken (class)](#commentendtoken-class)
    - [\_tag (property)](#_tag-property-9)
  - [CommentStartToken (class)](#commentstarttoken-class)
    - [\_tag (property)](#_tag-property-10)
  - [CommentToken (class)](#commenttoken-class)
    - [\_tag (property)](#_tag-property-11)
  - [DataAttributeEndToken (class)](#dataattributeendtoken-class)
    - [\_tag (property)](#_tag-property-12)
  - [DataAttributeStartToken (class)](#dataattributestarttoken-class)
    - [\_tag (property)](#_tag-property-13)
  - [EventAttributeEndToken (class)](#eventattributeendtoken-class)
    - [\_tag (property)](#_tag-property-14)
  - [EventAttributeStartToken (class)](#eventattributestarttoken-class)
    - [\_tag (property)](#_tag-property-15)
  - [OpeningTagEndToken (class)](#openingtagendtoken-class)
    - [\_tag (property)](#_tag-property-16)
  - [OpeningTagToken (class)](#openingtagtoken-class)
    - [\_tag (property)](#_tag-property-17)
  - [PartToken (class)](#parttoken-class)
    - [\_tag (property)](#_tag-property-18)
  - [PropertyAttributeEndToken (class)](#propertyattributeendtoken-class)
    - [\_tag (property)](#_tag-property-19)
  - [PropertyAttributeStartToken (class)](#propertyattributestarttoken-class)
    - [\_tag (property)](#_tag-property-20)
  - [RefAttributeEndToken (class)](#refattributeendtoken-class)
    - [\_tag (property)](#_tag-property-21)
  - [RefAttributeStartToken (class)](#refattributestarttoken-class)
    - [\_tag (property)](#_tag-property-22)
  - [SELF_CLOSING_TAGS](#self_closing_tags)
  - [TEXT_ONLY_NODES_REGEX](#text_only_nodes_regex)
  - [TextToken (class)](#texttoken-class)
    - [\_tag (property)](#_tag-property-23)
  - [Token (type alias)](#token-type-alias)

---

# utils

## AttributeEndToken (class)

**Signature**

```ts
export declare class AttributeEndToken { constructor(readonly name: string) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "attribute-end"
```

## AttributeStartToken (class)

**Signature**

```ts
export declare class AttributeStartToken { constructor(readonly name: string) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "attribute-start"
```

## AttributeToken (class)

**Signature**

```ts
export declare class AttributeToken { constructor(
    readonly name: string,
    readonly value: string
  ) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "attribute"
```

## BooleanAttributeEndToken (class)

**Signature**

```ts
export declare class BooleanAttributeEndToken { constructor(readonly name: string) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "boolean-attribute-end"
```

## BooleanAttributeStartToken (class)

**Signature**

```ts
export declare class BooleanAttributeStartToken { constructor(readonly name: string) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "boolean-attribute-start"
```

## BooleanAttributeToken (class)

**Signature**

```ts
export declare class BooleanAttributeToken { constructor(readonly name: string) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "boolean-attribute"
```

## ClassNameAttributeEndToken (class)

**Signature**

```ts
export declare class ClassNameAttributeEndToken
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "className-attribute-end"
```

## ClassNameAttributeStartToken (class)

**Signature**

```ts
export declare class ClassNameAttributeStartToken
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "className-attribute-start"
```

## ClosingTagToken (class)

**Signature**

```ts
export declare class ClosingTagToken { constructor(
    readonly name: string,
    readonly textOnly: boolean = TEXT_ONLY_NODES_REGEX.has(name)
  ) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "closing-tag"
```

## CommentEndToken (class)

**Signature**

```ts
export declare class CommentEndToken { constructor(readonly value: string) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "comment-end"
```

## CommentStartToken (class)

**Signature**

```ts
export declare class CommentStartToken { constructor(readonly value: string) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "comment-start"
```

## CommentToken (class)

**Signature**

```ts
export declare class CommentToken { constructor(readonly value: string) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "comment"
```

## DataAttributeEndToken (class)

**Signature**

```ts
export declare class DataAttributeEndToken
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "data-attribute-end"
```

## DataAttributeStartToken (class)

**Signature**

```ts
export declare class DataAttributeStartToken
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "data-attribute-start"
```

## EventAttributeEndToken (class)

**Signature**

```ts
export declare class EventAttributeEndToken { constructor(readonly name: string) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "event-attribute-end"
```

## EventAttributeStartToken (class)

**Signature**

```ts
export declare class EventAttributeStartToken { constructor(readonly name: string) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "event-attribute-start"
```

## OpeningTagEndToken (class)

**Signature**

```ts
export declare class OpeningTagEndToken { constructor(
    readonly name: string,
    readonly selfClosing: boolean = SELF_CLOSING_TAGS.has(name),
    readonly textOnly: boolean = TEXT_ONLY_NODES_REGEX.has(name)
  ) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "opening-tag-end"
```

## OpeningTagToken (class)

**Signature**

```ts
export declare class OpeningTagToken { constructor(
    readonly name: string,
    readonly isSelfClosing: boolean = SELF_CLOSING_TAGS.has(name),
    readonly textOnly: boolean = TEXT_ONLY_NODES_REGEX.has(name)
  ) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "opening-tag"
```

## PartToken (class)

**Signature**

```ts
export declare class PartToken { constructor(readonly index: number) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "part-token"
```

## PropertyAttributeEndToken (class)

**Signature**

```ts
export declare class PropertyAttributeEndToken { constructor(readonly name: string) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "property-attribute-end"
```

## PropertyAttributeStartToken (class)

**Signature**

```ts
export declare class PropertyAttributeStartToken { constructor(readonly name: string) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "property-attribute-start"
```

## RefAttributeEndToken (class)

**Signature**

```ts
export declare class RefAttributeEndToken
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "ref-attribute-end"
```

## RefAttributeStartToken (class)

**Signature**

```ts
export declare class RefAttributeStartToken
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "ref-attribute-start"
```

## SELF_CLOSING_TAGS

**Signature**

```ts
export declare const SELF_CLOSING_TAGS: Set<string>
```

Added in v1.0.0

## TEXT_ONLY_NODES_REGEX

**Signature**

```ts
export declare const TEXT_ONLY_NODES_REGEX: Set<string>
```

Added in v1.0.0

## TextToken (class)

**Signature**

```ts
export declare class TextToken { constructor(readonly value: string) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "text"
```

## Token (type alias)

**Signature**

```ts
export type Token =
  | OpeningTagToken
  | OpeningTagEndToken
  | ClosingTagToken
  | AttributeToken
  | AttributeStartToken
  | AttributeEndToken
  | BooleanAttributeToken
  | BooleanAttributeStartToken
  | BooleanAttributeEndToken
  | ClassNameAttributeStartToken
  | ClassNameAttributeEndToken
  | DataAttributeStartToken
  | DataAttributeEndToken
  | EventAttributeStartToken
  | EventAttributeEndToken
  | PropertyAttributeStartToken
  | PropertyAttributeEndToken
  | RefAttributeStartToken
  | RefAttributeEndToken
  | CommentToken
  | CommentStartToken
  | CommentEndToken
  | TextToken
  | PartToken
```

Added in v1.0.0
