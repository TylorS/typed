import type { Cause } from "effect"
import { Effect, Schedule } from "effect"
import type * as Sink from "../Sink"

export type EffectProducer<R = any, E = any, A = any> =
  | FromEffect<R, E, A>
  | FromScheduled<R, E, any, A>
  | Scheduled<R, E, A, any>

export interface FromEffect<R, E, A> {
  readonly _tag: "FromEffect"
  readonly source: Effect.Effect<R, E, A>
}

export function FromEffect<R, E, A>(source: Effect.Effect<R, E, A>): FromEffect<R, E, A> {
  return { _tag: "FromEffect", source }
}

export interface FromScheduled<R, E, I, O> {
  readonly _tag: "FromScheduled"
  readonly input: Effect.Effect<R, E, I>
  readonly schedule: Schedule.Schedule<R, I, O>
}

export function FromScheduled<R, E, R2, I, O>(
  input: Effect.Effect<R, E, I>,
  schedule: Schedule.Schedule<R2, I, O>
): FromScheduled<R | R2, E, I, O> {
  return { _tag: "FromScheduled", schedule, input }
}

export interface Scheduled<R, E, A, O> {
  readonly _tag: "Scheduled"
  readonly input: Effect.Effect<R, E, A>
  readonly schedule: Schedule.Schedule<R, unknown, O>
}

export function Scheduled<R, E, A, R2, O>(
  input: Effect.Effect<R, E, A>,
  schedule: Schedule.Schedule<R2, unknown, O>
): Scheduled<R | R2, E, A, O> {
  return { _tag: "Scheduled", schedule, input }
}

export function runSink<R, E, A, R2>(
  producer: EffectProducer<R, E, A>,
  sink: Sink.Sink<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  switch (producer._tag) {
    case "FromEffect":
      return Effect.matchCauseEffect(producer.source, sink)
    case "FromScheduled":
      return runFromScheduled(producer, sink)
    case "Scheduled":
      return runSchedule(producer, sink)
  }
}

function runFromScheduled<R, E, I, O, R2>(
  scheduled: FromScheduled<R, E, I, O>,
  sink: Sink.Sink<R2, E, O>
): Effect.Effect<R | R2, never, unknown> {
  return Effect.catchAllCause(
    Effect.flatMap(
      scheduled.input,
      (i) => Effect.scheduleFrom(scheduled.input, i, Schedule.mapEffect(scheduled.schedule, sink.onSuccess))
    ),
    sink.onFailure
  )
}

function runSchedule<R, E, A, O, R2>(
  scheduled: Scheduled<R, E, A, O>,
  sink: Sink.Sink<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return Effect.catchAllCause(
    Effect.schedule(Effect.matchCauseEffect(scheduled.input, sink), scheduled.schedule),
    sink.onFailure
  )
}

export function runEffect<R, E, A, R2, E2, B>(
  producer: EffectProducer<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Effect.Effect<R | R2, E | E2, unknown> {
  switch (producer._tag) {
    case "FromEffect":
      return Effect.flatMap(producer.source, f)
    case "FromScheduled":
      return Effect.flatMap(
        producer.input,
        (i) =>
          Effect.asyncEffect<never, E | E2, unknown, R | R2, never, unknown>((resume) => {
            const onFailure = (cause: Cause.Cause<E | E2>) => Effect.succeed(resume(Effect.failCause(cause)))

            return Effect.matchCauseEffect(
              Effect.scheduleFrom(
                producer.input,
                i,
                Schedule.mapEffect(
                  producer.schedule,
                  (a) => Effect.catchAllCause(f(a), onFailure)
                )
              ),
              { onFailure, onSuccess: () => Effect.succeed(resume(Effect.unit)) }
            )
          })
      )
    case "Scheduled":
      return Effect.schedule(Effect.flatMap(producer.input, f), producer.schedule)
  }
}

export function runReduceEffect<R, E, A, R2, E2, B>(
  producer: EffectProducer<R, E, A>,
  initial: B,
  f: (b: B, a: A) => Effect.Effect<R2, E2, B>
): Effect.Effect<R | R2, E | E2, B> {
  return Effect.suspend(() => {
    let acc = initial

    return Effect.map(runEffect(producer, (a) => Effect.map(f(acc, a), (b) => (acc = b))), () => acc)
  })
}