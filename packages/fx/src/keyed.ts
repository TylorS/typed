import * as MutableHashMap from '@effect/data/MutableHashMap'
import * as Option from '@effect/data/Option'
import * as ReadonlyArray from '@effect/data/ReadonlyArray'
import * as Equivalence from '@effect/data/typeclass/Equivalence'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import fastDeepEqual from 'fast-deep-equal'

import { Fx, Sink } from './Fx.js'
import { RefSubject } from './RefSubject.js'
import { Subject, makeHoldSubject } from './Subject.js'
import { Cause } from './externals.js'
import { ScopedFork, withScopedFork } from './helpers.js'

export function keyed<R, E, A, R2, E2, B, C>(
  fx: Fx<R, E, readonly A[]>,
  f: (fx: RefSubject<never, A>) => Fx<R2, E2, B>,
  getKey: (a: A) => C,
): Fx<R | R2, E | E2, readonly B[]> {
  return Fx(<R3>(sink: Sink<R3, E | E2, readonly B[]>) =>
    withScopedFork((fork) =>
      Effect.gen(function* ($) {
        const state = createKeyedState<A, B, C>()
        const eq = Equivalence.make((x: A, y: A) => fastDeepEqual(getKey(x), getKey(y)))
        const emit = emitWhenReady(state, getKey)

        // Let output emit to the sink
        const fiber = yield* $(fork(state.output.run(sink)))

        // Listen to the input and update the state
        yield* $(
          fx.run(
            Sink(
              (as) =>
                updateState({
                  state,
                  updated: as,
                  eq,
                  getKey,
                  f,
                  fork,
                  emit,
                  error: sink.error,
                }),
              sink.error,
            ),
          ),
        )

        yield* $(endAll(state))

        // When the source stream ends we wait for the remaining fibers to end
        yield* $(Fiber.joinAll(Array.from(state.fibers).map((x) => x[1])))

        // Terminate the output fiber
        yield* $(Fiber.interrupt(fiber))
      }),
    ),
  )
}

type KeyedState<A, B, C> = {
  previous: readonly A[]
  previousKeys: ReadonlySet<C>
  ended: boolean

  readonly subjects: MutableHashMap.MutableHashMap<C, RefSubject<never, A>>
  readonly fibers: MutableHashMap.MutableHashMap<C, Fiber.RuntimeFiber<never, void>>
  readonly values: MutableHashMap.MutableHashMap<C, B>
  readonly output: Subject<never, readonly B[]>
}

function createKeyedState<A, B, C>(): KeyedState<A, B, C> {
  return {
    previous: [],
    previousKeys: new Set(),
    ended: false,
    subjects: MutableHashMap.empty(),
    fibers: MutableHashMap.empty(),
    values: MutableHashMap.empty(),
    output: makeHoldSubject<never, readonly B[]>(),
  }
}

function updateState<A, B, C, R2, E2, R3>({
  state,
  updated,
  f,
  fork,
  emit,
  error,
  getKey,
}: {
  state: KeyedState<A, B, C>
  updated: readonly A[]
  eq: Equivalence.Equivalence<A>
  f: (fx: RefSubject<never, A>) => Fx<R2, E2, B>
  fork: ScopedFork
  emit: Effect.Effect<never, never, void>
  error: (e: Cause.Cause<E2>) => Effect.Effect<R3, never, void>
  getKey: (a: A) => C
}) {
  return Effect.gen(function* ($) {
    const { added, removed, unchanged } = diffValues(state, updated, getKey)

    // Remove values that are no longer in the stream
    yield* $(Effect.forEachDiscard(removed, (key) => removeValue(state, key)))

    // Add values that are new to the stream
    yield* $(
      Effect.forEachDiscard(added, (value) =>
        addValue({ state, value, f, fork, emit, error, getKey }),
      ),
    )

    // Update values that are still in the stream
    yield* $(Effect.forEachDiscard(unchanged, (value) => updateValue(state, value, getKey)))

    // If nothing was added, emit the current values
    if (added.length === 0) {
      yield* $(emit)
    }
  })
}

