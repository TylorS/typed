import { Context, Effect, ExecutionStrategy, Exit, Option, Scope } from "effect"
import type { Fx, KeyedOptions } from "../Fx.js"
import * as RefSubject from "../RefSubject.js"
import * as Sink from "../Sink.js"
import type { Add, Moved, Remove, Update } from "./diff.js"
import { diffIterator } from "./diff.js"
import { debounce, withExhaustLatestFork } from "./helpers.js"
import { FxBase } from "./protos.js"

const DISCARD = { discard: true } as const

// TODO: We should probably create a special-case for this behavior in @typed/template
//       which would allow connecting the diffing of arrays directly to the DOM instead of
//       having to translate between Fx and the DOM/HTML.

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
    return runKeyed(this.fx, this.options, sink)
  }
}

interface KeyedState<A, B extends PropertyKey, C> {
  readonly entries: Map<B, KeyedEntry<A, C>>
  readonly indices: Map<number, B>
  previousKeys: ReadonlyArray<B>
}

function emptyKeyedState<A, B extends PropertyKey, C>(): KeyedState<A, B, C> {
  return {
    entries: new Map(),
    indices: new Map(),
    previousKeys: []
  }
}

function runKeyed<R, E, A, B extends PropertyKey, R2, E2, C, R3>(
  fx: Fx<R, E, ReadonlyArray<A>>,
  options: KeyedOptions<A, B, R2, E2, C>,
  sink: Sink.Sink<R3, E | E2, ReadonlyArray<C>>
) {
  return debounce(
    (forkDebounce, parentScope) =>
      withExhaustLatestFork(
        (forkExhaustLatest) => {
          const state = emptyKeyedState<A, B, C>()
          // Uses debounce to avoid glitches
          const scheduleNextEmit = forkDebounce(Effect.suspend(() => sink.onSuccess(getReadyIndices(state))))

          function diffAndPatch(values: ReadonlyArray<A>) {
            const previous = state.previousKeys
            const keys = values.map(options.getKey)
            state.previousKeys = keys

            let added = false

            return Effect.flatMap(
              Effect.forEach(diffIterator(previous, keys), (patch) => {
                if (patch._tag === "Remove") return removeValue(state, patch)
                else if (patch._tag === "Add") {
                  added = true
                  return addValue(state, values, patch, parentScope, options, sink, scheduleNextEmit)
                } else return updateValue(state, values, patch)
              }, DISCARD),
              () => added === false ? scheduleNextEmit : Effect.unit
            )
          }

          return fx.run(
            Sink.make(
              (cause) => sink.onFailure(cause),
              // Use exhaust to ensure only 1 diff is running at a time
              // Skipping an intermediate changes that occur while diffing
              (values) => forkExhaustLatest(Effect.suspend(() => diffAndPatch(values)))
            )
          )
        },
        ExecutionStrategy.sequential
      ),
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
  { entries, indices, previousKeys }: KeyedState<A, B, C>
): ReadonlyArray<C> {
  const output: Array<C> = []

  for (let i = 0; i < previousKeys.length; ++i) {
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
  patch: Add<B>,
  parentScope: Scope.Scope,
  options: KeyedOptions<A, B, R2, E2, C>,
  sink: Sink.Sink<R2 | R3, E | E2, ReadonlyArray<C>>,
  scheduleNextEmit: Effect.Effect<R3, never, D>
) {
  return Effect.gen(function*(_) {
    const value = values[patch.index]
    const childScope = yield* _(Scope.fork(parentScope, ExecutionStrategy.sequential))
    const ref: RefSubject.RefSubject<never, never, A> = yield* _(
      RefSubject.make(Effect.sync(() => entry.value))
    )
    const entry = new KeyedEntry<A, C>(
      value,
      patch.index,
      Option.none(),
      ref,
      Scope.close(childScope, Exit.unit)
    )

    entries.set(patch.value, entry)
    indices.set(patch.index, patch.value)

    yield* _(
      Effect.forkIn(
        options.onValue(ref, patch.value).run(Sink.make(
          (cause) => sink.onFailure(cause),
          (output) => {
            entry.output = Option.some(output)

            return scheduleNextEmit
          }
        )),
        childScope
      )
    )
  })
}

function removeValue<A, B extends PropertyKey, C>({ entries, indices }: KeyedState<A, B, C>, patch: Remove<B>) {
  const interrupt = entries.get(patch.value)!.interrupt
  entries.delete(patch.value)
  indices.delete(patch.index)
  return interrupt
}

function updateValue<A, B extends PropertyKey, C>(
  { entries, indices }: KeyedState<A, B, C>,
  values: ReadonlyArray<A>,
  patch: Update<B> | Moved<B>
) {
  const key = patch.value
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
