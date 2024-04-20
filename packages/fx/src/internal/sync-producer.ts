import { Array, Effect, Option } from "effect"
import type { Sink } from "../Sink.js"

const DISCARD = { discard: true } as const

export type SyncProducer<A> = Success<A> | FromSync<A> | FromArray<A> | FromIterable<A>

export interface Success<A> {
  readonly _tag: "Success"
  readonly source: A
}

export const Success = <A>(value: A): Success<A> => ({ _tag: "Success", source: value })

export interface FromSync<A> {
  readonly _tag: "FromSync"
  readonly source: () => A
}

export const FromSync = <A>(f: () => A): FromSync<A> => ({ _tag: "FromSync", source: f })

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

export const matchSyncProducer = <A, R>(
  producer: SyncProducer<A>,
  matchers: {
    readonly Success: (a: A) => R
    readonly FromSync: (a: () => A) => R
    readonly FromArray: (a: ReadonlyArray<A>) => R
    readonly FromIterable: (a: Iterable<A>) => R
  }
): R => {
  return matchers[producer._tag](producer.source as any)
}

export function runSink<A, R, E>(
  producer: SyncProducer<A>,
  sink: Sink<A, E, R>
): Effect.Effect<unknown, never, R> {
  return matchSyncProducer(producer, {
    Success: (a) => sink.onSuccess(a),
    FromSync: (a) => Effect.suspend(() => sink.onSuccess(a())),
    FromArray: (a) => arrayToSink(a, sink),
    FromIterable: (a) => iterableToSink(a, sink)
  })
}

export function runReduce<A, B>(
  producer: SyncProducer<A>,
  initial: B,
  f: (b: B, a: any) => B
): Effect.Effect<B> {
  return matchSyncProducer(producer, {
    Success: (a) => syncOnce(() => f(initial, a)),
    FromSync: (a) => syncOnce(() => f(initial, a())),
    FromArray: (a) => syncOnce(() => Array.reduce(a, initial, f)),
    FromIterable: (a) => syncOnce(() => Array.reduce(a, initial, f))
  })
}

export function runReduceEffect<A, B, E2, R2>(
  producer: SyncProducer<A>,
  initial: B,
  f: (b: B, a: any) => Effect.Effect<B, E2, R2>
): Effect.Effect<B, E2, R2> {
  return matchSyncProducer(producer, {
    Success: (a) => effectOnce(() => f(initial, a)),
    FromSync: (a) => Effect.suspend(() => f(initial, a())),
    FromArray: (a) => Effect.reduce(a, initial, f),
    FromIterable: (a) => Effect.reduce(a, initial, f)
  })
}

function arrayToSink<A, R2>(array: ReadonlyArray<A>, sink: Sink<A, never, R2>): Effect.Effect<unknown, never, R2> {
  if (array.length === 0) return Effect.void
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

function iterableToSink<A, R2>(array: Iterable<A>, sink: Sink<A, never, R2>): Effect.Effect<unknown, never, R2> {
  let effect: Effect.Effect<any, never, R2> = Effect.void

  for (const item of array) {
    effect = Effect.zipRight(effect, sink.onSuccess(item))
  }

  return effect
}

export const syncOnce = <A>(f: () => A): Effect.Effect<A> => {
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

export const effectOnce = <A, E, R>(f: () => Effect.Effect<A, E, R>): Effect.Effect<A, E, R> => {
  let memoized: Option.Option<A> = Option.none()

  return Effect.suspend(() => {
    if (Option.isSome(memoized)) {
      return Effect.succeed(memoized.value)
    } else {
      return Effect.tap(f(), (a) => Effect.sync(() => memoized = Option.some(a)))
    }
  })
}

export function runEffect<A, B, E2, R2>(
  producer: SyncProducer<A>,
  f: (a: A) => Effect.Effect<B, E2, R2>
): Effect.Effect<void, E2, R2> {
  return matchSyncProducer(producer, {
    Success: (a): Effect.Effect<void, E2, R2> => f(a),
    FromSync: (a) => Effect.suspend(() => f(a())),
    FromArray: (a) => Effect.forEach(a, f, DISCARD),
    FromIterable: (a) => Effect.forEach(a, f, DISCARD)
  })
}
