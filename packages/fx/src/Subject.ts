/**
 * Subject is an Fx type which can also be imperatively pushed into.
 * @since 1.20.0
 */

import * as C from "@typed/context"
import type { Cause, Layer, Pipeable } from "effect"
import type * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as ExecutionStrategy from "effect/ExecutionStrategy"
import * as Exit from "effect/Exit"
import { dual, identity } from "effect/Function"
import * as MutableRef from "effect/MutableRef"
import * as Option from "effect/Option"
import { hasProperty } from "effect/Predicate"
import * as Scope from "effect/Scope"
import { type Fx } from "./Fx.js"
import { provide } from "./internal/core.js"
import { awaitScopeClose, RingBuffer, withScope } from "./internal/helpers.js"
import { FxBase } from "./internal/protos.js"
import type { Push } from "./Push.js"
import type { Sink } from "./Sink.js"
import { TypeId } from "./TypeId.js"

/**
 * Subject is an Fx type which can also be imperatively pushed into.
 * @since 1.20.0
 */
export interface Subject<out R, in out E, in out A> extends Push<R, E, A, R | Scope.Scope, E, A>, Pipeable.Pipeable {
  readonly subscriberCount: Effect.Effect<number, never, R>
  readonly interrupt: Effect.Effect<void, never, R>
}

/**
 * @since 1.20.0
 */
export namespace Subject {
  /**
   * @since 1.20.0
   */
  export interface Tagged<I, E, A> extends Subject<I, E, A> {
    readonly tag: C.Tagged<I, Subject<never, E, A>>

    readonly make: (replay?: number) => Layer.Layer<I>
    readonly provide: Provide<I>
  }

  /**
   * @since 1.20.0
   */
  export type Provide<I> = <
    const Args extends
      | readonly [
        | Fx<any, any, any>
        | Effect.Effect<any, any, any>,
        number?
      ]
      | readonly [
        number
      ]
  >(
    ...args: Args
  ) => Args extends readonly [infer _ extends number] ? <T extends Fx<any, any, any> | Effect.Effect<any, any, any>>(
      fxOrEffect: T
    ) => [T] extends [Fx<infer R2, infer E2, infer B>] ? Fx<Exclude<R2, I>, E2, B>
      : [T] extends [Effect.Effect<infer B, infer E2, infer R2>] ? Effect.Effect<B, E2, Exclude<R2, I>>
      : never
    : Args extends readonly [Fx<infer R2, infer E2, infer B>] ? Fx<Exclude<R2, I>, E2, B>
    : Args extends readonly [Effect.Effect<infer B, infer E2, infer R2>] ? Effect.Effect<B, E2, Exclude<R2, I>>
    : never
}

const DISCARD = { discard: true } as const

/**
 * @internal
 */
export class SubjectImpl<E, A> extends FxBase<Scope.Scope, E, A> implements Subject<never, E, A> {
  protected sinks: Set<readonly [Sink<any, E, A>, Context.Context<any>]> = new Set()
  protected scopes: Set<Scope.CloseableScope> = new Set()

  constructor() {
    super()
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  run<R2>(sink: Sink<R2, E, A>): Effect.Effect<unknown, never, R2 | Scope.Scope> {
    return this.addSink(sink, awaitScopeClose)
  }

  // Emit a failure to all sinks
  onFailure(cause: Cause.Cause<E>) {
    return this.onCause(cause)
  }

  // Emit an event to all sinks
  onSuccess(a: A) {
    return this.onEvent(a)
  }

  readonly interrupt = Effect.fiberIdWith((id) =>
    Effect.tap(
      Effect.forEach(this.scopes, (scope) => Scope.close(scope, Exit.interrupt(id)), DISCARD),
      () => {
        this.sinks.clear()
        this.scopes.clear()
      }
    )
  )

  protected addSink<R, R2, B>(
    sink: Sink<R, E, A>,
    f: (scope: Scope.Scope) => Effect.Effect<B, never, R2>
  ): Effect.Effect<B, never, R2 | Scope.Scope> {
    return withScope(
      (innerScope) =>
        Effect.contextWithEffect((ctx) => {
          const entry = [sink, ctx] as const
          const add = Effect.sync(() => {
            this.sinks.add(entry)
            this.scopes.add(innerScope)
          })
          const remove = Effect.sync(() => {
            this.sinks.delete(entry)
            this.scopes.delete(innerScope)
          })

          return Effect.zipRight(
            Scope.addFinalizer(innerScope, remove),
            Effect.zipRight(add, f(innerScope))
          )
        }),
      ExecutionStrategy.sequential
    )
  }

  readonly subscriberCount: Effect.Effect<number> = Effect.sync(() => this.sinks.size)

  protected onEvent(a: A) {
    if (this.sinks.size === 0) return Effect.unit
    else {
      return Effect.forEach(this.sinks, ([sink, ctx]) => Effect.provide(sink.onSuccess(a), ctx), DISCARD)
    }
  }

  protected onCause(cause: Cause.Cause<E>) {
    return Effect.forEach(
      this.sinks,
      ([sink, ctx]) => Effect.provide(sink.onFailure(cause), ctx),
      DISCARD
    )
  }
}

/**
 * @internal
 */
export class HoldSubjectImpl<E, A> extends SubjectImpl<E, A> implements Subject<never, E, A> {
  private lastValue: MutableRef.MutableRef<Option.Option<A>> = MutableRef.make(Option.none())

