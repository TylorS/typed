import * as MutableRef from "@effect/data/MutableRef"
import * as Option from "@effect/data/Option"
import type { Cause } from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Scope from "@effect/io/Scope"
import type { Fx } from "@typed/fx/Fx"
import { fromSink } from "@typed/fx/internal/core"
import { ToFx } from "@typed/fx/internal/fx-primitive"
import { RingBuffer } from "@typed/fx/internal/helpers"
import type { Sink } from "@typed/fx/Sink"
import type { Subject } from "@typed/fx/Subject"

export function makeSubject<E, A>(): Subject<never, E, A> {
  return new SubjectImpl<E, A>()
}

export function makeHoldSubject<E, A>(): Subject<never, E, A> {
  return new HoldSubjectImpl<E, A>()
}

export function makeReplaySubject<E, A>(capacity: number): Subject<never, E, A> {
  return new ReplaySubjectImpl<E, A>(new RingBuffer(capacity))
}

/**
 * @internal
 */
export class SubjectImpl<E, A> extends ToFx<never, E, A> implements Subject<never, E, A> {
  protected sinks: Set<Sink<E, A>> = new Set()

  // Emit a failure to all sinks
  onFailure = (cause: Cause<E>) => this.onCause(cause)

  // Emit an event to all sinks
  onSuccess = (a: A) => this.onEvent(a)

  toFx(): Fx<never, E, A> {
    return fromSink<never, E, A>((sink) => this.addSink(sink, () => Effect.never))
  }

  protected addSink<R2, B>(
    sink: Sink<E, A>,
    f: () => Effect.Effect<R2, never, B>
  ): Effect.Effect<R2, never, B> {
    return Effect.acquireUseRelease(
      Scope.make(),
      (scope) =>
        Effect.acquireRelease(
          Effect.sync(() => {
            this.sinks.add(sink)

            return this.sinks.size
          }),
          () => Effect.sync(() => this.sinks.delete(sink))
        ).pipe(
          Effect.provideService(Scope.Scope, scope),
          Effect.flatMap(f)
        ),
      (scope, exit) => Scope.close(scope, exit)
    )
  }

  readonly subscriberCount: Effect.Effect<never, never, number> = Effect.sync(() => this.sinks.size)

  protected onEvent(a: A) {
    return Effect.forEach(this.sinks, (sink) => sink.onSuccess(a), { concurrency: "unbounded" })
  }

  protected onCause(cause: Cause<E>) {
    return Effect.forEach(this.sinks, (sink) => sink.onFailure(cause), { concurrency: "unbounded" })
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
      this.addSink(sink, () =>
        Option.match(MutableRef.get(this.lastValue), {
          onNone: () => Effect.never,
          onSome: (a) => Effect.zipRight(sink.onSuccess(a), Effect.never)
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
      this.addSink(sink, () => Effect.zipRight(this.buffer.forEach(sink.onSuccess), Effect.never))
    )
  }
}
