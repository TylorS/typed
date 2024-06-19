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
  - [MatchCauseOptionsEffect (type alias)](#matchcauseoptionseffect-type-alias)
  - [MatchErrorOptions (type alias)](#matcherroroptions-type-alias)
  - [MatchErrorOptionsEffect (type alias)](#matcherroroptionseffect-type-alias)
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
  - [null](#null)
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
  - [promise](#promise)
  - [promiseFx](#promisefx)
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
  - [switchMatchCauseEffect](#switchmatchcauseeffect)
  - [switchMatchError](#switchmatcherror)
  - [switchMatchErrorEffect](#switchmatcherroreffect)
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
  - [unify](#unify)
  - [uninterruptible](#uninterruptible)
  - [until](#until)
  - [void](#void)
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
  ): <E, R>(
    fx: Fx<A, E, R>
  ) => Fx<
    Fx.Success<ReturnType<Matchers[keyof Matchers]>>,
    E | Fx.Error<ReturnType<Matchers[keyof Matchers]>>,
    R | Fx.Context<ReturnType<Matchers[keyof Matchers]>>
  >
  <A extends { readonly _tag: string }, E, R, Matchers extends DefaultMatchersFrom<A>>(
    fx: Fx<A, E, R>,
    matchers: Matchers
  ): Fx<
    Fx.Success<ReturnType<Matchers[keyof Matchers]>>,
    E | Fx.Error<ReturnType<Matchers[keyof Matchers]>>,
    R | Fx.Context<ReturnType<Matchers[keyof Matchers]>>
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
export type FxFork = <R>(effect: Effect.Effect<void, never, R>) => Effect.Effect<void, never, R>
```

Added in v1.20.0

## ScopedFork (type alias)

Type-alias for a Effect.forkIn(scope) that returns a Fiber

**Signature**

```ts
export type ScopedFork = <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<Fiber.Fiber<A, E>, never, R>
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
  readonly [Tag in A["_tag"]]: (value: RefSubject<Extract<A, { readonly _tag: Tag }>>) => Fx<any, any, any>
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
export interface Fx<out A, out E = never, out R = never> extends Pipeable.Pipeable {
  readonly [FxTypeId]: Fx.Variance<A, E, R>

  /**
   * @since 1.20.0
   */
  run<R2 = never>(sink: Sink.Sink<A, E, R2>): Effect.Effect<unknown, never, R | R2>
}
```

Added in v1.20.0

## Fx (namespace)

Added in v1.20.0

### Variance (interface)

**Signature**

```ts
export interface Variance<A, E, R> {
  readonly _R: Types.Covariant<R>
  readonly _E: Types.Covariant<E>
  readonly _A: Types.Covariant<A>
}
```

Added in v1.20.0

### Context (type alias)

**Signature**

```ts
export type Context<T> = T extends Fx<infer _A, infer _E, infer R> ? R : never
```

Added in v1.20.0

### Error (type alias)

**Signature**

```ts
export type Error<T> = T extends Fx<infer _A, infer E, infer _R> ? E : never
```

Added in v1.20.0

### Success (type alias)

**Signature**

```ts
export type Success<T> = T extends Fx<infer A, infer _E, infer _R> ? A : never
```

Added in v1.20.0

### Unify (type alias)

**Signature**

```ts
export type Unify<T> = [T] extends [Fx<infer A, infer E, infer R>] ? Fx<A, E, R> : never
```

Added in v1.20.0

## FxEffectBase (class)

**Signature**

```ts
export declare class FxEffectBase<A, E, R, B, E2, R2>
```

Added in v1.20.0

### run (method)

**Signature**

```ts
run<R3>(sink: Sink.Sink<A, E, R3>): Effect.Effect<void, never, R | R3>
```

Added in v1.20.0

### toFx (method)

**Signature**

```ts
abstract toFx(): Fx<A, E, R>
```

Added in v1.20.0

### toEffect (method)

**Signature**

```ts
abstract toEffect(): Effect.Effect<B, E2, R2>
```

Added in v1.20.0

## KeyedOptions (interface)

**Signature**

```ts
export interface KeyedOptions<A, B, C, E2, R2> {
  readonly getKey: (a: A) => B
  readonly onValue: (ref: RefSubject<A>, key: B) => Fx<C, E2, R2>
  readonly debounce?: Duration.DurationInput
}
```

Added in v1.20.0

## MatchCauseOptions (type alias)

**Signature**

```ts
export type MatchCauseOptions<E, A, B, E2, R2, C, E3, R3> = {
  readonly onFailure: (cause: Cause.Cause<E>) => Fx<B, E2, R2>
  readonly onSuccess: (a: A) => Fx<C, E3, R3>
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
}
```

Added in v1.20.0

## MatchCauseOptionsEffect (type alias)

**Signature**

```ts
export type MatchCauseOptionsEffect<E, A, B, E2, R2, C, E3, R3> = {
  readonly onFailure: (cause: Cause.Cause<E>) => Effect.Effect<B, E2, R2>
  readonly onSuccess: (a: A) => Effect.Effect<C, E3, R3>
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
}
```

Added in v1.20.0

## MatchErrorOptions (type alias)

**Signature**

```ts
export type MatchErrorOptions<E, A, B, E2, R2, C, E3, R3> = {
  readonly onFailure: (e: E) => Fx<B, E2, R2>
  readonly onSuccess: (a: A) => Fx<C, E3, R3>
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
}
```

Added in v1.20.0

## MatchErrorOptionsEffect (type alias)

**Signature**

```ts
export type MatchErrorOptionsEffect<E, A, B, E2, R2, C, E3, R3> = {
  readonly onFailure: (e: E) => Effect.Effect<B, E2, R2>
  readonly onSuccess: (a: A) => Effect.Effect<C, E3, R3>
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
export interface WithKeyOptions<A, B, C, E2, R2> {
  readonly getKey: (a: A) => B
  readonly onValue: (ref: RefSubject<A>, key: B) => Fx<C, E2, R2>
}
```

Added in v1.20.0

## acquireUseRelease

**Signature**

```ts
export declare const acquireUseRelease: {
  <A, B, E2, R2, C, E3, R3>(
    use: (a: A) => Fx<B, E2, R2>,
    release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<C, E3, R3>
  ): <E, R>(acquire: Effect.Effect<A, E, R>) => Fx<B, E2 | E3 | E, R2 | R3 | R>
  <A, E, R, B, E2, R2, C, E3, R3>(
    acquire: Effect.Effect<A, E, R>,
    use: (a: A) => Fx<B, E2, R2>,
    release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<C, E3, R3>
  ): Fx<B, E | E2 | E3, R | R2 | R3>
}
```

Added in v1.20.0

## all

**Signature**

```ts
export declare const all: {
  <const FX extends readonly Fx<any, any, any>[]>(
    fx: FX
  ): Fx<{ readonly [K in keyof FX]: Fx.Success<FX[K]> }, Fx.Error<FX[number]>, Fx.Context<FX[number]>>
  <const FX extends Readonly<Record<string, Fx<any, any, any>>>>(
    fx: FX
  ): Fx<{ readonly [K in keyof FX]: Fx.Success<FX[K]> }, Fx.Error<FX[string]>, Fx.Context<FX[string]>>
}
```

Added in v1.20.0

## annotateLogs

**Signature**

```ts
export declare const annotateLogs: {
  (key: string | Record<string, unknown>, value?: unknown): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, key: string | Record<string, unknown>, value?: unknown): Fx<A, E, R>
}
```

Added in v1.20.0

## annotateSpans

**Signature**

```ts
export declare const annotateSpans: {
  (key: string | Record<string, unknown>, value?: unknown): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, key: string | Record<string, unknown>, value?: unknown): Fx<A, E, R>
}
```

Added in v1.20.0

## append

**Signature**

```ts
export declare const append: {
  <C>(end: C): <A, E, R>(fx: Fx<A, E, R>) => Fx<C | A, E, R>
  <A, E, R, C>(fx: Fx<A, E, R>, end: C): Fx<A | C, E, R>
}
```

Added in v1.20.0

## appendAll

**Signature**

```ts
export declare const appendAll: {
  <C>(end: Iterable<C>): <A, E, R>(fx: Fx<A, E, R>) => Fx<C | A, E, R>
  <A, E, R, C>(fx: Fx<A, E, R>, end: Iterable<C>): Fx<A | C, E, R>
}
```

Added in v1.20.0

## at

**Signature**

```ts
export declare const at: {
  (duration: Duration.DurationInput): <A>(value: A) => Fx<A, never, never>
  <A>(value: A, duration: Duration.DurationInput): Fx<A, never, never>
}
```

Added in v1.20.0

## compact

**Signature**

```ts
export declare const compact: <A, E, R>(fx: Fx<Option.Option<A>, E, R>) => Fx<A, E, R>
```

Added in v1.20.0

## concatMap

**Signature**

```ts
export declare const concatMap: {
  <A, B, E2, R2>(
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E2 | E, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## continueWith

**Signature**

```ts
export declare const continueWith: {
  <B, E2, R2>(f: () => Fx<B, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<B | A, E2 | E, R2 | R>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, f: () => Fx<B, E2, R2>): Fx<A | B, E | E2, R | R2>
}
```

Added in v1.20.0

## debounce

**Signature**

```ts
export declare const debounce: {
  (delay: Duration.DurationInput): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Scope.Scope | R>
  <A, E, R>(fx: Fx<A, E, R>, delay: Duration.DurationInput): Fx<A, E, Scope.Scope | R>
}
```

Added in v1.20.0

## delay

Create an Fx which will wait a specified duration of time where no
events have occurred before emitting a value.

**Signature**

```ts
export declare const delay: {
  (delay: Duration.DurationInput): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Scope.Scope | R>
  <A, E, R>(fx: Fx<A, E, R>, delay: Duration.DurationInput): Fx<A, E, Scope.Scope | R>
}
```

Added in v1.18.0

## die

**Signature**

```ts
export declare const die: (error: unknown) => Fx<never>
```

Added in v1.20.0

## drain

**Signature**

```ts
export declare const drain: <A, E, R>(fx: Fx<A, E, R>) => Effect.Effect<void, E, R>
```

Added in v1.20.0

## drainLayer

**Signature**

```ts
export declare function drainLayer<FXS extends ReadonlyArray<Fx<any, never, any>>>(
  ...fxs: FXS
): Layer.Layer<never, never, Exclude<Fx.Context<FXS[number]>, Scope.Scope>>
```

Added in v1.20.0

## drop

**Signature**

```ts
export declare const drop: {
  (n: number): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, n: number): Fx<A, E, R>
}
```

Added in v1.20.0

## dropAfter

**Signature**

```ts
export declare const dropAfter: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <E, R>(fx: Fx<A, E, R>) => Fx<Exclude<A, B>, E, R>
  <A>(f: Predicate.Predicate<A>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R, B extends A>(fx: Fx<A, E, R>, f: Predicate.Refinement<A, B>): Fx<Exclude<A, B>, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: Predicate.Predicate<A>): Fx<A, E, R>
}
```

Added in v1.20.0

## dropAfterEffect

**Signature**

```ts
export declare const dropAfterEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E2 | E, R2 | R>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<boolean, E2, R2>): Fx<A, E | E2, R | R2>
}
```

Added in v1.20.0

## dropUntil

**Signature**

```ts
export declare const dropUntil: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <E, R>(fx: Fx<A, E, R>) => Fx<A | B, E, R>
  <A>(f: Predicate.Predicate<A>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R, B extends A>(fx: Fx<A, E, R>, f: Predicate.Refinement<A, B>): Fx<A | B, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: Predicate.Predicate<A>): Fx<A, E, R>
}
```

Added in v1.20.0

## dropUntilEffect

**Signature**

```ts
export declare const dropUntilEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E2 | E, R2 | R>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<boolean, E2, R2>): Fx<A, E | E2, R | R2>
}
```

Added in v1.20.0

## dropWhile

**Signature**

```ts
export declare const dropWhile: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <E, R>(fx: Fx<A, E, R>) => Fx<Exclude<A, B>, E, R>
  <A>(f: Predicate.Predicate<A>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R, B extends A>(fx: Fx<A, E, R>, f: Predicate.Refinement<A, B>): Fx<Exclude<A, B>, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: Predicate.Predicate<A>): Fx<A, E, R>
}
```

Added in v1.20.0

## dropWhileEffect

**Signature**

```ts
export declare const dropWhileEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E2 | E, R2 | R>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<boolean, E2, R2>): Fx<A, E | E2, R | R2>
}
```

Added in v1.20.0

## during

**Signature**

```ts
export declare const during: {
  <E2, R2, A, R3, E3, B>(
    window: Fx<Fx<B, E3, R3>, E2, R2>
  ): <E, R>(fx: Fx<A, E, R>) => Fx<A, E2 | E3 | E, Scope.Scope | R2 | R3 | R>
  <A, E, R, E2, R2, R3, E3, B>(
    fx: Fx<A, E, R>,
    window: Fx<Fx<B, E3, R3>, E2, R2>
  ): Fx<A, E | E2 | E3, Scope.Scope | R | R2 | R3>
}
```

Added in v1.20.0

## either

**Signature**

```ts
export declare const either: <A, E, R>(fx: Fx<A, E, R>) => Fx<Either.Either<A, E>, never, R>
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
  <R2>(finalizer: Effect.Effect<unknown, never, R2>): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E, R2 | R>
  <A, E, R, R2>(self: Fx<A, E, R>, finalizer: Effect.Effect<unknown, never, R2>): Fx<A, E, R | R2>
}
```

Added in v1.20.0

## exhaustMap

**Signature**

```ts
export declare const exhaustMap: {
  <A, B, E2, R2>(
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E2 | E, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## exhaustMapCause

**Signature**

```ts
export declare const exhaustMapCause: {
  <E, B, E2, R2>(
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<B | A, E2, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## exhaustMapEffect

**Signature**

```ts
export declare const exhaustMapEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E2 | E, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## exhaustMapError

**Signature**

```ts
export declare const exhaustMapError: {
  <E, B, E2, R2>(
    f: (e: E) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<B | A, E2, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (e: E) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## exhaustMapLatest

**Signature**

```ts
export declare const exhaustMapLatest: {
  <A, B, E2, R2>(
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E2 | E, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## exhaustMapLatestCause

**Signature**

```ts
export declare const exhaustMapLatestCause: {
  <E, B, E2, R2>(
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<B | A, E2, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## exhaustMapLatestEffect

**Signature**

```ts
export declare const exhaustMapLatestEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E2 | E, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## exhaustMapLatestError

**Signature**

```ts
export declare const exhaustMapLatestError: {
  <E, B, E2, R2>(
    f: (e: E) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<B | A, E2, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (e: E) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## exhaustMatchCause

**Signature**

```ts
export declare const exhaustMatchCause: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, Scope.Scope | R2 | R3 | R>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
}
```

Added in v1.20.0

## exhaustMatchError

**Signature**

```ts
export declare const exhaustMatchError: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, Scope.Scope | R2 | R3 | R>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: core.MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
}
```

Added in v1.20.0

## exhaustMatchLatestCause

**Signature**

```ts
export declare const exhaustMatchLatestCause: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, Scope.Scope | R2 | R3 | R>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
}
```

Added in v1.20.0

## exhaustMatchLatestError

**Signature**

```ts
export declare const exhaustMatchLatestError: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, Scope.Scope | R2 | R3 | R>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: core.MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
}
```

Added in v1.20.0

## exit

**Signature**

```ts
export declare const exit: <A, E, R>(fx: Fx<A, E, R>) => Fx<Exit.Exit<A, E>, never, R>
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
  <A, B extends A>(f: Predicate.Refinement<A, B>): <E, R>(fx: Fx<A, E, R>) => Fx<B, E, R>
  <A>(f: Predicate.Predicate<A>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R, B extends A>(fx: Fx<A, E, R>, f: Predicate.Refinement<A, B>): Fx<B, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: Predicate.Predicate<A>): Fx<A, E, R>
}
```

Added in v1.20.0

## filterCause

**Signature**

```ts
export declare const filterCause: {
  <E>(f: (cause: Cause.Cause<E>) => boolean): <R, A>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: (cause: Cause.Cause<E>) => boolean): Fx<A, E, R>
}
```

Added in v1.20.0

## filterCauseEffect

**Signature**

```ts
export declare const filterCauseEffect: {
  <E, E2, R2>(
    f: (cause: Cause.Cause<E>) => Effect.Effect<boolean, E2, R2>
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2, R2 | R>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (cause: Cause.Cause<E>) => Effect.Effect<boolean, E2, R2>): Fx<A, E2, R | R2>
}
```

Added in v1.20.0

## filterEffect

**Signature**

```ts
export declare const filterEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E2 | E, R2 | R>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<boolean, E2, R2>): Fx<A, E | E2, R | R2>
}
```

Added in v1.20.0

## filterError

**Signature**

```ts
export declare const filterError: {
  <E>(f: (e: E) => boolean): <R, A>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: (e: E) => boolean): Fx<A, E, R>
}
```

Added in v1.20.0

## filterErrorEffect

**Signature**

```ts
export declare const filterErrorEffect: {
  <E, E2, R2>(f: (e: E) => Effect.Effect<boolean, E2, R2>): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2, R2 | R>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (e: E) => Effect.Effect<boolean, E2, R2>): Fx<A, E2, R | R2>
}
```

Added in v1.20.0

## filterMap

**Signature**

```ts
export declare const filterMap: {
  <A, B>(f: (a: A) => Option.Option<B>): <E, R>(fx: Fx<A, E, R>) => Fx<B, E, R>
  <A, E, R, B>(fx: Fx<A, E, R>, f: (a: A) => Option.Option<B>): Fx<B, E, R>
}
```

Added in v1.20.0

## filterMapCause

**Signature**

```ts
export declare const filterMapCause: {
  <E, E2>(f: (cause: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2, R>
  <A, E, R, E2>(fx: Fx<A, E, R>, f: (cause: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>): Fx<A, E2, R>
}
```

Added in v1.20.0

## filterMapCauseEffect

**Signature**

```ts
export declare const filterMapCauseEffect: {
  <E3, E2, R2>(
    f: (cause: Cause.Cause<E2>) => Effect.Effect<Option.Option<Cause.Cause<E3>>, E2, R2>
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E3 | E2, R2 | R>
  <A, E, R, E3, E2, R2>(
    fx: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<Option.Option<Cause.Cause<E3>>, E2, R2>
  ): Fx<A, E3 | E2, R | R2>
}
```

Added in v1.20.0

## filterMapEffect

**Signature**

```ts
export declare const filterMapEffect: {
  <A, B, E2, R2>(f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<B, E2 | E, R2 | R>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>): Fx<B, E | E2, R | R2>
}
```

Added in v1.20.0

## filterMapError

**Signature**

```ts
export declare const filterMapError: {
  <E, E2>(f: (e: E) => Option.Option<E2>): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2, R>
  <A, E, R, E2>(fx: Fx<A, E, R>, f: (e: E) => Option.Option<E2>): Fx<A, E2, R>
}
```

Added in v1.20.0

## filterMapErrorEffect

**Signature**

```ts
export declare const filterMapErrorEffect: {
  <E, E3, E2, R2>(
    f: (e: E) => Effect.Effect<Option.Option<E3>, E2, R2>
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A, E3 | E2, R2 | R>
  <A, E, R, E3, E2, R2>(fx: Fx<A, E, R>, f: (e: E) => Effect.Effect<Option.Option<E3>, E2, R2>): Fx<A, E3 | E2, R | R2>
}
```

Added in v1.20.0

## filterMapLoop

**Signature**

```ts
export declare const filterMapLoop: {
  <B, A, C>(seed: B, f: (acc: B, a: A) => readonly [Option.Option<C>, B]): <E, R>(fx: Fx<A, E, R>) => Fx<C, E, R>
  <A, E, R, B, C>(fx: Fx<A, E, R>, seed: B, f: (acc: B, a: A) => readonly [Option.Option<C>, B]): Fx<C, E, R>
}
```

Added in v1.20.0

## filterMapLoopCause

**Signature**

```ts
export declare const filterMapLoopCause: {
  <B, E, E2, R2, C>(
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<readonly [Option.Option<Cause.Cause<C>>, B], E2, R2>
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2 | C, R2 | R>
  <A, E, R, B, C>(
    fx: Fx<A, E, R>,
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => readonly [Option.Option<Cause.Cause<C>>, B]
  ): Fx<A, C, R>
}
```

Added in v1.20.0

## filterMapLoopCauseEffect

**Signature**

```ts
export declare const filterMapLoopCauseEffect: {
  <B, E, E2, R2, C>(
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<readonly [Option.Option<Cause.Cause<C>>, B], E2, R2>
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2 | C, R2 | R>
  <A, E, R, B, E2, R2, C>(
    fx: Fx<A, E, R>,
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<readonly [Option.Option<Cause.Cause<C>>, B], E2, R2>
  ): Fx<A, E2 | C, R | R2>
}
```

Added in v1.20.0

## filterMapLoopEffect

**Signature**

```ts
export declare const filterMapLoopEffect: {
  <B, E2, R2, A, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E2, R2>
  ): <E, R>(fx: Fx<A, E, R>) => Fx<C, E2 | E, R2 | R>
  <A, E, R, B, E2, R2, C>(
    fx: Fx<A, E, R>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E2, R2>
  ): Fx<C, E | E2, R | R2>
}
```

Added in v1.20.0

## filterMapLoopError

**Signature**

```ts
export declare const filterMapLoopError: {
  <B, E, E2, R2, C>(
    seed: B,
    f: (b: B, e: E) => Effect.Effect<readonly [Option.Option<C>, B], E2, R2>
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2 | C, R2 | R>
  <A, E, R, B, C>(fx: Fx<A, E, R>, seed: B, f: (b: B, e: E) => readonly [Option.Option<C>, B]): Fx<A, C, R>
}
```

Added in v1.20.0

## filterMapLoopErrorEffect

**Signature**

```ts
export declare const filterMapLoopErrorEffect: {
  <B, E, E2, R2, C>(
    seed: B,
    f: (b: B, e: E) => Effect.Effect<readonly [Option.Option<C>, B], E2, R2>
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2 | C, R2 | R>
  <A, E, R, B, E2, R2, C>(
    fx: Fx<A, E, R>,
    seed: B,
    f: (b: B, e: E) => Effect.Effect<readonly [Option.Option<C>, B], E2, R2>
  ): Fx<A, E2 | C, R | R2>
}
```

Added in v1.20.0

## findFirst

**Signature**

```ts
export declare const findFirst: {
  <A, B extends A>(refinement: Predicate.Refinement<A, B>): <E, R>(fx: Fx<A, E, R>) => Effect.Effect<B, E, R>
  <A>(predicate: Predicate.Predicate<A>): <E, R>(fx: Fx<A, E, R>) => Effect.Effect<A, E, R>
  <A, E, R, B extends A>(fx: Fx<A, E, R>, refinement: Predicate.Refinement<A, B>): Effect.Effect<B, E, R>
  <A, E, R>(fx: Fx<A, E, R>, predicate: Predicate.Predicate<A>): Effect.Effect<A, E, R>
}
```

Added in v1.20.0

## first

**Signature**

```ts
export declare const first: <A, E, R>(fx: Fx<A, E, R>) => Effect.Effect<A, E, R>
```

Added in v1.20.0

## flatMap

**Signature**

```ts
export declare const flatMap: {
  <A, B, E2, R2>(
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E2 | E, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## flatMapCause

**Signature**

```ts
export declare const flatMapCause: {
  <E, B, E2, R2>(
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<B | A, E2, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## flatMapCauseConcurrently

**Signature**

```ts
export declare const flatMapCauseConcurrently: {
  <E, B, E2, R2>(
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    concurrency: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<B | A, E2, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    concurrency: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## flatMapCauseWithStrategy

**Signature**

```ts
export declare const flatMapCauseWithStrategy: {
  <E, B, E2, R2>(
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    flattenStrategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): <R, A>(fx: Fx<A, E, R>) => Fx<B | A, E2, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    flattenStrategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): Fx<A | B, E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## flatMapConcurrently

**Signature**

```ts
export declare const flatMapConcurrently: {
  <A, B, E2, R2>(
    f: (a: A) => Fx<B, E2, R2>,
    capacity: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E2 | E, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    capacity: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## flatMapConcurrentlyEffect

**Signature**

```ts
export declare const flatMapConcurrentlyEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>,
    capacity: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E2 | E, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
    capacity: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## flatMapEffect

**Signature**

```ts
export declare const flatMapEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E2 | E, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## flatMapError

**Signature**

```ts
export declare const flatMapError: {
  <E, B, E2, R2>(
    f: (e: E) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<B | A, E2, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (e: E) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## flatMapErrorConcurrently

**Signature**

```ts
export declare const flatMapErrorConcurrently: {
  <E, B, E2, R2>(
    f: (e: E) => Fx<B, E2, R2>,
    concurrency: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<B | A, E2, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (e: E) => Fx<B, E2, R2>,
    concurrency: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## flatMapErrorWithStrategy

**Signature**

```ts
export declare const flatMapErrorWithStrategy: {
  <E, B, E2, R2>(
    f: (e: E) => Fx<B, E2, R2>,
    flattenStrategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): <R, A>(fx: Fx<A, E, R>) => Fx<B | A, E2, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (e: E) => Fx<B, E2, R2>,
    flattenStrategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): Fx<A | B, E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## flatMapWithStrategy

**Signature**

```ts
export declare const flatMapWithStrategy: {
  <A, B, E2, R2>(
    f: (a: A) => Fx<B, E2, R2>,
    strategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E2 | E, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    strategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): Fx<B, E | E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## flip

**Signature**

```ts
export declare const flip: <A, E, R>(fx: Fx<A, E, R>) => Fx<E, A, R>
```

Added in v1.20.0

## fork

**Signature**

```ts
export declare const fork: <A, E, R>(fx: Fx<A, E, R>) => Effect.Effect<Fiber.RuntimeFiber<void, E>, never, R>
```

Added in v1.20.0

## forkDaemon

**Signature**

```ts
export declare const forkDaemon: <A, E, R>(fx: Fx<A, E, R>) => Effect.Effect<Fiber.RuntimeFiber<void, E>, never, R>
```

Added in v1.20.0

## forkIn

**Signature**

```ts
export declare const forkIn: {
  (scope: Scope.Scope): <A, E, R>(fx: Fx<A, E, R>) => Effect.Effect<Fiber.RuntimeFiber<void, E>, never, R>
  <A, E, R>(fx: Fx<A, E, R>, scope: Scope.Scope): Effect.Effect<Fiber.RuntimeFiber<void, E>, never, R>
}
```

Added in v1.20.0

## forkScoped

**Signature**

```ts
export declare const forkScoped: <A, E, R>(
  fx: Fx<A, E, R>
) => Effect.Effect<Fiber.RuntimeFiber<void, E>, never, Scope.Scope | R>
```

Added in v1.20.0

## fromArray

**Signature**

```ts
export declare const fromArray: <const A extends readonly any[]>(array: A) => Fx<A[number], never, never>
```

Added in v1.20.0

## fromAsyncIterable

**Signature**

```ts
export declare const fromAsyncIterable: <A>(iterable: AsyncIterable<A>) => Fx<A, never, never>
```

Added in v1.20.0

## fromDequeue

**Signature**

```ts
export declare function fromDequeue<A>(dequeue: Queue.Dequeue<A>): Fx<A>
export declare function fromDequeue<I, A>(dequeue: Ctx.Dequeue<I, A>): Fx<A, never, I>
```

Added in v1.20.0

## fromEffect

**Signature**

```ts
export declare const fromEffect: <A, E, R>(effect: Effect.Effect<A, E, R>) => Fx<A, E, R>
```

Added in v1.20.0

## fromFxEffect

**Signature**

```ts
export declare const fromFxEffect: <B, E, R, E2, R2>(
  effect: Effect.Effect<Fx<B, E2, R2>, E, R>
) => Fx<B, E | E2, R | R2>
```

Added in v1.20.0

## fromIterable

**Signature**

```ts
export declare const fromIterable: <A>(iterable: Iterable<A>) => Fx<A, never, never>
```

Added in v1.20.0

## fromNullable

**Signature**

```ts
export declare const fromNullable: <A>(value: void | A | null | undefined) => Fx<NonNullable<A>, never, never>
```

Added in v1.20.0

## fromPubSub

**Signature**

```ts
export declare function fromPubSub<A>(pubSub: PubSub.PubSub<A>): Fx<A, never, Scope.Scope>
export declare function fromPubSub<I, A>(pubSub: Ctx.PubSub<I, A>): Fx<A, never, I | Scope.Scope>
```

Added in v1.20.0

## fromScheduled

**Signature**

```ts
export declare const fromScheduled: {
  <R2, I, O>(schedule: Schedule.Schedule<O, I, R2>): <E, R>(input: Effect.Effect<I, E, R>) => Fx<O, E, R2 | R>
  <I, E, R, R2, O>(input: Effect.Effect<I, E, R>, schedule: Schedule.Schedule<O, I, R2>): Fx<O, E, R | R2>
}
```

Added in v1.20.0

## gen

**Signature**

```ts
export declare const gen: <Y extends Utils.YieldWrap<Effect.Effect<any, any, any>>, FX extends Fx<any, any, any>>(
  f: (_: Effect.Adapter) => Generator<Y, FX, any>
) => Fx<
  Fx.Success<FX>,
  (Y extends Utils.YieldWrap<Effect.Effect<infer _, infer E, any>> ? E : never) | Fx.Error<FX>,
  (Y extends Utils.YieldWrap<Effect.Effect<any, any, infer R>> ? R : never) | Fx.Context<FX>
>
```

Added in v1.20.0

## genScoped

**Signature**

```ts
export declare const genScoped: <Y extends Utils.YieldWrap<Effect.Effect<any, any, any>>, FX extends Fx<any, any, any>>(
  f: (_: Effect.Adapter) => Generator<Y, FX, any>
) => Fx<
  Fx.Success<FX>,
  (Y extends Utils.YieldWrap<Effect.Effect<infer _, infer E, any>> ? E : never) | Fx.Error<FX>,
  | Exclude<Y extends Utils.YieldWrap<Effect.Effect<any, any, infer R>> ? R : never, Scope.Scope>
  | Exclude<Fx.Context<FX>, Scope.Scope>
>
```

Added in v1.20.0

## getOrElse

**Signature**

```ts
export declare const getOrElse: {
  <A, B = never, E2 = never, R2 = never>(
    orElse: () => Fx<B, E2, R2>
  ): <E, R>(fx: Fx<Option.Option<A>, E, R>) => Fx<A | B, E2 | E, Scope.Scope | R2 | R>
  <A, E, R, B = never, E2 = never, R2 = never>(
    fx: Fx<Option.Option<A>, E, R>,
    orElse: () => Fx<B, E2, R2>
  ): Fx<A | B, E | E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## hold

**Signature**

```ts
export declare const hold: <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Scope.Scope | R>
```

Added in v1.20.0

## if

**Signature**

```ts
export declare const if: { <B, E2, R2, C, E3, R3>(options: { readonly onTrue: Fx<B, E2, R2>; readonly onFalse: Fx<C, E3, R3>; }): <E, R>(bool: Fx<boolean, E, R>) => Fx<B | C, E2 | E3 | E, Scope.Scope | R2 | R3 | R>; <B, E, R, E2, R2, C, E3, R3>(bool: Fx<boolean, E, R>, options: { readonly onTrue: Fx<B, E2, R2>; readonly onFalse: Fx<C, E3, R3>; }): Fx<B | C, E | E2 | E3, Scope.Scope | R | R2 | R3>; }
```

Added in v1.20.0

## interruptible

**Signature**

```ts
export declare const interruptible: <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
```

Added in v1.20.0

## isFx

**Signature**

```ts
export declare function isFx<A, E, R>(u: unknown): u is Fx<A, E, R>
```

Added in v1.20.0

## keyed

**Signature**

```ts
export declare const keyed: {
  <A, B extends PropertyKey, E2, R2, C>(
    options: KeyedOptions<A, B, C, E2, R2>
  ): <E, R>(fx: Fx<readonly A[], E, R>) => Fx<readonly C[], E2 | E, R2 | R>
  <A, E, R, B extends PropertyKey, E2, R2, C>(
    fx: Fx<readonly A[], E, R>,
    options: KeyedOptions<A, B, C, E2, R2>
  ): Fx<readonly C[], E | E2, R | R2>
}
```

Added in v1.20.0

## locally

**Signature**

```ts
export declare const locally: {
  <A>(self: FiberRef.FiberRef<A>, value: A): <B, E, R>(fx: Fx<B, E, R>) => Fx<B, E, R>
  <B, E, R, A>(use: Fx<B, E, R>, self: FiberRef.FiberRef<A>, value: A): Fx<B, E, R>
}
```

Added in v1.20.0

## locallyWith

**Signature**

```ts
export declare const locallyWith: {
  <A>(self: FiberRef.FiberRef<A>, f: (a: A) => A): <B, E, R>(fx: Fx<B, E, R>) => Fx<B, E, R>
  <B, E, R, A>(use: Fx<B, E, R>, self: FiberRef.FiberRef<A>, f: (a: A) => A): Fx<B, E, R>
}
```

Added in v1.20.0

## loop

**Signature**

```ts
export declare const loop: {
  <B, A, C>(seed: B, f: (acc: B, a: A) => readonly [C, B]): <E, R>(fx: Fx<A, E, R>) => Fx<C, E, R>
  <A, E, R, B, C>(fx: Fx<A, E, R>, seed: B, f: (acc: B, a: A) => readonly [C, B]): Fx<C, E, R>
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
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A, C, R>
  <A, E, R, B, C>(
    fx: Fx<A, E, R>,
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => readonly [Cause.Cause<C>, B]
  ): Fx<A, C, R>
}
```

Added in v1.20.0

## loopCauseEffect

**Signature**

```ts
export declare const loopCauseEffect: {
  <B, E, E2, R2, C>(
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<readonly [Cause.Cause<C>, B], E2, R2>
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2 | C, R2 | R>
  <A, E, R, B, E2, R2, C>(
    fx: Fx<A, E, R>,
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<readonly [Cause.Cause<C>, B], E2, R2>
  ): Fx<A, E2 | C, R | R2>
}
```

Added in v1.20.0

## loopEffect

**Signature**

```ts
export declare const loopEffect: {
  <B, E2, R2, A, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E2, R2>
  ): <E, R>(fx: Fx<A, E, R>) => Fx<C, E2 | E, R2 | R>
  <A, E, R, B, E2, R2, C>(
    fx: Fx<A, E, R>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E2, R2>
  ): Fx<C, E | E2, R | R2>
}
```

Added in v1.20.0

## loopError

**Signature**

```ts
export declare const loopError: {
  <B, E, C>(seed: B, f: (b: B, e: E) => readonly [C, B]): <R, A>(fx: Fx<A, E, R>) => Fx<A, C, R>
  <A, E, R, B, C>(fx: Fx<A, E, R>, seed: B, f: (b: B, e: E) => readonly [C, B]): Fx<A, C, R>
}
```

Added in v1.20.0

## loopErrorEffect

**Signature**

```ts
export declare const loopErrorEffect: {
  <B, E, E2, R2, C>(
    seed: B,
    f: (b: B, e: E) => Effect.Effect<readonly [C, B], E2, R2>
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2 | C, R2 | R>
  <A, E, R, B, E2, R2, C>(
    fx: Fx<A, E, R>,
    seed: B,
    f: (b: B, e: E) => Effect.Effect<readonly [C, B], E2, R2>
  ): Fx<A, E2 | C, R | R2>
}
```

Added in v1.20.0

## make

**Signature**

```ts
export declare const make: {
  <A, E, R>(run: (sink: Sink.Sink<A, E, never>) => Effect.Effect<unknown, never, R>): Fx<A, E, R>
  <A, E>(run: (sink: Sink.Sink<A, E, never>) => Effect.Effect<unknown>): Fx<A, E, never>
  <A>(run: (sink: Sink.Sink<A, never, never>) => Effect.Effect<unknown>): Fx<A, never, never>
}
```

Added in v1.20.0

## map

**Signature**

```ts
export declare const map: {
  <A, B>(f: (a: A) => B): <E, R>(fx: Fx<A, E, R>) => Fx<B, E, R>
  <A, E, R, B>(fx: Fx<A, E, R>, f: (a: A) => B): Fx<B, E, R>
}
```

Added in v1.20.0

## mapBoth

**Signature**

```ts
export declare const mapBoth: {
  <E, E2, A, B>(f: (e: E) => E2, g: (a: A) => B): <R>(fx: Fx<A, E, R>) => Fx<B, E2, R>
  <A, E, R, B, C>(fx: Fx<A, E, R>, f: (e: E) => B, g: (a: A) => C): Fx<C, B, R>
}
```

Added in v1.20.0

## mapCause

**Signature**

```ts
export declare const mapCause: {
  <E, E2>(f: (cause: Cause.Cause<E>) => Cause.Cause<E2>): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2, R>
  <A, E, R, E2>(fx: Fx<A, E, R>, f: (cause: Cause.Cause<E>) => Cause.Cause<E2>): Fx<A, E2, R>
}
```

Added in v1.20.0

## mapCauseEffect

**Signature**

```ts
export declare const mapCauseEffect: {
  <E3, E2, R2>(
    f: (cause: Cause.Cause<E2>) => Effect.Effect<Cause.Cause<E3>, E3, R2>
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E3 | E2, R2 | R>
  <A, E, R, E3, E2, R2>(
    fx: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<Cause.Cause<E3>, E2, R2>
  ): Fx<A, E3 | E2, R | R2>
}
```

Added in v1.20.0

## mapEffect

**Signature**

```ts
export declare const mapEffect: {
  <A, B, E2, R2>(f: (a: A) => Effect.Effect<B, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<B, E2 | E, R2 | R>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<B, E2, R2>): Fx<B, E | E2, R | R2>
}
```

Added in v1.20.0

## mapError

**Signature**

```ts
export declare const mapError: {
  <E, E2>(f: (e: E) => E2): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2, R>
  <A, E, R, E2>(fx: Fx<A, E, R>, f: (e: E) => E2): Fx<A, E2, R>
}
```

Added in v1.20.0

## mapErrorEffect

**Signature**

```ts
export declare const mapErrorEffect: {
  <E3, E2, R2>(f: (e: E2) => Effect.Effect<E3, E3, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E3 | E2, R2 | R>
  <A, E, R, E3, E2, R2>(fx: Fx<A, E, R>, f: (e: E) => Effect.Effect<E3, E2, R2>): Fx<A, E3 | E2, R | R2>
}
```

Added in v1.20.0

## matchCause

**Signature**

```ts
export declare const matchCause: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, Scope.Scope | R2 | R3 | R>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
}
```

Added in v1.20.0

## matchCauseConcurrently

**Signature**

```ts
export declare const matchCauseConcurrently: {
  <E, A, B, E2, R2, C, E3, R3>(
    concurrency: number,
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, Scope.Scope | R2 | R3 | R>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    concurrency: number,
    opts: core.MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
}
```

Added in v1.20.0

## matchCauseWithStrategy

**Signature**

```ts
export declare const matchCauseWithStrategy: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, Scope.Scope | R2 | R3 | R>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    flattenStrategy: FlattenStrategy,
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
}
```

Added in v1.20.0

## matchEither

**Signature**

```ts
export declare const matchEither: {
  <E1, A, B = never, E2 = never, R2 = never, C = never, E3 = never, R3 = never>(
    onLeft: (e: RefSubject<E1, never, never>) => Fx<B, E2, R2>,
    onRight: (a: RefSubject<A, never, never>) => Fx<C, E3, R3>
  ): <E, R>(fx: Fx<Either.Either<A, E1>, E, R>) => Fx<B | C, E2 | E3 | E, Scope.Scope | R2 | R3 | R>
  <R, E, E1, A, B = never, E2 = never, R2 = never, C = never, E3 = never, R3 = never>(
    fx: Fx<Either.Either<A, E1>, E, R>,
    onLeft: (e: RefSubject<E1, never, never>) => Fx<B, E2, R2>,
    onRight: (a: RefSubject<A, never, never>) => Fx<C, E3, R3>
  ): Fx<B | C, E | E2 | E3, Scope.Scope | R | R2 | R3>
}
```

Added in v1.20.0

## matchError

**Signature**

```ts
export declare const matchError: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, Scope.Scope | R2 | R3 | R>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
}
```

Added in v1.20.0

## matchErrorConcurrently

**Signature**

```ts
export declare const matchErrorConcurrently: {
  <E, A, B, E2, R2, C, E3, R3>(
    concurrency: number,
    opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, Scope.Scope | R2 | R3 | R>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    concurrency: number,
    opts: core.MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
}
```

Added in v1.20.0

## matchErrorWithStrategy

**Signature**

```ts
export declare const matchErrorWithStrategy: {
  <E, A, B, E2, R2, C, E3, R3>({
    executionStrategy,
    onFailure,
    onSuccess
  }: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>): <R>(
    fx: Fx<A, E, R>
  ) => Fx<B | C, E2 | E3, Scope.Scope | R2 | R3 | R>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    flattenStrategy: FlattenStrategy,
    { executionStrategy, onFailure, onSuccess }: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
}
```

Added in v1.20.0

## matchOption

**Signature**

```ts
export declare const matchOption: {
  <A, B = never, E2 = never, R2 = never, C = never, E3 = never, R3 = never>(
    onNone: () => Fx<B, E2, R2>,
    onSome: (a: RefSubject<A, never, never>) => Fx<C, E3, R3>
  ): <E, R>(fx: Fx<Option.Option<A>, E, R>) => Fx<B | C, E2 | E3 | E, Scope.Scope | R2 | R3 | R>
  <A, E, R, B = never, E2 = never, R2 = never, C = never, E3 = never, R3 = never>(
    fx: Fx<Option.Option<A>, E, R>,
    onNone: () => Fx<B, E2, R2>,
    onSome: (a: RefSubject<A, never, never>) => Fx<C, E3, R3>
  ): Fx<B | C, E | E2 | E3, Scope.Scope | R | R2 | R3>
}
```

Added in v1.20.0

## merge

**Signature**

```ts
export declare const merge: {
  <B, E2, R2>(other: Fx<B, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<B | A, E2 | E, R2 | R>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, other: Fx<B, E2, R2>): Fx<A | B, E | E2, R | R2>
}
```

Added in v1.20.0

## mergeAll

**Signature**

```ts
export declare const mergeAll: <FX extends readonly Fx<any, any, any>[]>(
  fx: FX
) => Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>>
```

Added in v1.20.0

## mergeFirst

**Signature**

```ts
export declare const mergeFirst: {
  <B, E2, R2>(that: Fx<B, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<B | A, E2 | E, R2 | R>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, that: Fx<B, E2, R2>): Fx<A, E | E2, R | R2>
}
```

Added in v1.20.0

## mergeOrdered

**Signature**

```ts
export declare const mergeOrdered: <FX extends readonly Fx<any, any, any>[]>(
  fx: FX
) => Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>>
```

Added in v1.20.0

## mergeOrderedConcurrently

**Signature**

```ts
export declare const mergeOrderedConcurrently: <FX extends readonly Fx<any, any, any>[]>(
  fx: FX,
  concurrency: number
) => Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>>
```

Added in v1.20.0

## mergeRace

**Signature**

```ts
export declare const mergeRace: {
  <B, E2, R2>(that: Fx<B, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<B | A, E2 | E, R2 | R>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, that: Fx<B, E2, R2>): Fx<A | B, E | E2, R | R2>
}
```

Added in v1.20.0

## mergeSwitch

**Signature**

```ts
export declare const mergeSwitch: <FX extends readonly Fx<any, any, any>[]>(
  fx: FX
) => Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>>
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
  ) => Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>>
  <const FX extends readonly Fx<any, any, any>[]>(
    fx: FX,
    stategy: MergeStrategy
  ): Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>>
}
```

Added in v1.20.0

## middleware

**Signature**

```ts
export declare const middleware: {
  <R, A, E, R3>(
    effect: (effect: Effect.Effect<unknown, never, R>) => Effect.Effect<unknown, never, R3>,
    sink?: ((sink: Sink.Sink<A, E, never>) => Sink.Sink<A, E, R>) | undefined
  ): <A, E>(fx: Fx<A, E, R>) => Fx<A, E, R3>
  <A, E, R, R3>(
    fx: Fx<A, E, R>,
    effect: (effect: Effect.Effect<unknown, never, R>) => Effect.Effect<unknown, never, R3>,
    sink?: ((sink: Sink.Sink<A, E, never>) => Sink.Sink<A, E, R>) | undefined
  ): Fx<A, E, R3>
}
```

Added in v1.20.0

## multicast

**Signature**

```ts
export declare const multicast: <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Scope.Scope | R>
```

Added in v1.20.0

## never

**Signature**

```ts
export declare const never: Fx<never, never, never>
```

Added in v1.20.0

## null

**Signature**

```ts
export declare const null: Fx<null, never, never>
```

Added in v2.0.0

## observe

**Signature**

```ts
export declare const observe: {
  <A, B, E2, R2>(f: (a: A) => Effect.Effect<B, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Effect.Effect<void, E2 | E, R2 | R>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<B, E2, R2>): Effect.Effect<void, E | E2, R | R2>
}
```

Added in v1.20.0

## onError

**Signature**

```ts
export declare const onError: {
  <R2>(f: (cause: Cause.Cause<never>) => Effect.Effect<unknown, never, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R2>
  <A, E, R, R2>(fx: Fx<A, E, R>, f: (cause: Cause.Cause<never>) => Effect.Effect<unknown, never, R2>): Fx<A, E, R | R2>
}
```

Added in v1.20.0

## onExit

**Signature**

```ts
export declare const onExit: {
  <R2>(
    f: (exit: Exit.Exit<unknown>) => Effect.Effect<unknown, never, R2>
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R2 | R>
  <A, E, R, R2>(
    fx: Fx<A, E, R>,
    f: (exit: Exit.Exit<unknown>) => Effect.Effect<unknown, never, R | R2>
  ): Fx<A, E, R | R2>
}
```

Added in v1.20.0

## onInterrupt

**Signature**

```ts
export declare const onInterrupt: {
  <R2>(
    f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<unknown, never, R2>
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R2>
  <A, E, R, R2>(
    fx: Fx<A, E, R>,
    f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<unknown, never, R2>
  ): Fx<A, E, R | R2>
}
```

Added in v1.20.0

## orElse

**Signature**

```ts
export declare const orElse: {
  <E, B, E2, R2>(f: (error: E) => Fx<B, E2, R2>): <R, A>(fx: Fx<A, E, R>) => Fx<B | A, E2, R2 | R>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, f: (error: E) => Fx<B, E2, R2>): Fx<A | B, E2, R | R2>
}
```

Added in v1.20.0

## orElseCause

**Signature**

```ts
export declare const orElseCause: {
  <E, B, E2, R2>(f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>): <R, A>(fx: Fx<A, E, R>) => Fx<B | A, E2, R2 | R>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>): Fx<A | B, E2, R | R2>
}
```

Added in v1.20.0

## padWith

**Signature**

```ts
export declare const padWith: {
  <B, C>(start: Iterable<B>, end: Iterable<C>): <A, E, R>(fx: Fx<A, E, R>) => Fx<B | C | A, E, R>
  <A, E, R, B, C>(fx: Fx<A, E, R>, start: Iterable<B>, end: Iterable<C>): Fx<A | B | C, E, R>
}
```

Added in v1.20.0

## partitionMap

**Signature**

```ts
export declare const partitionMap: {
  <A, B, C>(
    f: (a: A) => Either.Either<C, B>
  ): <E, R>(fx: Fx<A, E, R>) => readonly [Fx<B, E, Scope.Scope | R>, Fx<C, E, Scope.Scope | R>]
  <A, E, R, B, C>(
    fx: Fx<A, E, R>,
    f: (a: A) => Either.Either<C, B>
  ): readonly [Fx<B, E, Scope.Scope | R>, Fx<C, E, Scope.Scope | R>]
}
```

Added in v1.20.0

## periodic

**Signature**

```ts
export declare const periodic: {
  (period: Duration.DurationInput): <A, E, R>(iterator: Effect.Effect<A, E, R>) => Fx<A, E, R>
  <A, E, R>(iterator: Effect.Effect<A, E, R>, period: Duration.DurationInput): Fx<A, E, R>
}
```

Added in v1.20.0

## prepend

**Signature**

```ts
export declare const prepend: {
  <B>(start: B): <A, E, R>(fx: Fx<A, E, R>) => Fx<B | A, E, R>
  <A, E, R, B>(fx: Fx<A, E, R>, start: B): Fx<A | B, E, R>
}
```

Added in v1.20.0

## prependAll

**Signature**

```ts
export declare const prependAll: {
  <B>(start: Iterable<B>): <A, E, R>(fx: Fx<A, E, R>) => Fx<B | A, E, R>
  <A, E, R, B>(fx: Fx<A, E, R>, start: Iterable<B>): Fx<A | B, E, R>
}
```

Added in v1.20.0

## promise

**Signature**

```ts
export declare function promise<A>(f: (signal: AbortSignal) => Promise<A>)
```

Added in v2.0.0

## promiseFx

**Signature**

```ts
export declare function promiseFx<A, E = never, R = never>(f: (signal: AbortSignal) => Promise<Fx<A, E, R>>)
```

Added in v2.0.0

## provide

**Signature**

```ts
export declare const provide: {
  <R2>(context: Ctx.Context<R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Exclude<R, R2>>
  <R2>(runtime: Runtime.Runtime<R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Exclude<R, R2>>
  <S, E2, R2>(layer: Layer.Layer<S, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E2 | E, R2 | Exclude<R, S>>
  <S, E2 = never, R2 = never>(
    provide: Layer.Layer<S, E2, R2> | Ctx.Context<S> | Runtime.Runtime<S>
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E2 | E, R2 | Exclude<R, S>>
  <A, E, R, R2>(fx: Fx<A, E, R>, context: Ctx.Context<R2>): Fx<A, E, Exclude<R, R2>>
  <A, E, R, R2>(fx: Fx<A, E, R>, runtime: Runtime.Runtime<R2>): Fx<A, E, Exclude<R, R2>>
  <A, E, R, S, E2, R2>(fx: Fx<A, E, R>, layer: Layer.Layer<S, E2, R2>): Fx<A, E | E2, R2 | Exclude<R, S>>
  <A, E, R, S, E2 = never, R2 = never>(
    fx: Fx<A, E, R>,
    provide: Layer.Layer<S, E2, R2> | Ctx.Context<S> | Runtime.Runtime<S>
  ): Fx<A, E | E2, R2 | Exclude<R, S>>
}
```

Added in v1.20.0

## provideContext

**Signature**

```ts
export declare const provideContext: {
  <R2>(context: Ctx.Context<R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Exclude<R, R2>>
  <A, E, R, R2>(fx: Fx<A, E, R>, context: Ctx.Context<R2>): Fx<A, E, Exclude<R, R2>>
}
```

Added in v1.20.0

## provideLayer

**Signature**

```ts
export declare const provideLayer: {
  <E2, R2, S>(layer: Layer.Layer<S, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E2 | E, R2 | Exclude<R, S>>
  <A, E, R, E2, R2, S>(fx: Fx<A, E, R>, layer: Layer.Layer<S, E2, R2>): Fx<A, E | E2, R2 | Exclude<R, S>>
}
```

Added in v1.20.0

## provideRuntime

**Signature**

```ts
export declare const provideRuntime: {
  <R2>(runtime: Runtime.Runtime<R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Exclude<R, R2>>
  <A, E, R, R2>(fx: Fx<A, E, R>, runtime: Runtime.Runtime<R2>): Fx<A, E, Exclude<R, R2>>
}
```

Added in v1.20.0

## provideService

**Signature**

```ts
export declare const provideService: {
  <I, S>(service: Ctx.Tag<I, S>, instance: S): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Exclude<R, I>>
  <A, E, R, I, S>(fx: Fx<A, E, R>, service: Ctx.Tag<I, S>, instance: S): Fx<A, E, Exclude<R, I>>
}
```

Added in v1.20.0

## provideServiceEffect

**Signature**

```ts
export declare const provideServiceEffect: {
  <I, S, E2, R2>(
    service: Ctx.Tag<I, S>,
    instance: Effect.Effect<S, E2, R2>
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E2 | E, R2 | Exclude<R, I>>
  <A, E, R, I, S, E2, R2>(
    fx: Fx<A, E, R>,
    service: Ctx.Tag<I, S>,
    instance: Effect.Effect<S, E2, R2>
  ): Fx<A, E | E2, R2 | Exclude<R, I>>
}
```

Added in v1.20.0

## race

**Signature**

```ts
export declare const race: {
  <B, E2, R2>(that: Fx<B, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<B | A, E2 | E, R2 | R>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, that: Fx<B, E2, R2>): Fx<A | B, E | E2, R | R2>
}
```

Added in v1.20.0

## raceAll

**Signature**

```ts
export declare const raceAll: <const FX extends readonly Fx<any, any, any>[]>(
  fx: FX
) => Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>>
```

Added in v1.20.0

## reduce

**Signature**

```ts
export declare const reduce: {
  <A, B>(seed: B, f: (acc: B, a: A) => B): <E, R>(fx: Fx<A, E, R>) => Effect.Effect<B, E, R>
  <A, E, R, B>(fx: Fx<A, E, R>, seed: B, f: (acc: B, a: A) => B): Effect.Effect<B, E, R>
}
```

Added in v1.20.0

## replay

**Signature**

```ts
export declare const replay: {
  (capacity: number): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Scope.Scope | R>
  <A, E, R>(fx: Fx<A, E, R>, capacity: number): Fx<A, E, Scope.Scope | R>
}
```

Added in v1.20.0

## sample

**Signature**

```ts
export declare const sample: {
  <B, E, R>(sampled: Fx<B, E, R>): <E2, R2, A>(fx: Fx<A, E2, R2>) => Fx<B, E | E2, R | R2>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, sampled: Fx<B, E2, R2>): Fx<B, E | E2, R | R2>
}
```

Added in v1.20.0

## scan

**Signature**

```ts
export declare const scan: {
  <B, A>(seed: B, f: (b: B, a: A) => B): <E, R>(fx: Fx<A, E, R>) => Fx<B, E, R>
  <A, E, R, B>(fx: Fx<A, E, R>, seed: B, f: (b: B, a: A) => B): Fx<B, E, R>
}
```

Added in v1.20.0

## schedule

**Signature**

```ts
export declare const schedule: {
  <R2, O>(schedule: Schedule.Schedule<O, unknown, R2>): <A, E, R>(input: Effect.Effect<A, E, R>) => Fx<A, E, R2 | R>
  <A, E, R, R2, O>(input: Effect.Effect<A, E, R>, schedule: Schedule.Schedule<O, unknown, R2>): Fx<A, E, R | R2>
}
```

Added in v1.20.0

## scoped

**Signature**

```ts
export declare const scoped: <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Exclude<R, Scope.Scope>>
```

Added in v1.20.0

## share

**Signature**

```ts
export declare const share: {
  <E2, R2, A>(subject: Subject.Subject<A, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, Scope.Scope | R2 | R>
  <A, E, R, R2>(fx: Fx<A, E, R>, subject: Subject.Subject<A, E, R2>): Fx<A, E, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## since

**Signature**

```ts
export declare const since: {
  <B, E2, R2>(window: Fx<B, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E2 | E, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, window: Fx<B, E2, R2>): Fx<A, E | E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## skipRepeats

**Signature**

```ts
export declare const skipRepeats: <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
```

Added in v1.20.0

## skipRepeatsWith

**Signature**

```ts
export declare const skipRepeatsWith: {
  <A>(eq: Equivalence.Equivalence<A>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, eq: Equivalence.Equivalence<A>): Fx<A, E, R>
}
```

Added in v1.20.0

## slice

**Signature**

```ts
export declare const slice: {
  (drop: number, take: number): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, drop: number, take: number): Fx<A, E, R>
}
```

Added in v1.20.0

## snapshot

**Signature**

```ts
export declare const snapshot: {
  <B, E, R, A, C>(sampled: Fx<B, E, R>, g: (a: A, b: B) => C): <E2, R2>(fx: Fx<A, E2, R2>) => Fx<C, E | E2, R | R2>
  <A, E, R, B, E2, R2, C>(fx: Fx<A, E, R>, sampled: Fx<B, E2, R2>, f: (a: A, b: B) => C): Fx<C, E | E2, R | R2>
}
```

Added in v1.20.0

## snapshotEffect

**Signature**

```ts
export declare const snapshotEffect: {
  <B, E2, R2, A, C, E3, R3>(
    sampled: Fx<B, E2, R2>,
    g: (a: A, b: B) => Effect.Effect<C, E3, R3>
  ): <E, R>(fx: Fx<A, E, R>) => Fx<C, E2 | E3 | E, R2 | R3 | R>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    sampled: Fx<B, E2, R2>,
    f: (a: A, b: B) => Effect.Effect<C, E3, R3>
  ): Fx<C, E | E2 | E3, R | R2 | R3>
}
```

Added in v1.20.0

## struct

**Signature**

```ts
export declare const struct: <const FX extends Readonly<Record<string, Fx<any, any, any>>>>(
  fx: FX
) => Fx<{ readonly [K in keyof FX]: Fx.Success<FX[K]> }, Fx.Error<FX[string]>, Fx.Context<FX[string]>>
```

Added in v1.20.0

## succeed

**Signature**

```ts
export declare const succeed: <A>(value: A) => Fx<A, never, never>
```

Added in v1.20.0

## suspend

**Signature**

```ts
export declare const suspend: <A, E, R>(f: () => Fx<A, E, R>) => Fx<A, E, R>
```

Added in v1.20.0

## switchMap

**Signature**

```ts
export declare const switchMap: {
  <A, B, E2, R2>(
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E2 | E, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## switchMapCause

**Signature**

```ts
export declare const switchMapCause: {
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, Scope.Scope | R | R2>
  <E, B, E2, R2>(
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<B | A, E2, Scope.Scope | R2 | R>
}
```

Added in v1.20.0

## switchMapEffect

**Signature**

```ts
export declare const switchMapEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E2 | E, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## switchMapError

**Signature**

```ts
export declare const switchMapError: {
  <E, B, E2, R2>(
    f: (e: E) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<B | A, E2, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (e: E) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## switchMatchCause

**Signature**

```ts
export declare const switchMatchCause: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, Scope.Scope | R2 | R3 | R>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
}
```

Added in v1.20.0

## switchMatchCauseEffect

**Signature**

```ts
export declare const switchMatchCauseEffect: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchCauseOptionsEffect<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, Scope.Scope | R2 | R3 | R>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: MatchCauseOptionsEffect<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
}
```

Added in v2.0.0

## switchMatchError

**Signature**

```ts
export declare const switchMatchError: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, Scope.Scope | R2 | R3 | R>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
}
```

Added in v1.20.0

## switchMatchErrorEffect

**Signature**

```ts
export declare const switchMatchErrorEffect: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchErrorOptionsEffect<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, Scope.Scope | R2 | R3 | R>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: MatchErrorOptionsEffect<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
}
```

Added in v2.0.0

## sync

**Signature**

```ts
export declare const sync: <A>(f: () => A) => Fx<A, never, never>
```

Added in v1.20.0

## take

**Signature**

```ts
export declare const take: {
  (n: number): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, n: number): Fx<A, E, R>
}
```

Added in v1.20.0

## takeUntiEffect

**Signature**

```ts
export declare const takeUntiEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E2 | E, R2 | R>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<boolean, E2, R2>): Fx<A, E | E2, R | R2>
}
```

Added in v1.20.0

## takeUntil

**Signature**

```ts
export declare const takeUntil: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <E, R>(fx: Fx<A, E, R>) => Fx<Exclude<A, B>, E, R>
  <A>(f: Predicate.Predicate<A>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R, B extends A>(fx: Fx<A, E, R>, f: Predicate.Refinement<A, B>): Fx<Exclude<A, B>, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: Predicate.Predicate<A>): Fx<A, E, R>
}
```

Added in v1.20.0

## takeWhile

**Signature**

```ts
export declare const takeWhile: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <E, R>(fx: Fx<A, E, R>) => Fx<B, E, R>
  <A>(f: Predicate.Predicate<A>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R, B extends A>(fx: Fx<A, E, R>, f: Predicate.Refinement<A, B>): Fx<B, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: Predicate.Predicate<A>): Fx<A, E, R>
}
```

Added in v1.20.0

## takeWhileEffect

**Signature**

```ts
export declare const takeWhileEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E2 | E, R2 | R>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<boolean, E2, R2>): Fx<A, E | E2, R | R2>
}
```

Added in v1.20.0

## tap

**Signature**

```ts
export declare const tap: {
  <A>(f: (a: A) => unknown): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: (a: A) => unknown): Fx<A, E, R>
}
```

Added in v1.20.0

## tapEffect

**Signature**

```ts
export declare const tapEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<unknown, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E2 | E, R2 | R>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<unknown, E2, R2>): Fx<A, E | E2, R | R2>
}
```

Added in v1.20.0

## throttle

**Signature**

```ts
export declare const throttle: {
  (delay: Duration.DurationInput): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Scope.Scope | R>
  <A, E, R>(fx: Fx<A, E, R>, delay: Duration.DurationInput): Fx<A, E, Scope.Scope | R>
}
```

Added in v1.20.0

## throttleLatest

**Signature**

```ts
export declare const throttleLatest: {
  (delay: Duration.DurationInput): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Scope.Scope | R>
  <A, E, R>(fx: Fx<A, E, R>, delay: Duration.DurationInput): Fx<A, E, Scope.Scope | R>
}
```

Added in v1.20.0

## toEnqueue

**Signature**

```ts
export declare const toEnqueue: {
  <R2 = never, A = never>(
    queue: Ctx.Enqueue<R2, A> | Queue.Enqueue<A>
  ): <E, R>(fx: Fx<A, E, R>) => Effect.Effect<void, E, R2 | R>
  <A, E, R, R2 = never>(fx: Fx<A, E, R>, queue: Ctx.Enqueue<R2, A> | Queue.Enqueue<A>): Effect.Effect<void, E, R | R2>
}
```

Added in v1.20.0

## toReadonlyArray

**Signature**

```ts
export declare const toReadonlyArray: <A, E, R>(fx: Fx<A, E, R>) => Effect.Effect<readonly A[], E, R>
```

Added in v1.20.0

## tuple

**Signature**

```ts
export declare const tuple: <const FX extends readonly Fx<any, any, any>[]>(
  fx: FX
) => Fx<{ readonly [K in keyof FX]: Fx.Success<FX[K]> }, Fx.Error<FX[number]>, Fx.Context<FX[number]>>
```

Added in v1.20.0

## unify

**Signature**

```ts
export declare const unify: <T extends Fx<any, any, any>>(fx: T) => Fx.Unify<T>
```

Added in v1.20.0

## uninterruptible

**Signature**

```ts
export declare const uninterruptible: <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
```

Added in v1.20.0

## until

**Signature**

```ts
export declare const until: {
  <B, E2, R2>(window: Fx<B, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E2 | E, Scope.Scope | R2 | R>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, window: Fx<B, E2, R2>): Fx<A, E | E2, Scope.Scope | R | R2>
}
```

Added in v1.20.0

## void

**Signature**

```ts
export declare const void: Fx<void, never, never>
```

Added in v2.0.0

## when

**Signature**

```ts
export declare const when: {
  <B, C>(options: {
    readonly onTrue: B
    readonly onFalse: C
  }): <E, R>(bool: Fx<boolean, E, R>) => Fx<B | C, E, Scope.Scope | R>
  <B, E, R, C>(
    bool: Fx<boolean, E, R>,
    options: { readonly onTrue: B; readonly onFalse: C }
  ): Fx<B | C, E, Scope.Scope | R>
}
```

Added in v1.20.0

## withConcurrency

**Signature**

```ts
export declare const withConcurrency: {
  (concurrency: number | "unbounded"): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, concurrency: number | "unbounded"): Fx<A, E, R>
}
```

Added in v1.20.0

## withConfigProvider

**Signature**

```ts
export declare const withConfigProvider: {
  (configProvider: ConfigProvider.ConfigProvider): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, configProvider: ConfigProvider.ConfigProvider): Fx<A, E, R>
}
```

Added in v1.20.0

## withEmitter

**Signature**

```ts
export declare const withEmitter: <A, E = never, E2 = never, R = never>(
  f: (emitter: Emitter.Emitter<A, E>) => Effect.Effect<unknown, E2, R>
) => Fx<A, E | E2, Scope.Scope | R>
```

Added in v1.20.0

## withKey

**Signature**

```ts
export declare const withKey: {
  <A, B extends PropertyKey, E2, R2, C>(
    options: WithKeyOptions<A, B, C, E2, R2>
  ): <E, R>(fx: Fx<A, E, R>) => Fx<C, E2 | E, R2 | R>
  <A, E, R, B extends PropertyKey, E2, R2, C>(
    fx: Fx<A, E, R>,
    options: WithKeyOptions<A, B, C, E2, R2>
  ): Fx<C, E | E2, R | R2>
}
```

Added in v1.20.0

## withLogSpan

**Signature**

```ts
export declare const withLogSpan: {
  (span: string): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, span: string): Fx<A, E, R>
}
```

Added in v1.20.0

## withMaxOpsBeforeYield

**Signature**

```ts
export declare const withMaxOpsBeforeYield: {
  (maxOps: number): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, maxOps: number): Fx<A, E, R>
}
```

Added in v1.20.0

## withParentSpan

**Signature**

```ts
export declare const withParentSpan: {
  (parentSpan: Tracer.ParentSpan): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, parentSpan: Tracer.ParentSpan): Fx<A, E, R>
}
```

Added in v1.20.0

## withRequestBatching

**Signature**

```ts
export declare const withRequestBatching: {
  (requestBatching: boolean): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, requestBatching: boolean): Fx<A, E, R>
}
```

Added in v1.20.0

## withRequestCache

**Signature**

```ts
export declare const withRequestCache: {
  (cache: Request.Cache): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, cache: Request.Cache): Fx<A, E, R>
}
```

Added in v1.20.0

## withRequestCaching

**Signature**

```ts
export declare const withRequestCaching: {
  (requestCaching: boolean): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, requestCaching: boolean): Fx<A, E, R>
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
  ): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(
    self: Fx<A, E, R>,
    name: string,
    options?: {
      readonly attributes?: Record<string, unknown>
      readonly links?: ReadonlyArray<Tracer.SpanLink>
      readonly parent?: Tracer.ParentSpan
      readonly root?: boolean
      readonly context?: Ctx.Context<never>
    }
  ): Fx<A, E, R>
}
```

Added in v1.20.0

## withTracer

**Signature**

```ts
export declare const withTracer: {
  (tracer: Tracer.Tracer): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, tracer: Tracer.Tracer): Fx<A, E, R>
}
```

Added in v1.20.0

## withTracerTiming

**Signature**

```ts
export declare const withTracerTiming: {
  (enabled: boolean): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, enabled: boolean): Fx<A, E, R>
}
```

Added in v1.20.0
