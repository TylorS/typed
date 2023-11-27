import * as Chainable from "@effect/typeclass/Chainable"
import * as Covariant from "@effect/typeclass/Covariant"
import * as Invariant from "@effect/typeclass/Invariant"
import type * as Context from "@typed/context"
import { Fiber } from "effect"
import type * as Cause from "effect/Cause"
import * as Clock from "effect/Clock"
import type { ConfigProvider } from "effect/ConfigProvider"
import type { DurationInput } from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import * as Exit from "effect/Exit"
import type * as FiberId from "effect/FiberId"
import type * as FiberRef from "effect/FiberRef"
import { dual } from "effect/Function"
import type * as HashSet from "effect/HashSet"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import type * as PubSub from "effect/PubSub"
import * as Queue from "effect/Queue"
import type * as Request from "effect/Request"
import type { Scheduler } from "effect/Scheduler"
import type * as Scope from "effect/Scope"
import * as Tracer from "effect/Tracer"
import type { Fx, FxInput } from "../Fx"
import * as Sink from "../Sink"
import * as Typeclass from "../Typeclass"
import * as core from "./core"
import { run } from "./run"
import { multicast } from "./share"

/**
 * Create an Fx which will emit a value after waiting for a specified duration.
 * @since 1.18.0
 */
export const at: {
  (delay: DurationInput): <A>(value: A) => Fx<never, never, A>
  <A>(value: A, delay: DurationInput): Fx<never, never, A>
} = dual(2, function<A>(value: A, delay: DurationInput): Fx<never, never, A> {
  return core.fromEffect(Effect.delay(Effect.succeed(value), delay))
})

/**
 * Create an Fx which will wait a specified duration of time where no
 * events have occurred before emitting a value.
 * @since 1.18.0
 */
export const debounce: {
  (delay: DurationInput): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: DurationInput): Fx<R, E, A>
} = dual(2, function<R, E, A>(fx: Fx<R, E, A>, delay: DurationInput): Fx<R, E, A> {
  return core.switchMap(fx, (a) => core.fromEffect(Effect.delay(Effect.succeed(a), delay)))
})

/**
 * Create an Fx which will wait a specified duration of time before emitting
 * an event after the last event.
 * @since 1.18.0
 */
export const throttle: {
  (delay: DurationInput): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: DurationInput): Fx<R, E, A>
} = dual(2, function<R, E, A>(fx: Fx<R, E, A>, delay: DurationInput): Fx<R, E, A> {
  return core.exhaustMap(fx, (a) => core.fromEffect(Effect.delay(Effect.succeed(a), delay)))
})

/**
 * Create an Fx which will wait a specified duration of time where no
 * events have occurred before emitting a value.
 * @since 1.18.0
 */
export const delay: {
  (delay: DurationInput): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: DurationInput): Fx<R, E, A>
} = dual(2, function<R, E, A>(fx: Fx<R, E, A>, delay: DurationInput): Fx<R, E, A> {
  return core.flatMap(fx, (a) => core.fromEffect(Effect.delay(Effect.succeed(a), delay)))
})

/**
 * Run an Effect to produce an Fx to run.
 * @since 1.18.0
 */
export const fromFxEffect = <R, E, R2, E2, B>(fxEffect: Effect.Effect<R, E, Fx<R2, E2, B>>): Fx<R | R2, E | E2, B> =>
  core.fromSink((sink) => Effect.flatMap(fxEffect, (fx) => run(fx, sink)))

/**
 * Run an Effect when an Fx exits
 * @since 1.18.0
 */
