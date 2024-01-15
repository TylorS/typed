import type { FiberId } from "effect"
import { Context, Effect, ExecutionStrategy, Exit, Option, Scope } from "effect"
import type { Fx, KeyedOptions } from "../Fx.js"
import * as RefSubject from "../RefSubject.js"
import * as Sink from "../Sink.js"
import type { Add, Moved, Remove, Update } from "./diff.js"
import { diffIterator } from "./diff.js"
import { withDebounceFork } from "./helpers.js"
import { FxBase } from "./protos.js"

export function keyed<R, E, A, B extends PropertyKey, R2, E2, C>(
  fx: Fx<R, E, ReadonlyArray<A>>,
  options: KeyedOptions<A, B, R2, E2, C>
): Fx<R | R2 | Scope.Scope, E | E2, ReadonlyArray<C>> {
  return new Keyed(fx, options)
}

type StateContext<A, C> = {
  entry: KeyedEntry<A, C>
  output: C
}

const StateContext = Context.Tag<StateContext<any, any>>()

class Keyed<R, E, A, B extends PropertyKey, R2, E2, C> extends FxBase<R | R2 | Scope.Scope, E | E2, ReadonlyArray<C>>
  implements Fx<R | R2 | Scope.Scope, E | E2, ReadonlyArray<C>>
{
  constructor(
    readonly fx: Fx<R, E, ReadonlyArray<A>>,
    readonly options: KeyedOptions<A, B, R2, E2, C>
  ) {
    super()
  }

  run<R3>(sink: Sink.Sink<R3, E | E2, ReadonlyArray<C>>) {
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

function runKeyed<R, E, A, B extends PropertyKey, R2, E2, C, R3>(
  fx: Fx<R, E, ReadonlyArray<A>>,
  options: KeyedOptions<A, B, R2, E2, C>,
  sink: Sink.Sink<R3, E | E2, ReadonlyArray<C>>,
  id: FiberId.FiberId
) {
  return withDebounceFork(
    (forkDebounce, parentScope) => {
      const state = emptyKeyedState<A, B, C>()
      // Uses debounce to avoid glitches
      const scheduleNextEmit = forkDebounce(Effect.suspend(() => sink.onSuccess(getReadyIndices(state))))

      function diffAndPatch(values: ReadonlyArray<A>) {
        return Effect.gen(function*(_) {
          const previous = state.previousValues
          state.previousValues = values

          let added = false
          let done = false
          let scheduled = false

          for (const patch of diffIterator(previous, values, options)) {
            if (patch._tag === "Remove") {
              yield* _(removeValue(state, patch))
            } else if (patch._tag === "Add") {
              added = true
              yield* _(
                addValue(
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
                      return Effect.unit
                    }
                    return scheduleNextEmit
                  })
                )
              )
            } else {
              yield* _(updateValue(state, values, patch))
            }
          }

          done = true

          if (scheduled || added === false) {
            yield* _(scheduleNextEmit)
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
    options.debounce || 0
  )
}

class KeyedEntry<A, C> {
  constructor(
    public value: A,
    public index: number,
    public output: Option.Option<C>,
    public readonly ref: RefSubject.RefSubject<never, never, A>,
    public readonly interrupt: Effect.Effect<never, never, void>
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
  options: KeyedOptions<A, B, R2, E2, C>,
  sink: Sink.Sink<R2 | R3, E | E2, ReadonlyArray<C>>,
  scheduleNextEmit: Effect.Effect<R3, never, D>
) {
  return Effect.gen(function*(_) {
    const value = values[patch.index]
    const childScope = yield* _(Scope.fork(parentScope, ExecutionStrategy.sequential))
    const ref: RefSubject.RefSubject<never, never, A> = yield* _(RefSubject.unsafeMake<never, A>({
      initial: Effect.sync(() => entry.value),
      initialValue: value,
      scope: childScope,
      id
    }))
    yield* _(Scope.addFinalizer(childScope, ref.interrupt))

    const entry = new KeyedEntry<A, C>(
      value,
      patch.index,
      Option.none(),
      ref,
      Scope.close(childScope, Exit.interrupt(id))
    )

    entries.set(patch.key, entry)
    indices.set(patch.index, patch.key)

    yield* _(
      Effect.forkIn(
        options.onValue(ref, patch.key).run(Sink.make(
          (cause) => sink.onFailure(cause),
          (output) => {
            entry.output = Option.some(output)

            return scheduleNextEmit
          }
        )),
        parentScope
      )
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
