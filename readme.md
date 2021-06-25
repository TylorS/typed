# @typed/fp

`@typed/fp` is conceptually an extension [fp-ts](https://gcanti.github.io/fp-ts/), with cancelable 
async effects, do-notation, state management, hooks, streams, and more. 

Extremely modular in the same way you would expect from the `fp-ts/*` style modules and imports 
using ES modules to ensure dead code elimination of all kinds can be highly effective all of 
the src files can be imported directly imported as `@typed/fp/*` and both commonjs `main` and 
esm `module` are provided for each package for maximum support.

This project is under very heavy development. It is my goal to align with `fp-ts` v3 which is currently also under heavy development and once both codebases are stable I intend to make the 1.0 release.

## Features

- Bridges `fp-ts` and `@most/core` ecosystems
- [Cancelable Async Effect](#resume)
- [Testable State Management](#ref)
- [Stack-safe Do-notation](#do-notation) w/ support for variance
- [Hooks](#hooks)
- Globals free
- Queues

## Conceptual Documentation

As with `fp-ts`' own documentation, it is not strictly a goal to explain functional programming as whole
though it is a goal to provide more than just hard API documentation and some thing might be mentioned.
This will take a much longer time to get to. For now, I'm just sort of using this README as way to stream
my thoughts somewhere visible. I don't feel too close to finished, but some of the core things are
starting to form and I'd like to get their ideas written down.

### Resume

Resume is a possibly synchronous or possibly asynchronous effect type. Conceptually you can think
of Resume as a union between the `IO` monad and the `Task` (Promise-based) monad w/ cancelation. The 
`Disposable` interface is borrowed from `@most/core`'s internal types and makes it easy to interop 
resource cancelation throughout the codebase and yours as well. This will also allow reusing the 
`@most/scheduler` package for providing extremely consistent time-based scheduling consistent with any
other most-based workflows you have. 

The beauty of `Resume` is that it can do work as fast as possible without delay. Sync when possible but
async when needed allows you to unify your sync/async workflows using a single monad w/ easy interop with 
your existing IO/Task allowing for cancelation where needed.

```ts
import { IO } from 'fp-ts/IO'
import { Disposable } from '@most/types'

type Resume<A> = Sync<A> | Async<A>

type Sync<A> = { 
  readonly type: 'sync', 
  readonly resume: IO<A> 
}

type Async<A> = {
  readonly type: 'async', 
  readonly resume: (cb: (value: A) => Disposable) => Disposable 
}

// From @most/types
type Dispsoable = {
  readonly dispose: () => void 
}
```

### Env 

`Env` is the core of the higher-level modules like [`Ref`](#ref) and [`hooks`](#hooks) and is a `ReaderT` of `Resume`, but to be honest being used so much, I didn't like writing `ReaderResume<A>` and chose to shorten to `Env` for the 
"environmental" quality Reader provides. Combining Reader and Resume allows for creating APIs that are 
capable of utilizing dependency injection for its configurability and testability.  

While designing application APIs it is often better to describe the logic of your system separate from 
the implementation details. `Env`, or rather `Reader` helps you accomplish this through the [Dependency Inversion Principle](https://stackify.com/dependency-inversion-principle/). This principle is one of 
the easiest ways to begin improving any codebase.

### Do-Notation

Do-notation is a syntax for performing effects in a way that looks a lot more like imperative code.
`Fx` is a type-safe(!) generator-based abstraction with allows you to utilize a Monad's `ChainRec` 
instance to create a stack-safe do-notation interpreter. 

In addition to the syntax-related benefits, this abstraction understands variance in the 
type-parameters of all of the built-in fp-ts types and all within this library. If you've ever used 
a `*W` API from `fp-ts` like `chainW/matchW` or similar, then you might already understand what this 
means. If you use do-notation with a Reader-like monad if 1 uses an environment of `{a: string}` and 2
uses an environment of `{b: number}` something like the below you'll end up with a Reader-like effect
needing an environment of `{a: string} & {b:number}`, or an intersection of all requirements will be 
created. Similarly if there are Either-like effects all Left values will be combined into a union.

This variance can be configured per each higher-kinded type's URI by extending an interface. The choice
to use this variance is for convenience of accumulating requirements at the point of definition with
more modularity.

The choice to use or not use the provided do-notation or one of the relatively straightforward variants from fp-ts is
entirely up to you, and is not required in order to use the tools contained within. It _does_ add a dependency on
various `Monad` + `ChainRec` instances which shouldn't be too big a deal in most cases if you're already using these types. 
`fp-ts` does not currently implement `ChainRec` for most of its modules, so at times there are `@typed/fp/*` libraries which 
mirror `fp-ts` intentionally like `@typed/fp/Reader` or `@typed/fp/Task`. These modules re-export `fp-ts/*` from them for 
convenience with namespace imports, but otherwise they generally add the minimal amount to implement `ChainRec` and potentially 
other type-classes added within this library like `MonadRec`(Monad + ChainRec), and `UseSome`/`ProvideSome` (see `Provide.ts`) which add 
and remove requirements from the environment for a Reader-like effect.


```ts
import { doReader, toReader } from '@typed/fp/Fx/Reader'
import * as R from 'fp-ts/Reader'

/** 
 * all do* APIs provide a function to lift that effect into an Fx for type-safety 
 * since generator's return value can be strictly known at compile time unlike yields. 
 * By convention I've been using _ as the reference here for this lift function.
 */
const fx = doReader(function*(_) {
  const { a } = yield* _(R.ask<{a: string}>())
  const { b } = yield* _(R.ask<{b: number}>())

  // do things
})

// Convert's an Fx<Reader<{a: string}, {a: string}> | Reader<{b: number}, {b: number}>, A> to 
// Reader<{a: string} & {b: number}, A>
const reader = toReader(fx)

// Contrasted with fp-ts' chainW

pipe(
  R.ask<{a:string}>(),
  R.chainW(({ a }) => pipe(
    R.ask<{b:number}>(),
    R.chainW(({ b }) => {
      // do things
    }) 
  ))
)

// and with fp-ts' bindW syntax
pipe(
  R.Do,
  R.bindW('a', R.asks((e: {a:string}) => e.a)),
  R.bindW('b', R.asks((e: {b:number}) => e.b)),
  R.chainW(({a, b}) => {
    // do things
  })
)

// A special mention since apSW uses applicatives and isn't quite the same
// but if the Reader monad were instead an asynchronous effect like Env, the 
// applicative instance have the chance to perform them in parallel or sequentially
// depending on the apply instance
pipe(
  R.Do,
  R.apSW('a', R.asks((e: {a:string}) => e.a)),
  R.apSW('b', R.asks((e: {b:number}) => e.b)),
  R.chainW(({a, b}) => {
    // do things
  })
)

```

### Ref 

`Ref` is an abstraction for managing state using `Env`. It exposes an extensible get/set/delete
API for managing keys (string|number|symbol) to values. Every `Ref` is connected to an `Env`
that will provide the default value lazily when first asked for or after being deleted previously.

The provided implementation will also send events containing all of the creations/updates/deletes occuring
in realtime.

```ts
import * as Ref from '@typed/fp/Ref'
import * as E from '@typed/fp/Env'
import * as R from '@typed/fp/Resume'
import { Do } from '@typed/fp/Fx/Env'
import * as N from 'fp-ts/number'
import { pipe } from 'fp-ts/function'

// Create a reference using Env for a starting value.
const Count = Ref.create(E.of(0))

// Create a workflow using references
const addOne: E.Env<Ref.Refs, number> = Do(function*(_) {
  // Get the current value
  const count: number = yield* _(R.getRef(Count))
  // Add 1
  const countPlusOne: number = yield* _(pipe(Count, R.modifyRef(x => x + 1)))

  return countPlusOne
})

const refs: R.Refs = Ref.refs()
// Optionally provide default values, uses the Reference's Id by providing an interval of key-values.
// Convenient for testing specific values
// const refs = R.createReferences([[Count.id, 42]])

// Provide the references and run the Resume
const disposable = pipe(refs, addOne, R.start((n: number) => {
  // Do stuff with the result
}))

// Clean up any resources created and/or async effects
disposable.dispose()
```

### Hooks

Hooks are a special instance of `Ref`s, where `Ref`s are actually a lower-level primitive of Hooks. Hooks in `@typed/fp` are not tied to any rendering library, and can easily be tested in isolation.

With `Refs` their IDs are used to look up a given value. With `hooks`, like those found in React, this `ID` 
is instead generated using an incrementing index which leads to the "rules of hooks" particularly where 
ordering matters and must be consistent. To help with this functionality hooks have been implemented atop 
of Streams since they have a lifecycle of their own.

```ts
import * as Ref from '@typed/fp/Ref'
import * as E from '@typed/fp/Env'
import * as RS from '@typed/fp/ReaderStream'
import * as H from '@typed/fp/hooks'

const Component: E.Env<E & Ref.Refs, HTMLElement> = ...

const stream: RS.ReaderStream<E & Ref.Refs, HTMLElement> = H.withHooks(Component)
```