export const onExit: {
  <R2>(
    f: (exit: Exit.Exit<never, unknown>) => Effect.Effect<R2, never, unknown>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E, A>
  <R, E, A, R2>(
    fx: Fx<R, E, A>,
    f: (exit: Exit.Exit<never, unknown>) => Effect.Effect<R2, never, unknown>
  ): Fx<R | R2, E, A>
} = dual(2, function onExit<R, E, A, R2>(
  fx: Fx<R, E, A>,
  f: (exit: Exit.Exit<never, unknown>) => Effect.Effect<R2, never, unknown>
): Fx<R | R2, E, A> {
  return core.middleware(fx, Effect.onExit(f))
})

/**
 * Run an Effect when an Fx is interrupted
 * @since 1.18.0
 */
export const onInterrupt: {
  <R2>(
    f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<R2, never, unknown>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E, A>
  <R, E, A, R2>(
    fx: Fx<R, E, A>,
    f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<R2, never, unknown>
  ): Fx<R | R2, E, A>
} = dual(2, function onInterrupt<R, E, A, R2>(
  fx: Fx<R, E, A>,
  f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<R2, never, unknown>
): Fx<R | R2, E, A> {
  return core.middleware(fx, Effect.onInterrupt(f))
})

/**
 * Run an Effect when an Fx ends with an error
 * @since 1.18.0
 */
export const onError: {
  <R2>(
    f: (cause: Cause.Cause<never>) => Effect.Effect<R2, never, unknown>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E, A>
  <R, E, A, R2>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<never>) => Effect.Effect<R2, never, unknown>
  ): Fx<R | R2, E, A>
} = dual(2, function onError<R, E, A, R2>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<never>) => Effect.Effect<R2, never, unknown>
): Fx<R | R2, E, A> {
  return core.middleware(fx, Effect.onError(f))
})

export const scoped = <R, E, A>(fx: Fx<R, E, A>): Fx<Exclude<R, Scope.Scope>, E, A> =>
  core.middleware(fx, Effect.scoped)

export const annotateLogs: {
  (key: string, value: unknown): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  (values: Record<string, unknown>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, key: string, value: unknown): Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, values: Record<string, unknown>): Fx<R, E, A>
} = dual(3, function annotateLogs<R, E, A>(
  fx: Fx<R, E, A>,
  key: string | Record<string, unknown>,
  value?: unknown
): Fx<R, E, A> {
  return core.middleware(fx, (effect) => Effect.annotateLogs(effect, key as string, value as unknown))
})

export const annotateSpans: {
  (key: string, value: unknown): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  (values: Record<string, unknown>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, key: string, value: unknown): Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, values: Record<string, unknown>): Fx<R, E, A>
} = dual(3, function annotateSpans<R, E, A>(
  fx: Fx<R, E, A>,
  key: string | Record<string, unknown>,
  value?: unknown
): Fx<R, E, A> {
  return core.middleware(fx, (effect) => Effect.annotateSpans(effect, key as string, value as unknown))
})

export const succeedNone = <A = never>(): Fx<never, never, Option.Option<A>> => core.succeed(Option.none<A>())

export const succeedSome = <A>(value: A): Fx<never, never, Option.Option<A>> => core.succeed(Option.some<A>(value))

export const asSome: <R, E, A>(self: Fx<R, E, A>) => Fx<R, E, Option.Option<A>> = (self) => core.map(self, Option.some)

export const asSomeError: <R, E, A>(self: Fx<R, E, A>) => Fx<R, Option.Option<E>, A> = (self) =>
  core.mapError(self, Option.some)

export const Do: Fx<never, never, {}> = core.succeed<{}>({})

export const bind: {
  <N extends string, A extends object, R2, E2, B>(
    name: Exclude<N, keyof A>,
    f: (a: A) => Fx<R2, E2, B>
  ): <R1, E1>(self: Fx<R1, E1, A>) => Fx<R1 | R2, E1 | E2, { [K in N | keyof A]: K extends keyof A ? A[K] : B }>
  <R1, E1, A1 extends object, N extends string, R2, E2, B>(
    self: Fx<R1, E1, A1>,
    name: Exclude<N, keyof A1>,
    f: (a: A1) => Fx<R2, E2, B>
  ): Fx<R1 | R2, E1 | E2, { [K in N | keyof A1]: K extends keyof A1 ? A1[K] : B }>
} = Chainable.bind(Typeclass.Monad)

export const bindTo: {
  <N extends string>(name: N): <R, E, A>(self: Fx<R, E, A>) => Fx<R, E, { [K in N]: A }>
  <R, E, A, N extends string>(self: Fx<R, E, A>, name: N): Fx<R, E, { [K_1 in N]: A }>
} = Invariant.bindTo(Typeclass.Invariant)

