---
title: PathJoin.ts
nav_order: 5
parent: "@typed/path"
---

## PathJoin overview

Type-level path joining

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [formatPart](#formatpart)
  - [pathJoin](#pathjoin)
  - [removeLeadingSlash](#removeleadingslash)
  - [removeTrailingSlash](#removetrailingslash)
- [Type-level](#type-level)
  - [FormatPart (type alias)](#formatpart-type-alias)
  - [PathJoin (type alias)](#pathjoin-type-alias)
  - [RemoveLeadingSlash (type alias)](#removeleadingslash-type-alias)
  - [RemoveTrailingSlash (type alias)](#removetrailingslash-type-alias)

---

# Combinator

## formatPart

Formats a piece of a path

**Signature**

```ts
export declare const formatPart: (part: string) => string
```

Added in v1.0.0

## pathJoin

Join together path parts

**Signature**

```ts
export declare const pathJoin: <P extends readonly string[]>(...parts: P) => PathJoin<P>
```

Added in v1.0.0

## removeLeadingSlash

**Signature**

```ts
export declare const removeLeadingSlash: <A extends string>(a: A) => RemoveLeadingSlash<A>
```

Added in v1.0.0

## removeTrailingSlash

**Signature**

```ts
export declare const removeTrailingSlash: <A extends string>(a: A) => RemoveTrailingSlash<A>
```

Added in v1.0.0

# Type-level

## FormatPart (type alias)

**Signature**

```ts
export type FormatPart<P extends string> = `` extends P
  ? P
  : RemoveSlash<P> extends `\\?${infer _}`
    ? RemoveSlash<P>
    : P extends `{${infer _}`
      ? P
      : `/${RemoveSlash<P>}`
```

Added in v1.0.0

## PathJoin (type alias)

Composes other path parts into a single path

**Signature**

```ts
export type PathJoin<A> = A extends readonly [infer Head extends string, ...infer Tail extends ReadonlyArray<string>]
  ? RemoveLeadingDoubleSlash<`${FormatPart<Head>}${PathJoin<Tail>}`>
  : ``
```

Added in v1.0.0

## RemoveLeadingSlash (type alias)

Remove forward slashes prefixes recursively

**Signature**

```ts
export type RemoveLeadingSlash<A> = A extends `/${infer R}` ? RemoveLeadingSlash<R> : A
```

Added in v1.0.0

## RemoveTrailingSlash (type alias)

Remove forward slashes postfixes recursively

**Signature**

```ts
export type RemoveTrailingSlash<A> = A extends `${infer R}/` ? RemoveTrailingSlash<R> : A
```

Added in v1.0.0
