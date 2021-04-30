# @typed/fp

`@typed/fp` is conceptually an extension [fp-ts](https://gcanti.github.io/fp-ts/), with cancelable 
async effects, do-notation, fibers, state management, hooks, streams, and more. 

Extremely modular in the same way you would expect from the `fp-ts/*` style modules and imports 
using ES modules to ensure dead code elimination of all kinds can be highly effective all of 
the src files can be imported directly imported as `@typed/fp/*` and both commonjs `main` and 
esm `module` are provided for each package for maximum support.

This project is under very heavy development. It is my goal to align with `fp-ts` v3 which is currently also under heavy development and once both codebases are stable I intend to make the 1.0 release.

## Features

- Bridges `fp-ts` and `@most/core` ecosystems
- [Cancelable Async Effect](#resume)
- [Fibers](#fiber)
- [Environment-aware Effect](#env)
- [Modular state management](#ref)
- Stack-safe [Do-notation](#do-notation)
  - Supports configurable variance on type parameters
- [Hooks](#Hooks)
- Bring your own UI library or none at all
- No globals required
- Branded types
- Queues
- ....and more TBD

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

`Env` is the core of the higher-level modules like [`Fiber`](#Fiber) and is a `ReaderT` of `Resume`, but to be honest being used so much, I didn't like writing `ReaderReader<A>` and chose to shorten to `Env` for the 
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
import * as R from '@typed/fp/Ref'
import * as E from '@typed/fp/Env'
import * as Re from '@typed/fp/Resume'
import { Do } from '@typed/fp/Fx/Env'
import * as N from 'fp-ts/number'
import { pipe } from 'fp-ts/function'

// Create a reference needing nothing from the environment
// and references a number. The second parameter is optional and is the key to use
// otherwise it will create its own Symbol() for randomness. The third parameter is
// an Eq instance which will configure which an update event will be triggered when 
// trying to update the references value.
const Count: R.Ref<unknown, number> = R.createRef(E.of(0), Symbol('Count'), N.Eq)

// Potentially use something asynchronous and uses an environmental resource, this additional 
// Resource would be added to the environemnt with any calls to getRef/setRef/deleteRef/modifyRef calls.
// const Count: R.Ref<unknown, number> = R.createRef(E.of(0), Symbol('Count'), N.Eq)

// Create a workflow using references
const addOne: E.Env<R.Refs, number> = Do(function*(_) {
  // Get the current value
  const count: number = yield* _(R.getRef(Count))
  // Add 1
  const countPlusOne: number = yield* _(pipe(Count, R.modifyRef(x => x + 1)))

  return countPlusOne
})

const refs: R.References = R.createReferences()
// Optionally provide default values, uses the Reference's Id by providing an interval of key-values.
// Convenient for testing specific values
// const refs = R.createReferences([[Count.id, 42]])

// Provide the references and run the Resume
const disposable = pipe({ refs }, addOne, Re.run((n: number) => {
  // Do stuff with the result

  return { dispose: () => { /*cancel things*/ } }
}))

// Clean up any resources created and/or async effects
disposable.dispose()
```

### Fiber

`Fiber`s build upon `Env` to overlay a unix thread-like model atop. Sometimes called coroutines 
or green threads these constructs allow for a single thread to cooperate for what work should 
be done with what priority. In some ways a `Fiber` is like a `Promise` (w/ cancelation still) an `Env` can be transformed into. 

Fibers can be inspected for what status they are currently in. There is a `most` `Stream` available 
from each Fiber to listen to the status changes as they occur. 

<details>
  <summary>Status TypeScript Defintion</summary>

```ts
export type Status<A> =
  | Queued
  | Running
  | Failed
  | Paused
  | Aborting
  | Aborted
  | Finished<A>
  | Completed<A>

/**
 * The initial state a fiber starts before running
 */
export type Queued = {
  readonly type: 'queued'
}

/**
 * The state of a fiber when it begins running its computations
 */
export type Running = {
  readonly type: 'running'
}

/**
 * The state of a fiber when it has failed, but it still has uninterruptable child
 * fibers.
 */
export type Failed = {
  readonly type: 'failed'
  readonly error: Error
}

/**
 * The state of a fiber when it has chosen to yield to its parent
 */
export type Paused = {
  readonly type: 'paused'
}

/**
 * The state of a fiber when it has been aborted but is running finalizers
 */
export type Aborting = {
  readonly type: 'aborting'
}

/**
 * The state of a fiber when it has been aborted
 */
export type Aborted = {
  readonly type: 'aborted'
}

/**
 * The state of a fiber when it has computed a value, but still has child
 * fibers executing
 */
export type Finished<A> = {
  readonly type: 'finished'
  readonly value: A
}

/**
 * The state of a fiber when it and all of its children have completed
 */
export type Completed<A> = {
  readonly type: 'completed'
  readonly value: Either<Error, A>
}
```

</details>
<br/>

To start your `Env`-based application using Fibers you'll use the `runAsFiber` API. Generally this API should be used once per application. Within your application however, the `fork` API is preferred. Fork 
will automatically construct a tree of your Fibers, allowing for creating many various asynchronous 
workflows while never leaking resources due to the underlying usage of `Disposable` and other cancelation
baked into Fibers.

Every `Fiber` has their own instances of `Refs` to allow for managing state that is localized to each 
Fiber. This allows for creating "components" that correspond to a Fiber instance. Keeping track of these
references and 

> Write More - Give examples

### Hooks

Hooks are a special instance of `Ref`s, where `Ref`s are actually a lower-level primitive of Hooks. Hooks in `@typed/fp` are not tied to any rendering library, and can easily be tested in isolation.

With `Refs` their IDs are used to look up a given value. With `hooks`, like those found in React, this `ID` 
is instead generated using an incrementing index which leads to the "rules of hooks" particularly where 
ordering matters and must be consistent. To help with this functionality hooks have been implemented atop 
of Fibers since they have their own copy of references and a lifecycle of their own.

> Write More - Give examples

### Patch 

Best summarized by its type signature

```ts
export interface Patch<A, B> {
  readonly patch: (a: A, b: B) => Resume<A>
}
```

`Patch` is the basis of rendering, but is generalized to an reducer-like function returning a `Resume`.

## TODO

At a high-level I'm still trying to figure out what pieces to the puzzle work above `Patch` and `Hooks` to provide a bring-your-own-renderer 
style experience. I've had a couple of POCs now and it's very possible, I've had it working with and without queues + requestIdleCallback for 
cooperative scheduling, but I haven't been happy with the implementation yet. I'm pretty interested in exploring a static site generator style experience
using [Islands Architecture](https://jasonformat.com/islands-architecture/) where each island corresponds to a `Fiber` process with a while-loop performing 
patches when there's changes to its state. I've been considering having a "global" parent Fiber to all of these "island" Fibers, in which to configure how to lazy-load islands when they're about to be on screen, hovered over, etc, and share "global" state that continues to be unit-testable.

### Conversions

I need to make sure we can interop with as many types as possible, so for all the types that can implement these interfaces we'll want to make sure all of the kliesi arrows are 
implemented as well.

- [ ] FromEither
- [ ] FromIO
- [ ] FromTask
- [ ] FromReader
- [ ] FromState 
- [ ] FromResume 
- [ ] FromEnv 

### Derivable Implementations

We'll want to make sure that all of the derivable functions given a type-class are available, including missing instances of those type-classes.

- [ ] Alt 
- [ ] Alternative 
- [ ] Apply 
- [ ] Bifunctor 
- [ ] Category 
- [ ] Chain 
- [ ] Choice 
- [ ] Compactable 
- [ ] Contravariant 
- [ ] Filterable 
- [ ] Foldable 
- [ ] Functor 
- [ ] Invariant 
- [ ] Monad 
- [ ] Monoid 
- [ ] Ord 
- [ ] Profunctor 
- [ ] Semigroup 
- [ ] Semigroupoid
- [ ] Separated
- [ ] Show
- [ ] Strong
- [ ] Traversable
- [ ] Unfoldable
- [ ] Witherable

### Examples

I'd love suggestions as to what kinds of examples would be useful! Feel free to open an
issue, I'd like to make this more accessible to more than just FP experts

- [x] fp-to-the-max
- [ ] react
- [ ] uhtml


### Documentation

I'd love suggestions as to what kinds of documentation would be useful! Feel free to open an
issue, I'd like to make this more accessible to more than just FP experts

> Suggestions welcome!

- [ ] API Documentation
- [ ] Resume tutorial
- [ ] Env tutorial
- [ ] Refs tutorial
- [ ] Fiber tutorial
- [ ] Hooks tutorial
- [ ] 