const let_: {
  <N extends string, A extends object, B>(
    name: Exclude<N, keyof A>,
    f: (a: A) => B
  ): <R1, E1>(self: Fx<R1, E1, A>) => Fx<R1, E1, { [K in N | keyof A]: K extends keyof A ? A[K] : B }>
  <R1, E1, A1 extends object, N extends string, B>(
    self: Fx<R1, E1, A1>,
    name: Exclude<N, keyof A1>,
    f: (a: A1) => B
  ): Fx<R1, E1, { [K in N | keyof A1]: K extends keyof A1 ? A1[K] : B }>
} = Covariant.let(Typeclass.Monad)

export { let_ as let }

export const ensuring: {
  <R2>(finalizer: Effect.Effect<R2, never, unknown>): <R, E, A>(self: Fx<R, E, A>) => Fx<R | R2, E, A>
  <R, E, A, R2>(self: Fx<R, E, A>, finalizer: Effect.Effect<R2, never, unknown>): Fx<R | R2, E, A>
} = dual(2, function<R, E, A, R2>(
  self: Fx<R, E, A>,
  finalizer: Effect.Effect<R2, never, unknown>
): Fx<R | R2, E, A> {
  return core.middleware(self, (effect) => Effect.ensuring(effect, finalizer))
})

export const exit = <R, E, A>(fx: Fx<R, E, A>): Fx<R, never, Exit.Exit<E, A>> =>
  core.matchCause(fx, {
    onFailure: (cause) => core.succeed(Exit.failCause(cause)),
    onSuccess: (a) => core.succeed(Exit.succeed(a))
  })

export const either = <R, E, A>(fx: Fx<R, E, A>): Fx<R, never, Either.Either<E, A>> =>
  core.match(fx, {
    onFailure: (error) => core.succeed(Either.left(error)),
    onSuccess: (a) => core.succeed(Either.right(a))
  })

export const findFirst: {
  <A, R2, E2>(
    f: (a: A) => Effect.Effect<R2, E2, boolean>
  ): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R | R2, E | E2, Option.Option<A>>
  <R, E, A, R2, E2>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Effect.Effect<R | R2, E | E2, Option.Option<A>>
} = dual(2, function findFirst<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Effect.Effect<R | R2, E | E2, Option.Option<A>> {
  return Effect.asyncEffect((resume) =>
    Effect.zipRight(
      run(
        fx,
        Sink.WithContext(
          (cause) => Effect.sync(() => resume(Effect.failCause(cause))),
          (a) =>
            Effect.matchCause(f(a), {
              onFailure: (cause) => resume(Effect.failCause(cause)),
              onSuccess: (b) => b ? resume(Effect.succeedSome(a)) : Effect.unit
            })
        )
      ),
      Effect.sync(() => resume(Effect.succeedNone))
    )
  )
})

export const flip = <R, E, A>(fx: Fx<R, E, A>): Fx<R, A, E> =>
  core.match(fx, {
    onFailure: (error: E) => core.succeed(error),
    onSuccess: (a) => core.fail(a)
  })

export const fromNullable = <A>(value: A | null | undefined | void): Fx<never, never, NonNullable<A>> => {
  if (value === null || value === undefined) {
    return core.empty
  } else {
    return core.succeed(value)
  }
}

const if_: {
  <R2, E2, B, R3, E3, C>(
    onTrue: FxInput<R2, E2, B>,
    onFalse: FxInput<R3, E3, C>
  ): {
    <R, E>(bool: Fx<R, E, boolean>): Fx<R | R2 | R3, E | E2 | E3, B | C>
    (bool: boolean): Fx<R2 | R3, E2 | E3, B | C>
  }

  <R, E, R2, E2, B, R3, E3, C>(
    bool: Fx<R, E, boolean>,
    onTrue: FxInput<R2, E2, B>,
    onFalse: FxInput<R3, E3, C>
  ): Fx<R | R2 | R3, E | E2 | E3, B | C>

  <R2, E2, B, R3, E3, C>(
    bool: boolean,
    onTrue: FxInput<R2, E2, B>,
    onFalse: FxInput<R3, E3, C>
  ): Fx<R2 | R3, E2 | E3, B | C>
} = dual(3, function if_<R, E, R2, E2, B, R3, E3, C>(
  bool: boolean | Fx<R, E, boolean>,
  onTrue: FxInput<R2, E2, B>,
  onFalse: FxInput<R3, E3, C>
): Fx<R | R2 | R3, E | E2 | E3, B | C> {
  if (typeof bool === "boolean") {
    return bool ? core.from(onTrue) : core.from(onFalse)
  } else {
    return core.switchMap(
      bool,
      (bool): FxInput<R2 | R3, E2 | E3, B | C> => (bool ? onTrue : onFalse)
    )
  }
})

