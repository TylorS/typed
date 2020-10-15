import { newDefaultScheduler } from '@most/scheduler'
import { provideRafEnv, provideWhenIdleEnv } from '@typed/fp/dom/exports'
import { doEffect, Effect, EnvOf, provide, Pure } from '@typed/fp/Effect/exports'
import { runAsFiberWith } from '@typed/fp/fibers/exports'
import { getState, provideBrowserHooks, updateState, useState } from '@typed/fp/hooks/exports'
import {
  AddEffect,
  ListManagerValue,
  patchOnRaf,
  providePatchRefs,
  useListManager,
} from '@typed/fp/patch/exports'
import { Ref } from '@typed/fp/SharedRef/exports'
import { eqNumber } from 'fp-ts/Eq'
import { decrement, increment } from 'fp-ts/function'
import { pipe } from 'fp-ts/pipeable'
import { range } from 'fp-ts/ReadonlyArray'
import { html, Renderable } from 'uhtml'

import { patchReactEnv } from './infrastructure'

const main = (addEffect: AddEffect) =>
  doEffect(function* () {
    const numberOfCounters = yield* useState(Pure.of(1), eqNumber)
    const addCounter = updateState(increment, numberOfCounters)
    const removeCounter = updateState((x) => Math.max(0, decrement(x)), numberOfCounters)

    const count = yield* getState(numberOfCounters)
    const counters = yield* useListManager(
      range(1, count),
      (n) => n,
      ({ ref, index }: ListManagerValue<number, number, Node>) => Counter(ref, index, addEffect),
    )

    return html`<div>
      <section style="display:flex;align-items:center;">
        <button onclick=${() => addEffect(removeCounter)}>-</button>
        <p style="margin: 0 0.5rem;">Number of Counters: ${count}</p>
        <button onclick=${() => addEffect(addCounter)}>+</button>
      </section>

      <section>${counters}</section>
    </div>`
  })

const useCount = useState(Pure.of(0))

export const Counter = (
  ref: Ref<Node | null | undefined>,
  index: number,
  addEffect: AddEffect,
): Effect<EnvOf<typeof useState>, Renderable> =>
  doEffect(function* () {
    const count = yield* useCount
    const decrement = updateState((x) => x - 1, count)
    const increment = updateState((x) => x + 1, count)

    return html`<section ref=${ref}>
      <h2>Counter ${index + 1}</h2>
      <section style="display:flex;align-items:center;">
        <button onclick=${() => addEffect(decrement)}>-</button>
        <p style="margin: 0 0.5rem;">${yield* getState(count)}</p>
        <button onclick=${() => addEffect(increment)}>+</button>
      </section>
    </section>`
  })

pipe(
  patchOnRaf(main, document.body),
  provideBrowserHooks,
  providePatchRefs,
  provide(patchReactEnv),
  provideRafEnv,
  provideWhenIdleEnv,
  runAsFiberWith(newDefaultScheduler()),
)

document.title = `uhtml: Counter Example`
