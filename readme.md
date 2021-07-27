# @typed/fp

`@typed/fp` is conceptually an extension of [fp-ts](https://gcanti.github.io/fp-ts/), with cancelable 
async effects, [streams](https://github.com/mostjs/core), state management, and more. 

This project is under very heavy development. It is my goal to align with `fp-ts` v3 which is currently also under heavy development and once both codebases are stable I intend to make the 1.0 release.

## Features

- [`@most/core`](https://github.com/mostjs/core) Streams
- [Cancelable Async Effect](#resume)
- [State Management](#ref)
- Free of globals
- Testable


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

`Env` is the core of the higher-level modules like [`Ref`](#ref) and is a `ReaderT` of `Resume`, but to be honest being used so much, I didn't like writing `ReaderResume<A>` and chose to shorten to `Env` for the 
"environmental" quality Reader provides. Combining Reader and Resume allows for creating APIs that are 
capable of utilizing dependency injection for its configurability and testability.  

While designing application APIs it is often better to describe the logic of your system separate from 
the implementation details. `Env`, or rather `Reader` helps you accomplish this through the [Dependency Inversion Principle](https://stackify.com/dependency-inversion-principle/). This principle is one of 
the easiest ways to begin improving any codebase.

### Ref 

`Ref` is an abstraction for managing state using `Env`. It exposes an extensible get/set/delete
API for managing keys (string|number|symbol) to values. Every `Ref` is connected to an `Env`
that will provide the default value lazily when first asked for or after being deleted previously.

The provided implementation will also send events containing all of the creations/updates/deletes occuring
in realtime.

Here's a small counter example to show how one might use Ref to create a simple counter application.

```ts
import * as E from '@fp/Env'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import * as S from '@fp/Stream'
import * as U from '@fp/use'
import { newDefaultScheduler } from '@most/scheduler'
import * as F from 'fp-ts/function'
import { html, render, Renderable } from 'uhtml'

/**
 * This is an example of using hooks to render a dynamically-sized
 * set of Counters with their own internal state separate from any other Counters.
 */

const rootElement: HTMLElement | null = document.getElementById('app')

if (!rootElement) {
  throw new Error('Unable to find element by #app')
}

// Creates a Reference to keep our Count
// It requires no resources and tracks a number
const Count: Ref.Wrapped<unknown, number> = Ref.create(E.of(0))

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