export { if_ as if }

export const when: {
  <B, C>(
    onTrue: B,
    onFalse: C
  ): {
    <R, E>(bool: Fx<R, E, boolean>): Fx<R, E, B | C>
    (bool: boolean): Fx<never, never, B | C>
  }

  <R, E, B, C>(
    bool: Fx<R, E, boolean>,
    onTrue: B,
    onFalse: C
  ): Fx<R, E, B | C>

  <B, C>(
    bool: boolean,
    onTrue: B,
    onFalse: C
  ): Fx<never, never, B | C>
} = dual(3, function when_<R, E, B, C>(
  bool: boolean | Fx<R, E, boolean>,
  onTrue: B,
  onFalse: C
): Fx<R, E, B | C> {
  if (typeof bool === "boolean") {
    return bool ? core.from(onTrue) : core.from(onFalse)
  } else {
    return core.map(
      bool,
      (bool): B | C => (bool ? onTrue : onFalse)
    )
  }
})

export const interruptible = <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> => core.middleware(fx, Effect.interruptible)

export const uninterruptible = <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> => core.middleware(fx, Effect.uninterruptible)

export const locally: {
  <A>(self: FiberRef.FiberRef<A>, value: A): <R, E, B>(use: Fx<R, E, B>) => Fx<R, E, B>
  <R, E, B, A>(use: Fx<R, E, B>, self: FiberRef.FiberRef<A>, value: A): Fx<R, E, B>
} = dual(3, function locally<R, E, B, A>(
  use: Fx<R, E, B>,
  self: FiberRef.FiberRef<A>,
  value: A
): Fx<R, E, B> {
  return core.middleware(use, (effect) => Effect.locally(effect, self, value))
})

export const locallyWith: {
  <A>(self: FiberRef.FiberRef<A>, f: (a: A) => A): <R, E, B>(use: Fx<R, E, B>) => Fx<R, E, B>
  <R, E, B, A>(use: Fx<R, E, B>, self: FiberRef.FiberRef<A>, f: (a: A) => A): Fx<R, E, B>
} = dual(3, function locally<R, E, B, A>(
  use: Fx<R, E, B>,
  self: FiberRef.FiberRef<A>,
  f: (a: A) => A
): Fx<R, E, B> {
  return core.middleware(use, (effect) => Effect.locallyWith(effect, self, f))
})

export const withTracerTiming: {
  (enabled: boolean): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, enabled: boolean): Fx<R, E, A>
} = dual(2, function withTracerTiming<R, E, A>(
  fx: Fx<R, E, A>,
  enabled: boolean
): Fx<R, E, A> {
  return core.middleware(fx, (effect) => Effect.withTracerTiming(effect, enabled))
})

export const withConcurrency: {
  (concurrency: number | "unbounded"): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, concurrency: number | "unbounded"): Fx<R, E, A>
} = dual(2, function withConcurrency<R, E, A>(
  fx: Fx<R, E, A>,
  concurrency: number | "unbounded"
): Fx<R, E, A> {
  return core.middleware(fx, (effect) => Effect.withConcurrency(effect, concurrency))
})

export const withConfigProvider: {
  (configProvider: ConfigProvider): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, configProvider: ConfigProvider): Fx<R, E, A>
} = dual(2, function withConfigProvider<R, E, A>(
  fx: Fx<R, E, A>,
  configProvider: ConfigProvider
): Fx<R, E, A> {
  return core.middleware(fx, (effect) => Effect.withConfigProvider(effect, configProvider))
})