function diffValues<A, B, C>(
  state: KeyedState<A, B, C>,
  updated: ReadonlyArray<A>,
  getKey: (a: A) => C,
) {
  const previousKeys = state.previousKeys
  const keys = new Set<C>(updated.map(getKey))

  state.previous = updated
  state.previousKeys = keys

  if (previousKeys.size === 0) {
    return {
      added: updated,
      unchanged: [],
      removed: [],
    }
  }

  const added: A[] = []
  const unchanged: A[] = []
  const removed: C[] = []

  for (let i = 0; i < updated.length; ++i) {
    const value = updated[i]
    const key = getKey(value)

    if (previousKeys.has(key)) {
      unchanged.push(value)
    } else {
      added.push(value)
    }
  }

  previousKeys.forEach((k) => {
    if (!keys.has(k)) {
      removed.push(k)
    }
  })

  return {
    added,
    unchanged,
    removed,
  } as const
}

function removeValue<A, B, C>(state: KeyedState<A, B, C>, key: C) {
  return Effect.gen(function* ($) {
    const subject = MutableHashMap.get(state.subjects, key)

    if (Option.isSome(subject)) yield* $(Effect.fork(subject.value.end()))

    const fiber = MutableHashMap.get(state.fibers, key)

    if (Option.isSome(fiber)) yield* $(Fiber.interruptFork(fiber.value))

    MutableHashMap.remove(state.values, key)
    MutableHashMap.remove(state.subjects, key)
    MutableHashMap.remove(state.fibers, key)
  })
}

function addValue<A, B, C, R2, E2, R3>({
  state,
  value,
  f,
  fork,
  emit,
  error,
  getKey,
}: {
  state: KeyedState<A, B, C>
  value: A
  f: (fx: RefSubject<never, A>) => Fx<R2, E2, B>
  fork: ScopedFork
  emit: Effect.Effect<never, never, void>
  error: (e: Cause.Cause<E2>) => Effect.Effect<R3, never, void>
  getKey: (a: A) => C
}) {
  return Effect.gen(function* ($) {
    const key = getKey(value)
    const subject = RefSubject.unsafeMake<never, A>(Effect.succeed(value))
    const fx = f(subject)
    const fiber = yield* $(
      fork(
        fx.run(
          Sink(
            (b: B) =>
              Effect.suspend(() => {
                MutableHashMap.set(state.values, key, b)
                return emit
              }),
            error,
          ),
        ),
      ),
    )

    MutableHashMap.set(state.subjects, key, subject)
    MutableHashMap.set(state.fibers, key, fiber)
  })
}

function updateValue<A, B, C>(state: KeyedState<A, B, C>, value: A, getKey: (a: A) => C) {
  return Effect.gen(function* ($) {
    const subject = MutableHashMap.get(state.subjects, getKey(value))

    // Send the current value
    if (Option.isSome(subject)) {
      yield* $(subject.value.set(value))
    }
  })
}

function emitWhenReady<A, B, C>(state: KeyedState<A, B, C>, getKey: (a: A) => C) {
  return Effect.suspend(() => {
    // Fast path: if we don't have enough values, don't emit
    if (MutableHashMap.size(state.values) !== state.previous.length) {
      return Effect.unit()
    }

    const values = ReadonlyArray.filterMap(state.previous, (value) =>
      MutableHashMap.get(state.values, getKey(value)),
    )

    // When all of the values have resolved at least once, emit the output
    if (values.length === state.previous.length) {
      return state.output.event(values)
    }

    return Effect.unit()
  })
}

function endAll<A, B, C>(state: KeyedState<A, B, C>) {
  return Effect.gen(function* ($) {
    yield* $(Effect.forEachParDiscard(state.subjects, ([, subject]) => subject.end()))
  })
}
