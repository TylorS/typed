---
title: Idle.ts
nav_order: 7
parent: "@typed/fx"
---

## Idle overview

Some Effect-based abstractions for utilizing requestIdleCallback to schedule work to be done when the event
loops determines it is not busy with other higher-priority work.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [withIdleScheduler](#withidlescheduler)
- [instances](#instances)
  - [defaultIdleScheduler](#defaultidlescheduler)
- [layers](#layers)
  - [setIdleScheduler](#setidlescheduler)
- [models](#models)
  - [IdleScheduler (interface)](#idlescheduler-interface)
- [params](#params)
  - [WhileIdleRequestOptions (interface)](#whileidlerequestoptions-interface)
- [scoped](#scoped)
  - [whenIdle](#whenidle)
- [utils](#utils)
  - [IdleQueue (interface)](#idlequeue-interface)
  - [dequeueWhileIdle](#dequeuewhileidle)
  - [makeIdleQueue](#makeidlequeue)
  - [shouldContinue](#shouldcontinue)
  - [whileIdle](#whileidle)

---

# combinators

## withIdleScheduler

Run an Effect using the IdleScheduler.

**Signature**

```ts
export declare const withIdleScheduler: <R, E, B>(self: Effect.Effect<R, E, B>) => Effect.Effect<R, E, B>
```

Added in v1.18.0

# instances

## defaultIdleScheduler

Default instance of the IdleScheduler

**Signature**

```ts
export declare const defaultIdleScheduler: IdleScheduler
```

Added in v1.18.0

# layers

## setIdleScheduler

Provide the IdleScheduler using a Layer.

**Signature**

```ts
export declare const setIdleScheduler: Layer.Layer<never, never, never>
```

Added in v1.18.0

# models

## IdleScheduler (interface)

The IdleScheduler is an implementation of Effect's Scheduler interface, which utilizes a priority queue
to order tasks to be run when the event loop is idle through the usage of requestIdleCallback.

In the event requestIdleCallback is not available, setTimeout(task, 1) will be utilized as a fallback

**Signature**

```ts
export interface IdleScheduler extends Scheduler.Scheduler {
  dispose(): void
}
```

Added in v1.18.0

# params

## WhileIdleRequestOptions (interface)

The options provided to `whileIdle`

**Signature**

```ts
export interface WhileIdleRequestOptions<R, E, R2, E2> extends IdleRequestOptions {
  readonly while: Effect.Effect<R, E, boolean>
  readonly body: Effect.Effect<R2, E2, unknown>
}
```

Added in v1.18.0

# scoped

## whenIdle

Request to run some work with requestIdleCallback returning an IdleDeadline

**Signature**

```ts
export declare const whenIdle: (options?: IdleRequestOptions) => Effect.Effect<Scope.Scope, never, IdleDeadline>
```

Added in v1.18.0

# utils

## IdleQueue (interface)

**Signature**

```ts
export interface IdleQueue<I> {
  readonly add: <R>(part: I, task: Effect.Effect<R, never, unknown>) => Effect.Effect<R | Scope.Scope, never, void>

  readonly interrupt: Effect.Effect<never, never, void>
}
```

Added in v1.18.0

## dequeueWhileIdle

Dequeue values and perform an Effect while the event loop is not busy with any other work.

**Signature**

```ts
export declare function dequeueWhileIdle<A, R2, E2, B>(
  dequeue: Queue.Dequeue<A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
  options?: IdleRequestOptions
): Effect.Effect<R2 | Scope.Scope, E2, void>
export declare function dequeueWhileIdle<I, A, R2, E2, B>(
  dequeue: Context.Dequeue<I, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
  options?: IdleRequestOptions
): Effect.Effect<I | R2 | Scope.Scope, E2, void>
export declare function dequeueWhileIdle<I = never, A = unknown, R2 = never, E2 = never, B = unknown>(
  dequeue: Context.Dequeue<I, A> | Queue.Dequeue<A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
  options?: IdleRequestOptions
): Effect.Effect<I | R2 | Scope.Scope, E2, void>
```

Added in v1.18.0

## makeIdleQueue

**Signature**

```ts
export declare const makeIdleQueue: <I>(options?: IdleRequestOptions) => Effect.Effect<Scope.Scope, never, IdleQueue<I>>
```

Added in v1.18.0

## shouldContinue

Check to see if an IdleDeadline timed out or has time remaining.

**Signature**

```ts
export declare function shouldContinue(deadline: IdleDeadline): boolean
```

Added in v1.18.0

## whileIdle

Schedule a while-loop to run using requestIdleCallback.

**Signature**

```ts
export declare const whileIdle: <R, E, R2, E2>(
  options: WhileIdleRequestOptions<R, E, R2, E2>
) => Effect.Effect<Scope.Scope | R | R2, E | E2, void>
```

Added in v1.18.0