export const withLogSpan: {
  (span: string): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, span: string): Fx<R, E, A>
} = dual(2, function withLogSpan<R, E, A>(
  fx: Fx<R, E, A>,
  span: string
): Fx<R, E, A> {
  return core.middleware(fx, (effect) => Effect.withLogSpan(effect, span))
})

export const withMaxOpsBeforeYield: {
  (maxOps: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, maxOps: number): Fx<R, E, A>
} = dual(2, function withMaxOpsBeforeYield<R, E, A>(
  fx: Fx<R, E, A>,
  maxOps: number
): Fx<R, E, A> {
  return core.middleware(fx, (effect) => Effect.withMaxOpsBeforeYield(effect, maxOps))
})

export const withParentSpan: {
  (parentSpan: Tracer.ParentSpan): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, parentSpan: Tracer.ParentSpan): Fx<R, E, A>
} = dual(2, function withParentSpan<R, E, A>(
  fx: Fx<R, E, A>,
  parentSpan: Tracer.ParentSpan
): Fx<R, E, A> {
  return core.middleware(fx, (effect) => Effect.withParentSpan(effect, parentSpan))
})

export const withRequestBatching: {
  (requestBatching: boolean): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, requestBatching: boolean): Fx<R, E, A>
} = dual(2, function withRequestBatching<R, E, A>(
  fx: Fx<R, E, A>,
  requestBatching: boolean
): Fx<R, E, A> {
  return core.middleware(fx, (effect) => Effect.withRequestBatching(effect, requestBatching))
})

export const withRequestCache: {
  (cache: Request.Cache): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, cache: Request.Cache): Fx<R, E, A>
} = dual(2, function withRequestCache<R, E, A>(
  fx: Fx<R, E, A>,
  cache: Request.Cache
): Fx<R, E, A> {
  return core.middleware(fx, (effect) => Effect.withRequestCache(effect, cache))
})

export const withRequestCaching: {
  (requestCaching: boolean): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, requestCaching: boolean): Fx<R, E, A>
} = dual(2, function withRequestCaching<R, E, A>(
  fx: Fx<R, E, A>,
  requestCaching: boolean
): Fx<R, E, A> {
  return core.middleware(fx, (effect) => Effect.withRequestCaching(effect, requestCaching))
})

export const withScheduler: {
  (scheduler: Scheduler): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, scheduler: Scheduler): Fx<R, E, A>
} = dual(2, function withScheduler<R, E, A>(
  fx: Fx<R, E, A>,
  scheduler: Scheduler
): Fx<R, E, A> {
  return core.middleware(fx, (effect) => Effect.withScheduler(effect, scheduler))
})

export const withSpan: {
  (
    name: string,
    options?: {
      readonly attributes?: Record<string, unknown>
      readonly links?: ReadonlyArray<Tracer.SpanLink>
      readonly parent?: Tracer.ParentSpan
      readonly root?: boolean
      readonly context?: Context.Context<never>
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
      readonly context?: Context.Context<never>
    }
  ): Fx<R, E, A>
} = dual(3, function withSpan<R, E, A>(
  self: Fx<R, E, A>,
  name: string,
  options: {
    readonly attributes?: Record<string, unknown>
    readonly links?: ReadonlyArray<Tracer.SpanLink>
    readonly parent?: Tracer.ParentSpan
    readonly root?: boolean
    readonly context?: Context.Context<never>
  } = {}
): Fx<R, E, A> {
  return core.acquireUseRelease(
    Effect.flatMap(
      Effect.currentSpan,
      (parent) => Effect.makeSpan(name, { ...options, parent: options?.parent || Option.getOrUndefined(parent) } as any)
    ),
    (span) =>
      core.middleware(
        self,
        (effect) => Effect.provideService(effect, Tracer.ParentSpan, span),
        Sink.setSpan(span)
      ),
    (span, exit) => Effect.flatMap(Clock.currentTimeNanos, (time) => Effect.sync(() => span.end(time, exit)))
  )
})

