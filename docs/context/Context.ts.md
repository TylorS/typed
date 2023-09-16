---
title: Context.ts
nav_order: 3
parent: "@typed/context"
---

## Context overview

Re-exports from @effect/data/Context

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [empty](#empty)
  - [isContext](#iscontext)
  - [make](#make)
- [getters](#getters)
  - [get](#get)
  - [getOption](#getoption)
- [guards](#guards)
  - [isTag](#istag)
- [models](#models)
  - [Context](#context)
  - [TagUnify](#tagunify)
  - [TagUnifyBlacklist](#tagunifyblacklist)
  - [ValidTagsById](#validtagsbyid)
- [symbol](#symbol)
  - [TagTypeId](#tagtypeid)
  - [TypeId](#typeid)
- [unsafe](#unsafe)
  - [unsafeGet](#unsafeget)
- [utils](#utils)
  - [add](#add)
  - [merge](#merge)
  - [omit](#omit)
  - [pick](#pick)

---

# constructors

## empty

Returns an empty `Context`.

**Signature**

```ts
export declare const empty: () => Context<never>
```

**Example**

```ts
import * as Context from '@effect/data/Context'

assert.strictEqual(Context.isContext(Context.empty()), true)
```

Added in v1.0.0

## isContext

Returns an empty `Context`.

**Signature**

```ts
export declare const isContext: (input: unknown) => input is Context<never>
```

**Example**

```ts
import * as Context from '@effect/data/Context'

assert.strictEqual(Context.isContext(Context.empty()), true)
```

Added in v1.0.0

## make

Creates a new `Context` with a single service associated to the tag.

**Signature**

```ts
export declare const make: <T extends Tag<any, any>>(tag: T, service: Tag.Service<T>) => Context<Tag.Identifier<T>>
```

**Example**

```ts
import * as Context from '@effect/data/Context'

const Port = Context.Tag<{ PORT: number }>()

const Services = Context.make(Port, { PORT: 8080 })

assert.deepStrictEqual(Context.get(Services, Port), { PORT: 8080 })
```

Added in v1.0.0

# getters

## get

Get a service from the context that corresponds to the given tag.

**Signature**

```ts
export declare const get: {
  <Services, T extends ValidTagsById<Services>>(tag: T): (self: Context<Services>) => Tag.Service<T>
  <Services, T extends ValidTagsById<Services>>(self: Context<Services>, tag: T): Tag.Service<T>
}
```

**Example**

```ts
import * as Context from '@effect/data/Context'
import { pipe } from '@effect/data/Function'

const Port = Context.Tag<{ PORT: number }>()
const Timeout = Context.Tag<{ TIMEOUT: number }>()

const Services = pipe(Context.make(Port, { PORT: 8080 }), Context.add(Timeout, { TIMEOUT: 5000 }))

assert.deepStrictEqual(Context.get(Services, Timeout), { TIMEOUT: 5000 })
```

Added in v1.0.0

## getOption

Get the value associated with the specified tag from the context wrapped in an `Option` object. If the tag is not
found, the `Option` object will be `None`.

**Signature**

```ts
export declare const getOption: {
  <S, I>(tag: Tag<I, S>): <Services>(self: Context<Services>) => Option<S>
  <Services, S, I>(self: Context<Services>, tag: Tag<I, S>): Option<S>
}
```

**Example**

```ts
import * as Context from '@effect/data/Context'
import * as O from '@effect/data/Option'

const Port = Context.Tag<{ PORT: number }>()
const Timeout = Context.Tag<{ TIMEOUT: number }>()

const Services = Context.make(Port, { PORT: 8080 })

assert.deepStrictEqual(Context.getOption(Services, Port), O.some({ PORT: 8080 }))
assert.deepStrictEqual(Context.getOption(Services, Timeout), O.none())
```

Added in v1.0.0

# guards

## isTag

Checks if the provided argument is a `Tag`.

**Signature**

```ts
export declare const isTag: (input: unknown) => input is Tag<any, any>
```

**Example**

```ts
import * as Context from '@effect/data/Context'

assert.strictEqual(Context.isTag(Context.Tag()), true)
```

Added in v1.0.0

# models

## Context

**Signature**

```ts
export declare const Context: any
```

Added in v1.0.0

## TagUnify

**Signature**

```ts
export declare const TagUnify: any
```

Added in v1.0.0

## TagUnifyBlacklist

**Signature**

```ts
export declare const TagUnifyBlacklist: any
```

Added in v1.0.0

## ValidTagsById

**Signature**

```ts
export declare const ValidTagsById: any
```

Added in v1.0.0

# symbol

## TagTypeId

**Signature**

```ts
export declare const TagTypeId: any
```

Added in v1.0.0

## TypeId

**Signature**

```ts
export declare const TypeId: any
```

Added in v1.0.0

# unsafe

## unsafeGet

Get a service from the context that corresponds to the given tag.
This function is unsafe because if the tag is not present in the context, a runtime error will be thrown.

For a safer version see {@link getOption}.

**Signature**

```ts
export declare const unsafeGet: {
  <S, I>(tag: Tag<I, S>): <Services>(self: Context<Services>) => S
  <Services, S, I>(self: Context<Services>, tag: Tag<I, S>): S
}
```

**Example**

```ts
import * as Context from '@effect/data/Context'

const Port = Context.Tag<{ PORT: number }>()
const Timeout = Context.Tag<{ TIMEOUT: number }>()

const Services = Context.make(Port, { PORT: 8080 })

assert.deepStrictEqual(Context.unsafeGet(Services, Port), { PORT: 8080 })
assert.throws(() => Context.unsafeGet(Services, Timeout))
```

Added in v1.0.0

# utils

## add

Adds a service to a given `Context`.

**Signature**

```ts
export declare const add: {
  <T extends Tag<any, any>>(tag: T, service: Tag.Service<T>): <Services>(
    self: Context<Services>
  ) => Context<Services | Tag.Identifier<T>>
  <Services, T extends Tag<any, any>>(self: Context<Services>, tag: T, service: Tag.Service<T>): Context<
    Services | Tag.Identifier<T>
  >
}
```

**Example**

```ts
import * as Context from '@effect/data/Context'
import { pipe } from '@effect/data/Function'

const Port = Context.Tag<{ PORT: number }>()
const Timeout = Context.Tag<{ TIMEOUT: number }>()

const someContext = Context.make(Port, { PORT: 8080 })

const Services = pipe(someContext, Context.add(Timeout, { TIMEOUT: 5000 }))

assert.deepStrictEqual(Context.get(Services, Port), { PORT: 8080 })
assert.deepStrictEqual(Context.get(Services, Timeout), { TIMEOUT: 5000 })
```

Added in v1.0.0

## merge

Merges two `Context`s, returning a new `Context` containing the services of both.

**Signature**

```ts
export declare const merge: {
  <R1>(that: Context<R1>): <Services>(self: Context<Services>) => Context<R1 | Services>
  <Services, R1>(self: Context<Services>, that: Context<R1>): Context<Services | R1>
}
```

**Example**

```ts
import * as Context from '@effect/data/Context'

const Port = Context.Tag<{ PORT: number }>()
const Timeout = Context.Tag<{ TIMEOUT: number }>()

const firstContext = Context.make(Port, { PORT: 8080 })
const secondContext = Context.make(Timeout, { TIMEOUT: 5000 })

const Services = Context.merge(firstContext, secondContext)

assert.deepStrictEqual(Context.get(Services, Port), { PORT: 8080 })
assert.deepStrictEqual(Context.get(Services, Timeout), { TIMEOUT: 5000 })
```

Added in v1.0.0

## omit

Omits specified services from a given `Context`.

**Signature**

```ts
export declare const omit: <Services, S extends ValidTagsById<Services>[]>(
  ...tags: S
) => (self: Context<Services>) => Context<Exclude<Services, { [k in keyof S]: Tag.Identifier<S[k]> }[keyof S]>>
```

Added in v1.0.0

## pick

Returns a new `Context` that contains only the specified services.

**Signature**

```ts
export declare const pick: <Services, S extends ValidTagsById<Services>[]>(
  ...tags: S
) => (self: Context<Services>) => Context<{ [k in keyof S]: Tag.Identifier<S[k]> }[number]>
```

**Example**

```ts
import * as Context from '@effect/data/Context'
import { pipe } from '@effect/data/Function'
import * as O from '@effect/data/Option'

const Port = Context.Tag<{ PORT: number }>()
const Timeout = Context.Tag<{ TIMEOUT: number }>()

const someContext = pipe(Context.make(Port, { PORT: 8080 }), Context.add(Timeout, { TIMEOUT: 5000 }))

const Services = pipe(someContext, Context.pick(Port))

assert.deepStrictEqual(Context.getOption(Services, Port), O.some({ PORT: 8080 }))
assert.deepStrictEqual(Context.getOption(Services, Timeout), O.none())
```

Added in v1.0.0
