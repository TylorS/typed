---
title: Fx.ts
nav_order: 8
parent: "@typed/fx"
---

## Fx overview

Fx<R, E, A> is a representation of an `Effect`-ful workflow that exists over
the time dimension. It operates within a context `R`, can fail with an `E`,
and succeed with an `A`.

Any `Fx`, shorthand for "Effects", can emit 0 or more errors or events over an
indefinite period of time. This is in contrast to `Effect` which can only
produce exactly 1 error or event.

It is defined as a super-type of `Effect`, `Stream`, and `Cause`. This
allows for all operators that accept an `Fx` to also capable of
accepting an `Effect`, `Stream`, or `Cause`. An Effect or Cause represents a single
event or error, while a Stream represents a series of events or errors that will
be pulled from the producer as soon as possible.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [Do](#do)
  - [Do](#do-1)
  - [bind](#bind)
  - [bindTo](#bindto)
  - [let](#let)
- [FiberRef](#fiberref)
  - [locally](#locally)
  - [locallyWith](#locallywith)
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
- [Subtyping](#subtyping)
  - [ToFx (class)](#tofx-class)
    - [toFx (method)](#tofx-method)
- [batching](#batching)
  - [withRequestBatching](#withrequestbatching)
  - [withRequestCache](#withrequestcache)
  - [withRequestCaching](#withrequestcaching)
- [combinators](#combinators)
  - [annotateLogs](#annotatelogs)
  - [annotateSpans](#annotatespans)
  - [compact](#compact)
  - [continueWith](#continuewith)
  - [delay](#delay)
  - [either](#either)
  - [endWith](#endwith)
  - [ensuring](#ensuring)
  - [exit](#exit)
  - [filter](#filter)
  - [filterEffect](#filtereffect)
  - [filterMap](#filtermap)
  - [filterMapEffect](#filtermapeffect)
  - [flip](#flip)
  - [if](#if)
  - [interruptible](#interruptible)
  - [loop](#loop)
  - [loopEffect](#loopeffect)
  - [map](#map)
  - [mapBoth](#mapboth)
  - [mapEffect](#mapeffect)
  - [middleware](#middleware)
  - [orElse](#orelse)
  - [partitionMap](#partitionmap)
  - [scan](#scan)
  - [scanEffect](#scaneffect)
  - [snapshot](#snapshot)
  - [startWith](#startwith)
  - [tap](#tap)
  - [uninterruptible](#uninterruptible)
- [concurrency](#concurrency)
  - [withConcurrency](#withconcurrency)
  - [withMaxOpsBeforeYield](#withmaxopsbeforeyield)
  - [withScheduler](#withscheduler)
- [constructors](#constructors)
  - [acquireUseRelease](#acquireuserelease)
  - [at](#at)
  - [combine](#combine)
  - [die](#die)
  - [empty](#empty)
  - [fail](#fail)
  - [failCause](#failcause)
  - [fromEffect](#fromeffect)
  - [fromFxEffect](#fromfxeffect)
  - [fromIterable](#fromiterable)
  - [fromNullable](#fromnullable)
  - [fromScheduled](#fromscheduled)
  - [fromSink](#fromsink)
  - [gen](#gen)
  - [interrupt](#interrupt)
  - [merge](#merge)
  - [mergeBuffer](#mergebuffer)
  - [mergeBufferConcurrently](#mergebufferconcurrently)
  - [mergeConcurrently](#mergeconcurrently)
  - [mergeSwitch](#mergeswitch)
  - [never](#never)
  - [periodic](#periodic)
  - [race](#race)
  - [struct](#struct)
  - [succeed](#succeed)
  - [succeedNone](#succeednone)
  - [succeedSome](#succeedsome)
  - [suspend](#suspend)
  - [sync](#sync)
  - [withEarlyExit](#withearlyexit)
  - [withFlattenStrategy](#withflattenstrategy)
  - [withScopedFork](#withscopedfork)
- [context](#context)
  - [provideContext](#providecontext)
  - [provideLayer](#providelayer)
  - [provideService](#provideservice)
  - [provideServiceEffect](#provideserviceeffect)
  - [provideSomeContext](#providesomecontext)
  - [provideSomeLayer](#providesomelayer)
  - [scoped](#scoped)
- [errors](#errors)
  - [filterCause](#filtercause)
  - [filterMapCause](#filtermapcause)
  - [mapError](#maperror)
  - [mapErrorCause](#maperrorcause)
- [flattening](#flattening)
  - [concatMap](#concatmap)
  - [exhaust](#exhaust-1)
  - [exhaustLatest](#exhaustlatest-1)
  - [exhaustLatestMatchCause](#exhaustlatestmatchcause)
  - [exhaustMap](#exhaustmap)
  - [exhaustMapCause](#exhaustmapcause)
  - [exhaustMapLatest](#exhaustmaplatest)
  - [exhaustMapLatestCause](#exhaustmaplatestcause)
  - [exhaustMatchCause](#exhaustmatchcause)
  - [flatMap](#flatmap)
  - [flatMapCause](#flatmapcause)
  - [flatMapCauseConcurrently](#flatmapcauseconcurrently)
  - [flatMapCauseWithStrategy](#flatmapcausewithstrategy)
  - [flatMapConcurrently](#flatmapconcurrently)
  - [flatMapWithStrategy](#flatmapwithstrategy)
  - [flatten](#flatten)
  - [matchCause](#matchcause)
  - [matchCauseConcurrently](#matchcauseconcurrently)
  - [matchCauseWithStrategy](#matchcausewithstrategy)
  - [switchMap](#switchmap)
  - [switchMapCause](#switchmapcause)
  - [switchMatchCause](#switchmatchcause)
- [lifecycles](#lifecycles)
  - [onError](#onerror)
  - [onExit](#onexit)
  - [onInterrupt](#oninterrupt)
- [logging](#logging)
  - [withLogSpan](#withlogspan)
- [models](#models)
  - [Fx (interface)](#fx-interface)
  - [FxFork (type alias)](#fxfork-type-alias)
  - [ScopedFork (type alias)](#scopedfork-type-alias)
- [params](#params)
  - [WithEarlyExitParams (type alias)](#withearlyexitparams-type-alias)
  - [WithFlattenStrategyParams (type alias)](#withflattenstrategyparams-type-alias)
  - [WithScopedForkParams (type alias)](#withscopedforkparams-type-alias)
- [running](#running)
  - [drain](#drain)
  - [findFirst](#findfirst)
  - [observe](#observe)
  - [reduce](#reduce)
  - [run](#run)
  - [toArray](#toarray)
  - [toChunk](#tochunk)
  - [toReadonlyArray](#toreadonlyarray)
- [sharing](#sharing)
  - [hold](#hold)
  - [multicast](#multicast)
  - [replay](#replay)
  - [share](#share)
- [slicing](#slicing)
  - [drop](#drop)
  - [dropAfter](#dropafter)
  - [dropUntil](#dropuntil)
  - [dropWhile](#dropwhile)
  - [skipRepeats](#skiprepeats)
  - [skipRepeatsWith](#skiprepeatswith)
  - [slice](#slice)
  - [take](#take)
  - [takeUntil](#takeuntil)
  - [takeWhile](#takewhile)
- [time slicing](#time-slicing)
  - [debounce](#debounce)
  - [during](#during)
  - [since](#since)
  - [throttle](#throttle)
  - [until](#until)
- [tracing](#tracing)
  - [withParentSpan](#withparentspan)
  - [withSpan](#withspan)
  - [withTracer](#withtracer)
  - [withTracerTiming](#withtracertiming)
- [utils](#utils)
  - [EffectGenContext (type alias)](#effectgencontext-type-alias)
  - [EffectGenError (type alias)](#effectgenerror-type-alias)
  - [EffectGenSuccess (type alias)](#effectgensuccess-type-alias)
  - [Fx (namespace)](#fx-namespace)
    - [Variance (interface)](#variance-interface)
    - [Context (type alias)](#context-type-alias)
    - [Error (type alias)](#error-type-alias)
    - [Success (type alias)](#success-type-alias)
  - [keyed](#keyed)

---

# Do

## Do

Do simulation

**Signature**

```ts
export declare const Do: Fx<never, never, {}>
```

Added in v1.18.0

## bind

Do simulation

**Signature**

```ts
export declare const bind: {
  <N extends string, A extends object, R2, E2, B>(name: Exclude<N, keyof A>, f: (a: A) => Fx<R2, E2, B>): <R1, E1>(
    self: Fx<R1, E1, A>
  ) => Fx<R2 | R1, E2 | E1, { [K in N | keyof A]: K extends keyof A ? A[K] : B }>
  <R1, E1, A1 extends object, N extends string, R2, E2, B>(
    self: Fx<R1, E1, A1>,
    name: Exclude<N, keyof A1>,
    f: (a: A1) => Fx<R2, E2, B>
  ): Fx<R1 | R2, E1 | E2, { [K in N | keyof A1]: K extends keyof A1 ? A1[K] : B }>
}
```

Added in v1.18.0

## bindTo

Do simulation

**Signature**

```ts
export declare const bindTo: {
  <N extends string>(name: N): <R, E, A>(self: Fx<R, E, A>) => Fx<R, E, { [K in N]: A }>
  <R, E, A, N extends string>(self: Fx<R, E, A>, name: N): Fx<R, E, { [K_1 in N]: A }>
}
```

Added in v1.18.0

## let

Do simulation

**Signature**

```ts
export declare const let: {
  <N extends string, A extends object, B>(name: Exclude<N, keyof A>, f: (a: A) => B): <R1, E1>(
    self: Fx<R1, E1, A>
  ) => Fx<R1, E1, { [K in N | keyof A]: K extends keyof A ? A[K] : B }>
  <R1, E1, A1 extends object, N extends string, B>(
    self: Fx<R1, E1, A1>,
    name: Exclude<N, keyof A1>,
    f: (a: A1) => B
  ): Fx<R1, E1, { [K in N | keyof A1]: K extends keyof A1 ? A1[K] : B }>
}
```

Added in v1.18.0

# FiberRef

## locally

Locally set the value of a FiberRef

**Signature**

```ts
export declare const locally: {
  <A>(self: FiberRef<A>, value: A): <R, E, B>(use: Fx<R, E, B>) => Fx<R, E, B>
  <R, E, B, A>(use: Fx<R, E, B>, self: FiberRef<A>, value: A): Fx<R, E, B>
}
```

Added in v1.18.0

## locallyWith

Locally set the value of a FiberRef by updating the current value

**Signature**

```ts
export declare const locallyWith: {
  <A>(self: FiberRef<A>, f: (a: A) => A): <R, E, B>(use: Fx<R, E, B>) => Fx<R, E, B>
  <R, E, B, A>(use: Fx<R, E, B>, self: FiberRef<A>, f: (a: A) => A): Fx<R, E, B>
}
```

Added in v1.18.0

# FlattenStrategy

## Bounded

Construct a Bounded strategy

**Signature**

```ts
export declare const Bounded: (capacity: number) => Bounded
```

Added in v1.18.0

## Bounded (interface)

Strategy which will allow for a bounded number of concurrent effects to be run.

**Signature**

```ts
export interface Bounded {
  readonly _tag: 'Bounded'
  readonly capacity: number
}
```

Added in v1.18.0

## Exhaust

Singleton instance of Exhaust

**Signature**

```ts
export declare const Exhaust: Exhaust
```

Added in v1.18.0

## Exhaust (interface)

Strategy which will always favor the first Fx, dropping any Fx emitted while
the first Fx is still running. When the first Fx finished, the next event
will execute.

**Signature**

```ts
export interface Exhaust {
  readonly _tag: 'Exhaust'
}
```

Added in v1.18.0

## ExhaustLatest

Singleton instance of ExhaustLatest

**Signature**

```ts
export declare const ExhaustLatest: ExhaustLatest
```

Added in v1.18.0

## ExhaustLatest (interface)

Strategy which will always favor the latest Fx, dropping any Fx emitted while
the latest Fx is still running. When the latest Fx finishes, the last seend event
will execute.

**Signature**

```ts
export interface ExhaustLatest {
  readonly _tag: 'ExhaustLatest'
}
```

Added in v1.18.0

## FlattenStrategy (type alias)

FlattenStrategy is a representation of how higher-order effect operators should flatten
nested Fx.

**Signature**

```ts
export type FlattenStrategy = Unbounded | Bounded | Switch | Exhaust | ExhaustLatest
```

Added in v1.18.0

## Switch

Singleton instance of Switch

**Signature**

```ts
export declare const Switch: Switch
```

Added in v1.18.0

## Switch (interface)

Strategy which will switch to a new effect as soon as it is available.

**Signature**

```ts
export interface Switch {
  readonly _tag: 'Switch'
}
```

Added in v1.18.0

## Unbounded

Singleton instance of Unbounded

**Signature**

```ts
export declare const Unbounded: Unbounded
```

Added in v1.18.0

## Unbounded (interface)

Strategy which will allow for an unbounded number of concurrent effects to be run.

**Signature**

```ts
export interface Unbounded {
  readonly _tag: 'Unbounded'
}
```

Added in v1.18.0

# MergeStrategy

## MergeStrategy (type alias)

MergeStrategy is a representation of how multiple Fx should be merged together.

**Signature**

```ts
export type MergeStrategy = Unordered | Ordered | Switch
```

Added in v1.18.0

## Ordered

Construct an Ordered strategy

**Signature**

```ts
export declare const Ordered: (concurrency: number) => Ordered
```

Added in v1.18.0

## Ordered (interface)

Strategy which will merge Fx in an ordered fashion with
the specified level of concurrency.

**Signature**

```ts
export interface Ordered {
  readonly _tag: 'Ordered'
  readonly concurrency: number
}
```

Added in v1.18.0

## Unordered

Construct an Unordered strategy

**Signature**

```ts
export declare const Unordered: (concurrency: number) => Unordered
```

Added in v1.18.0

## Unordered (interface)

Strategy which will merge Fx in an unordered fashion.

**Signature**

```ts
export interface Unordered {
  readonly _tag: 'Unordered'
  readonly concurrency: number
}
```

Added in v1.18.0

# Subtyping

## ToFx (class)

Helper for constructing your own custom subtypes of an Fx

**Signature**

```ts
export declare class ToFx<R, E, A>
```

Added in v1.18.0

### toFx (method)

**Signature**

```ts
abstract toFx(): Fx<R, E, A>
```

Added in v1.18.0

# batching

## withRequestBatching

Enable/disable request batching within an Fx

**Signature**

```ts
export declare const withRequestBatching: {
  (requestBatching: boolean): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, requestBatching: boolean): Fx<R, E, A>
}
```

Added in v1.18.0

## withRequestCache

Set the request cache Effects running within an Fx

**Signature**

```ts
export declare const withRequestCache: {
  (cache: Request.Cache): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, cache: Request.Cache): Fx<R, E, A>
}
```

Added in v1.18.0

## withRequestCaching

Enable/disable request caching within an Fx

**Signature**

```ts
export declare const withRequestCaching: {
  (requestCaching: boolean): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, requestCaching: boolean): Fx<R, E, A>
}
```

Added in v1.18.0

# combinators

## annotateLogs

Annotate the logs of an Fx

**Signature**

```ts
export declare const annotateLogs: {
  (key: string, value: Logger.AnnotationValue): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  (values: Record<string, Logger.AnnotationValue>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, key: string, value: Logger.AnnotationValue): Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, values: Record<string, Logger.AnnotationValue>): Fx<R, E, A>
}
```

Added in v1.18.0

## annotateSpans

Annotate the spans of an Fx

**Signature**

```ts
export declare const annotateSpans: {
  (key: string, value: Tracer.AttributeValue): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  (values: Record<string, Tracer.AttributeValue>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, key: string, value: Tracer.AttributeValue): Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, values: Record<string, Tracer.AttributeValue>): Fx<R, E, A>
}
```

Added in v1.18.0

## compact

Unwrap Options by filtering any None values.

**Signature**

```ts
export declare const compact: <R, E, A>(fx: Fx<R, E, Option.Option<A>>) => Fx<R, E, A>
```

Added in v1.18.0

## continueWith

Concatenate an Fx after the successful completion of another Fx

**Signature**

```ts
export declare const continueWith: {
  <R2, E2, B>(f: () => Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, B | A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
}
```

Added in v1.18.0

## delay

Create an Fx which will wait a specified duration of time where no
events have occurred before emitting a value.

**Signature**

```ts
export declare const delay: {
  (delay: DurationInput): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: DurationInput): Fx<R, E, A>
}
```

Added in v1.18.0

## either

Capture the errors and success values as Either

**Signature**

```ts
export declare const either: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, never, Either.Either<E, A>>
```

Added in v1.18.0

## endWith

Appends a value to the end of an Fx.

**Signature**

```ts
export declare const endWith: {
  <B>(value: B): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, B | A>
  <R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, A | B>
}
```

Added in v1.18.0

## ensuring

Ensure a finalizer runs on Fx ext.

**Signature**

```ts
export declare const ensuring: {
  <R2>(finalizer: Effect.Effect<R2, never, unknown>): <R, E, A>(self: Fx<R, E, A>) => Fx<R2 | R, E, A>
  <R, E, A, R2>(self: Fx<R, E, A>, finalizer: Effect.Effect<R2, never, unknown>): Fx<R | R2, E, A>
}
```

Added in v1.18.0

## exit

Capture the errors and success values as Exit

**Signature**

```ts
export declare const exit: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, never, Exit.Exit<E, A>>
```

Added in v1.18.0

## filter

Filter the success value of an Fx.

**Signature**

```ts
export declare const filter: {
  <A, B extends A>(f: (a: A) => a is B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <A>(f: (a: A) => boolean): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, f: (a: A) => a is B): Fx<R, E, B>
  <R, E, A>(fx: Fx<R, E, A>, f: (a: A) => boolean): Fx<R, E, A>
}
```

Added in v1.18.0

## filterEffect

Filter the success value of an Fx with an Effect.

**Signature**

```ts
export declare const filterEffect: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
}
```

Added in v1.18.0

## filterMap

Filter and map the success value of an Fx.

**Signature**

```ts
export declare const filterMap: {
  <A, B>(f: (a: A) => Option.Option<B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => Option.Option<B>): Fx<R, E, B>
}
```

Added in v1.18.0

## filterMapEffect

Filter and map the success value of an Fx with an Effect.

**Signature**

```ts
export declare const filterMapEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>): Fx<R | R2, E | E2, B>
}
```

Added in v1.18.0

## flip

Transform success values into failures and failures into successes.

**Signature**

```ts
export declare const flip: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, A, E>
```

Added in v1.18.0

## if

Logical if/else using Fx.

**Signature**

```ts
export declare const if: { <R2, E2, B, R3, E3, C>(options: { readonly onTrue: Fx<R2, E2, B>; readonly onFalse: Fx<R3, E3, C>; }): { <R, E>(bool: Fx<R, E, boolean>): Fx<R2 | R3 | R, E2 | E3 | E, B | C>; (bool: boolean): Fx<R2 | R3, E2 | E3, B | C>; }; <R, E, R2, E2, B, R3, E3, C>(bool: Fx<R, E, boolean>, options: { readonly onTrue: Fx<R2, E2, B>; readonly onFalse: Fx<R3, E3, C>; }): Fx<R | R2 | R3, E | E2 | E3, B | C>; <R2, E2, B, R3, E3, C>(bool: boolean, options: { readonly onTrue: Fx<R2, E2, B>; readonly onFalse: Fx<R3, E3, C>; }): Fx<R2 | R3, E2 | E3, B | C>; }
```

Added in v1.18.0

## interruptible

Mark an Fx as interruptible

**Signature**

```ts
export declare const interruptible: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
```

Added in v1.18.0

## loop

Accumulate a value over the success values of an Fx and atomically produce derived value.

**Signature**

```ts
export declare const loop: {
  <A, B, C>(seed: B, f: (acc: B, a: A) => readonly [C, B]): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, C>
  <R, E, A, B, C>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => readonly [C, B]): Fx<R, E, C>
}
```

Added in v1.18.0

## loopEffect

Accumulate a value over the success values of an Fx and atomically produce derived value
useing an Effect. A SynchronizedRef is utilized to ensure ordering of events.

**Signature**

```ts
export declare const loopEffect: {
  <B, A, R2, E2, C>(seed: B, f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>): <R, E>(
    fx: Fx<R, E, A>
  ) => Fx<R2 | R, E2 | E, C>
  <R, E, A, B, R2, E2, C>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>): Fx<
    R | R2,
    E | E2,
    C
  >
}
```

Added in v1.18.0

## map

Map over the success value of an Fx.

**Signature**

```ts
export declare const map: {
  <A, B>(f: (a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B>
}
```

Added in v1.18.0

## mapBoth

Map over both failure and success values of an Fx.

**Signature**

```ts
export declare const mapBoth: {
  <E, E2, A, B>(options: { readonly onFailure: (e: E) => E2; readonly onSuccess: (a: A) => B }): <R>(
    fx: Fx<R, E, A>
  ) => Fx<R, E2, B>
  <R, E, A, E2, B>(fx: Fx<R, E, A>, options: { readonly onFailure: (e: E) => E2; readonly onSuccess: (a: A) => B }): Fx<
    R,
    E2,
    B
  >
}
```

Added in v1.18.0

## mapEffect

Map the success value of an Fx to an Effect, doesn't fork any fibers like flatMap\* etc.

**Signature**

```ts
export declare const mapEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, B>
}
```

Added in v1.18.0

## middleware

Apply a function to the constructed Effect that represents the running Fx.

**Signature**

```ts
export declare const middleware: {
  <R, E, A, R2>(
    f: (effect: Effect.Effect<R, never, unknown>, sink: Sink.Sink<E, A>) => Effect.Effect<R2, never, unknown>
  ): (fx: Fx<R, E, A>) => Fx<R2, E, A>
  <R, E, A, R2>(
    fx: Fx<R, E, A>,
    f: (effect: Effect.Effect<R, never, unknown>, sink: Sink.Sink<E, A>) => Effect.Effect<R2, never, unknown>
  ): Fx<R2, E, A>
}
```

Added in v1.18.0

## orElse

Concatenate an Fx after the failure of another Fx

**Signature**

```ts
export declare const orElse: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, A>): Fx<R | R2, E2, A | B>
}
```

Added in v1.18.0

## partitionMap

Partition an Fx into two Fx's based on a either-returning function.

**Signature**

```ts
export declare const partitionMap: {
  <A, B, C>(f: (a: A) => Either.Either<B, C>): <R, E>(self: Fx<R, E, A>) => readonly [Fx<R, E, B>, Fx<R, E, C>]
  <R, E, A, B, C>(self: Fx<R, E, A>, f: (a: A) => Either.Either<B, C>): readonly [Fx<R, E, B>, Fx<R, E, C>]
}
```

Added in v1.18.0

## scan

Run a reducer over the success values of an Fx.

**Signature**

```ts
export declare const scan: {
  <A, B>(seed: B, f: (acc: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B): Fx<R, E, B>
}
```

Added in v1.18.0

## scanEffect

Run an Effect-ful reducer over the success values of an Fx.

**Signature**

```ts
export declare const scanEffect: {
  <A, B, R2, E2>(seed: B, f: (acc: B, a: A) => Effect.Effect<R2, E2, B>): <R, E>(
    fx: Fx<R, E, A>
  ) => Fx<R2 | R, E2 | E, B>
  <R, E, A, B, R2, E2>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, B>
}
```

Added in v1.18.0

## snapshot

Sample the values of an Fx, or Effect, during the events of another Fx.

**Signature**

```ts
export declare const snapshot: {
  <R2, E2, B, A, R3, E3, C>(sampled: Fx<R2, E2, B>, f: (a: A, b: B) => Effect.Effect<R3, E3, C>): <R, E>(
    fx: Fx<R, E, A>
  ) => Fx<R2 | R3 | R, E2 | E3 | E, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    sampled: Fx<R2, E2, B>,
    f: (a: A, b: B) => Effect.Effect<R3, E3, C>
  ): Fx<R | R2 | R3, E | E2 | E3, C>
}
```

Added in v1.18.0

## startWith

Prepends a value to the beginning of an Fx.

**Signature**

```ts
export declare const startWith: {
  <B>(value: B): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, B | A>
  <R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, A | B>
}
```

Added in v1.18.0

## tap

Perform an Effect for each value emitted by an Fx, not affecting the output of the Fx.

**Signature**

```ts
export declare const tap: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, B>
}
```

Added in v1.18.0

## uninterruptible

Mark an Fx as uninterruptible

**Signature**

```ts
export declare const uninterruptible: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
```

Added in v1.18.0

# concurrency

## withConcurrency

Configure the concurreny limit of Fibers running within an Fx

**Signature**

```ts
export declare const withConcurrency: {
  (concurrency: number | 'unbounded'): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, concurrency: number | 'unbounded'): Fx<R, E, A>
}
```

Added in v1.18.0

## withMaxOpsBeforeYield

Configure the maximum number of operations to run before yielding to the runtime

**Signature**

```ts
export declare const withMaxOpsBeforeYield: {
  (maxOps: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, maxOps: number): Fx<R, E, A>
}
```

Added in v1.18.0

## withScheduler

Configure the scheduler to use within an Fx

**Signature**

```ts
export declare const withScheduler: {
  (scheduler: Scheduler): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, scheduler: Scheduler): Fx<R, E, A>
}
```

Added in v1.18.0

# constructors

## acquireUseRelease

Acquire a resource, use it to construct an Fx, and then release the resource
after the Fx has exited.

**Signature**

```ts
export declare const acquireUseRelease: {
  <A, R2, E2, B, R3, E3>(
    use: (a: A) => Fx<R2, E2, B>,
    release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R3, E3, unknown>
  ): <R, E>(acquire: Effect.Effect<R, E, A>) => Fx<R2 | R3 | R, E2 | E3 | E, B>
  <R, E, A, R2, E2, B, R3, E3>(
    acquire: Effect.Effect<R, E, A>,
    use: (a: A) => Fx<R2, E2, B>,
    release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R3, E3, unknown>
  ): Fx<R | R2 | R3, E | E2 | E3, B>
}
```

Added in v1.18.0

## at

Create an Fx which will emit a value after waiting for a specified duration.

**Signature**

```ts
export declare const at: {
  (delay: DurationInput): <A>(value: A) => Fx<never, never, A>
  <A>(value: A, delay: DurationInput): Fx<never, never, A>
}
```

Added in v1.18.0

## combine

Combine multiple Fx into a single Fx that will emit the results of all Fx
as a tuple of values.

**Signature**

```ts
export declare const combine: <const FX extends readonly Fx<any, any, any>[]>(
  fxs: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, { readonly [K in keyof FX]: Fx.Success<FX[K]> }>
```

Added in v1.18.0

## die

Construct an Fx<never, never, never> from a defect

**Signature**

```ts
export declare const die: (defect: unknown) => Fx<never, never, never>
```

Added in v1.18.0

## empty

An Fx which will immediately end producing 0 events and 0 errors.

**Signature**

```ts
export declare const empty: Fx<never, never, never>
```

Added in v1.18.0

## fail

Construct an Fx which will fail with the specified error.

**Signature**

```ts
export declare const fail: <E>(error: E) => Fx<never, E, never>
```

Added in v1.18.0

## failCause

Construct an Fx<never, E, A> from a Cause<E>

**Signature**

```ts
export declare const failCause: <E>(cause: Cause.Cause<E>) => Fx<never, E, never>
```

Added in v1.18.0

## fromEffect

Construct an Fx<R, E, A> from an Effect<R, E, A>

**Signature**

```ts
export declare const fromEffect: <R, E, A>(effect: Effect.Effect<R, E, A>) => Fx<R, E, A>
```

Added in v1.18.0

## fromFxEffect

Run an Effect to produce an Fx to run.

**Signature**

```ts
export declare const fromFxEffect: <R, E, R2, E2, B>(
  fxEffect: Effect.Effect<R, E, Fx<R2, E2, B>>
) => Fx<R | R2, E | E2, B>
```

Added in v1.18.0

## fromIterable

Construct an Fx from an Iterable

**Signature**

```ts
export declare const fromIterable: {
  <A extends readonly any[]>(array: A): Fx<never, never, A[number]>
  <A>(iterable: Iterable<A>): Fx<never, never, A>
}
```

Added in v1.18.0

## fromNullable

Lift a nullable value into an Fx

**Signature**

```ts
export declare const fromNullable: <A>(value: void | A | null | undefined) => Fx<never, never, NonNullable<A>>
```

Added in v1.18.0

## fromScheduled

Schedule an Effect to run using the provided Schedule, emitting its success of failure
at the intervals specified by the Schedule.

**Signature**

```ts
export declare const fromScheduled: {
  <R2>(scheduled: Schedule.Schedule<R2, unknown, unknown>): <R, E, A>(fx: Effect.Effect<R, E, A>) => Fx<R2 | R, E, A>
  <R, E, A, R2>(fx: Effect.Effect<R, E, A>, scheduled: Schedule.Schedule<R2, unknown, unknown>): Fx<R | R2, E, A>
}
```

Added in v1.18.0

## fromSink

Construct an Fx by describing an Effectful workflow that has access to a Sink
to emit events and errors.

**Signature**

```ts
export declare const fromSink: <R, E, A>(f: (sink: Sink.Sink<E, A>) => Effect.Effect<R, E, unknown>) => Fx<R, E, A>
```

Added in v1.18.0

## gen

Utilize Effect.gen to construct an Fx

**Signature**

```ts
export declare function gen<Yield extends Effect.EffectGen<any, any, any>, R, E, A>(
  f: () => Generator<Yield, Fx<R, E, A>, any>
): Fx<R | EffectGenContext<Yield>, E | EffectGenError<Yield>, A>
```

Added in v1.18.0

## interrupt

Interrupt the current Fx with the specified FiberId

**Signature**

```ts
export declare const interrupt: (id: FiberId.FiberId) => Fx<never, never, never>
```

Added in v1.18.0

## merge

Combine multiple Fx into a single Fx that will emit the results of all Fx
as they occur.

**Signature**

```ts
export declare const merge: <const FX extends readonly Fx<any, any, any>[]>(
  fxs: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
```

Added in v1.18.0

## mergeBuffer

Combine multiple Fx into a single Fx that will emit the results of all Fx
in the order the Fx were provided. All Fx will be executed concurrently,
and the results will be buffered if necessary to preserve ordering.

**Signature**

```ts
export declare const mergeBuffer: <const FX extends readonly Fx<any, any, any>[]>(
  fxs: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
```

Added in v1.18.0

## mergeBufferConcurrently

Combine multiple Fx into a single Fx that will emit the results of all Fx
in the order the Fx were provided. All Fx will be executed concurrently, limited
by the provided concurrency, and the results will be buffered if necessary to preserve ordering.

**Signature**

```ts
export declare const mergeBufferConcurrently: {
  (concurrency: number): <const FX extends readonly Fx<any, any, any>[]>(
    fxs: FX
  ) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
  <const FX extends readonly Fx<any, any, any>[]>(fxs: FX, concurrency: number): Fx<
    Fx.Context<FX[number]>,
    Fx.Error<FX[number]>,
    Fx.Success<FX[number]>
  >
}
```

Added in v1.18.0

## mergeConcurrently

Combine multiple Fx into a single Fx that will emit the results of all Fx
as they occur, but only allowing `n` concurrent Fx to run at a time.

**Signature**

```ts
export declare const mergeConcurrently: {
  (concurrency: number): <const FX extends readonly Fx<any, any, any>[]>(
    fxs: FX
  ) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
  <const FX extends readonly Fx<any, any, any>[]>(fxs: FX, concurrency: number): Fx<
    Fx.Context<FX[number]>,
    Fx.Error<FX[number]>,
    Fx.Success<FX[number]>
  >
}
```

Added in v1.18.0

## mergeSwitch

Merge together multiple Fx into a single Fx that will emit the results of all Fx
allowing only 1 Fx to run at a time.

**Signature**

```ts
export declare const mergeSwitch: <const FX extends readonly Fx<any, any, any>[]>(
  fxs: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
```

Added in v1.18.0

## never

An Fx which will never emit any errors or events, and will never end

**Signature**

```ts
export declare const never: Fx<never, never, never>
```

Added in v1.18.0

## periodic

Schedule an Effect to run at the specified duration.

**Signature**

```ts
export declare const periodic: {
  (duration: DurationInput): <R, E, A>(fx: Effect.Effect<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Effect.Effect<R, E, A>, duration: DurationInput): Fx<R, E, A>
}
```

Added in v1.18.0

## race

Merge together multiple Fx into a single Fx that will emit the results of the
first Fx to emit a value.

**Signature**

```ts
export declare const race: <const FX extends readonly Fx<any, any, any>[]>(
  fxs: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
```

Added in v1.18.0

## struct

Combine a record of Fx into a single Fx that will emit the results of all Fx
as a record of values.

**Signature**

```ts
export declare const struct: <const FX extends Readonly<Record<string, Fx<any, any, any>>>>(
  fxs: FX
) => Fx<Fx.Context<FX[string]>, Fx.Error<FX[string]>, { readonly [K in keyof FX]: Fx.Success<FX[K]> }>
```

Added in v1.18.0

## succeed

Construct an Fx which will emit the specified value and then end.

**Signature**

```ts
export declare const succeed: <A>(value: A) => Fx<never, never, A>
```

Added in v1.18.0

## succeedNone

Create an Fx which will succeed with Option.None

**Signature**

```ts
export declare const succeedNone: <A = never>() => Fx<never, never, Option.Option<A>>
```

Added in v1.18.0

## succeedSome

Create an Fx which will succeed with Option.Some

**Signature**

```ts
export declare const succeedSome: <A>(value: A) => Fx<never, never, Option.Option<A>>
```

Added in v1.18.0

## suspend

Lazily construct an Fx.

**Signature**

```ts
export declare const suspend: <R, E, A>(f: () => Fx<R, E, A>) => Fx<R, E, A>
```

Added in v1.18.0

## sync

Construct an Fx which will emit the return of a synchronous function and then end.

**Signature**

```ts
export declare const sync: <A>(f: () => A) => Fx<never, never, A>
```

Added in v1.18.0

## withEarlyExit

Construct an Fx which can exit early from a Scope.

**Signature**

```ts
export declare const withEarlyExit: <R, E, A>(
  f: (params: WithEarlyExitParams<E, A>) => Effect.Effect<R, never, unknown>
) => Fx<R, E, A>
```

Added in v1.18.0

## withFlattenStrategy

Construct an Fx which can flatten nested Fx.

**Signature**

```ts
export declare const withFlattenStrategy: <R, E, A>(
  f: (params: WithFlattenStrategyParams<E, A>) => Effect.Effect<R, never, unknown>,
  strategy: FlattenStrategy
) => Fx<R, E, A>
```

Added in v1.18.0

## withScopedFork

Construct an Fx which can fork effects into a Scope.

**Signature**

```ts
export declare const withScopedFork: <R, E, A>(
  f: (params: WithScopedForkParams<E, A>) => Effect.Effect<R, never, unknown>
) => Fx<R, E, A>
```

Added in v1.18.0

# context

## provideContext

Provide the environment to an Fx.

**Signature**

```ts
export declare const provideContext: {
  <R>(context: Context<R>): <E, A>(fx: Fx<R, E, A>) => Fx<never, E, A>
  <R, E, A>(fx: Fx<R, E, A>, context: Context<R>): Fx<never, E, A>
}
```

Added in v1.18.0

## provideLayer

Provide the environment to an Fx using a Layer.

**Signature**

```ts
export declare const provideLayer: {
  <R2, E2, R>(layer: Layer.Layer<R2, E2, R>): <E, A>(fx: Fx<R, E, A>) => Fx<R2, E2 | E, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, R>): Fx<R2, E | E2, A>
}
```

Added in v1.18.0

## provideService

Provide a service to an Fx using a Tag.

**Signature**

```ts
export declare const provideService: {
  <I, S>(tag: Tag<I, S>, service: S): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, I>, E, A>
  <R, E, A, I, S>(fx: Fx<R, E, A>, tag: Tag<I, S>, service: S): Fx<Exclude<R, I>, E, A>
}
```

Added in v1.18.0

## provideServiceEffect

Provide a service using an Effect to an Fx using a Tag.

**Signature**

```ts
export declare const provideServiceEffect: {
  <I, S, R2, E2>(tag: Tag<I, S>, service: Effect.Effect<R2, E2, S>): <R, E, A>(
    fx: Fx<R, E, A>
  ) => Fx<R2 | Exclude<R, I>, E, A>
  <R, E, A, I, S, R2, E2>(fx: Fx<R, E, A>, tag: Tag<I, S>, service: Effect.Effect<R2, E2, S>): Fx<
    R2 | Exclude<R, I>,
    E,
    A
  >
}
```

Added in v1.18.0

## provideSomeContext

Provide some of the environment to an Fx.

**Signature**

```ts
export declare const provideSomeContext: {
  <R2>(context: Context<R2>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, R2>, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, context: Context<R2>): Fx<Exclude<R, R2>, E, A>
}
```

Added in v1.18.0

## provideSomeLayer

Provide some of the environment to an Fx using a Layer.

**Signature**

```ts
export declare const provideSomeLayer: {
  <R2, E2, S>(layer: Layer.Layer<R2, E2, S>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | Exclude<R, S>, E2 | E, A>
  <R, E, A, R2, E2, S>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, S>): Fx<R2 | Exclude<R, S>, E | E2, A>
}
```

Added in v1.18.0

## scoped

Provide a Scope to an Fx

**Signature**

```ts
export declare const scoped: <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, Scope.Scope>, E, A>
```

Added in v1.18.0

# errors

## filterCause

Filter the Error of an Fx.

**Signature**

```ts
export declare const filterCause: {
  <E, E2 extends E>(f: (a: Cause.Cause<E>) => a is Cause.Cause<E2>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <E>(f: (a: Cause.Cause<E>) => boolean): <R, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, E2 extends E, A>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => a is Cause.Cause<E2>): Fx<R, E2, A>
  <R, E, A>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => boolean): Fx<R, E, A>
}
```

Added in v1.18.0

## filterMapCause

Filter and map the Error of an Fx.

**Signature**

```ts
export declare const filterMapCause: {
  <E, E2>(f: (a: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>): Fx<R, E2, A>
}
```

Added in v1.18.0

## mapError

Map over the Error of an Fx.

**Signature**

```ts
export declare const mapError: {
  <E, E2>(f: (a: E) => E2): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (a: E) => E2): Fx<R, E2, A>
}
```

Added in v1.18.0

## mapErrorCause

Map over the Cause of an Fx.

**Signature**

```ts
export declare const mapErrorCause: {
  <E, E2>(f: (a: Cause.Cause<E>) => Cause.Cause<E2>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => Cause.Cause<E2>): Fx<R, E2, A>
}
```

Added in v1.18.0

# flattening

## concatMap

Map the success value of an Fx to another Fx one at a time.

**Signature**

```ts
export declare const concatMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
}
```

Added in v1.18.0

## exhaust

Flatten a nested Fx, prefering the first
Fx emitted and dropping any subsequent Fx until it has completed.

**Signature**

```ts
export declare const exhaust: <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => Fx<R | R2, E | E2, A>
```

Added in v1.18.0

## exhaustLatest

Flatten a nested Fx, prefering the first until completion, and then running the last emitted Fx if they are not
the same Fx.

**Signature**

```ts
export declare const exhaustLatest: <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => Fx<R | R2, E | E2, A>
```

Added in v1.18.0

## exhaustLatestMatchCause

Map over the failures and successes of an Fx, prefering the first

**Signature**

```ts
export declare const exhaustLatestMatchCause: {
  <E, R2, E2, B, A, R3, E3, C>(options: {
    readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
    readonly onSuccess: (a: A) => Fx<R3, E3, C>
  }): <R>(fx: Fx<R, E, A>) => Fx<R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
}
```

Added in v1.18.0

## exhaustMap

Map the success value of an Fx to another Fx, prefering the first
Fx emitted and dropping any subsequent Fx until it has completed.

**Signature**

```ts
export declare const exhaustMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
}
```

Added in v1.18.0

## exhaustMapCause

Map the failures of an Fx to another Fx, prefering the first
Fx emitted and dropping any subsequent Fx until it has completed.

**Signature**

```ts
export declare const exhaustMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
}
```

Added in v1.18.0

## exhaustMapLatest

Map the success value of an Fx to another Fx, prefering the first
until completion, and then running the last emitted Fx if they are not
the same Fx.

**Signature**

```ts
export declare const exhaustMapLatest: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
}
```

Added in v1.18.0

## exhaustMapLatestCause

Map the failures of an Fx to another Fx, prefering the first
until completion, and then running the last emitted Fx if they are not
the same Fx.

**Signature**

```ts
export declare const exhaustMapLatestCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
}
```

Added in v1.18.0

## exhaustMatchCause

Map over the failures and successes of an Fx, prefering the first
Fx emitted and dropping any subsequent Fx until it has completed.

**Signature**

```ts
export declare const exhaustMatchCause: {
  <E, R2, E2, B, A, R3, E3, C>(options: {
    readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
    readonly onSuccess: (a: A) => Fx<R3, E3, C>
  }): <R>(fx: Fx<R, E, A>) => Fx<R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
}
```

Added in v1.18.0

## flatMap

Map the success value of an Fx to another Fx with unbounded concurrency.

**Signature**

```ts
export declare const flatMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
}
```

Added in v1.18.0

## flatMapCause

Map the failures of an Fx to another Fx, flattening the result with unbounded concurrency.

**Signature**

```ts
export declare const flatMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
}
```

Added in v1.18.0

## flatMapCauseConcurrently

Map the failures of an Fx to another Fx with the specified concurrency.

**Signature**

```ts
export declare const flatMapCauseConcurrently: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>, concurrency: number): <R, A>(
    fx: Fx<R, E, A>
  ) => Fx<R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>, concurrency: number): Fx<
    R | R2,
    E2,
    A | B
  >
}
```

Added in v1.18.0

## flatMapCauseWithStrategy

Map the failures of an Fx to another Fx, flattening the result
with the provided FlattenStrategy.

**Signature**

```ts
export declare const flatMapCauseWithStrategy: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>, strategy: FlattenStrategy): <R, A>(
    fx: Fx<R, E, A>
  ) => Fx<R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>, strategy: FlattenStrategy): Fx<
    R | R2,
    E2,
    A | B
  >
}
```

Added in v1.18.0

## flatMapConcurrently

Map the success value of an Fx to another Fx with the specified concurrency.

**Signature**

```ts
export declare const flatMapConcurrently: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>, concurrency: number): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>, concurrency: number): Fx<R | R2, E | E2, B>
}
```

Added in v1.18.0

## flatMapWithStrategy

Map the success value of an Fx to another Fx, flattening the result
with the provided FlattenStrategy.

**Signature**

```ts
export declare const flatMapWithStrategy: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>, strategy: FlattenStrategy): <R, E>(
    fx: Fx<R, E, A>
  ) => Fx<R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>, strategy: FlattenStrategy): Fx<R | R2, E | E2, B>
}
```

Added in v1.18.0

## flatten

Map the success value of an Fx to another Fx with unbounded concurrency.

**Signature**

```ts
export declare const flatten: <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => Fx<R | R2, E | E2, A>
```

Added in v1.18.0

## matchCause

Map over the failures and successes of an Fx, flattening both with unbounded concurrency.

**Signature**

```ts
export declare const matchCause: {
  <E, R2, E2, B, A, R3, E3, C>(options: {
    readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
    readonly onSuccess: (a: A) => Fx<R3, E3, C>
  }): <R>(fx: Fx<R, E, A>) => Fx<R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
}
```

Added in v1.18.0

## matchCauseConcurrently

Map over the failures and successes of an Fx, flattening both with the specified concurrency.

**Signature**

```ts
export declare const matchCauseConcurrently: {
  <E, R2, E2, B, A, R3, E3, C>(options: {
    readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
    readonly onSuccess: (a: A) => Fx<R3, E3, C>
    readonly concurrency: number
  }): <R>(fx: Fx<R, E, A>) => Fx<R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
      readonly concurrency: number
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
}
```

Added in v1.18.0

## matchCauseWithStrategy

Map over the failures and successes of an Fx, flattening both using the same strategy.

**Signature**

```ts
export declare const matchCauseWithStrategy: {
  <E, R2, E2, B, A, R3, E3, C>(options: {
    readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
    readonly onSuccess: (a: A) => Fx<R3, E3, C>
    readonly strategy: FlattenStrategy
  }): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2, B | A>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
      readonly strategy: FlattenStrategy
    }
  ): Fx<R | R2, E2 | E3, B | C>
}
```

Added in v1.18.0

## switchMap

Map the success value of an Fx to another Fx, switching to the latest
Fx emitted and interrupting the previous.

**Signature**

```ts
export declare const switchMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
}
```

Added in v1.18.0

## switchMapCause

Map the failures of an Fx to another Fx, switching to the latest
Fx emitted and interrupting the previous.

**Signature**

```ts
export declare const switchMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2, B | A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
}
```

Added in v1.18.0

## switchMatchCause

Map over the failures and successes of an Fx, switching to the latest
Fx emitted and interrupting the previous.

**Signature**

```ts
export declare const switchMatchCause: {
  <E, R2, E2, B, A, R3, E3, C>(options: {
    readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
    readonly onSuccess: (a: A) => Fx<R3, E3, C>
  }): <R>(fx: Fx<R, E, A>) => Fx<R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
}
```

Added in v1.18.0

# lifecycles

## onError

Run an Effect when an Fx ends with an error

**Signature**

```ts
export declare const onError: {
  <R2>(f: (cause: Cause.Cause<never>) => Effect.Effect<R2, never, unknown>): <R, E, A>(
    fx: Fx<R, E, A>
  ) => Fx<R2 | R, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<never>) => Effect.Effect<R2, never, unknown>): Fx<R | R2, E, A>
}
```

Added in v1.18.0

## onExit

Run an Effect when an Fx exits

**Signature**

```ts
export declare const onExit: {
  <R2>(f: (exit: Exit.Exit<never, unknown>) => Effect.Effect<R2, never, unknown>): <R, E, A>(
    fx: Fx<R, E, A>
  ) => Fx<R2 | R, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, f: (exit: Exit.Exit<never, unknown>) => Effect.Effect<R2, never, unknown>): Fx<
    R | R2,
    E,
    A
  >
}
```

Added in v1.18.0

## onInterrupt

Run an Effect when an Fx is interrupted

**Signature**

```ts
export declare const onInterrupt: {
  <R2>(f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<R2, never, unknown>): <R, E, A>(
    fx: Fx<R, E, A>
  ) => Fx<R2 | R, E, A>
  <R, E, A, R2>(
    fx: Fx<R, E, A>,
    f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<R2, never, unknown>
  ): Fx<R | R2, E, A>
}
```

Added in v1.18.0

# logging

## withLogSpan

Add a span to your log messages

**Signature**

```ts
export declare const withLogSpan: {
  (span: string): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, span: string): Fx<R, E, A>
}
```

Added in v1.18.0

# models

## Fx (interface)

Fx<R, E, A> is a representation of an `Effect`-ful workflow that exists over
the time dimension. It operates within a context `R`, can fail with an `E`,
and succeed with an `A`.

**Signature**

```ts
export interface Fx<R, E, A> extends Fx.Variance<R, E, A>, Pipeable, Inspectable {}
```

Added in v1.18.0

## FxFork (type alias)

Type-alias for Effect.forkIn(scope) which runs the Effect runtime
of an Fx in a Scope. Used in for higher-order operators.

**Signature**

```ts
export type FxFork = <R>(effect: Effect.Effect<R, never, void>) => Effect.Effect<R, never, void>
```

Added in v1.18.0

## ScopedFork (type alias)

Type-alias for a Effect.forkIn(scope) that returns a Fiber

**Signature**

```ts
export type ScopedFork = <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<R, never, Fiber.Fiber<E, A>>
```

Added in v1.18.0

# params

## WithEarlyExitParams (type alias)

Params for withEarlyExit

**Signature**

```ts
export type WithEarlyExitParams<E, A> = {
  readonly sink: Sink.WithEarlyExit<E, A>
  readonly fork: ScopedFork
  readonly scope: Scope.Scope
}
```

Added in v1.18.0

## WithFlattenStrategyParams (type alias)

Params for withFlattenStrategy

**Signature**

```ts
export type WithFlattenStrategyParams<E, A> = {
  readonly sink: Sink.Sink<E, A>
  readonly fork: FxFork
  readonly scope: Scope.Scope
}
```

Added in v1.18.0

## WithScopedForkParams (type alias)

Params for withScopedFork

**Signature**

```ts
export type WithScopedForkParams<E, A> = {
  readonly sink: Sink.Sink<E, A>
  readonly fork: ScopedFork
  readonly scope: Scope.Scope
}
```

Added in v1.18.0

# running

## drain

Run an Fx to completion. The Effect will resolve with the first Error of the Fx.

**Signature**

```ts
export declare const drain: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, void>
```

Added in v1.18.0

## findFirst

Run an Fx until finding a value which satisfies the predicate.

**Signature**

```ts
export declare const findFirst: {
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(
    fx: Fx<R, E, A>
  ) => Effect.Effect<R2 | R, E2 | E, Option.Option<A>>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, boolean>): Effect.Effect<
    R | R2,
    E | E2,
    Option.Option<A>
  >
}
```

Added in v1.18.0

## observe

Observe an Fx with the provided success value handler. The
Effect will resolve with the first Error of the Fx.

**Signature**

```ts
export declare const observe: {
  <A, R2, E2>(onSuccees: (a: A) => Effect.Effect<R2, E2, unknown>): <R, E>(
    fx: Fx<R, E, A>
  ) => Effect.Effect<R2 | R, E2 | E, void>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, onSuccees: (a: A) => Effect.Effect<R2, E2, unknown>): Effect.Effect<
    R | R2,
    E | E2,
    void
  >
}
```

Added in v1.18.0

## reduce

Reduce an Fx to a single value.

**Signature**

```ts
export declare const reduce: {
  <A, B>(seed: B, f: (acc: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B): Effect.Effect<R, E, B>
}
```

Added in v1.18.0

## run

Run an Fx to completion with the provided Sink. The
Effect will resolve with the first Error of the Fx.

**Signature**

```ts
export declare const run: <R, E, A, R2>(
  fx: Fx<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
) => Effect.Effect<R | R2, never, unknown>
```

Added in v1.18.0

## toArray

Run an Fx to completion, collecting all emitted values into an Array.

**Signature**

```ts
export declare const toArray: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, A[]>
```

Added in v1.18.0

## toChunk

Run an Fx to completion, collecting all emitted values into a Chunk.

**Signature**

```ts
export declare const toChunk: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
```

Added in v1.18.0

## toReadonlyArray

Run an Fx to completion, collecting all emitted values into a ReadonlyArray.

**Signature**

```ts
export declare const toReadonlyArray: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, readonly A[]>
```

Added in v1.18.0

# sharing

## hold

Effeciently share an underlying stream with multiple subscribers, saving the most
recent event and emitting it to new subscribers.

**Signature**

```ts
export declare const hold: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
```

Added in v1.18.0

## multicast

Effeciently share an underlying stream with multiple subscribers.

**Signature**

```ts
export declare const multicast: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
```

Added in v1.18.0

## replay

Effeciently share an underlying stream with multiple subscribers,
saving up to the most recent `n` events and emitting them to new subscribers.

**Signature**

```ts
export declare const replay: {
  (capacity: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, capacity: number): Fx<R, E, A>
}
```

Added in v1.18.0

## share

Share the output of an Fx, or Effect, with other Fx's using the behavior of the
provided Subject.

**Signature**

```ts
export declare const share: <R, E, A, R2>(fx: Fx<R, E, A>, subject: Subject<R2, E, A>) => Fx<R | R2, E, A>
```

Added in v1.18.0

# slicing

## drop

Drop a number of values from an Fx.

**Signature**

```ts
export declare const drop: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
}
```

Added in v1.18.0

## dropAfter

Drop values from an Fx after the predicate returns true.

**Signature**

```ts
export declare const dropAfter: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
}
```

Added in v1.18.0

## dropUntil

Drop values from an Fx until the predicate returns true.

**Signature**

```ts
export declare const dropUntil: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
}
```

Added in v1.18.0

## dropWhile

Drop values from an Fx while the predicate returns true.

**Signature**

```ts
export declare const dropWhile: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
}
```

Added in v1.18.0

## skipRepeats

Skip repeated values, using @effect/data/Equal for value comparison.

**Signature**

```ts
export declare const skipRepeats: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
```

Added in v1.18.0

## skipRepeatsWith

Skip repeated values, using the provided Equivalence to compare values.

**Signature**

```ts
export declare const skipRepeatsWith: {
  <A>(eq: Equivalence<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, eq: Equivalence<A>): Fx<R, E, A>
}
```

Added in v1.18.0

## slice

Skip and take a number of values from an Fx.

**Signature**

```ts
export declare const slice: {
  (skip: number, take: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, skip: number, take: number): Fx<R, E, A>
}
```

Added in v1.18.0

## take

Take a number of values from an Fx.

**Signature**

```ts
export declare const take: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
}
```

Added in v1.18.0

## takeUntil

Take values from an Fx until the predicate returns true.

**Signature**

```ts
export declare const takeUntil: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
}
```

Added in v1.18.0

## takeWhile

Take values from an Fx while the predicate returns true.

**Signature**

```ts
export declare const takeWhile: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
}
```

Added in v1.18.0

# time slicing

## debounce

Create an Fx which will wait a specified duration of time where no
events have occurred before emitting a value.

**Signature**

```ts
export declare const debounce: {
  (delay: DurationInput): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: DurationInput): Fx<R, E, A>
}
```

Added in v1.18.0

## during

Listen to the events of an Fx within the provided window. When the window Fx
emits the inner stream, the fx will begin allowing events to pass through,
and when the inner stream emits, the fx will be interrupted.

**Signature**

```ts
export declare const during: {
  <R2, E2, R3, E3>(window: Fx<R2, E2, Fx<R3, E3, unknown>>): <R, E, A>(
    fx: Fx<R, E, A>
  ) => Fx<R2 | R3 | R, E2 | E3 | E, A>
  <R, E, A, R2, E2, R3, E3>(fx: Fx<R, E, A>, window: Fx<R2, E2, Fx<R3, E3, unknown>>): Fx<R | R2 | R3, E | E2 | E3, A>
}
```

Added in v1.18.0

## since

Listen to the events of an Fx after the provided window emits.

**Signature**

```ts
export declare const since: {
  <R2, E2>(window: Fx<R2, E2, unknown>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, window: Fx<R2, E2, unknown>): Fx<R | R2, E | E2, A>
}
```

Added in v1.18.0

## throttle

Create an Fx which will wait a specified duration of time before emitting
an event after the last event.

**Signature**

```ts
export declare const throttle: {
  (delay: DurationInput): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: DurationInput): Fx<R, E, A>
}
```

Added in v1.18.0

## until

Listen to the events of an Fx until the provided window emits.

**Signature**

```ts
export declare const until: {
  <R2, E2>(window: Fx<R2, E2, unknown>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2 | E, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, window: Fx<R2, E2, unknown>): Fx<R | R2, E | E2, A>
}
```

Added in v1.18.0

# tracing

## withParentSpan

Set the parent Span of an Fx

**Signature**

```ts
export declare const withParentSpan: {
  (parentSpan: Tracer.ParentSpan): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, parentSpan: Tracer.ParentSpan): Fx<R, E, A>
}
```

Added in v1.18.0

## withSpan

Set the span of an Fx

**Signature**

```ts
export declare const withSpan: {
  (
    name: string,
    options?: {
      readonly attributes?: Record<string, Tracer.AttributeValue>
      readonly links?: ReadonlyArray<Tracer.SpanLink>
      readonly parent?: Tracer.ParentSpan
      readonly root?: boolean
      readonly context?: Context<never>
    }
  ): <R, E, A>(self: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(
    self: Fx<R, E, A>,
    name: string,
    options?: {
      readonly attributes?: Record<string, Tracer.AttributeValue>
      readonly links?: ReadonlyArray<Tracer.SpanLink>
      readonly parent?: Tracer.ParentSpan
      readonly root?: boolean
      readonly context?: Context<never>
    }
  ): Fx<R, E, A>
}
```

Added in v1.18.0

## withTracer

Set the tracer used within an Fx

**Signature**

```ts
export declare const withTracer: {
  (tracer: Tracer.Tracer): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, tracer: Tracer.Tracer): Fx<R, E, A>
}
```

Added in v1.18.0

## withTracerTiming

Enable/disable tracer timing for an Fx

**Signature**

```ts
export declare const withTracerTiming: {
  (enabled: boolean): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, enabled: boolean): Fx<R, E, A>
}
```

Added in v1.18.0

# utils

## EffectGenContext (type alias)

Extract the context from an EffectGen

**Signature**

```ts
export type EffectGenContext<T> = [T] extends [never]
  ? never
  : [T] extends [Effect.EffectGen<infer R, any, any>]
  ? R
  : never
```

Added in v1.18.0

## EffectGenError (type alias)

Extract the error from an EffectGen

**Signature**

```ts
export type EffectGenError<T> = [T] extends [never]
  ? never
  : [T] extends [Effect.EffectGen<any, infer E, any>]
  ? E
  : never
```

Added in v1.18.0

## EffectGenSuccess (type alias)

Extract the success value from an EffectGen

**Signature**

```ts
export type EffectGenSuccess<T> = [T] extends [never]
  ? never
  : [T] extends [Effect.EffectGen<any, any, infer A>]
  ? A
  : never
```

Added in v1.18.0

## Fx (namespace)

Added in v1.18.0

### Variance (interface)

Configures the variance of an Fx

**Signature**

```ts
export interface Variance<R, E, A> {
  readonly [TypeId]: {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _A: (_: never) => A
  }
}
```

Added in v1.18.0

### Context (type alias)

Extract the Context, Error, or Success type from an Fx

**Signature**

```ts
export type Context<T> = T extends Fx<infer R, infer _E, infer _A> ? R : never
```

Added in v1.18.0

### Error (type alias)

Extract the Error type from an Fx

**Signature**

```ts
export type Error<T> = T extends Fx<infer _R, infer E, infer _A> ? E : never
```

Added in v1.18.0

### Success (type alias)

Extract the Success type from an Fx

**Signature**

```ts
export type Success<T> = T extends Fx<infer _R, infer _E, infer A> ? A : never
```

Added in v1.18.0

## keyed

Convert a list of keyed values into persistent workflows for given each key of the list
even when the list has been re-ordered.

**Signature**

```ts
export declare const keyed: {
  <A, R2, E2, B, C>(f: (ref: RefSubject<never, A>, key: C) => Fx<R2, E2, B>, getKey: (a: A) => C): <R, E>(
    fx: Fx<R, E, readonly A[]>
  ) => Fx<R2 | R, E2 | E, readonly B[]>
  <R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, readonly A[]>,
    f: (ref: RefSubject<never, A>, key: C) => Fx<R2, E2, B>,
    getKey: (a: A) => C
  ): Fx<R | R2, E | E2, readonly B[]>
}
```

Added in v1.18.0
