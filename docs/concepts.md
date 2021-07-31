---
title: Concepts
nav_order: 2
---

# Concepts

As with `fp-ts`' own documentation, it is not strictly a goal to explain functional programming as a
whole, though it is a goal to provide more than just hard API documentation. For now, I'm just using
this README as a way to stream my thoughts somewhere visible. Some core things are coming together
already.

## Where's this coming from and where's it going?

### Some Background

#### Push-based Reactive Programming

I've been experimenting with functional programming within reactive systems for almost my entire
software career. I got started in open-source by contributing to [Cycle.js](https://cycle.js.org/)
and eventually I met the great folks behind [`@most/core`](https://github.com/mostjs/core) and then
I tried my hand at a hybrid of the 2 projects
[Motorcyle.ts](https://github.com/motorcycle/motorcycle.ts). I got my first jobs because of these
projects, and I'm truly grateful.

It became pretty clear to me that most people don't really enjoy programming in that style, or it's
really difficult to transition from an imperative world into their declarative programming style. I
struggled to remain a real advocate for quite some time.

#### Relationship with React

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
doing great things. I totally considered ditching my library to work with `Effect-TS` instead and
consolidate efforts.

Fibers are cool concurrency primitives. Generally, they have their isolated bits of state. Every
React component, class or functional, is backed by a Fiber to keep each component's state. Fibers
require a lot of considerations to orchestrate in complex ways. In addition to Fibers' inherent
complexity, they often layer on more concepts to deal with various async workflows that occur over
time.

I started wondering...

**Can I use push-based reactive programming to provide better combinators for dealing with systems
over time?**

### Where things are going

#### Push-Pull Reactive Programming w/ Ref

At the intersection of the previously posed questions is [Ref](#ref---typedfpref).

`Ref` is 100% decoupled from any view library. You can utilize it to sample the current state of
your application. You will be able to use it to express your application over time.

You will be able to compose pull-based workflows with push-based workflows as required to construct
more complex systems. Concurrent React will never reach the level of control over a most-based
stream graph. Recover from errors with ease, throttle/debounce naturally, all while never leaking
resources.

#### Domain-Driven Design and Layered Architecture

Over the past 3 or 4 years, I've been toying with many variations of functional programming and
layered architectures inspired by
[Domain-Driven Design](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf).

With the combination of [Ref](#ref---typedfpref), the sync/async Reader effect
[Env](#env---typedfpenv), and [Streams](#stream---typedfpstream), you can build functional
applications that are also fundamentally designed for unit testing with a unique blend of
declarative and denotative programming that I've found to be a wonderful companion to DDD and all of
the various domain-centric architectures such as _onion_, _hexagonal_ (ports and adapters), clean
architecture, or any other variations of these layered architectures.

Personally, it's been amazing to see products come together utilizing Domain Modeling to rule out
bad states from applications with structures like Option or Either, to see all state-based workflows
become decoupled and fully unit tested, to use data structures like `Reader` or
[Env](#env---typedfpenv) to exemplify the
[Dependency Inversion Principle](https://alexnault.dev/dependency-inversion-principle-in-functional-typescript)
in your layered architectures.

The Dependency Inversion Principle allows you to separate the _what_ to do from the _how_ to do it.
In other words, it helps you to separate concerns or push side effects to the bounds of your system.
When paired with Functional Programming, the
[Open-Closed Principle](https://en.wikipedia.org/wiki/Open%E2%80%93closed_principle) **_just
happens_** to allow you to modify the behavior of your applications without changing your
algorithms. The Open-Closed Principle will enable you to easily share code between runtimes, like
Node.js or the browser.

This is the future of `@typed/fp`; to exemplify push-pull reactive programming, backed by the
mathematical roots of functional programming, to compose domain-centric application's that
rigorously separate concerns at an architectural level.
