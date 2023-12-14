import type { Cause, Context } from "effect"
import { Effect, ExecutionStrategy, Exit, MutableRef, Option, Scope } from "effect"
import { awaitScopeClose, RingBuffer } from "../internal/helpers"
import { FxBase } from "./internal/protos"
import type { Push } from "./Push"
import type { Sink } from "./Sink"

export interface Subject<R, E, A> extends Push<R, E, A, R | Scope.Scope, E, A> {
  readonly subscriberCount: Effect.Effect<never, never, number>
  readonly interrupt: Effect.Effect<never, never, void>
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

  run<R2>(sink: Sink<R2, E, A>): Effect.Effect<R2 | Scope.Scope, never, unknown> {
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

  readonly interrupt = Effect.suspend(() => Effect.forEach(this.scopes, (scope) => Scope.close(scope, Exit.unit)))

  protected addSink<R, R2, B>(
    sink: Sink<R, E, A>,
    f: (scope: Scope.Scope) => Effect.Effect<R2, never, B>
  ): Effect.Effect<R2 | Scope.Scope, never, B> {
    return Effect.scopeWith((outerScope) =>
      Effect.flatMap(
        Scope.fork(outerScope, ExecutionStrategy.sequential),
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
          })
      )
    )
  }

  readonly subscriberCount: Effect.Effect<never, never, number> = Effect.sync(() => this.sinks.size)

  protected onEvent(a: A) {
    if (this.sinks.size === 0) return Effect.unit
    else {
      return Effect.forEach(Array.from(this.sinks), ([sink, ctx]) => Effect.provide(sink.onSuccess(a), ctx), DISCARD)
    }
  }

  protected onCause(cause: Cause.Cause<E>) {
    return Effect.forEach(Array.from(this.sinks), ([sink, ctx]) => Effect.provide(sink.onFailure(cause), ctx), DISCARD)
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

  run<R2>(sink: Sink<R2, E, A>): Effect.Effect<R2 | Scope.Scope, never, unknown> {
    return this.addSink(sink, (scope) =>
      Option.match(MutableRef.get(this.lastValue), {
        onNone: () => awaitScopeClose(scope),
        onSome: (a) => Effect.zipRight(sink.onSuccess(a), awaitScopeClose(scope))
      }))
  }
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

  run<R2>(sink: Sink<R2, E, A>): Effect.Effect<R2 | Scope.Scope, never, unknown> {
    return this.addSink(sink, (scope) => Effect.zipRight(this.buffer.forEach(sink.onSuccess), awaitScopeClose(scope)))
  }
}

export function make<E, A>(replay: number = 0): Subject<never, E, A> {
  replay = Math.max(0, replay)

  if (replay === 0) {
    return new SubjectImpl<E, A>()
  } else if (replay === 1) {
    return new HoldSubjectImpl<E, A>()
  } else {
    return new ReplaySubjectImpl<E, A>(new RingBuffer(replay))
  }
}
