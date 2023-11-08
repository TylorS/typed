import type * as Fx from "@typed/fx/Fx"
import { from, skipRepeatsWith, withScopedFork } from "@typed/fx/internal/core"
import { makeHoldSubject } from "@typed/fx/internal/core-subject"
import { run } from "@typed/fx/internal/run"
import { fromEffect, type RefSubject } from "@typed/fx/RefSubject"
import { WithContext } from "@typed/fx/Sink"
import type { Subject } from "@typed/fx/Subject"
import type * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import * as Fiber from "effect/Fiber"
import * as MutableHashMap from "effect/MutableHashMap"
import * as Option from "effect/Option"
import * as ReadonlyArray from "effect/ReadonlyArray"
import * as Scope from "effect/Scope"

export function keyed<R, E, A, B, R2, E2, C>(
  fx: Fx.Fx<R, E, ReadonlyArray<A>>,
  getKey: (a: A) => B,
  f: (fx: RefSubject<never, never, A>, key: B) => Fx.FxInput<R2, E2, C>
): Fx.Fx<R | R2, E | E2, ReadonlyArray<C>> {
  return withScopedFork(({ fork, scope, sink }) =>
    Effect.gen(function*($) {
      const state = createKeyedState<A, B, C>()
      const emit = emitWhenReady(state, getKey)

      // Let output emit to the sink, it is closes by the surrounding scope
      yield* $(fork(run(skipRepeatsWith(state.output, ReadonlyArray.getEquivalence(equals)), sink)))

      // Listen to the input and update the state
      yield* $(
        run(
          fx,
          WithContext(
            sink.onFailure,
            (as) =>
              updateState({
                state,
                updated: as,
                getKey,
                f: (ref, key) => from(f(ref, key)),
                fork,
                scope,
                emit,
                error: sink.onFailure
              })
          )
        )
      )

      yield* $(endAll(state))

      // When the source stream ends we wait for the remaining fibers to end
      yield* $(Fiber.joinAll(Array.from(state.fibers).map((x) => x[1])))
    })
  )
}

type KeyedState<A, B, C> = {
  previous: ReadonlyArray<A>
  previousKeys: ReadonlySet<B>

  readonly subjects: MutableHashMap.MutableHashMap<B, RefSubject<never, never, A>>
  readonly initialValues: MutableHashMap.MutableHashMap<B, A>
  readonly fibers: MutableHashMap.MutableHashMap<B, Fiber.RuntimeFiber<never, void>>
  readonly values: MutableHashMap.MutableHashMap<B, C>
  readonly output: Subject<never, never, ReadonlyArray<C>>
}

function createKeyedState<A, B, C>(): KeyedState<A, B, C> {
  return {
    previous: [],
    previousKeys: new Set(),
    subjects: MutableHashMap.empty(),
    initialValues: MutableHashMap.empty(),
    fibers: MutableHashMap.empty(),
    values: MutableHashMap.empty(),
    output: makeHoldSubject<never, ReadonlyArray<C>>()
  }
}

function updateState<A, B, C, R2, E2, R3>({
  emit,
  error,
  f,
  fork,
  getKey,
  scope,
  state,
  updated
}: {
  state: KeyedState<A, B, C>
  updated: ReadonlyArray<A>
  f: (fx: RefSubject<never, never, A>, key: B) => Fx.Fx<R2, E2, C>
  fork: Fx.ScopedFork
  scope: Scope.Scope
  emit: Effect.Effect<never, never, void>
  error: (e: Cause.Cause<E2>) => Effect.Effect<R3, never, void>
  getKey: (a: A) => B
}): Effect.Effect<Exclude<R2 | R3, Scope.Scope>, never, void> {
  return Effect.provideService(
    Effect.gen(function*($) {
      const { added, removed, unchanged } = diffValues(state, updated, getKey)

      // Remove values that are no longer in the stream
      yield* $(Effect.forEach(removed, (key) => removeValue(state, key), { discard: true }))

      // Update values that are still in the stream
      yield* $(
        Effect.forEach(unchanged, (value) => updateValue(state, value, getKey), {
          concurrency: "unbounded",
          discard: true
        })
      )

      // Add values that are new to the stream
      yield* $(
        Effect.forEach(added, (value) => addValue({ state, value, f, fork, emit, error, getKey }), {
          concurrency: "unbounded",
          discard: true
        })
      )

      // If nothing was added, emit the current values
      if (added.length === 0) {
        yield* $(emit)
      }
    }),
    Scope.Scope,
    scope
  )
}

