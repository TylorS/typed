- [@typed/fp](#typedfp)
  - [Features](#features)
  - [Documentation](#documentation)
  - [Core Libraries](#core-libraries)
    - [Stream - @typed/fp/Stream](#stream---typedfpstream)
    - [Resume - @typed/fp/Resume](#resume---typedfpresume)
    - [Env - @typed/fp/Env](#env---typedfpenv)
    - [Ref - @typed/fp/Ref](#ref---typedfpref)

# @typed/fp

`@typed/fp` is conceptually an extension of [fp-ts](https://gcanti.github.io/fp-ts/), with
cancelable async effects, [streams](https://github.com/mostjs/core), state management, and more.

This project is under heavy development. We intend to align with `fp-ts` v3. A 1.0 will be released
once both codebases are stable.

## Features

- [`@most/core`](https://github.com/mostjs/core) [Streams](#streams)
- [Cancelable Async Effect](#resume---typedfpresume)
- [Dependency Injection](#env---typedfpenv)
- [State Management](#ref---typedfpref)
- Testable, Free of globals
- Type-Safe
- Composable
- Concurrent
- Asynchronous
- Resource-safe
- Resilient
- Deeply integrated with [fp-ts](https://gcanti.github.io/fp-ts/)

## Documentation

Navigate over to [https://typed-fp.org](https://typed-fp.org) for the API documentation. More to
come over time. If something doesn't make sense, please open a github issue.

## Core Libraries

### Stream - @typed/fp/Stream

A large goal of @typed/fp is to expand the `fp-ts` ecosystem to include
[`@most/core`](https://github.com/mostjs/core) for a Reactive programming style, including
derivatives such as `ReaderStream`, `ReaderStreamEither`, `StateReaderStreamEither` and a few
others. It's the fastest push-based reactive library in JS period. The performance characteristics
are due to it's architecture of getting out of the way of the computations you need to perform. It's
also the first experience I had with FP. For instance, Most utilizes `Functor` laws to remove
unneeded machinery through function composition improving runtime performance amongst other
optimizations.

```ts
import * as M from '@most/core'

const input = pipe(stream, M.map(f), M.map(g))
// transformed to effectively at time of construction
const output = pipe(stream, M.map(flow(f, g)))
```

It's simple architecture, and it's
[always-async guarantee](https://mostcore.readthedocs.io/en/latest/concepts.html#always-async),
which is fantastic for modularity, but it also allows for it's
[`Scheduler`](https://mostcore.readthedocs.io/en/latest/api.html#most-scheduler) to be the only
place in the codebase to require a `try/catch`. This ensures that a much greater portion of the
stream graph can be inlined by the optimizing compiler your JS is running within. This `Scheduler`
can be reused to inject time into your applications like any other dependency, with packages like
[most-virtual-scheduler](https://github.com/mostjs-community/virtual-scheduler) allowing you to
control time imperatively for your time-precise tests with millisecond accuracy. This could also
allow you to create a React-like framework where you avoid starting non-blocking async workflows
(think useEffect) by utilizing a virtual scheduler on the server but then utilizing most's default
scheduler to utilize `performance.now()` for millisecond accuracy with monotonic, referentially
transparent, time in the browser.

### Resume - @typed/fp/Resume

`Resume` is a possibly synchronous or asynchronous effect type. Conceptually you can think of
`Resume` as a union between the `IO` and `Task` monads w/ cancelation. The `Disposable` interface is
borrowed from `@most/core`'s internal types and makes it easy to interoperate. Using `Disposable`
makes it easy to reuse the `@most/scheduler` package for providing scheduling consistent with any
other most-based workflows you have.

The beauty of `Resume` is that it can do work as fast as possible without delay. Sync when possible
but async when needed allows you to unify your sync/async workflows using a single monad w/ easy
interop with your existing IO/Task allowing for cancelation when required.

```ts
import { IO } from 'fp-ts/IO'
import { Disposable } from '@most/types'

type Resume<A> = Sync<A> | Async<A>

type Sync<A> = {
  readonly type: 'sync'
  readonly resume: IO<A>
}

type Async<A> = {
  readonly type: 'async'
  readonly resume: (cb: (value: A) => Disposable) => Disposable
}

// From @most/types
type Disposable = {
  readonly dispose: () => void
}
```

### Env - @typed/fp/Env

`Env` is the core of the higher-level modules like [`Ref`](#ref) and is a `ReaderT` of `Resume`; but
to be honest, being used so much, I didn't like writing `ReaderResume<E, A>` and chose to shorten to
`Env<E, A>` for the "environmental" quality Reader provides. Combining Reader and Resume allows for
creating APIs capable of utilizing dependency injection for their configuration and testability
while still combining your sync/async workflows.

While designing application APIs it is often better to describe the logic of your system separate
from the implementation details. `Env` or rather `Reader` helps you accomplish this through the
[Dependency Inversion Principle](https://alexnault.dev/dependency-inversion-principle-in-functional-typescript).
This principle is one of the easiest ways to begin improving any codebase.

### Ref - @typed/fp/Ref

`Ref` is an abstraction for managing state-based applications using `Env`. It exposes an extensible
get/set/delete API for managing keys to values. Every `Ref` is connected to an `Env` that will
provide the default value lazily when first asked for or after being deleted previously.

The provided implementation will also send events containing all of the creations/updates/deletes
occurring in real-time.

Here's a small example of a Counter application to show how one might use Ref to create a simple
counter application.

```ts
import * as E from '@typed/fp/Env'
import * as RS from '@typed/fp/ReaderStream'
import * as Ref from '@typed/fp/Ref'
import * as S from '@typed/fp/Stream'
import * as U from '@typed/fp/use'
import { newDefaultScheduler } from '@most/scheduler'
import * as F from 'fp-ts/function'
import { html, render, Renderable } from 'uhtml'

const rootElement: HTMLElement | null = document.getElementById('app')

if (!rootElement) {
  throw new Error('Unable to find element by #app')
}

// Creates a Reference to keep our Count
// It requires no resources and tracks a number
const Count: Ref.Reference<unknown, number> = Ref.create(E.of(0))

// Actions to update our Count Reference - easily tested
const increment: E.Env<Ref.Refs, number> = Count.update(F.flow(F.increment, E.of))

const decrement: E.Env<Ref.Refs, number> = Count.update(
  F.flow(
    F.decrement,
    E.of,
    E.map((x) => Math.max(0, x)),
  ),
)

// Creates a component which represents our counter
const Counter: E.Env<Ref.Refs, Renderable> = F.pipe(
  E.Do,
  U.bindEnvK('dec', () => decrement),
  U.bindEnvK('inc', () => increment),
  E.bindW('count', () => Count.get),
  E.map(
    ({ dec, inc, count }) => html`<div>
      <button onclick=${dec}>Decrement</button>
      <span>Count: ${count}</span>
      <button onclick=${inc}>Increment</button>
    </div>`,
  ),
)

const Main: RS.ReaderStream<Ref.Refs, HTMLElement> = F.pipe(
  Counter,
  Ref.sample, // Sample our Counter everytime there is a Ref update.
  RS.scan(render, rootElement), // Render our application using 'uhtml'
)

// Provide Main with its required resources
const stream: S.Stream<HTMLElement> = Main(Ref.refs())

// Execute our Stream with a default scheduler
S.runEffects(stream, newDefaultScheduler()).catch((error) => console.error(error))
```

It is likely worth noting that, by default, `Ref.make` is not referentially transparent. It will
automatically generate a unique `Symbol()` on each invocation for the `Ref.id`. If you need
referential transparency, be sure to provide your own `id`. This also applies to `Ref.create` and
the `Context.create`.

```ts
const myRef = Ref.make(initial, {
  id: 'MyId',
})
```
