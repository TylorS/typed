import * as MutableHashMap from '@effect/data/MutableHashMap'
import * as Option from '@effect/data/Option'
import * as ReadonlyArray from '@effect/data/ReadonlyArray'
import { Equivalence } from '@effect/data/typeclass/Equivalence'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import fastDeepEqual from 'fast-deep-equal'

import { Fx, Sink } from './Fx.js'
import { RefSubject } from './RefSubject.js'
import { Subject, makeHoldSubject } from './Subject.js'
import { Cause } from './externals.js'
import { ScopedFork, withScopedFork } from './helpers.js'

export function keyed<R, E, A, R2, E2, B>(
  fx: Fx<R, E, readonly A[]>,
  f: (a: Fx<never, never, A>) => Fx<R2, E2, B>,
  eq: Equivalence<A> = fastDeepEqual,
): Fx<R | R2, E | E2, readonly B[]> {
  return Fx(<R3>(sink: Sink<R3, E | E2, readonly B[]>) =>
    withScopedFork((fork) =>
      Effect.gen(function* ($) {
        const state = createKeyedState<A, B>()
        const difference = ReadonlyArray.difference(eq)
        const intersection = ReadonlyArray.intersection(eq)
        const emit = emitWhenReady(state)

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
                  f,
                  fork,
                  difference,
                  intersection,
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

type KeyedState<A, B> = {
  previous: readonly A[]
  ended: boolean

  readonly subjects: MutableHashMap.MutableHashMap<A, Subject<never, A>>
  readonly fibers: MutableHashMap.MutableHashMap<A, Fiber.RuntimeFiber<never, void>>
  readonly values: MutableHashMap.MutableHashMap<A, B>
  readonly output: Subject<never, readonly B[]>
}

function createKeyedState<A, B>(): KeyedState<A, B> {
  return {
    previous: [],
    ended: false,
    subjects: MutableHashMap.empty(),
    fibers: MutableHashMap.empty(),
    values: MutableHashMap.empty(),
    output: makeHoldSubject<never, readonly B[]>(),
  }
}

function updateState<A, B, R2, E2, R3>({
  state,
  updated,
  f,
  fork,
  difference,
  intersection,
  emit,
  error,
}: {
  state: KeyedState<A, B>
  updated: readonly A[]
  f: (a: Fx<never, never, A>) => Fx<R2, E2, B>
  fork: ScopedFork
  difference: (self: Iterable<A>, that: Iterable<A>) => A[]
  intersection: (self: Iterable<A>, that: Iterable<A>) => A[]
  emit: Effect.Effect<never, never, void>
  error: (e: Cause.Cause<E2>) => Effect.Effect<R3, never, void>
}) {
  return Effect.gen(function* ($) {
    const added = difference(updated, state.previous)
    const removed = difference(state.previous, updated)
    const unchanged = intersection(updated, state.previous)

    state.previous = updated

    // Remove values that are no longer in the stream
    yield* $(Effect.forEachParDiscard(removed, (value) => removeValue(state, value)))

    // Add values that are new to the stream
    yield* $(
      Effect.forEachParDiscard(added, (value) => addValue({ state, value, f, fork, emit, error })),
    )

    // Update values that are still in the stream
    yield* $(Effect.forEachParDiscard(unchanged, (value) => updateValue(state, value)))

    // If nothing was added or removed, emit the current values
    if (added.length === 0 && removed.length === 0) {
      yield* $(emit)
    }
  })
}

function removeValue<A, B>(state: KeyedState<A, B>, value: A) {
  return Effect.gen(function* ($) {
    const subject = MutableHashMap.get(state.subjects, value)

    if (Option.isSome(subject)) yield* $(subject.value.end())

    const fiber = MutableHashMap.get(state.fibers, value)

    if (Option.isSome(fiber)) yield* $(Fiber.interrupt(fiber.value))

    MutableHashMap.remove(state.values, value)
    MutableHashMap.remove(state.subjects, value)
    MutableHashMap.remove(state.fibers, value)
  })
}

function addValue<A, B, R2, E2, R3>({
  state,
  value,
  f,
  fork,
  emit,
  error,
}: {
  state: KeyedState<A, B>
  value: A
  f: (a: Fx<never, never, A>) => Fx<R2, E2, B>
  fork: ScopedFork
  emit: Effect.Effect<never, never, void>
  error: (e: Cause.Cause<E2>) => Effect.Effect<R3, never, void>
}) {
  return Effect.gen(function* ($) {
    const subject = RefSubject.unsafeMake<never, A>(Effect.succeed(value))
    const fx = f(subject)
    const fiber = yield* $(
      fork(
        fx.run(
          Sink(
            (b: B) =>
              Effect.suspend(() => {
                MutableHashMap.set(state.values, value, b)
                return emit
              }),
            error,
          ),
        ),
      ),
    )

    MutableHashMap.set(state.subjects, value, subject)
    MutableHashMap.set(state.fibers, value, fiber)
  })
}

function updateValue<A, B>(state: KeyedState<A, B>, value: A) {
  return Effect.gen(function* ($) {
    const subject = MutableHashMap.get(state.subjects, value)

    // Send the current value
    if (Option.isSome(subject)) {
      yield* $(subject.value.event(value))
    }
  })
}

function emitWhenReady<A, B>(state: KeyedState<A, B>) {
  return Effect.suspend(() => {
    const values = ReadonlyArray.filterMap(state.previous, (value) =>
      MutableHashMap.get(state.values, value),
    )

    // When all of the values have resolved at least once, emit the output
    if (values.length === state.previous.length) {
      return state.output.event(values)
    }

    return Effect.unit()
  })
}

function endAll<A, B>(state: KeyedState<A, B>) {
  return Effect.gen(function* ($) {
    yield* $(Effect.forEachParDiscard(state.subjects, ([, subject]) => subject.end()))
  })
}
