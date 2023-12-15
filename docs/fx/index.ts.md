---
title: index.ts
nav_order: 9
parent: "@typed/fx"
---

## index overview

Fx<R, E, A> is a representation of an `Effect`-ful workflow that exists over
the time dimension. It operates within a context `R`, can fail with an `E`,
and succeed with an `A`.

Any `Fx`, shorthand for "Effects", can emit 0 or more errors or events over an
indefinite period of time. This is in contrast to `Effect` which can only
produce exactly 1 error or event.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [exports](#exports)
  - [From "./Computed.js"](#from-computedjs)
  - [From "./Filtered.js"](#from-filteredjs)
  - [From "./Fx.js"](#from-fxjs)
  - [From "./RefArray.js"](#from-refarrayjs)
  - [From "./RefSubject.js"](#from-refsubjectjs)
  - [From "./Sink.js"](#from-sinkjs)
  - [From "./Subject.js"](#from-subjectjs)
  - [From "./TypeId.js"](#from-typeidjs)
  - [From "./Typeclass.js"](#from-typeclassjs)

---

# exports

## From "./Computed.js"

Fx<R, E, A> is a representation of an `Effect`-ful workflow that exists over
the time dimension. It operates within a context `R`, can fail with an `E`,
and succeed with an `A`.

Any `Fx`, shorthand for "Effects", can emit 0 or more errors or events over an
indefinite period of time. This is in contrast to `Effect` which can only
produce exactly 1 error or event.

**Signature**

```ts
export * as Computed from "./Computed.js"
```

Added in v1.18.0

## From "./Filtered.js"

[Filtered documentation](https://tylors.github.io/typed/fx/Filtered.ts.html)

**Signature**

```ts
export * as Filtered from "./Filtered.js"
```

Added in v1.18.0

## From "./Fx.js"

[Fx documentation](https://tylors.github.io/typed/fx/Fx.ts.html)

**Signature**

```ts
export * from "./Fx.js"
```

Added in v1.18.0

## From "./RefArray.js"

[RefArray documentation](https://tylors.github.io/typed/fx/RefArray.ts.html)

**Signature**

```ts
export * as RefArray from "./RefArray.js"
```

Added in v1.18.0

## From "./RefSubject.js"

[RefSubject documentation](https://tylors.github.io/typed/fx/RefSubject.ts.html)

**Signature**

```ts
export * as RefSubject from "./RefSubject.js"
```

Added in v1.18.0

## From "./Sink.js"

[Sink documentation](https://tylors.github.io/typed/fx/Sink.ts.html)

**Signature**

```ts
export * as Sink from "./Sink.js"
```

Added in v1.18.0

## From "./Subject.js"

[Subject documentation](https://tylors.github.io/typed/fx/Subject.ts.html)

**Signature**

```ts
export * as Subject from "./Subject.js"
```

Added in v1.18.0

## From "./TypeId.js"

[TypeId documentation](https://tylors.github.io/typed/fx/TypeId.ts.html)

**Signature**

```ts
export * from "./TypeId.js"
```

Added in v1.18.0

## From "./Typeclass.js"

[Typeclass documentation](https://tylors.github.io/typed/fx/Typeclass.ts.html)

**Signature**

```ts
export * as Typeclass from "./Typeclass.js"
```

Added in v1.18.0
