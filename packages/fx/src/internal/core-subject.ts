import * as MutableRef from "@effect/data/MutableRef"
import * as Option from "@effect/data/Option"
import type { Cause } from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Scope from "@effect/io/Scope"
import { Commit, fromSink } from "@typed/fx/internal/core2"
import type { Fx, Subject } from "@typed/fx/internal/core2"
import { RingBuffer } from "@typed/fx/internal/helpers"
import type { Sink } from "@typed/fx/internal/sink"

export function makeSubject<E, A>(): Subject<never, E, A> {
  return new SubjectImpl<E, A>()
}

export function makeHoldSubject<E, A>(): Subject<never, E, A> {
  return new HoldSubjectImpl<E, A>()
}

export function makeReplaySubject<E, A>(capacity: number): Subject<never, E, A> {
  return new ReplaySubjectImpl<E, A>(new RingBuffer(capacity))
}

class SubjectImpl<E, A> extends Commit<never, E, A> implements Subject<never, E, A> {
  protected sinks: Set<Sink<E, A>> = new Set()

  // Emit a failure to all sinks
  onFailure = (cause: Cause<E>) => Effect.forEach(this.sinks, (sink) => sink.onFailure(cause))

  // Emit an event to all sinks
  onSuccess = (a: A) => Effect.forEach(this.sinks, (sink) => sink.onSuccess(a))

  commit(): Fx<never, E, A> {
    return fromSink<never, E, A>((sink) => this.addSink(sink, Effect.zipRight(Effect.never)))
  }

  protected addSink<R2, B>(
    sink: Sink<E, A>,
    f: (effect: Effect.Effect<never, never, number>) => Effect.Effect<R2, never, B>
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
          f
        ),
      (scope, exit) => Scope.close(scope, exit)
    )
  }
}

class HoldSubjectImpl<E, A> extends SubjectImpl<E, A> implements Subject<never, E, A> {
  private lastValue: MutableRef.MutableRef<Option.Option<A>> = MutableRef.make(Option.none())

  // Emit an event to all sinks
  onSuccess = (a: A) =>
    Effect.suspend(() => {
      MutableRef.set(this.lastValue, Option.some(a))

      return Effect.forEach(this.sinks, (sink) => sink.onSuccess(a))
    })

  commit(): Fx<never, E, A> {
    return fromSink<never, E, A>((sink) =>
      this.addSink(sink, (effect) =>
        effect.pipe(
          Effect.tap(() =>
            Option.match(MutableRef.get(this.lastValue), {
              onNone: () => Effect.unit,
              onSome: sink.onSuccess
            })
          ),
          Effect.zipRight(Effect.never)
        ))
    )
  }
}

class ReplaySubjectImpl<E, A> extends SubjectImpl<E, A> {
  constructor(readonly buffer: RingBuffer<A>) {
    super(buffer)
  }

  // Emit an event to all sinks
  onSuccess = (a: A) =>
    Effect.suspend(() => {
      this.buffer.push(a)

      return Effect.forEach(this.sinks, (sink) => sink.onSuccess(a))
    })

  commit(): Fx<never, E, A> {
    return fromSink<never, E, A>((sink) =>
      this.addSink(sink, (effect) =>
        effect.pipe(
          Effect.tap(() => this.buffer.forEach(sink.onSuccess)),
          Effect.zipRight(Effect.never)
        ))
    )
  }
}
