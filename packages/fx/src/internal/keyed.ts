import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as ExecutionStrategy from "effect/ExecutionStrategy"
import * as Exit from "effect/Exit"
import type * as FiberId from "effect/FiberId"
import * as Option from "effect/Option"
import * as Scope from "effect/Scope"
import { type Fx, type KeyedOptions } from "../Fx.js"
import * as RefSubject from "../RefSubject.js"
import * as Sink from "../Sink.js"
import type { Add, Moved, Remove, Update } from "./diff.js"
import { diffIterator } from "./diff.js"
import { withDebounceFork } from "./helpers.js"
import { FxBase } from "./protos.js"

export function keyed<A, E, R, B extends PropertyKey, C, E2, R2>(
  fx: Fx<ReadonlyArray<A>, E, R>,
  options: KeyedOptions<A, B, C, E2, R2>
): Fx<ReadonlyArray<C>, E | E2, R | R2 | Scope.Scope> {
  return new Keyed(fx, options)
}

type StateContext<A, C> = {
  entry: KeyedEntry<A, C>
  output: C
}

const StateContext = Context.GenericTag<StateContext<any, any>>("@services/StateContext")

class Keyed<A, E, R, B extends PropertyKey, C, E2, R2> extends FxBase<ReadonlyArray<C>, E | E2, R | R2 | Scope.Scope>
  implements Fx<ReadonlyArray<C>, E | E2, R | R2 | Scope.Scope>
{
  constructor(
    readonly fx: Fx<ReadonlyArray<A>, E, R>,
    readonly options: KeyedOptions<A, B, C, E2, R2>
  ) {
    super()
  }

  run<R3>(sink: Sink.Sink<ReadonlyArray<C>, E | E2, R3>) {
    return Effect.fiberIdWith((id) => runKeyed(this.fx, this.options, sink, id))
  }
}

interface KeyedState<A, B extends PropertyKey, C> {
  readonly entries: Map<B, KeyedEntry<A, C>>
  readonly indices: Map<number, B>
  previousValues: ReadonlyArray<A>
}

function emptyKeyedState<A, B extends PropertyKey, C>(): KeyedState<A, B, C> {
  return {
    entries: new Map(),
    indices: new Map(),
    previousValues: []
  }
}

function runKeyed<A, E, R, B extends PropertyKey, C, E2, R2, R3>(
  fx: Fx<ReadonlyArray<A>, E, R>,
  options: KeyedOptions<A, B, C, E2, R2>,
  sink: Sink.Sink<ReadonlyArray<C>, E | E2, R3>,
  id: FiberId.FiberId
): Effect.Effect<unknown, never, Scope.Scope | R | R2 | R3> {
  return withDebounceFork(
    (forkDebounce, parentScope) => {
      const state = emptyKeyedState<A, B, C>()
      // Uses debounce to avoid glitches
      const scheduleNextEmit = forkDebounce(Effect.suspend(() => sink.onSuccess(getReadyIndices(state))))

      function diffAndPatch(values: ReadonlyArray<A>) {
        return Effect.gen(function*() {
          const previous = state.previousValues
          state.previousValues = values

          let added = false
          let scheduled = false
          let done = false

          for (const patch of diffIterator(previous, values, options)) {
            if (patch._tag === "Remove") {
              yield* removeValue(state, patch)
            } else if (patch._tag === "Add") {
              added = true
              yield* addValue(
                state,
                values,
                patch,
                id,
                parentScope,
                options,
                sink,
                Effect.suspend(() => {
                  if (done === false) {
                    scheduled = true
                    return Effect.void
                  }
                  return scheduleNextEmit
                })
              )
            } else {
              yield* updateValue(state, values, patch)
            }
          }

          done = true

          if (scheduled || added === false) {
            yield* scheduleNextEmit
          } else {
            // Allow fibers to begin running if we're adding Fibers
            yield* Effect.sleep(1)
          }
        })
      }

      return fx.run(
        Sink.make(
          (cause) => sink.onFailure(cause),
          // Use exhaust to ensure only 1 diff is running at a time
          // Skipping an intermediate changes that occur while diffing
          (values) => Effect.withMaxOpsBeforeYield(diffAndPatch(values), Number.MAX_SAFE_INTEGER)
        )
      )
    },
    options.debounce || 1
  )
}

class KeyedEntry<A, C> {
  constructor(
    public value: A,
    public index: number,
    public output: Option.Option<C>,
    public readonly ref: RefSubject.RefSubject<A>,
    public readonly interrupt: Effect.Effect<void>
  ) {}
}

function getReadyIndices<A, B extends PropertyKey, C>(
  { entries, indices, previousValues }: KeyedState<A, B, C>
): ReadonlyArray<C> {
  const output: Array<C> = []

  for (let i = 0; i < previousValues.length; ++i) {
    const key = indices.get(i)

    if (key === undefined) break

    const entry = entries.get(key)!
    if (Option.isSome(entry.output)) {
      output.push(entry.output.value)
    } else {
      break
    }
  }

  return output
}

function addValue<A, B extends PropertyKey, C, R2, E2, E, R3, D>(
  { entries, indices }: KeyedState<A, B, C>,
  values: ReadonlyArray<A>,
  patch: Add<A, B>,
  id: FiberId.FiberId,
  parentScope: Scope.Scope,
  options: KeyedOptions<A, B, C, E2, R2>,
  sink: Sink.Sink<ReadonlyArray<C>, E | E2, R2 | R3>,
  scheduleNextEmit: Effect.Effect<D, never, R3>
) {
  return Effect.gen(function*() {
    const value = values[patch.index]
    const childScope = yield* Scope.fork(parentScope, ExecutionStrategy.sequential)
    const ref: RefSubject.RefSubject<A> = yield* RefSubject.unsafeMake<never, A>({
      initial: Effect.sync(() => entry.value),
      initialValue: value,
      scope: childScope,
      id
    })

    yield* Scope.addFinalizer(childScope, ref.interrupt)

    const entry = new KeyedEntry<A, C>(
      value,
      patch.index,
      Option.none(),
      ref,
      Scope.close(childScope, Exit.interrupt(id))
    )

    entries.set(patch.key, entry)
    indices.set(patch.index, patch.key)

    yield* Effect.forkIn(
      options.onValue(ref, patch.key).run(Sink.make(
        (cause) => sink.onFailure(cause),
        (output) => {
          entry.output = Option.some(output)

          return scheduleNextEmit
        }
      )),
      parentScope
    )
  })
}

function removeValue<A, B extends PropertyKey, C>({ entries, indices }: KeyedState<A, B, C>, patch: Remove<A, B>) {
  const interrupt = entries.get(patch.key)!.interrupt
  entries.delete(patch.key)
  indices.delete(patch.index)
  return interrupt
}

function updateValue<A, B extends PropertyKey, C>(
  { entries, indices }: KeyedState<A, B, C>,
  values: ReadonlyArray<A>,
  patch: Update<A, B> | Moved<A, B>
) {
  const key = patch.key
  const entry = entries.get(key)!

  if (patch._tag === "Moved") {
    const currentKey = indices.get(patch.index)
    if (currentKey === key) {
      indices.delete(patch.index)
    }
    indices.set(patch.to, key)
    entry.value = values[entry.index = patch.to]
  } else {
    entry.value = values[entry.index = patch.index]
  }

  return RefSubject.set(entry.ref, entry.value)
}
