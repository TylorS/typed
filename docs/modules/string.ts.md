---
title: string.ts
nav_order: 72
parent: Modules
---

## string overview

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [captialize](#captialize)
  - [concat](#concat)
  - [lowerCase](#lowercase)
  - [uncaptialize](#uncaptialize)
  - [upperCase](#uppercase)
- [Type-level](#type-level)
  - [ConcatStrings (type alias)](#concatstrings-type-alias)

---

# Combinator

## captialize

**Signature**

```ts
export declare const captialize: <S extends string>(s: S) => Capitalize<S>
```

Added in v0.9.2

## concat

**Signature**

```ts
export declare function concat<S extends readonly string[]>(...strings: S): ConcatStrings<S>
```

Added in v0.9.2

## lowerCase

**Signature**

```ts
export declare const lowerCase: <S extends string>(s: S) => Lowercase<S>
```

Added in v0.9.2

## uncaptialize

**Signature**

```ts
export declare const uncaptialize: <S extends string>(s: S) => Uncapitalize<S>
```

Added in v0.9.2

## upperCase

**Signature**

```ts
export declare const upperCase: <S extends string>(s: S) => Uppercase<S>
```

Added in v0.9.2

# Type-level

## ConcatStrings (type alias)

**Signature**

```ts
export type ConcatStrings<A extends readonly string[], R extends string = ''> = [] extends A
  ? R
  : ConcatStrings<L.Drop<A, 1>, `${R}${A[0]}`>
```

Added in v0.9.2
