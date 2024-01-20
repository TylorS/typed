---
title: Fx.ts
nav_order: 5
parent: "@typed/fx"
---

## Fx overview

Fx is a push-based reactive primitive built atop of Effect.

Added in v1.20.0

---

<h2 class="text-delta">Table of contents</h2>

- [FlattenStrategy](#flattenstrategy)
  - [Bounded](#bounded)
  - [Bounded (interface)](#bounded-interface)
  - [Exhaust](#exhaust)
  - [Exhaust (interface)](#exhaust-interface)
  - [ExhaustLatest](#exhaustlatest)
  - [ExhaustLatest (interface)](#exhaustlatest-interface)
  - [FlattenStrategy (type alias)](#flattenstrategy-type-alias)
  - [Switch](#switch)
  - [Switch (interface)](#switch-interface)
  - [Unbounded](#unbounded)
  - [Unbounded (interface)](#unbounded-interface)
- [MergeStrategy](#mergestrategy)
  - [MergeStrategy (type alias)](#mergestrategy-type-alias)
  - [Ordered](#ordered)
  - [Ordered (interface)](#ordered-interface)
  - [Unordered](#unordered)
  - [Unordered (interface)](#unordered-interface)
- [combinators](#combinators)
  - [matchTags](#matchtags)
- [models](#models)
  - [FxFork (type alias)](#fxfork-type-alias)
  - [ScopedFork (type alias)](#scopedfork-type-alias)
- [utils](#utils)
  - [Context (type alias)](#context-type-alias)
  - [DefaultMatchersFrom (type alias)](#defaultmatchersfrom-type-alias)
  - [Error (type alias)](#error-type-alias)
  - [Fx (interface)](#fx-interface)
  - [Fx (namespace)](#fx-namespace)
    - [Variance (interface)](#variance-interface)
    - [Context (type alias)](#context-type-alias-1)
    - [Error (type alias)](#error-type-alias-1)
    - [Success (type alias)](#success-type-alias)
    - [Unify (type alias)](#unify-type-alias)
  - [FxEffectBase (class)](#fxeffectbase-class)
    - [run (method)](#run-method)
    - [toFx (method)](#tofx-method)
    - [toEffect (method)](#toeffect-method)
  - [KeyedOptions (interface)](#keyedoptions-interface)
  - [MatchCauseOptions (type alias)](#matchcauseoptions-type-alias)
  - [MatchErrorOptions (type alias)](#matcherroroptions-type-alias)
  - [Success (type alias)](#success-type-alias-1)
  - [Unify (type alias)](#unify-type-alias-1)
  - [WithKeyOptions (interface)](#withkeyoptions-interface)
  - [acquireUseRelease](#acquireuserelease)
  - [all](#all)
  - [annotateLogs](#annotatelogs)
  - [annotateSpans](#annotatespans)
  - [append](#append)
  - [appendAll](#appendall)
  - [at](#at)
  - [compact](#compact)
  - [concatMap](#concatmap)
  - [continueWith](#continuewith)
  - [debounce](#debounce)
  - [delay](#delay)
  - [die](#die)
  - [drain](#drain)
  - [drainLayer](#drainlayer)
  - [drop](#drop)
  - [dropAfter](#dropafter)
  - [dropAfterEffect](#dropaftereffect)
  - [dropUntil](#dropuntil)
  - [dropUntilEffect](#dropuntileffect)
  - [dropWhile](#dropwhile)
  - [dropWhileEffect](#dropwhileeffect)
  - [during](#during)
  - [either](#either)
  - [empty](#empty)
  - [ensuring](#ensuring)
  - [exhaustMap](#exhaustmap)
  - [exhaustMapCause](#exhaustmapcause)
  - [exhaustMapEffect](#exhaustmapeffect)
  - [exhaustMapError](#exhaustmaperror)
  - [exhaustMapLatest](#exhaustmaplatest)
  - [exhaustMapLatestCause](#exhaustmaplatestcause)
  - [exhaustMapLatestEffect](#exhaustmaplatesteffect)
  - [exhaustMapLatestError](#exhaustmaplatesterror)
  - [exhaustMatchCause](#exhaustmatchcause)
  - [exhaustMatchError](#exhaustmatcherror)
  - [exhaustMatchLatestCause](#exhaustmatchlatestcause)
  - [exhaustMatchLatestError](#exhaustmatchlatesterror)
  - [exit](#exit)
  - [fail](#fail)
  - [failCause](#failcause)
  - [filter](#filter)
  - [filterCause](#filtercause)
  - [filterCauseEffect](#filtercauseeffect)
  - [filterEffect](#filtereffect)
  - [filterError](#filtererror)
  - [filterErrorEffect](#filtererroreffect)
  - [filterMap](#filtermap)
  - [filterMapCause](#filtermapcause)
  - [filterMapCauseEffect](#filtermapcauseeffect)
  - [filterMapEffect](#filtermapeffect)
  - [filterMapError](#filtermaperror)
  - [filterMapErrorEffect](#filtermaperroreffect)
  - [filterMapLoop](#filtermaploop)
  - [filterMapLoopCause](#filtermaploopcause)
  - [filterMapLoopCauseEffect](#filtermaploopcauseeffect)
  - [filterMapLoopEffect](#filtermaploopeffect)
  - [filterMapLoopError](#filtermaplooperror)
  - [filterMapLoopErrorEffect](#filtermaplooperroreffect)
  - [findFirst](#findfirst)
  - [first](#first)
  - [flatMap](#flatmap)
  - [flatMapCause](#flatmapcause)
  - [flatMapCauseConcurrently](#flatmapcauseconcurrently)
  - [flatMapCauseWithStrategy](#flatmapcausewithstrategy)
  - [flatMapConcurrently](#flatmapconcurrently)
  - [flatMapConcurrentlyEffect](#flatmapconcurrentlyeffect)
  - [flatMapEffect](#flatmapeffect)
  - [flatMapError](#flatmaperror)
  - [flatMapErrorConcurrently](#flatmaperrorconcurrently)
  - [flatMapErrorWithStrategy](#flatmaperrorwithstrategy)
  - [flatMapWithStrategy](#flatmapwithstrategy)
  - [flip](#flip)
  - [fork](#fork)
  - [forkDaemon](#forkdaemon)
  - [forkIn](#forkin)
  - [forkScoped](#forkscoped)
  - [fromArray](#fromarray)
  - [fromAsyncIterable](#fromasynciterable)
  - [fromDequeue](#fromdequeue)
  - [fromEffect](#fromeffect)
  - [fromFxEffect](#fromfxeffect)
  - [fromIterable](#fromiterable)
  - [fromNullable](#fromnullable)
  - [fromPubSub](#frompubsub)
  - [fromScheduled](#fromscheduled)
  - [gen](#gen)
  - [genScoped](#genscoped)
  - [getOrElse](#getorelse)
  - [hold](#hold)
  - [if](#if)
  - [interruptible](#interruptible)
  - [isFx](#isfx)
  - [keyed](#keyed)
  - [locally](#locally)
  - [locallyWith](#locallywith)
  - [loop](#loop)
  - [loopCause](#loopcause)
  - [loopCauseEffect](#loopcauseeffect)
  - [loopEffect](#loopeffect)
  - [loopError](#looperror)
  - [loopErrorEffect](#looperroreffect)
  - [make](#make)
  - [map](#map)
  - [mapBoth](#mapboth)
  - [mapCause](#mapcause)
  - [mapCauseEffect](#mapcauseeffect)
  - [mapEffect](#mapeffect)
  - [mapError](#maperror)
  - [mapErrorEffect](#maperroreffect)
  - [matchCause](#matchcause)
  - [matchCauseConcurrently](#matchcauseconcurrently)
  - [matchCauseWithStrategy](#matchcausewithstrategy)
  - [matchEither](#matcheither)
  - [matchError](#matcherror)
  - [matchErrorConcurrently](#matcherrorconcurrently)
  - [matchErrorWithStrategy](#matcherrorwithstrategy)
  - [matchOption](#matchoption)
  - [merge](#merge)
  - [mergeAll](#mergeall)
  - [mergeFirst](#mergefirst)
  - [mergeOrdered](#mergeordered)
  - [mergeOrderedConcurrently](#mergeorderedconcurrently)
  - [mergeRace](#mergerace)
  - [mergeSwitch](#mergeswitch)
  - [mergeWithStrategy](#mergewithstrategy)
  - [middleware](#middleware)
  - [multicast](#multicast)
  - [never](#never)
  - [observe](#observe)
  - [onError](#onerror)
  - [onExit](#onexit)
  - [onInterrupt](#oninterrupt)
  - [orElse](#orelse)
  - [orElseCause](#orelsecause)
  - [padWith](#padwith)
  - [partitionMap](#partitionmap)
  - [periodic](#periodic)
  - [prepend](#prepend)
  - [prependAll](#prependall)
  - [provide](#provide)
  - [provideContext](#providecontext)
  - [provideLayer](#providelayer)
  - [provideRuntime](#provideruntime)
  - [provideService](#provideservice)
  - [provideServiceEffect](#provideserviceeffect)
  - [race](#race)
  - [raceAll](#raceall)
  - [reduce](#reduce)
  - [replay](#replay)
  - [sample](#sample)
  - [scan](#scan)
  - [schedule](#schedule)
  - [scoped](#scoped)
  - [share](#share)
  - [since](#since)
  - [skipRepeats](#skiprepeats)
  - [skipRepeatsWith](#skiprepeatswith)
  - [slice](#slice)
  - [snapshot](#snapshot)
  - [snapshotEffect](#snapshoteffect)
  - [struct](#struct)
  - [succeed](#succeed)
  - [suspend](#suspend)
  - [switchMap](#switchmap)
  - [switchMapCause](#switchmapcause)
  - [switchMapEffect](#switchmapeffect)
  - [switchMapError](#switchmaperror)
  - [switchMatchCause](#switchmatchcause)
  - [switchMatchError](#switchmatcherror)
  - [sync](#sync)
  - [take](#take)
  - [takeUntiEffect](#takeuntieffect)
  - [takeUntil](#takeuntil)
  - [takeWhile](#takewhile)
  - [takeWhileEffect](#takewhileeffect)
  - [tap](#tap)
  - [tapEffect](#tapeffect)
  - [throttle](#throttle)
  - [throttleLatest](#throttlelatest)
  - [toEnqueue](#toenqueue)
  - [toReadonlyArray](#toreadonlyarray)
  - [tuple](#tuple)
  - [uninterruptible](#uninterruptible)
  - [until](#until)
  - [when](#when)
  - [withConcurrency](#withconcurrency)
  - [withConfigProvider](#withconfigprovider)
  - [withEmitter](#withemitter)
  - [withKey](#withkey)
  - [withLogSpan](#withlogspan)
  - [withMaxOpsBeforeYield](#withmaxopsbeforeyield)
  - [withParentSpan](#withparentspan)
  - [withRequestBatching](#withrequestbatching)
  - [withRequestCache](#withrequestcache)
  - [withRequestCaching](#withrequestcaching)
  - [withSpan](#withspan)
  - [withTracer](#withtracer)
  - [withTracerTiming](#withtracertiming)

---

# FlattenStrategy

## Bounded

Construct a Bounded strategy

**Signature**

```ts
export declare const Bounded: (capacity: number) => Bounded
```

Added in v1.20.0

## Bounded (interface)

Strategy which will allow for a bounded number of concurrent effects to be run.

**Signature**

```ts
export interface Bounded {
  readonly _tag: "Bounded"
  readonly capacity: number
}
```

Added in v1.20.0

## Exhaust

Singleton instance of Exhaust

**Signature**

```ts
export declare const Exhaust: Exhaust
```

Added in v1.20.0

## Exhaust (interface)

Strategy which will always favor the first Fx, dropping any Fx emitted while
the first Fx is still running. When the first Fx finished, the next event
will execute.

**Signature**

```ts
export interface Exhaust {
  readonly _tag: "Exhaust"
}
```

Added in v1.20.0

## ExhaustLatest

Singleton instance of ExhaustLatest

**Signature**

```ts
export declare const ExhaustLatest: ExhaustLatest
```

Added in v1.20.0

## ExhaustLatest (interface)

Strategy which will always favor the latest Fx, dropping any Fx emitted while
the latest Fx is still running. When the latest Fx finishes, the last seend event
will execute.

**Signature**

```ts
export interface ExhaustLatest {
  readonly _tag: "ExhaustLatest"
}
```

Added in v1.20.0

## FlattenStrategy (type alias)

FlattenStrategy is a representation of how higher-order effect operators should flatten
nested Fx.

**Signature**

```ts
export type FlattenStrategy = Unbounded | Bounded | Switch | Exhaust | ExhaustLatest
```

Added in v1.20.0

## Switch

Singleton instance of Switch

**Signature**

```ts
export declare const Switch: Switch
```

Added in v1.20.0

## Switch (interface)

Strategy which will switch to a new effect as soon as it is available.

**Signature**

```ts
export interface Switch {
  readonly _tag: "Switch"
}
```

Added in v1.20.0

## Unbounded

Singleton instance of Unbounded

**Signature**

```ts
export declare const Unbounded: Unbounded
```

Added in v1.20.0

## Unbounded (interface)

Strategy which will allow for an unbounded number of concurrent effects to be run.

**Signature**

```ts
export interface Unbounded {
  readonly _tag: "Unbounded"
}
```

Added in v1.20.0

# MergeStrategy

## MergeStrategy (type alias)

MergeStrategy is a representation of how multiple Fx should be merged together.

**Signature**

```ts
export type MergeStrategy = Unordered | Ordered | Switch
```

Added in v1.20.0

## Ordered

Construct an Ordered strategy

**Signature**

```ts
export declare const Ordered: (concurrency: number) => Ordered
```

Added in v1.20.0

## Ordered (interface)

Strategy which will merge Fx in an ordered fashion with
the specified level of concurrency.

**Signature**

```ts
export interface Ordered {
  readonly _tag: "Ordered"
  readonly concurrency: number
}
```

Added in v1.20.0

## Unordered

Construct an Unordered strategy

**Signature**

```ts
export declare const Unordered: (concurrency: number) => Unordered
```

Added in v1.20.0

## Unordered (interface)

Strategy which will merge Fx in an unordered fashion.

**Signature**

```ts
export interface Unordered {
  readonly _tag: "Unordered"
  readonly concurrency: number
}
```

Added in v1.20.0

# combinators

## matchTags

Match over a tagged union of values into a set of persistent workflows
that allow listening to changes of values with the same tag using the same
Fx.

**Signature**

```ts
export declare const matchTags: {
  <A extends { readonly _tag: string }, Matchers extends DefaultMatchersFrom<A>>(
    matchers: Matchers
  ): <R, E>(
    fx: Fx<R, E, A>
  ) => Fx<
    R | Fx.Context<ReturnType<Matchers[keyof Matchers]>>,
    E | Fx.Error<ReturnType<Matchers[keyof Matchers]>>,
    Fx.Success<ReturnType<Matchers[keyof Matchers]>>
  >
  <R, E, A extends { readonly _tag: string }, Matchers extends DefaultMatchersFrom<A>>(
    fx: Fx<R, E, A>,
    matchers: Matchers
  ): Fx<
    R | Fx.Context<ReturnType<Matchers[keyof Matchers]>>,
    E | Fx.Error<ReturnType<Matchers[keyof Matchers]>>,
    Fx.Success<ReturnType<Matchers[keyof Matchers]>>
  >
}
```

Added in v1.20.0

# models

## FxFork (type alias)

Type-alias for Effect.forkIn(scope) which runs the Effect runtime
of an Fx in a Scope. Used in for higher-order operators.

**Signature**

```ts
export type FxFork = <R>(effect: Effect.Effect<R, never, void>) => Effect.Effect<R, never, void>
```

Added in v1.20.0

## ScopedFork (type alias)

Type-alias for a Effect.forkIn(scope) that returns a Fiber

**Signature**

```ts
export type ScopedFork = <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<R, never, Fiber.Fiber<E, A>>
```

Added in v1.20.0

# utils

## Context (type alias)

**Signature**

```ts
export type Context<T> = Fx.Context<T>
```

Added in v1.20.0

## DefaultMatchersFrom (type alias)

**Signature**

```ts
export type DefaultMatchersFrom<A extends { readonly _tag: string }> = {
  readonly [Tag in A["_tag"]]: (
    value: RefSubject<never, never, Extract<A, { readonly _tag: Tag }>>
  ) => Fx<any, any, any>
}
```

Added in v1.20.0

## Error (type alias)

**Signature**

```ts
export type Error<T> = Fx.Error<T>
```

Added in v1.20.0

## Fx (interface)

Fx is a push-based reactive primitive built atop of Effect.

**Signature**

```ts
export interface Fx<out R, out E, out A> extends Pipeable.Pipeable {
  readonly [TypeId]: Fx.Variance<R, E, A>

  /**
   * @since 1.20.0
   */
  run<R2 = never>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, unknown>
}
```

Added in v1.20.0

## Fx (namespace)

Added in v1.20.0

### Variance (interface)

**Signature**

```ts
export interface Variance<R, E, A> {
  readonly _R: Types.Covariant<R>
  readonly _E: Types.Covariant<E>
  readonly _A: Types.Covariant<A>
}
```

Added in v1.20.0

### Context (type alias)

**Signature**

```ts
export type Context<T> = T extends Fx<infer R, infer _E, infer _A> ? R : never
```

Added in v1.20.0

### Error (type alias)

**Signature**

```ts
export type Error<T> = T extends Fx<infer _R, infer E, infer _A> ? E : never
```

Added in v1.20.0

### Success (type alias)

**Signature**

```ts
export type Success<T> = T extends Fx<infer _R, infer _E, infer A> ? A : never
```

Added in v1.20.0

### Unify (type alias)

**Signature**

```ts
export type Unify<T> = T extends Fx<infer R, infer E, infer A> | infer _ ? Fx<R, E, A> : never
```

Added in v1.20.0

## FxEffectBase (class)

**Signature**

```ts
export declare class FxEffectBase<R, E, A, R2, E2, B>
```

Added in v1.20.0

### run (method)

**Signature**

```ts
run<R3>(sink: Sink.Sink<R3, E, A>): Effect.Effect<R | R3, never, void>
```

Added in v1.20.0

### toFx (method)

**Signature**

```ts
abstract toFx(): Fx<R, E, A>
```

Added in v1.20.0

### toEffect (method)

**Signature**

```ts
abstract toEffect(): Effect.Effect<R2, E2, B>
```

Added in v1.20.0

## KeyedOptions (interface)

**Signature**

```ts
export interface KeyedOptions<A, B, R2, E2, C> {
  readonly getKey: (a: A) => B
  readonly onValue: (ref: RefSubject<never, never, A>, key: B) => Fx<R2, E2, C>
  readonly debounce?: Duration.DurationInput
}
```

Added in v1.20.0

## MatchCauseOptions (type alias)

**Signature**

```ts
export type MatchCauseOptions<E, A, R2, E2, B, R3, E3, C> = {
  readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
  readonly onSuccess: (a: A) => Fx<R3, E3, C>
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
}
```

Added in v1.20.0

## MatchErrorOptions (type alias)

**Signature**

```ts
export type MatchErrorOptions<E, A, R2, E2, B, R3, E3, C> = {
  readonly onFailure: (e: E) => Fx<R2, E2, B>
  readonly onSuccess: (a: A) => Fx<R3, E3, C>
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
}
```

Added in v1.20.0

## Success (type alias)

**Signature**

```ts
export type Success<T> = Fx.Success<T>
```

Added in v1.20.0

## Unify (type alias)

**Signature**

```ts
export type Unify<T> = Fx.Unify<T>
```

Added in v1.20.0

## WithKeyOptions (interface)

**Signature**

```ts
export interface WithKeyOptions<A, B, R2, E2, C> {
  readonly getKey: (a: A) => B
  readonly onValue: (ref: RefSubject<never, never, A>, key: B) => Fx<R2, E2, C>
}
```

Added in v1.20.0

## acquireUseRelease

**Signature**

```ts
export declare const acquireUseRelease: {
  <A, R2, E2, B, R3, E3, C>(
    use: (a: A) => Fx<R2, E2, B>,
    release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R3, E3, C>
  ): <R, E>(acquire: Effect.Effect<R, E, A>) => Fx<R2 | R3 | R, E2 | E3 | E, B>
  <R, E, A, R2, E2, B, R3, E3, C>(
    acquire: Effect.Effect<R, E, A>,
    use: (a: A) => Fx<R2, E2, B>,
    release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R3, E3, C>
  ): Fx<R | R2 | R3, E | E2 | E3, B>
}
```

Added in v1.20.0

## all

**Signature**

```ts
export declare const all: {
  <const FX extends readonly Fx<any, any, any>[]>(
    fx: FX
  ): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, { readonly [K in keyof FX]: Fx.Success<FX[K]> }>
  <const FX extends Readonly<Record<string, Fx<any, any, any>>>>(
    fx: FX
  ): Fx<Fx.Context<FX[string]>, Fx.Error<FX[string]>, { readonly [K in keyof FX]: Fx.Success<FX[K]> }>
}
```

Added in v1.20.0

## annotateLogs

**Signature**

```ts
export declare const annotateLogs: {
  (key: string | Record<string, unknown>, value?: unknown): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, key: string | Record<string, unknown>, value?: unknown): Fx<R, E, A>
}
```

Added in v1.20.0

## annotateSpans

**Signature**

```ts
export declare const annotateSpans: {
  (key: string | Record<string, unknown>, value?: unknown): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, key: string | Record<string, unknown>, value?: unknown): Fx<R, E, A>
}
```

Added in v1.20.0

## append

**Signature**

```ts
export declare const append: {
  <C>(end: C): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, C | A>
  <R, E, A, C>(fx: Fx<R, E, A>, end: C): Fx<R, E, A | C>
}
```

Added in v1.20.0

## appendAll

**Signature**

```ts
export declare const appendAll: {
  <C>(end: Iterable<C>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, C | A>
  <R, E, A, C>(fx: Fx<R, E, A>, end: Iterable<C>): Fx<R, E, A | C>
}
```

Added in v1.20.0

## at

**Signature**

```ts
export declare const at: {
  (duration: Duration.DurationInput): <A>(value: A) => Fx<never, never, A>
  <A>(value: A, duration: Duration.DurationInput): Fx<never, never, A>
}
```

Added in v1.20.0

## compact

**Signature**

```ts
export declare const compact: <R, E, A>(fx: Fx<R, E, Option.Option<A>>) => Fx<R, E, A>
```

Added in v1.20.0

## concatMap

**Signature**

```ts
export declare const concatMap: {
  <A, R2, E2, B>(
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E | E2, B>
}
```

Added in v1.20.0

## continueWith

**Signature**

```ts
export declare const continueWith: {
  <R2, E2, B>(f: () => Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, B | A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
}
```

Added in v1.20.0

## debounce

**Signature**

```ts
export declare const debounce: {
  (delay: Duration.DurationInput): <R, E, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: Duration.DurationInput): Fx<Scope.Scope | R, E, A>
}
```

Added in v1.20.0

## delay

Create an Fx which will wait a specified duration of time where no
events have occurred before emitting a value.

**Signature**

```ts
export declare const delay: {
  (delay: DurationInput): <R, E, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: DurationInput): Fx<Scope.Scope | R, E, A>
}
```

Added in v1.18.0

## die

**Signature**

```ts
export declare const die: (error: unknown) => Fx<never, never, never>
```

Added in v1.20.0

## drain

**Signature**

```ts
export declare const drain: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, void>
```

Added in v1.20.0

## drainLayer

**Signature**

```ts
export declare function drainLayer<FXS extends ReadonlyArray<Fx<any, never, any>>>(
  ...fxs: FXS
): Layer.Layer<Exclude<Fx.Context<FXS[number]>, Scope.Scope>, never, never>
```

Added in v1.20.0

## drop

**Signature**

```ts
export declare const drop: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
}
```

Added in v1.20.0

## dropAfter

**Signature**

```ts
export declare const dropAfter: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, Exclude<A, B>>
  <A>(f: Predicate.Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, f: Predicate.Refinement<A, B>): Fx<R, E, Exclude<A, B>>
  <R, E, A>(fx: Fx<R, E, A>, f: Predicate.Predicate<A>): Fx<R, E, A>
}
```

Added in v1.20.0

## dropAfterEffect

**Signature**

```ts
export declare const dropAfterEffect: {
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
}
```

Added in v1.20.0

## dropUntil

**Signature**

```ts
export declare const dropUntil: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A | B>
  <A>(f: Predicate.Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, f: Predicate.Refinement<A, B>): Fx<R, E, A | B>
  <R, E, A>(fx: Fx<R, E, A>, f: Predicate.Predicate<A>): Fx<R, E, A>
}
```

Added in v1.20.0

## dropUntilEffect

**Signature**

```ts
export declare const dropUntilEffect: {
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
}
```

Added in v1.20.0

## dropWhile

**Signature**

```ts
export declare const dropWhile: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, Exclude<A, B>>
  <A>(f: Predicate.Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, f: Predicate.Refinement<A, B>): Fx<R, E, Exclude<A, B>>
  <R, E, A>(fx: Fx<R, E, A>, f: Predicate.Predicate<A>): Fx<R, E, A>
}
```

Added in v1.20.0

## dropWhileEffect

**Signature**

```ts
export declare const dropWhileEffect: {
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
}
```

Added in v1.20.0

## during

**Signature**

```ts
export declare const during: {
  <R2, E2, A, R3, E3, B>(
    window: Fx<R2, E2, Fx<R3, E3, B>>
  ): <R, E>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R3 | R, E2 | E3 | E, A>
  <R, E, A, R2, E2, R3, E3, B>(
    fx: Fx<R, E, A>,
    window: Fx<R2, E2, Fx<R3, E3, B>>
  ): Fx<Scope.Scope | R | R2 | R3, E | E2 | E3, A>
}
```

Added in v1.20.0

## either

**Signature**

```ts
export declare const either: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, never, Either.Either<E, A>>
```

Added in v1.20.0

## empty

**Signature**

```ts
export declare const empty: Fx<never, never, never>
```

Added in v1.20.0

## ensuring

**Signature**

```ts
export declare const ensuring: {
  <R2>(finalizer: Effect.Effect<R2, never, unknown>): <R, E, A>(self: Fx<R, E, A>) => Fx<R2 | R, E, A>
  <R, E, A, R2>(self: Fx<R, E, A>, finalizer: Effect.Effect<R2, never, unknown>): Fx<R | R2, E, A>
}
```

Added in v1.20.0

## exhaustMap

**Signature**

```ts
export declare const exhaustMap: {
  <A, R2, E2, B>(
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E | E2, B>
}
```

Added in v1.20.0

## exhaustMapCause

**Signature**

```ts
export declare const exhaustMapCause: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E2, A | B>
}
```

Added in v1.20.0

## exhaustMapEffect

**Signature**

```ts
export declare const exhaustMapEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E | E2, B>
}
```

Added in v1.20.0

## exhaustMapError

**Signature**

```ts
export declare const exhaustMapError: {
  <E, R2, E2, B>(
    f: (e: E) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: E) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E2, A | B>
}
```

Added in v1.20.0

## exhaustMapLatest

**Signature**

```ts
export declare const exhaustMapLatest: {
  <A, R2, E2, B>(
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E | E2, B>
}
```

Added in v1.20.0

## exhaustMapLatestCause

**Signature**

```ts
export declare const exhaustMapLatestCause: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E2, A | B>
}
```

Added in v1.20.0

## exhaustMapLatestEffect

**Signature**

```ts
export declare const exhaustMapLatestEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E | E2, B>
}
```

Added in v1.20.0

## exhaustMapLatestError

**Signature**

```ts
export declare const exhaustMapLatestError: {
  <E, R2, E2, B>(
    f: (e: E) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: E) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E2, A | B>
}
```

Added in v1.20.0

## exhaustMatchCause

**Signature**

```ts
export declare const exhaustMatchCause: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
}
```

Added in v1.20.0

## exhaustMatchError

**Signature**

```ts
export declare const exhaustMatchError: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    opts: core.MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
}
```

Added in v1.20.0

## exhaustMatchLatestCause

**Signature**

```ts
export declare const exhaustMatchLatestCause: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
}
```

Added in v1.20.0

## exhaustMatchLatestError

**Signature**

```ts
export declare const exhaustMatchLatestError: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    opts: core.MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
}
```

Added in v1.20.0

## exit

**Signature**

```ts
export declare const exit: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, never, Exit.Exit<E, A>>
```

Added in v1.20.0

## fail

**Signature**

```ts
export declare const fail: <E>(error: E) => Fx<never, E, never>
```

Added in v1.20.0

## failCause

**Signature**

```ts
export declare const failCause: <E>(cause: Cause.Cause<E>) => Fx<never, E, never>
```

Added in v1.20.0

## filter

**Signature**

```ts
export declare const filter: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <A>(f: Predicate.Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, f: Predicate.Refinement<A, B>): Fx<R, E, B>
  <R, E, A>(fx: Fx<R, E, A>, f: Predicate.Predicate<A>): Fx<R, E, A>
}
```

Added in v1.20.0

## filterCause

**Signature**

```ts
export declare const filterCause: {
  <E>(f: (cause: Cause.Cause<E>) => boolean): <R, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => boolean): Fx<R, E, A>
}
```

Added in v1.20.0

## filterCauseEffect

**Signature**

```ts
export declare const filterCauseEffect: {
  <E, R2, E2>(
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, boolean>
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E2, A>
}
```

Added in v1.20.0

## filterEffect

**Signature**

```ts
export declare const filterEffect: {
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
}
```

Added in v1.20.0

## filterError

**Signature**

```ts
export declare const filterError: {
  <E>(f: (e: E) => boolean): <R, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, f: (e: E) => boolean): Fx<R, E, A>
}
```

Added in v1.20.0

## filterErrorEffect

**Signature**

```ts
export declare const filterErrorEffect: {
  <E, R2, E2>(f: (e: E) => Effect.Effect<R2, E2, boolean>): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (e: E) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E2, A>
}
```

Added in v1.20.0

## filterMap

**Signature**

```ts
export declare const filterMap: {
  <A, B>(f: (a: A) => Option.Option<B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => Option.Option<B>): Fx<R, E, B>
}
```

Added in v1.20.0

## filterMapCause

**Signature**

```ts
export declare const filterMapCause: {
  <E, E2>(f: (cause: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>): Fx<R, E2, A>
}
```

Added in v1.20.0

## filterMapCauseEffect

**Signature**

```ts
export declare const filterMapCauseEffect: {
  <R2, E2, E3>(
    f: (cause: Cause.Cause<E2>) => Effect.Effect<R2, E2, Option.Option<Cause.Cause<E3>>>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E3, A>
  <R, E, A, R2, E2, E3>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, Option.Option<Cause.Cause<E3>>>
  ): Fx<R | R2, E2 | E3, A>
}
```

Added in v1.20.0

## filterMapEffect

**Signature**

```ts
export declare const filterMapEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>): Fx<R | R2, E | E2, B>
}
```

Added in v1.20.0

## filterMapError

**Signature**

```ts
export declare const filterMapError: {
  <E, E2>(f: (e: E) => Option.Option<E2>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (e: E) => Option.Option<E2>): Fx<R, E2, A>
}
```

Added in v1.20.0

## filterMapErrorEffect

**Signature**

```ts
export declare const filterMapErrorEffect: {
  <E, R2, E2, E3>(
    f: (e: E) => Effect.Effect<R2, E2, Option.Option<E3>>
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E3, A>
  <R, E, A, R2, E2, E3>(fx: Fx<R, E, A>, f: (e: E) => Effect.Effect<R2, E2, Option.Option<E3>>): Fx<R | R2, E2 | E3, A>
}
```

Added in v1.20.0

## filterMapLoop

**Signature**

```ts
export declare const filterMapLoop: {
  <B, A, C>(seed: B, f: (acc: B, a: A) => readonly [Option.Option<C>, B]): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, C>
  <R, E, A, B, C>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => readonly [Option.Option<C>, B]): Fx<R, E, C>
}
```

Added in v1.20.0

## filterMapLoopCause

**Signature**

```ts
export declare const filterMapLoopCause: {
  <B, E, R2, E2, C>(
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<R2, E2, readonly [Option.Option<Cause.Cause<C>>, B]>
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | C, A>
  <R, E, A, B, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => readonly [Option.Option<Cause.Cause<C>>, B]
  ): Fx<R, C, A>
}
```

Added in v1.20.0

## filterMapLoopCauseEffect

**Signature**

```ts
export declare const filterMapLoopCauseEffect: {
  <B, E, R2, E2, C>(
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<R2, E2, readonly [Option.Option<Cause.Cause<C>>, B]>
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | C, A>
  <R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<R2, E2, readonly [Option.Option<Cause.Cause<C>>, B]>
  ): Fx<R | R2, E2 | C, A>
}
```

Added in v1.20.0

## filterMapLoopEffect

**Signature**

```ts
export declare const filterMapLoopEffect: {
  <R2, E2, B, A, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [Option.Option<C>, B]>
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, C>
  <R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [Option.Option<C>, B]>
  ): Fx<R | R2, E | E2, C>
}
```

Added in v1.20.0

## filterMapLoopError

**Signature**

```ts
export declare const filterMapLoopError: {
  <B, E, R2, E2, C>(
    seed: B,
    f: (b: B, e: E) => Effect.Effect<R2, E2, readonly [Option.Option<C>, B]>
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | C, A>
  <R, E, A, B, C>(fx: Fx<R, E, A>, seed: B, f: (b: B, e: E) => readonly [Option.Option<C>, B]): Fx<R, C, A>
}
```

Added in v1.20.0

## filterMapLoopErrorEffect

**Signature**

```ts
export declare const filterMapLoopErrorEffect: {
  <B, E, R2, E2, C>(
    seed: B,
    f: (b: B, e: E) => Effect.Effect<R2, E2, readonly [Option.Option<C>, B]>
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | C, A>
  <R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (b: B, e: E) => Effect.Effect<R2, E2, readonly [Option.Option<C>, B]>
  ): Fx<R | R2, E2 | C, A>
}
```

Added in v1.20.0

## findFirst

**Signature**

```ts
export declare const findFirst: {
  <A, B extends A>(refinement: Predicate.Refinement<A, B>): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R, E, B>
  <A>(predicate: Predicate.Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, refinement: Predicate.Refinement<A, B>): Effect.Effect<R, E, B>
  <R, E, A>(fx: Fx<R, E, A>, predicate: Predicate.Predicate<A>): Effect.Effect<R, E, A>
}
```

Added in v1.20.0

## first

**Signature**

```ts
export declare const first: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, A>
```

Added in v1.20.0

## flatMap

**Signature**

```ts
export declare const flatMap: {
  <A, R2, E2, B>(
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E | E2, B>
}
```

Added in v1.20.0

## flatMapCause

**Signature**

```ts
export declare const flatMapCause: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E2, A | B>
}
```

Added in v1.20.0

## flatMapCauseConcurrently

**Signature**

```ts
export declare const flatMapCauseConcurrently: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    concurrency: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    concurrency: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E2, A | B>
}
```

Added in v1.20.0

## flatMapCauseWithStrategy

**Signature**

```ts
export declare const flatMapCauseWithStrategy: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    flattenStrategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): <R, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    flattenStrategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): Fx<Scope.Scope | R | R2, E2, A | B>
}
```

Added in v1.20.0

## flatMapConcurrently

**Signature**

```ts
export declare const flatMapConcurrently: {
  <A, R2, E2, B>(
    f: (a: A) => Fx<R2, E2, B>,
    capacity: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    capacity: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E | E2, B>
}
```

Added in v1.20.0

## flatMapConcurrentlyEffect

**Signature**

```ts
export declare const flatMapConcurrentlyEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
    capacity: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
    capacity: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E | E2, B>
}
```

Added in v1.20.0

## flatMapEffect

**Signature**

```ts
export declare const flatMapEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E | E2, B>
}
```

Added in v1.20.0

## flatMapError

**Signature**

```ts
export declare const flatMapError: {
  <E, R2, E2, B>(
    f: (e: E) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: E) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E2, A | B>
}
```

Added in v1.20.0

## flatMapErrorConcurrently

**Signature**

```ts
export declare const flatMapErrorConcurrently: {
  <E, R2, E2, B>(
    f: (e: E) => Fx<R2, E2, B>,
    concurrency: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: E) => Fx<R2, E2, B>,
    concurrency: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E2, A | B>
}
```

Added in v1.20.0

## flatMapErrorWithStrategy

**Signature**

```ts
export declare const flatMapErrorWithStrategy: {
  <E, R2, E2, B>(
    f: (e: E) => Fx<R2, E2, B>,
    flattenStrategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): <R, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: E) => Fx<R2, E2, B>,
    flattenStrategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): Fx<Scope.Scope | R | R2, E2, A | B>
}
```

Added in v1.20.0

## flatMapWithStrategy

**Signature**

```ts
export declare const flatMapWithStrategy: {
  <A, R2, E2, B>(
    f: (a: A) => Fx<R2, E2, B>,
    strategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): <R, E>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    strategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): Fx<Scope.Scope | R | R2, E | E2, B>
}
```

Added in v1.20.0

## flip

**Signature**

```ts
export declare const flip: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, A, E>
```

Added in v1.20.0

## fork

**Signature**

```ts
export declare const fork: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, never, Fiber.RuntimeFiber<E, void>>
```

Added in v1.20.0

## forkDaemon

**Signature**

```ts
export declare const forkDaemon: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, never, Fiber.RuntimeFiber<E, void>>
```

Added in v1.20.0

## forkIn

**Signature**

```ts
export declare const forkIn: {
  (scope: Scope.Scope): <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, never, Fiber.RuntimeFiber<E, void>>
  <R, E, A>(fx: Fx<R, E, A>, scope: Scope.Scope): Effect.Effect<R, never, Fiber.RuntimeFiber<E, void>>
}
```

Added in v1.20.0

## forkScoped

**Signature**

```ts
export declare const forkScoped: <R, E, A>(
  fx: Fx<R, E, A>
) => Effect.Effect<Scope.Scope | R, never, Fiber.RuntimeFiber<E, void>>
```

Added in v1.20.0

## fromArray

**Signature**

```ts
export declare const fromArray: <const A extends readonly any[]>(array: A) => Fx<never, never, A[number]>
```

Added in v1.20.0

## fromAsyncIterable

**Signature**

```ts
export declare const fromAsyncIterable: <A>(iterable: AsyncIterable<A>) => Fx<never, never, A>
```

Added in v1.20.0

## fromDequeue

**Signature**

```ts
export declare function fromDequeue<A>(dequeue: Queue.Dequeue<A>): Fx<never, never, A>
export declare function fromDequeue<I, A>(dequeue: Ctx.Dequeue<I, A>): Fx<I, never, A>
```

Added in v1.20.0

## fromEffect

**Signature**

```ts
export declare const fromEffect: <R, E, A>(effect: Effect.Effect<R, E, A>) => Fx<R, E, A>
```

Added in v1.20.0

## fromFxEffect

**Signature**

```ts
export declare const fromFxEffect: <R, E, R2, E2, B>(
  effect: Effect.Effect<R, E, Fx<R2, E2, B>>
) => Fx<R | R2, E | E2, B>
```

Added in v1.20.0

## fromIterable

**Signature**

```ts
export declare const fromIterable: <A>(iterable: Iterable<A>) => Fx<never, never, A>
```

Added in v1.20.0

## fromNullable

**Signature**

```ts
export declare const fromNullable: <A>(value: void | A | null | undefined) => Fx<never, never, NonNullable<A>>
```

Added in v1.20.0

## fromPubSub

**Signature**

```ts
export declare function fromPubSub<A>(pubSub: PubSub.PubSub<A>): Fx<Scope.Scope, never, A>
export declare function fromPubSub<I, A>(pubSub: Ctx.PubSub<I, A>): Fx<I | Scope.Scope, never, A>
```

Added in v1.20.0

## fromScheduled

**Signature**

```ts
export declare const fromScheduled: {
  <R2, I, O>(schedule: Schedule.Schedule<R2, I, O>): <R, E>(input: Effect.Effect<R, E, I>) => Fx<R2 | R, E, O>
  <R, E, I, R2, O>(input: Effect.Effect<R, E, I>, schedule: Schedule.Schedule<R2, I, O>): Fx<R | R2, E, O>
}
```

Added in v1.20.0

## gen

**Signature**

```ts
export declare const gen: <Y extends Effect.EffectGen<any, any, any>, FX extends Fx<any, any, any>>(
  f: (_: Effect.Adapter) => Generator<Y, FX, any>
) => Fx<
  Effect.Effect.Context<Y["value"]> | Fx.Context<FX>,
  Effect.Effect.Error<Y["value"]> | Fx.Error<FX>,
  Fx.Success<FX>
>
```

Added in v1.20.0

## genScoped

**Signature**

```ts
export declare const genScoped: <Y extends Effect.EffectGen<any, any, any>, FX extends Fx<any, any, any>>(
  f: (_: Effect.Adapter) => Generator<Y, FX, any>
) => Fx<
  Exclude<Effect.Effect.Context<Y["value"]>, Scope.Scope> | Exclude<Fx.Context<FX>, Scope.Scope>,
  Effect.Effect.Error<Y["value"]> | Fx.Error<FX>,
  Fx.Success<FX>
>
```

Added in v1.20.0

## getOrElse

**Signature**

```ts
export declare const getOrElse: {
  <A, R2 = never, E2 = never, B = never>(
    orElse: () => Fx<R2, E2, B>
  ): <R, E>(fx: Fx<R, E, Option.Option<A>>) => Fx<Scope.Scope | R2 | R, E2 | E, A | B>
  <R, E, A, R2 = never, E2 = never, B = never>(
    fx: Fx<R, E, Option.Option<A>>,
    orElse: () => Fx<R2, E2, B>
  ): Fx<Scope.Scope | R | R2, E | E2, A | B>
}
```

Added in v1.20.0

## hold

**Signature**

```ts
export declare const hold: <R, E, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R, E, A>
```

Added in v1.20.0

## if

**Signature**

```ts
export declare const if: { <R2, E2, B, R3, E3, C>(options: { readonly onTrue: Fx<R2, E2, B>; readonly onFalse: Fx<R3, E3, C>; }): <R, E>(bool: Fx<R, E, boolean>) => Fx<Scope.Scope | R2 | R3 | R, E2 | E3 | E, B | C>; <R, E, R2, E2, B, R3, E3, C>(bool: Fx<R, E, boolean>, options: { readonly onTrue: Fx<R2, E2, B>; readonly onFalse: Fx<R3, E3, C>; }): Fx<Scope.Scope | R | R2 | R3, E | E2 | E3, B | C>; }
```

Added in v1.20.0

## interruptible

**Signature**

```ts
export declare const interruptible: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
```

Added in v1.20.0

## isFx

**Signature**

```ts
export declare function isFx<R, E, A>(u: unknown): u is Fx<R, E, A>
```

Added in v1.20.0

## keyed

**Signature**

```ts
export declare const keyed: {
  <A, B extends PropertyKey, R2, E2, C>(
    options: KeyedOptions<A, B, R2, E2, C>
  ): <R, E>(fx: Fx<R, E, readonly A[]>) => Fx<R2 | R, E2 | E, readonly C[]>
  <R, E, A, B extends PropertyKey, R2, E2, C>(
    fx: Fx<R, E, readonly A[]>,
    options: KeyedOptions<A, B, R2, E2, C>
  ): Fx<R | R2, E | E2, readonly C[]>
}
```

Added in v1.20.0

## locally

**Signature**

```ts
export declare const locally: {
  <A>(self: FiberRef.FiberRef<A>, value: A): <R, E, B>(fx: Fx<R, E, B>) => Fx<R, E, B>
  <R, E, B, A>(use: Fx<R, E, B>, self: FiberRef.FiberRef<A>, value: A): Fx<R, E, B>
}
```

Added in v1.20.0

## locallyWith

**Signature**

```ts
export declare const locallyWith: {
  <A>(self: FiberRef.FiberRef<A>, f: (a: A) => A): <R, E, B>(fx: Fx<R, E, B>) => Fx<R, E, B>
  <R, E, B, A>(use: Fx<R, E, B>, self: FiberRef.FiberRef<A>, f: (a: A) => A): Fx<R, E, B>
}
```

Added in v1.20.0

## loop

**Signature**

```ts
export declare const loop: {
  <B, A, C>(seed: B, f: (acc: B, a: A) => readonly [C, B]): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, C>
  <R, E, A, B, C>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => readonly [C, B]): Fx<R, E, C>
}
```

Added in v1.20.0

## loopCause

**Signature**

```ts
export declare const loopCause: {
  <B, E, C>(
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => readonly [Cause.Cause<C>, B]
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R, C, A>
  <R, E, A, B, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => readonly [Cause.Cause<C>, B]
  ): Fx<R, C, A>
}
```

Added in v1.20.0

## loopCauseEffect

**Signature**

```ts
export declare const loopCauseEffect: {
  <B, E, R2, E2, C>(
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<R2, E2, readonly [Cause.Cause<C>, B]>
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | C, A>
  <R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<R2, E2, readonly [Cause.Cause<C>, B]>
  ): Fx<R | R2, E2 | C, A>
}
```

Added in v1.20.0

## loopEffect

**Signature**

```ts
export declare const loopEffect: {
  <R2, E2, B, A, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, C>
  <R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>
  ): Fx<R | R2, E | E2, C>
}
```

Added in v1.20.0

## loopError

**Signature**

```ts
export declare const loopError: {
  <B, E, C>(seed: B, f: (b: B, e: E) => readonly [C, B]): <R, A>(fx: Fx<R, E, A>) => Fx<R, C, A>
  <R, E, A, B, C>(fx: Fx<R, E, A>, seed: B, f: (b: B, e: E) => readonly [C, B]): Fx<R, C, A>
}
```

Added in v1.20.0

## loopErrorEffect

**Signature**

```ts
export declare const loopErrorEffect: {
  <B, E, R2, E2, C>(
    seed: B,
    f: (b: B, e: E) => Effect.Effect<R2, E2, readonly [C, B]>
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | C, A>
  <R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (b: B, e: E) => Effect.Effect<R2, E2, readonly [C, B]>
  ): Fx<R | R2, E2 | C, A>
}
```

Added in v1.20.0

## make

**Signature**

```ts
export declare const make: {
  <R, E, A>(run: (sink: Sink.Sink<never, E, A>) => Effect.Effect<R, never, unknown>): Fx<R, E, A>
  <E, A>(run: (sink: Sink.Sink<never, E, A>) => Effect.Effect<never, never, unknown>): Fx<never, E, A>
  <A>(run: (sink: Sink.Sink<never, never, A>) => Effect.Effect<never, never, unknown>): Fx<never, never, A>
}
```

Added in v1.20.0

## map

**Signature**

```ts
export declare const map: {
  <A, B>(f: (a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B>
}
```

Added in v1.20.0

## mapBoth

**Signature**

```ts
export declare const mapBoth: {
  <E, E2, A, B>(f: (e: E) => E2, g: (a: A) => B): <R>(fx: Fx<R, E, A>) => Fx<R, E2, B>
  <R, E, A, B, C>(fx: Fx<R, E, A>, f: (e: E) => B, g: (a: A) => C): Fx<R, B, C>
}
```

Added in v1.20.0

## mapCause

**Signature**

```ts
export declare const mapCause: {
  <E, E2>(f: (cause: Cause.Cause<E>) => Cause.Cause<E2>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Cause.Cause<E2>): Fx<R, E2, A>
}
```

Added in v1.20.0

## mapCauseEffect

**Signature**

```ts
export declare const mapCauseEffect: {
  <R2, E2, E3>(
    f: (cause: Cause.Cause<E2>) => Effect.Effect<R2, E3, Cause.Cause<E3>>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E3, A>
  <R, E, A, R2, E2, E3>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, Cause.Cause<E3>>
  ): Fx<R | R2, E2 | E3, A>
}
```

Added in v1.20.0

## mapEffect

**Signature**

```ts
export declare const mapEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, B>
}
```

Added in v1.20.0

## mapError

**Signature**

```ts
export declare const mapError: {
  <E, E2>(f: (e: E) => E2): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (e: E) => E2): Fx<R, E2, A>
}
```

Added in v1.20.0

## mapErrorEffect

**Signature**

```ts
export declare const mapErrorEffect: {
  <R2, E2, E3>(f: (e: E2) => Effect.Effect<R2, E3, E3>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E3, A>
  <R, E, A, R2, E2, E3>(fx: Fx<R, E, A>, f: (e: E) => Effect.Effect<R2, E2, E3>): Fx<R | R2, E2 | E3, A>
}
```

Added in v1.20.0

## matchCause

**Signature**

```ts
export declare const matchCause: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
}
```

Added in v1.20.0

## matchCauseConcurrently

**Signature**

```ts
export declare const matchCauseConcurrently: {
  <E, A, R2, E2, B, R3, E3, C>(
    concurrency: number,
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    concurrency: number,
    opts: core.MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
}
```

Added in v1.20.0

## matchCauseWithStrategy

**Signature**

```ts
export declare const matchCauseWithStrategy: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    flattenStrategy: FlattenStrategy,
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
}
```

Added in v1.20.0

## matchEither

**Signature**

```ts
export declare const matchEither: {
  <E1, A, R2 = never, E2 = never, B = never, R3 = never, E3 = never, C = never>(
    onLeft: (e: RefSubject<never, never, E1>) => Fx<R2, E2, B>,
    onRight: (a: RefSubject<never, never, A>) => Fx<R3, E3, C>
  ): <R, E>(fx: Fx<R, E, Either.Either<E1, A>>) => Fx<Scope.Scope | R2 | R3 | R, E2 | E3 | E, B | C>
  <R, E, E1, A, R2 = never, E2 = never, B = never, R3 = never, E3 = never, C = never>(
    fx: Fx<R, E, Either.Either<E1, A>>,
    onLeft: (e: RefSubject<never, never, E1>) => Fx<R2, E2, B>,
    onRight: (a: RefSubject<never, never, A>) => Fx<R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E | E2 | E3, B | C>
}
```

Added in v1.20.0

## matchError

**Signature**

```ts
export declare const matchError: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    opts: core.MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
}
```

Added in v1.20.0

## matchErrorConcurrently

**Signature**

```ts
export declare const matchErrorConcurrently: {
  <E, A, R2, E2, B, R3, E3, C>(
    concurrency: number,
    opts: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    concurrency: number,
    opts: core.MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
}
```

Added in v1.20.0

## matchErrorWithStrategy

**Signature**

```ts
export declare const matchErrorWithStrategy: {
  <E, A, R2, E2, B, R3, E3, C>({
    executionStrategy,
    onFailure,
    onSuccess
  }: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>): <R>(
    fx: Fx<R, E, A>
  ) => Fx<Scope.Scope | R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    flattenStrategy: FlattenStrategy,
    { executionStrategy, onFailure, onSuccess }: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
}
```

Added in v1.20.0

## matchOption

**Signature**

```ts
export declare const matchOption: {
  <A, R2 = never, E2 = never, B = never, R3 = never, E3 = never, C = never>(
    onNone: () => Fx<R2, E2, B>,
    onSome: (a: RefSubject<never, never, A>) => Fx<R3, E3, C>
  ): <R, E>(fx: Fx<R, E, Option.Option<A>>) => Fx<Scope.Scope | R2 | R3 | R, E2 | E3 | E, B | C>
  <R, E, A, R2 = never, E2 = never, B = never, R3 = never, E3 = never, C = never>(
    fx: Fx<R, E, Option.Option<A>>,
    onNone: () => Fx<R2, E2, B>,
    onSome: (a: RefSubject<never, never, A>) => Fx<R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E | E2 | E3, B | C>
}
```

Added in v1.20.0

## merge

**Signature**

```ts
export declare const merge: {
  <R2, E2, B>(other: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, B | A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, other: Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
}
```

Added in v1.20.0

## mergeAll

**Signature**

```ts
export declare const mergeAll: <FX extends readonly Fx<any, any, any>[]>(
  fx: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
```

Added in v1.20.0

## mergeFirst

**Signature**

```ts
export declare const mergeFirst: {
  <R2, E2, B>(that: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, B | A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, that: Fx<R2, E2, B>): Fx<R | R2, E | E2, A>
}
```

Added in v1.20.0

## mergeOrdered

**Signature**

```ts
export declare const mergeOrdered: <FX extends readonly Fx<any, any, any>[]>(
  fx: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
```

Added in v1.20.0

## mergeOrderedConcurrently

**Signature**

```ts
export declare const mergeOrderedConcurrently: <FX extends readonly Fx<any, any, any>[]>(
  fx: FX,
  concurrency: number
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
```

Added in v1.20.0

## mergeRace

**Signature**

```ts
export declare const mergeRace: {
  <R2, E2, B>(that: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, B | A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, that: Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
}
```

Added in v1.20.0

## mergeSwitch

**Signature**

```ts
export declare const mergeSwitch: <FX extends readonly Fx<any, any, any>[]>(
  fx: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
```

Added in v1.20.0

## mergeWithStrategy

**Signature**

```ts
export declare const mergeWithStrategy: {
  (
    strategy: MergeStrategy
  ): <FX extends readonly Fx<any, any, any>[]>(
    fx: FX
  ) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
  <const FX extends readonly Fx<any, any, any>[]>(
    fx: FX,
    stategy: MergeStrategy
  ): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
}
```

Added in v1.20.0

## middleware

**Signature**

```ts
export declare const middleware: {
  <R, R3, E, A>(
    effect: (effect: Effect.Effect<R, never, unknown>) => Effect.Effect<R3, never, unknown>,
    sink?: ((sink: Sink.Sink<never, E, A>) => Sink.Sink<R, E, A>) | undefined
  ): <E, A>(fx: Fx<R, E, A>) => Fx<R3, E, A>
  <R, E, A, R3>(
    fx: Fx<R, E, A>,
    effect: (effect: Effect.Effect<R, never, unknown>) => Effect.Effect<R3, never, unknown>,
    sink?: ((sink: Sink.Sink<never, E, A>) => Sink.Sink<R, E, A>) | undefined
  ): Fx<R3, E, A>
}
```

Added in v1.20.0

## multicast

**Signature**

```ts
export declare const multicast: <R, E, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R, E, A>
```

Added in v1.20.0

## never

**Signature**

```ts
export declare const never: Fx<never, never, never>
```

Added in v1.20.0

## observe

**Signature**

```ts
export declare const observe: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R2 | R, E2 | E, void>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Effect.Effect<R | R2, E | E2, void>
}
```

Added in v1.20.0

## onError

**Signature**

```ts
export declare const onError: {
  <R2>(f: (cause: Cause.Cause<never>) => Effect.Effect<R2, never, unknown>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<never>) => Effect.Effect<R2, never, unknown>): Fx<R | R2, E, A>
}
```

Added in v1.20.0

## onExit

**Signature**

```ts
export declare const onExit: {
  <R2>(
    f: (exit: Exit.Exit<never, unknown>) => Effect.Effect<R2, never, unknown>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2, E, A>
  <R, E, A, R2>(
    fx: Fx<R, E, A>,
    f: (exit: Exit.Exit<never, unknown>) => Effect.Effect<R2, never, unknown>
  ): Fx<R | R2, E, A>
}
```

Added in v1.20.0

## onInterrupt

**Signature**

```ts
export declare const onInterrupt: {
  <R2>(
    f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<R2, never, unknown>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2, E, A>
  <R, E, A, R2>(
    fx: Fx<R, E, A>,
    f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<R2, never, unknown>
  ): Fx<R | R2, E, A>
}
```

Added in v1.20.0

## orElse

**Signature**

```ts
export declare const orElse: {
  <E, R2, E2, B>(f: (error: E) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (error: E) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
}
```

Added in v1.20.0

## orElseCause

**Signature**

```ts
export declare const orElseCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
}
```

Added in v1.20.0

## padWith

**Signature**

```ts
export declare const padWith: {
  <B, C>(start: Iterable<B>, end: Iterable<C>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, B | C | A>
  <R, E, A, B, C>(fx: Fx<R, E, A>, start: Iterable<B>, end: Iterable<C>): Fx<R, E, A | B | C>
}
```

Added in v1.20.0

## partitionMap

**Signature**

```ts
export declare const partitionMap: {
  <A, B, C>(
    f: (a: A) => Either.Either<B, C>
  ): <R, E>(fx: Fx<R, E, A>) => readonly [Fx<Scope.Scope | R, E, B>, Fx<Scope.Scope | R, E, C>]
  <R, E, A, B, C>(
    fx: Fx<R, E, A>,
    f: (a: A) => Either.Either<B, C>
  ): readonly [Fx<Scope.Scope | R, E, B>, Fx<Scope.Scope | R, E, C>]
}
```

Added in v1.20.0

## periodic

**Signature**

```ts
export declare const periodic: {
  (period: Duration.DurationInput): <R, E, A>(iterator: Effect.Effect<R, E, A>) => Fx<R, E, A>
  <R, E, A>(iterator: Effect.Effect<R, E, A>, period: Duration.DurationInput): Fx<R, E, A>
}
```

Added in v1.20.0

## prepend

**Signature**

```ts
export declare const prepend: {
  <B>(start: B): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, B | A>
  <R, E, A, B>(fx: Fx<R, E, A>, start: B): Fx<R, E, A | B>
}
```

Added in v1.20.0

## prependAll

**Signature**

```ts
export declare const prependAll: {
  <B>(start: Iterable<B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, B | A>
  <R, E, A, B>(fx: Fx<R, E, A>, start: Iterable<B>): Fx<R, E, A | B>
}
```

Added in v1.20.0

## provide

**Signature**

```ts
export declare const provide: {
  <R2>(context: Ctx.Context<R2>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, R2>, E, A>
  <R2>(runtime: Runtime.Runtime<R2>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, R2>, E, A>
  <R2, E2, S>(layer: Layer.Layer<R2, E2, S>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | Exclude<R, S>, E2 | E, A>
  <R2 = never, E2 = never, S = never>(
    provide: Layer.Layer<R2, E2, S> | Ctx.Context<S> | Runtime.Runtime<S>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | Exclude<R, S>, E2 | E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, context: Ctx.Context<R2>): Fx<Exclude<R, R2>, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, runtime: Runtime.Runtime<R2>): Fx<Exclude<R, R2>, E, A>
  <R, E, A, R2, E2, S>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, S>): Fx<R2 | Exclude<R, S>, E | E2, A>
  <R, E, A, R2 = never, E2 = never, S = never>(
    fx: Fx<R, E, A>,
    provide: Layer.Layer<R2, E2, S> | Ctx.Context<S> | Runtime.Runtime<S>
  ): Fx<R2 | Exclude<R, S>, E | E2, A>
}
```

Added in v1.20.0

## provideContext

**Signature**

```ts
export declare const provideContext: {
  <R2>(context: Ctx.Context<R2>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, R2>, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, context: Ctx.Context<R2>): Fx<Exclude<R, R2>, E, A>
}
```

Added in v1.20.0

## provideLayer

**Signature**

```ts
export declare const provideLayer: {
  <R2, E2, S>(layer: Layer.Layer<R2, E2, S>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | Exclude<R, S>, E2 | E, A>
  <R, E, A, R2, E2, S>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, S>): Fx<R2 | Exclude<R, S>, E | E2, A>
}
```

Added in v1.20.0

## provideRuntime

**Signature**

```ts
export declare const provideRuntime: {
  <R2>(runtime: Runtime.Runtime<R2>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, R2>, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, runtime: Runtime.Runtime<R2>): Fx<Exclude<R, R2>, E, A>
}
```

Added in v1.20.0

## provideService

**Signature**

```ts
export declare const provideService: {
  <I, S>(service: Ctx.Tag<I, S>, instance: S): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, I>, E, A>
  <R, E, A, I, S>(fx: Fx<R, E, A>, service: Ctx.Tag<I, S>, instance: S): Fx<Exclude<R, I>, E, A>
}
```

Added in v1.20.0

## provideServiceEffect

**Signature**

```ts
export declare const provideServiceEffect: {
  <I, S, R2, E2>(
    service: Ctx.Tag<I, S>,
    instance: Effect.Effect<R2, E2, S>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | Exclude<R, I>, E2 | E, A>
  <R, E, A, I, S, R2, E2>(
    fx: Fx<R, E, A>,
    service: Ctx.Tag<I, S>,
    instance: Effect.Effect<R2, E2, S>
  ): Fx<R2 | Exclude<R, I>, E | E2, A>
}
```

Added in v1.20.0

## race

**Signature**

```ts
export declare const race: {
  <R2, E2, B>(that: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, B | A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, that: Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
}
```

Added in v1.20.0

## raceAll

**Signature**

```ts
export declare const raceAll: <const FX extends readonly Fx<any, any, any>[]>(
  fx: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
```

Added in v1.20.0

## reduce

**Signature**

```ts
export declare const reduce: {
  <A, B>(seed: B, f: (acc: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B): Effect.Effect<R, E, B>
}
```

Added in v1.20.0

## replay

**Signature**

```ts
export declare const replay: {
  (capacity: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, capacity: number): Fx<Scope.Scope | R, E, A>
}
```

Added in v1.20.0

## sample

**Signature**

```ts
export declare const sample: {
  <R, E, B>(sampled: Fx<R, E, B>): <R2, E2, A>(fx: Fx<R2, E2, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, sampled: Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
}
```

Added in v1.20.0

## scan

**Signature**

```ts
export declare const scan: {
  <B, A>(seed: B, f: (b: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (b: B, a: A) => B): Fx<R, E, B>
}
```

Added in v1.20.0

## schedule

**Signature**

```ts
export declare const schedule: {
  <R2, O>(schedule: Schedule.Schedule<R2, unknown, O>): <R, E, A>(input: Effect.Effect<R, E, A>) => Fx<R2 | R, E, A>
  <R, E, A, R2, O>(input: Effect.Effect<R, E, A>, schedule: Schedule.Schedule<R2, unknown, O>): Fx<R | R2, E, A>
}
```

Added in v1.20.0

## scoped

**Signature**

```ts
export declare const scoped: <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, Scope.Scope>, E, A>
```

Added in v1.20.0

## share

**Signature**

```ts
export declare const share: {
  <R2, E2, A>(subject: Subject.Subject<R2, E2, A>): <R, E>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, subject: Subject.Subject<R2, E, A>): Fx<Scope.Scope | R | R2, E, A>
}
```

Added in v1.20.0

## since

**Signature**

```ts
export declare const since: {
  <R2, E2, B>(window: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2 | E, A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, window: Fx<R2, E2, B>): Fx<Scope.Scope | R | R2, E | E2, A>
}
```

Added in v1.20.0

## skipRepeats

**Signature**

```ts
export declare const skipRepeats: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
```

Added in v1.20.0

## skipRepeatsWith

**Signature**

```ts
export declare const skipRepeatsWith: {
  <A>(eq: Equivalence.Equivalence<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, eq: Equivalence.Equivalence<A>): Fx<R, E, A>
}
```

Added in v1.20.0

## slice

**Signature**

```ts
export declare const slice: {
  (drop: number, take: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, drop: number, take: number): Fx<R, E, A>
}
```

Added in v1.20.0

## snapshot

**Signature**

```ts
export declare const snapshot: {
  <R, E, B, A, C>(sampled: Fx<R, E, B>, g: (a: A, b: B) => C): <R2, E2>(fx: Fx<R2, E2, A>) => Fx<R | R2, E | E2, C>
  <R, E, A, R2, E2, B, C>(fx: Fx<R, E, A>, sampled: Fx<R2, E2, B>, f: (a: A, b: B) => C): Fx<R | R2, E | E2, C>
}
```

Added in v1.20.0

## snapshotEffect

**Signature**

```ts
export declare const snapshotEffect: {
  <R2, E2, B, A, R3, E3, C>(
    sampled: Fx<R2, E2, B>,
    g: (a: A, b: B) => Effect.Effect<R3, E3, C>
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R3 | R, E2 | E3 | E, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    sampled: Fx<R2, E2, B>,
    f: (a: A, b: B) => Effect.Effect<R3, E3, C>
  ): Fx<R | R2 | R3, E | E2 | E3, C>
}
```

Added in v1.20.0

## struct

**Signature**

```ts
export declare const struct: <const FX extends Readonly<Record<string, Fx<any, any, any>>>>(
  fx: FX
) => Fx<Fx.Context<FX[string]>, Fx.Error<FX[string]>, { readonly [K in keyof FX]: Fx.Success<FX[K]> }>
```

Added in v1.20.0

## succeed

**Signature**

```ts
export declare const succeed: <A>(value: A) => Fx<never, never, A>
```

Added in v1.20.0

## suspend

**Signature**

```ts
export declare const suspend: <R, E, A>(f: () => Fx<R, E, A>) => Fx<R, E, A>
```

Added in v1.20.0

## switchMap

**Signature**

```ts
export declare const switchMap: {
  <A, R2, E2, B>(
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E | E2, B>
}
```

Added in v1.20.0

## switchMapCause

**Signature**

```ts
export declare const switchMapCause: {
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E2, A | B>
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2, B | A>
}
```

Added in v1.20.0

## switchMapEffect

**Signature**

```ts
export declare const switchMapEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E | E2, B>
}
```

Added in v1.20.0

## switchMapError

**Signature**

```ts
export declare const switchMapError: {
  <E, R2, E2, B>(
    f: (e: E) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: E) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E2, A | B>
}
```

Added in v1.20.0

## switchMatchCause

**Signature**

```ts
export declare const switchMatchCause: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
}
```

Added in v1.20.0

## switchMatchError

**Signature**

```ts
export declare const switchMatchError: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    opts: core.MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
}
```

Added in v1.20.0

## sync

**Signature**

```ts
export declare const sync: <A>(f: () => A) => Fx<never, never, A>
```

Added in v1.20.0

## take

**Signature**

```ts
export declare const take: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
}
```

Added in v1.20.0

## takeUntiEffect

**Signature**

```ts
export declare const takeUntiEffect: {
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
}
```

Added in v1.20.0

## takeUntil

**Signature**

```ts
export declare const takeUntil: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, Exclude<A, B>>
  <A>(f: Predicate.Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, f: Predicate.Refinement<A, B>): Fx<R, E, Exclude<A, B>>
  <R, E, A>(fx: Fx<R, E, A>, f: Predicate.Predicate<A>): Fx<R, E, A>
}
```

Added in v1.20.0

## takeWhile

**Signature**

```ts
export declare const takeWhile: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <A>(f: Predicate.Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, f: Predicate.Refinement<A, B>): Fx<R, E, B>
  <R, E, A>(fx: Fx<R, E, A>, f: Predicate.Predicate<A>): Fx<R, E, A>
}
```

Added in v1.20.0

## takeWhileEffect

**Signature**

```ts
export declare const takeWhileEffect: {
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
}
```

Added in v1.20.0

## tap

**Signature**

```ts
export declare const tap: {
  <A>(f: (a: A) => unknown): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, f: (a: A) => unknown): Fx<R, E, A>
}
```

Added in v1.20.0

## tapEffect

**Signature**

```ts
export declare const tapEffect: {
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, unknown>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, unknown>): Fx<R | R2, E | E2, A>
}
```

Added in v1.20.0

## throttle

**Signature**

```ts
export declare const throttle: {
  (delay: Duration.DurationInput): <R, E, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: Duration.DurationInput): Fx<Scope.Scope | R, E, A>
}
```

Added in v1.20.0

## throttleLatest

**Signature**

```ts
export declare const throttleLatest: {
  (delay: Duration.DurationInput): <R, E, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: Duration.DurationInput): Fx<Scope.Scope | R, E, A>
}
```

Added in v1.20.0

## toEnqueue

**Signature**

```ts
export declare const toEnqueue: {
  <R2 = never, A = never>(
    queue: Ctx.Enqueue<R2, A> | Queue.Enqueue<A>
  ): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R2 | R, E, void>
  <R, E, A, R2 = never>(fx: Fx<R, E, A>, queue: Ctx.Enqueue<R2, A> | Queue.Enqueue<A>): Effect.Effect<R | R2, E, void>
}
```

Added in v1.20.0

## toReadonlyArray

**Signature**

```ts
export declare const toReadonlyArray: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, readonly A[]>
```

Added in v1.20.0

## tuple

**Signature**

```ts
export declare const tuple: <const FX extends readonly Fx<any, any, any>[]>(
  fx: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, { readonly [K in keyof FX]: Fx.Success<FX[K]> }>
```

Added in v1.20.0

## uninterruptible

**Signature**

```ts
export declare const uninterruptible: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
```

Added in v1.20.0

## until

**Signature**

```ts
export declare const until: {
  <R2, E2, B>(window: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R2 | R, E2 | E, A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, window: Fx<R2, E2, B>): Fx<Scope.Scope | R | R2, E | E2, A>
}
```

Added in v1.20.0

## when

**Signature**

```ts
export declare const when: {
  <B, C>(options: {
    readonly onTrue: B
    readonly onFalse: C
  }): <R, E>(bool: Fx<R, E, boolean>) => Fx<Scope.Scope | R, E, B | C>
  <R, E, B, C>(
    bool: Fx<R, E, boolean>,
    options: { readonly onTrue: B; readonly onFalse: C }
  ): Fx<Scope.Scope | R, E, B | C>
}
```

Added in v1.20.0

## withConcurrency

**Signature**

```ts
export declare const withConcurrency: {
  (concurrency: number | "unbounded"): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, concurrency: number | "unbounded"): Fx<R, E, A>
}
```

Added in v1.20.0

## withConfigProvider

**Signature**

```ts
export declare const withConfigProvider: {
  (configProvider: ConfigProvider.ConfigProvider): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, configProvider: ConfigProvider.ConfigProvider): Fx<R, E, A>
}
```

Added in v1.20.0

## withEmitter

**Signature**

```ts
export declare const withEmitter: <E, A, R = never, E2 = never>(
  f: (emitter: Emitter.Emitter<E, A>) => Effect.Effect<R, E2, unknown>
) => Fx<Scope.Scope | R, E | E2, A>
```

Added in v1.20.0

## withKey

**Signature**

```ts
export declare const withKey: {
  <A, B extends PropertyKey, R2, E2, C>(
    options: WithKeyOptions<A, B, R2, E2, C>
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, C>
  <R, E, A, B extends PropertyKey, R2, E2, C>(
    fx: Fx<R, E, A>,
    options: WithKeyOptions<A, B, R2, E2, C>
  ): Fx<R | R2, E | E2, C>
}
```

Added in v1.20.0

## withLogSpan

**Signature**

```ts
export declare const withLogSpan: {
  (span: string): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, span: string): Fx<R, E, A>
}
```

Added in v1.20.0

## withMaxOpsBeforeYield

**Signature**

```ts
export declare const withMaxOpsBeforeYield: {
  (maxOps: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, maxOps: number): Fx<R, E, A>
}
```

Added in v1.20.0

## withParentSpan

**Signature**

```ts
export declare const withParentSpan: {
  (parentSpan: Tracer.ParentSpan): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, parentSpan: Tracer.ParentSpan): Fx<R, E, A>
}
```

Added in v1.20.0

## withRequestBatching

**Signature**

```ts
export declare const withRequestBatching: {
  (requestBatching: boolean): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, requestBatching: boolean): Fx<R, E, A>
}
```

Added in v1.20.0

## withRequestCache

**Signature**

```ts
export declare const withRequestCache: {
  (cache: Request.Cache): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, cache: Request.Cache): Fx<R, E, A>
}
```

Added in v1.20.0

## withRequestCaching

**Signature**

```ts
export declare const withRequestCaching: {
  (requestCaching: boolean): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, requestCaching: boolean): Fx<R, E, A>
}
```

Added in v1.20.0

## withSpan

**Signature**

```ts
export declare const withSpan: {
  (
    name: string,
    options?: {
      readonly attributes?: Record<string, unknown>
      readonly links?: ReadonlyArray<Tracer.SpanLink>
      readonly parent?: Tracer.ParentSpan
      readonly root?: boolean
      readonly context?: Ctx.Context<never>
    }
  ): <R, E, A>(self: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(
    self: Fx<R, E, A>,
    name: string,
    options?: {
      readonly attributes?: Record<string, unknown>
      readonly links?: ReadonlyArray<Tracer.SpanLink>
      readonly parent?: Tracer.ParentSpan
      readonly root?: boolean
      readonly context?: Ctx.Context<never>
    }
  ): Fx<R, E, A>
}
```

Added in v1.20.0

## withTracer

**Signature**

```ts
export declare const withTracer: {
  (tracer: Tracer.Tracer): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, tracer: Tracer.Tracer): Fx<R, E, A>
}
```

Added in v1.20.0

## withTracerTiming

**Signature**

```ts
export declare const withTracerTiming: {
  (enabled: boolean): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, enabled: boolean): Fx<R, E, A>
}
```

Added in v1.20.0