  // Emit an event to all sinks
  onSuccess = (a: A) =>
    Effect.suspend(() => {
      MutableRef.set(this.lastValue, Option.some(a))

      return this.onEvent(a)
    })

  run<R2>(sink: Sink<R2, E, A>): Effect.Effect<unknown, never, R2 | Scope.Scope> {
    return this.addSink(sink, (scope) =>
      Option.match(MutableRef.get(this.lastValue), {
        onNone: () => awaitScopeClose(scope),
        onSome: (a) => Effect.zipRight(sink.onSuccess(a), awaitScopeClose(scope))
      }))
  }

  readonly interrupt = Effect.fiberIdWith((id) =>
    Effect.tap(
      Effect.forEach(this.scopes, (scope) => Scope.close(scope, Exit.interrupt(id)), DISCARD),
      () => MutableRef.set(this.lastValue, Option.none())
    )
  )
}

/**
 * @internal
 */
export class ReplaySubjectImpl<E, A> extends SubjectImpl<E, A> {
  constructor(readonly buffer: RingBuffer<A>) {
    super()
  }

  // Emit an event to all sinks
  onSuccess = (a: A) =>
    Effect.suspend(() => {
      this.buffer.push(a)

      return this.onEvent(a)
    })

  run<R2>(sink: Sink<R2, E, A>): Effect.Effect<unknown, never, R2 | Scope.Scope> {
    return this.addSink(
      sink,
      (scope) => Effect.zipRight(this.buffer.forEach((a) => sink.onSuccess(a)), awaitScopeClose(scope))
    )
  }

  readonly interrupt = Effect.fiberIdWith((id) =>
    Effect.tap(
      Effect.forEach(this.scopes, (scope) => Scope.close(scope, Exit.interrupt(id)), DISCARD),
      () => this.buffer.clear()
    )
  )
}

/**
 * @since 1.20.0
 */
export function unsafeMake<E, A>(replay: number = 0): Subject<never, E, A> {
  replay = Math.max(0, replay)

  if (replay === 0) {
    return new SubjectImpl<E, A>()
  } else if (replay === 1) {
    return new HoldSubjectImpl<E, A>()
  } else {
    return new ReplaySubjectImpl<E, A>(new RingBuffer(replay))
  }
}

/**
 * @since 1.20.0
 */
export function make<E, A>(replay?: number): Effect.Effect<Subject<never, E, A>, never, Scope.Scope> {
  return Effect.acquireRelease(Effect.sync(() => unsafeMake(replay)), (subject) => subject.interrupt)
}

/**
 * @since 1.20.0
 */
export function fromTag<I, S, R, E, A>(tag: C.Tag<I, S>, f: (s: S) => Subject<R, E, A>): Subject<I | R, E, A> {
  return new FromTag(tag, f)
}

class FromTag<I, S, R, E, A> extends FxBase<I | R | Scope.Scope, E, A> implements Subject<I | R, E, A> {
  private get: Effect.Effect<Subject<R, E, A>, never, I>

  readonly subscriberCount: Effect.Effect<number, never, I | R>
  readonly interrupt: Effect.Effect<void, never, I | R>

  constructor(readonly tag: C.Tag<I, S>, readonly f: (s: S) => Subject<R, E, A>) {
    super()

    this.get = Effect.map(tag, f)
    this.subscriberCount = Effect.flatMap(this.get, (subject) => subject.subscriberCount)
    this.interrupt = Effect.flatMap(this.get, (subject) => subject.interrupt)
  }

  run<R2>(sink: Sink<R2, E, A>): Effect.Effect<unknown, never, I | R | R2 | Scope.Scope> {
    return Effect.flatMap(this.get, (subject) => subject.run(sink))
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, I | R> {
    return Effect.flatMap(this.get, (subject) => subject.onFailure(cause))
  }

  onSuccess(value: A): Effect.Effect<unknown, never, I | R> {
    return Effect.flatMap(this.get, (subject) => subject.onSuccess(value))
  }
}

/**
 * @since 1.20.0
 */
export function tagged<E, A>(): {
  <const I extends C.IdentifierFactory<any>>(identifier: I): Subject.Tagged<C.IdentifierOf<I>, E, A>
  <const I>(identifier: I): Subject.Tagged<C.IdentifierOf<I>, E, A>
} {
  return <const I>(identifier: I) => new TaggedImpl(C.Tagged<I, Subject<never, E, A>>(identifier))
}

const isDataFirst = (args: IArguments): boolean =>
  args.length === 2 || Effect.isEffect(args[0]) || hasProperty(args[0], TypeId)

class TaggedImpl<I, E, A> extends FromTag<I, Subject<never, E, A>, never, E, A> implements Subject.Tagged<I, E, A> {
  readonly provide: Subject.Tagged<I, E, A>["provide"]

  constructor(readonly tag: C.Tagged<I, Subject<never, E, A>>) {
    super(tag, identity)

    this.provide = dual(
      isDataFirst,
      <R2, E2, B>(fxOrEffect: Fx<R2, E2, B> | Effect.Effect<B, E2, R2>, replay?: number) => {
        if (TypeId in fxOrEffect) return provide(fxOrEffect as Fx<Exclude<R2, I>, E2, B>, this.make(replay))
        else return Effect.provide(fxOrEffect as Effect.Effect<B, E2, R2>, this.make(replay))
      }
    )
  }

  make(replay?: number): Layer.Layer<I> {
    return this.tag.scoped(make(replay))
  }
}