export const withTracer: {
  (tracer: Tracer.Tracer): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, tracer: Tracer.Tracer): Fx<R, E, A>
} = dual(2, function withTracer<R, E, A>(
  fx: Fx<R, E, A>,
  tracer: Tracer.Tracer
): Fx<R, E, A> {
  return core.middleware(fx, (effect) => Effect.withTracer(effect, tracer))
})

export const partitionMap: {
  <A, B, C>(f: (a: A) => Either.Either<B, C>): <R, E>(self: Fx<R, E, A>) => readonly [Fx<R, E, B>, Fx<R, E, C>]
  <R, E, A, B, C>(self: Fx<R, E, A>, f: (a: A) => Either.Either<B, C>): readonly [Fx<R, E, B>, Fx<R, E, C>]
} = dual(2, <R, E, A, B, C>(self: Fx<R, E, A>, f: (a: A) => Either.Either<B, C>) => {
  // Multicast such that listening to both streams only runs the Fx once.
  const m = multicast(core.map(self, f))

  return [
    core.filterMap(m, Either.getLeft),
    core.filterMap(m, Either.getRight)
  ] as const
})

export function fromDequeue<A>(dequeue: Queue.Dequeue<A>): Fx<never, never, A>
export function fromDequeue<I, A>(dequeue: Context.Dequeue<I, A>): Fx<I, never, A>
export function fromDequeue<I, A>(dequeue: Context.Dequeue<I, A> | Queue.Dequeue<A>): Fx<I, never, A> {
  return core.fromSink((sink) =>
    Effect.repeatWhileEffect(
      Effect.matchCauseEffect(dequeue.take, sink),
      () => dequeueIsActive(dequeue)
    )
  )
}

/**
 * @internal
 */
export function dequeueIsActive<I, A>(
  dequeue: Context.Dequeue<I, A> | Queue.Dequeue<A>
): Effect.Effect<I, never, boolean> {
  if (Queue.DequeueTypeId in dequeue) {
    return Effect.sync(() => dequeue.isActive())
  } else {
    return dequeue.isActive
  }
}

export const toEnqueue: {
  <A, B>(enqueue: Queue.Enqueue<A | B>): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R, E, void>
  <I, A, B>(enqueue: Context.Enqueue<I, A | B>): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R | I, E, void>
  <R, E, A, B>(fx: Fx<R, E, A>, enqueue: Queue.Enqueue<A | B>): Effect.Effect<R, E, void>
  <R, E, I, A, B>(fx: Fx<R, E, A>, enqueue: Context.Enqueue<I, A | B>): Effect.Effect<R, E, void>
} = dual(
  2,
  function toEnqueue<R, E, I, A, B>(
    fx: Fx<R, E, A>,
    enqueue: Context.Enqueue<I, A | B> | Queue.Enqueue<A | B>
  ): Effect.Effect<R | I, E, void> {
    return core.observe(fx, (a) => enqueue.offer(a))
  }
)

export function fromPubSub<A>(PubSub: PubSub.PubSub<A>): Fx<Scope.Scope, never, A>
export function fromPubSub<I, A>(PubSub: Context.PubSub<I, A>): Fx<I | Scope.Scope, never, A>
export function fromPubSub<I, A>(PubSub: Context.PubSub<I, A> | PubSub.PubSub<A>): Fx<I | Scope.Scope, never, A> {
  return core.acquireUseRelease(
    PubSub.subscribe,
    (q) => fromDequeue(q),
    (d) => d.shutdown
  )
}

export function drainLayer<FXS extends ReadonlyArray<Fx<any, never, any>>>(...fxs: FXS): Layer.Layer<
  Exclude<Fx.Context<FXS[number]>, Scope.Scope>,
  never,
  never
> {
  return Layer.scopedDiscard(Effect.forkScoped(core.drain(core.merge(fxs))))
}

export const mergeRace: {
  <R2, E2, B>(other: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, other: Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
} = dual(
  2,
  function mergeRace<R, E, A, R2, E2, B>(fx: Fx<R, E, A>, other: Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B> {
    return core.withScopedFork(({ fork, sink }) =>
      Effect.flatMap(
        fork(run(other, sink)),
        (otherFiber) => run(core.tap(fx, () => Fiber.interrupt(otherFiber)), sink)
      )
    )
  }
)
