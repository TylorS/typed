# @typed/fp

`@typed/fp` is conceptually an extension of [fp-ts](https://gcanti.github.io/fp-ts/), with
cancelable async effects, [streams](https://github.com/mostjs/core), state management, and more.

This project is under heavy development. We intend to align with `fp-ts` v3. A 1.0 will be released
once both codebases are stable.

## Features

- [`@most/core`](https://github.com/mostjs/core) [Streams](#streams)
- [Cancelable Async Effect](#resume---typedfpresume)
- [State Management](#streams)
- Free of globals
- Easy to Test
- Deeply integrated with [fp-ts](https://gcanti.github.io/fp-ts/)
- Decoupled from any view library

## Conceptual Documentation

As with `fp-ts`' own documentation, it is not strictly a goal to explain functional programming as a
whole, though it is a goal to provide more than just hard API documentation. For now, I'm just using
this README as a way to stream my thoughts somewhere visible. Some core things are coming together
already.

### Where's this coming from and where's it going?

#### Some Background

##### Push-based Reactive Programming

I've been experimenting with functional programming within reactive systems for my almost entire
software career. I got started in open-source by contributing to [Cycle.js](https://cycle.js.org/)
and eventually I met the great folks behind [`@most/core`](https://github.com/mostjs/core) and then
I tried my hand at a hybrid of the 2 projects
[Motorcyle.ts](https://github.com/motorcycle/motorcycle.ts). I got my first jobs because of these
projects, and I'm truly grateful.

It became pretty clear to me that most people don't really enjoy programming in that style, or it's
really difficult to transition from an imperative world into their declarative programming style. I
struggled to remain a real advocate for quite some time.

##### Relationship with React

I've been focused primarily in the FE/UI space, so I've spent a lot of time with React. It's got an
interesting set of tradeoffs it makes, but I'm not really here to roast any other projects. I've
felt like the key to React's success is that it abstracts away time and allows people to program to
a single instant, what they call the "render phase". Each call to Component.render() or (hopefully)
your function component you're dealing with the current snapshot of time. But UIs don't exist
without time. The user clicks, scrolls and interacts with your page over time.

At first @typed/fp was really an attempt to recreate React utilizing data-structures from Category
Theory.

Did you know you can create your own hooks library utilizing just `Reader`?!

I tried it for a while. I was excited for a while. Then I wasn't. I had realized though there's a
more fundamental concept beneath them. While using React's hooks, each call to `use*` (e.g.
useState) increments an index. This leads to the rules of hooks where _order matters_ and you cannot
nest hooks inside callbacks. This index is used the key to look up the state that was held there
from previous renders.

**What if you didn't need to care about order? What if you could just use any construct wherever you
like?**

I'll come back to that in just a moment.

I was also looking into providing
[Fiber](<https://en.wikipedia.org/wiki/Fiber_(computer_science)>)s. Do you remember the hype around
[React Fiber](https://www.velotio.com/engineering-blog/react-fiber-algorithm)? I considered doing
everything pull-based like [ZIO](https://zio.dev/) or
[Effect-TS](https://github.com/Effect-TS/core). Both are amazing libraries with brilliant authors
doing great things. I totally considered ditching my library just to work with `Effect-TS` instead
and consolidate efforts.

Fibers are really cool concurrency primitives. Generally they have their own isolated bits of state.
Every React component, class or functional, is backed by a Fiber to give it local state. Fibers
require a lot of considerations to be really powerful. However, while I started to continue
implementing while continuing my own versions (how I learn) I realized a lot of machinery had to be
built in order to express concepts that stretched over time.

I started wondering...

**Can I use push-based reactive programming provide better combinators for dealing with systems over
time?**

### Push-Pull Reactive Programming w/ Ref

At the intersection of the previously posed questions is [Ref](#ref---typedfpref).

`Ref` is 100% decoupled from any view library. You can utilize it to sample the current state of
your application, and you will be able to use it to express your application over time.

You will be able to compose pull-based workflows with push-based workflows as required to construct
more complex systems. Concurrent React will never reach the level of control over most-based stream
graph. Recover from errors with ease, throttle and debounce naturally, all while never leaking
resources.

### Domain-Driven Design and Layered Architecture

Over the past 3 or 4 years I've been toying with many variations of functional programming and
layered architectures inspired by
[Domain-Driven Design](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf).

With the combination of [Ref](#ref---typedfpref), the sync/async Reader effect
[Env](#env---typedfpenv), and [Streams](#stream---typedfpstream), you can build functional applications that are
also fundamentally designed for unit testing with unique blend of declarative and denotative
programming that I've found to be a wonderful companion to DDD and all of the various domain-centric
architectures such as _onion_, _hexagonal_ (ports and adapters), clean architecture, or any other
variations of these layered architectures.

Personally it's been a amazing to see products come together utilizing Domain Modeling to rule out
bad states from applications with structures like Option or Either, to see all state-based workflows
become decoupled and unit tested. to use data structures like `Reader` or [Env](#env---typedfpenv) to exemplify
the [Dependency Inversion Principle](https://alexnault.dev/dependency-inversion-principle-in-functional-typescript) in
your layered architectures. 

This is the future of @typed/fp: to exemplify push-pull reactive programming, backed by the mathematical roots of functional programming, to compose domain-centric applicaton's that rigourously separate concerns at the architectural level.

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
[Dependency Inversion Principle](https://alexnault.dev/dependency-inversion-principle-in-functional-typescript). This
principle is one of the easiest ways to begin improving any codebase.

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
