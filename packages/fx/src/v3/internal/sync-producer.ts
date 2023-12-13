import type { Exit } from "effect"
import { Effect, Option, ReadonlyArray } from "effect"
import type { Sink } from "../Sink"

export type SyncProducer<A> = Success<A> | FromArray<A> | FromIterable<A>

export interface Success<A> {
  readonly _tag: "Success"
  readonly source: A
}

export const Success = <A>(value: A): Success<A> => ({ _tag: "Success", source: value })

export interface FromArray<A> {
  readonly _tag: "FromArray"
  readonly source: ReadonlyArray<A>
}

export const FromArray = <A>(array: ReadonlyArray<A>): FromArray<A> => ({ _tag: "FromArray", source: array })

export interface FromIterable<A> {
  readonly _tag: "FromIterable"
  readonly source: Iterable<A>
}

export const FromIterable = <A>(iterable: Iterable<A>): FromIterable<A> => ({ _tag: "FromIterable", source: iterable })

export function runSink<A, R, E>(
  producer: SyncProducer<A>,
  sink: Sink<R, E, A>
): Effect.Effect<R, never, unknown> {
  switch (producer._tag) {
    case "Success":
      return sink.onSuccess(producer.source)
    case "FromArray":
      return arrayToSink(producer.source, sink)
    case "FromIterable":
      return iterableToSink(producer.source, sink)
  }
}

export function runReduce<A, B>(
  producer: SyncProducer<A>,
  initial: B,
  f: (b: B, a: any) => B
): Effect.Effect<never, never, B> {
  switch (producer._tag) {
    case "Success":
      return syncOnce(() => f(initial, producer.source))
    case "FromArray":
    case "FromIterable":
      return syncOnce(() => ReadonlyArray.reduce(producer.source, initial, f))
  }
}

export function runReduceEffect<A, R2, E2, B>(
  producer: SyncProducer<A>,
  initial: B,
  f: (b: B, a: any) => Effect.Effect<R2, E2, B>
): Effect.Effect<R2, E2, B> {
  switch (producer._tag) {
    case "Success":
      return effectOnce(() => f(initial, producer.source))
    case "FromArray":
    case "FromIterable":
      return effectOnce(() => Effect.reduce(producer.source, initial, f))
  }
}

function arrayToSink<A, R2>(array: ReadonlyArray<A>, sink: Sink<R2, never, A>): Effect.Effect<R2, never, unknown> {
  if (array.length === 0) return Effect.unit
  else if (array.length === 1) return sink.onSuccess(array[0])
  else {
    const [first, ...rest] = array
    let effect = sink.onSuccess(first)
    for (const item of rest) {
      effect = Effect.zipRight(effect, sink.onSuccess(item))
    }
    return effect
  }
}

function iterableToSink<A, R2>(array: Iterable<A>, sink: Sink<R2, never, A>): Effect.Effect<R2, never, unknown> {
  let effect: Effect.Effect<R2, never, any> = Effect.unit

  for (const item of array) {
    effect = Effect.zipRight(effect, sink.onSuccess(item))
  }

  return effect
}

export const syncOnce = <A>(f: () => A): Effect.Effect<never, never, A> => {
  let memoized: Option.Option<A> = Option.none()
  const get = () => {
    if (Option.isSome(memoized)) {
      return memoized.value
    } else {
      const a = f()
      memoized = Option.some(a)
      return a
    }
  }

  return Effect.sync(get)
}

export const effectOnce = <R, E, A>(f: () => Effect.Effect<R, E, A>): Effect.Effect<R, E, A> => {
  let memoized: Option.Option<Exit.Exit<E, A>> = Option.none()

  return Effect.suspend(() => {
    if (Option.isSome(memoized)) {
      return memoized.value
    } else {
      return Effect.flatten(Effect.tap(Effect.exit(f()), (exit) =>
        Effect.sync(() => {
          memoized = Option.some(exit)
        })))
    }
  })
}

export function runEffect<A, R2, E2, B>(
  producer: SyncProducer<A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Effect.Effect<R2, E2, void> {
  switch (producer._tag) {
    case "Success":
      return f(producer.source)
    case "FromArray":
    case "FromIterable":
      return Effect.forEach(producer.source, f)
  }
}
