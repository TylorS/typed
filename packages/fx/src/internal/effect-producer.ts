import type { Cause } from "effect"
import * as Effect from "effect/Effect"
import * as Schedule from "effect/Schedule"
import type * as Sink from "../Sink.js"

export type EffectProducer<A = any, E = any, R = any> =
  | FromEffect<A, E, R>
  | FromScheduled<any, E, R, A>
  | Scheduled<A, E, R, any>

export interface FromEffect<A, E, R> {
  readonly _tag: "FromEffect"
  readonly source: Effect.Effect<A, E, R>
}

export function FromEffect<A, E, R>(source: Effect.Effect<A, E, R>): FromEffect<A, E, R> {
  return { _tag: "FromEffect", source }
}

export interface FromScheduled<I, E, R, O> {
  readonly _tag: "FromScheduled"
  readonly input: Effect.Effect<I, E, R>
  readonly schedule: Schedule.Schedule<O, I, R>
}

export function FromScheduled<I, E, R, R2, O>(
  input: Effect.Effect<I, E, R>,
  schedule: Schedule.Schedule<O, I, R2>
): FromScheduled<I, E, R | R2, O> {
  return { _tag: "FromScheduled", schedule, input }
}

export interface Scheduled<A, E, R, O> {
  readonly _tag: "Scheduled"
  readonly input: Effect.Effect<A, E, R>
  readonly schedule: Schedule.Schedule<O, unknown, R>
}

export function Scheduled<A, E, R, R2, O>(
  input: Effect.Effect<A, E, R>,
  schedule: Schedule.Schedule<O, unknown, R2>
): Scheduled<A, E, R | R2, O> {
  return { _tag: "Scheduled", schedule, input }
}

export function runSink<A, E, R, R2>(
  producer: EffectProducer<A, E, R>,
  sink: Sink.Sink<A, E, R2>
): Effect.Effect<unknown, never, R | R2> {
  switch (producer._tag) {
    case "FromEffect":
      return Effect.matchCauseEffect(producer.source, sink)
    case "FromScheduled":
      return runFromScheduled(producer, sink)
    case "Scheduled":
      return runSchedule(producer, sink)
  }
}

function runFromScheduled<I, E, R, O, R2>(
  scheduled: FromScheduled<I, E, R, O>,
  sink: Sink.Sink<O, E, R2>
): Effect.Effect<unknown, never, R | R2> {
  return Effect.catchAllCause(
    Effect.flatMap(
      scheduled.input,
      (i) => Effect.scheduleFrom(scheduled.input, i, Schedule.mapEffect(scheduled.schedule, sink.onSuccess))
    ),
    sink.onFailure
  )
}

function runSchedule<A, E, R, O, R2>(
  scheduled: Scheduled<A, E, R, O>,
  sink: Sink.Sink<A, E, R2>
): Effect.Effect<unknown, never, R | R2> {
  return Effect.catchAllCause(
    Effect.schedule(Effect.matchCauseEffect(scheduled.input, sink), scheduled.schedule),
    sink.onFailure
  )
}

export function runEffect<A, E, R, B, E2, R2>(
  producer: EffectProducer<A, E, R>,
  f: (a: A) => Effect.Effect<B, E2, R2>
): Effect.Effect<unknown, E | E2, R | R2> {
  switch (producer._tag) {
    case "FromEffect":
      return Effect.flatMap(producer.source, f)
    case "FromScheduled":
      return Effect.flatMap(
        producer.input,
        (i) =>
          Effect.asyncEffect((resume) => {
            const onFailure = (cause: Cause.Cause<E | E2>) => Effect.succeed(resume(Effect.failCause(cause)))

            return Effect.asVoid(Effect.matchCauseEffect(
              Effect.scheduleFrom(
                producer.input,
                i,
                Schedule.mapEffect(
                  producer.schedule,
                  (a) => Effect.catchAllCause(f(a), onFailure)
                )
              ),
              { onFailure, onSuccess: () => Effect.succeed(resume(Effect.void)) }
            ))
          })
      )
    case "Scheduled":
      return Effect.schedule(Effect.flatMap(producer.input, f), producer.schedule)
  }
}

export function runReduceEffect<A, E, R, B, E2, R2>(
  producer: EffectProducer<A, E, R>,
  initial: B,
  f: (b: B, a: A) => Effect.Effect<B, E2, R2>
): Effect.Effect<B, E | E2, R | R2> {
  return Effect.suspend(() => {
    let acc = initial

    return Effect.map(runEffect(producer, (a) => Effect.map(f(acc, a), (b) => (acc = b))), () => acc)
  })
}