function diffValues<A, B, C>(
  state: KeyedState<A, B, C>,
  updated: ReadonlyArray<A>,
  getKey: (a: A) => B
) {
  const added: Array<A> = []
  const unchanged: Array<A> = []
  const removed: Array<B> = []
  const previousKeys = state.previousKeys
  const keys = new Set<B>(updated.map(getKey))

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

  state.previous = updated
  state.previousKeys = keys

  return {
    added,
    unchanged,
    removed
  } as const
}

function removeValue<A, B, C>(state: KeyedState<A, B, C>, key: B) {
  return Effect.gen(function*($) {
    const subject = MutableHashMap.get(state.subjects, key)

    if (Option.isSome(subject)) yield* $(Effect.fork(subject.value.interrupt))

    const fiber = MutableHashMap.get(state.fibers, key)

    if (Option.isSome(fiber)) yield* $(Fiber.interruptFork(fiber.value))

    MutableHashMap.remove(state.values, key)
    MutableHashMap.remove(state.subjects, key)
    MutableHashMap.remove(state.fibers, key)
  })
}

function addValue<A, B, C, R2, E2, R3>({
  emit,
  error,
  f,
  fork,
  getKey,
  state,
  value
}: {
  state: KeyedState<A, B, C>
  value: A
  f: (fx: RefSubject<never, never, A>, key: B) => Fx.Fx<R2, E2, C>
  fork: Fx.ScopedFork
  emit: Effect.Effect<never, never, void>
  error: (e: Cause.Cause<E2>) => Effect.Effect<R3, never, void>
  getKey: (a: A) => B
}) {
  return Effect.suspend(() => {
    const key = getKey(value)

    // Set the initial value
    MutableHashMap.set(state.initialValues, key, value)

    return fromEffect<never, never, A>(
      Effect.sync(() =>
        // Default to the initial value
        MutableHashMap.get(state.initialValues, key).pipe(Option.getOrElse(() => value))
      )
    ).pipe(
      Effect.flatMap((subject) =>
        fork(
          run(
            f(subject, key),
            WithContext(
              error,
              (c: C) =>
                Effect.suspend(() => {
                  MutableHashMap.set(state.values, key, c)
                  return emit
                })
            )
          )
        ).pipe(
          Effect.tap((fiber) =>
            Effect.sync(() => {
              MutableHashMap.set(state.subjects, key, subject)
              MutableHashMap.set(state.fibers, key, fiber)
            })
          )
        )
      )
    )
  })
}

function updateValue<A, B, C>(state: KeyedState<A, B, C>, value: A, getKey: (a: A) => B) {
  return Effect.gen(function*($) {
    const key = getKey(value)
    const subject = MutableHashMap.get(state.subjects, key)

    // External updates reset the initial value
    MutableHashMap.set(state.initialValues, key, value)

    // Send the current value
    if (Option.isSome(subject)) {
      yield* $(subject.value.set(value))
    }
  })
}

function emitWhenReady<A, B, C>(state: KeyedState<A, B, C>, getKey: (a: A) => B) {
  return Effect.suspend(() => {
    // Fast path: if we don't have enough values, don't emit
    if (MutableHashMap.size(state.values) !== state.previous.length) {
      return Effect.unit
    }

    const values = ReadonlyArray.filterMap(state.previous, (value) => MutableHashMap.get(state.values, getKey(value)))

    // When all of the values have resolved at least once, emit the output
    if (values.length === state.previous.length) {
      return state.output.onSuccess(values)
    }

    return Effect.unit
  })
}

function endAll<A, B, C>(state: KeyedState<A, B, C>) {
  return Effect.forEach(state.subjects, ([, subject]) => subject.interrupt, { concurrency: "unbounded" })
}
