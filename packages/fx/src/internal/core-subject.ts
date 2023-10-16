import type { Fx } from "@typed/fx/Fx"
import { fromSink } from "@typed/fx/internal/core"
import { ToFx } from "@typed/fx/internal/fx-primitive"
import { RingBuffer } from "@typed/fx/internal/helpers"
import type { Sink } from "@typed/fx/Sink"
import type { Subject } from "@typed/fx/Subject"
import { type Cause } from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as MutableRef from "effect/MutableRef"
import * as Option from "effect/Option"
import * as Scope from "effect/Scope"

export function makeSubject<E, A>(): Subject<never, E, A> {
  return new SubjectImpl<E, A>()
}

export function makeHoldSubject<E, A>(): Subject<never, E, A> {
  return new HoldSubjectImpl<E, A>()
}

export function makeReplaySubject<E, A>(capacity: number): Subject<never, E, A> {
  return new ReplaySubjectImpl<E, A>(new RingBuffer(capacity))
}

const UNBOUNDED = { concurrency: "unbounded" } as const

/**
 * @internal
 */
export class SubjectImpl<E, A> extends ToFx<never, E, A> implements Subject<never, E, A> {
  protected sinks: Set<Sink<E, A>> = new Set()
  protected scopes: Set<Scope.CloseableScope> = new Set()

  // Emit a failure to all sinks
  onFailure = (cause: Cause<E>) => this.onCause(cause)

  // Emit an event to all sinks
  onSuccess = (a: A) => this.onEvent(a)

  interrupt = Effect.suspend(() => Effect.forEach(this.scopes, (scope) => Scope.close(scope, Exit.unit)))

  toFx(): Fx<never, E, A> {
    return fromSink<never, E, A>((sink) => this.addSink(sink, (scope) => awaitScopeClose(scope)))
  }

  protected addSink<R2, B>(
    sink: Sink<E, A>,
    f: (scope: Scope.Scope) => Effect.Effect<R2, never, B>
  ): Effect.Effect<R2, never, B> {
    return Effect.acquireUseRelease(
      Scope.make(),
      (scope) =>
        Effect.flatMap(
          Effect.provideService(
            Effect.acquireRelease(
              Effect.sync(() => {
                this.sinks.add(sink)
                this.scopes.add(scope)

                return this.sinks.size
              }),
              () =>
                Effect.sync(() => {
                  this.sinks.delete(sink)
                  this.scopes.delete(scope)
                })
            ),
            Scope.Scope,
            scope
          ),
          () => f(scope)
        ),
      (scope, exit) => Scope.close(scope, exit)
    )
  }

  readonly subscriberCount: Effect.Effect<never, never, number> = Effect.sync(() => this.sinks.size)

  protected onEvent(a: A) {
    return Effect.forEach(this.sinks, (sink) => sink.onSuccess(a), UNBOUNDED)
  }

  protected onCause(cause: Cause<E>) {
    return Effect.forEach(this.sinks, (sink) => sink.onFailure(cause), UNBOUNDED)
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

  toFx(): Fx<never, E, A> {
    return fromSink<never, E, A>((sink) =>
      this.addSink(sink, (scope) =>
        Option.match(MutableRef.get(this.lastValue), {
          onNone: () => awaitScopeClose(scope),
          onSome: (a) => Effect.zipRight(sink.onSuccess(a), awaitScopeClose(scope))
        }))
    )
  }
}

/**
 * @internal
 */
export class ReplaySubjectImpl<E, A> extends SubjectImpl<E, A> {
  constructor(readonly buffer: RingBuffer<A>) {
    super(buffer)
  }

  // Emit an event to all sinks
  onSuccess = (a: A) =>
    Effect.suspend(() => {
      this.buffer.push(a)

      return this.onEvent(a)
    })

  toFx(): Fx<never, E, A> {
    return fromSink<never, E, A>((sink) =>
      this.addSink(sink, (scope) => Effect.zipRight(this.buffer.forEach(sink.onSuccess), awaitScopeClose(scope)))
    )
  }
}

function awaitScopeClose(scope: Scope.Scope) {
  return Effect.asyncEffect<never, never, unknown, never, never, void>((cb) =>
    Scope.addFinalizerExit(scope, () => Effect.sync(() => cb(Effect.unit)))
  )
}
