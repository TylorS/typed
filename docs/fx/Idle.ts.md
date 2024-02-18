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
export declare const withIdleScheduler: <B, E, R>(self: Effect.Effect<B, E, R>) => Effect.Effect<B, E, R>
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
  readonly while: Effect.Effect<boolean, E, R>
  readonly body: Effect.Effect<unknown, E2, R2>
}
```

Added in v1.18.0

# scoped

## whenIdle

Request to run some work with requestIdleCallback returning an IdleDeadline

**Signature**

```ts
export declare const whenIdle: (options?: IdleRequestOptions) => Effect.Effect<IdleDeadline, never, Scope.Scope>
```

Added in v1.18.0

# utils

## IdleQueue (interface)

**Signature**

```ts
export interface IdleQueue<I> {
  readonly add: <R>(part: I, task: Effect.Effect<unknown, never, R>) => Effect.Effect<void, never, R | Scope.Scope>

  readonly interrupt: Effect.Effect<void>
}
```

Added in v1.18.0

## dequeueWhileIdle

Dequeue values and perform an Effect while the event loop is not busy with any other work.

**Signature**

```ts
export declare function dequeueWhileIdle<A, B, E2, R2>(
  dequeue: Queue.Dequeue<A>,
  f: (a: A) => Effect.Effect<B, E2, R2>,
  options?: IdleRequestOptions
): Effect.Effect<void, E2, R2 | Scope.Scope>
export declare function dequeueWhileIdle<I, A, B, E2, R2>(
  dequeue: Context.Dequeue<I, A>,
  f: (a: A) => Effect.Effect<B, E2, R2>,
  options?: IdleRequestOptions
): Effect.Effect<void, E2, I | R2 | Scope.Scope>
export declare function dequeueWhileIdle<I = never, A = unknown, R2 = never, E2 = never, B = unknown>(
  dequeue: Context.Dequeue<I, A> | Queue.Dequeue<A>,
  f: (a: A) => Effect.Effect<B, E2, R2>,
  options?: IdleRequestOptions
): Effect.Effect<void, E2, I | R2 | Scope.Scope>
```

Added in v1.18.0

## makeIdleQueue

**Signature**

```ts
export declare const makeIdleQueue: <I>(options?: IdleRequestOptions) => Effect.Effect<IdleQueue<I>, never, Scope.Scope>
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
) => Effect.Effect<void, E | E2, Scope.Scope | R | R2>
```

Added in v1.18.0
