import { newDefaultScheduler } from '@most/scheduler'
import { provideRafEnv, provideWhenIdleEnv } from '@typed/fp/dom/exports'
import { doEffect, provide, Pure } from '@typed/fp/Effect/exports'
import { runAsFiberWith } from '@typed/fp/fibers/exports'
import { getState, provideBrowserHooks, updateState, useState } from '@typed/fp/hooks/exports'
import {
  AddEffect,
  ListManagerValue,
  patchOnRaf,
  providePatchRefs,
  useListManager,
} from '@typed/fp/patch/exports'
import { eqNumber } from 'fp-ts/Eq'
import { decrement, increment } from 'fp-ts/function'
import { pipe } from 'fp-ts/pipeable'
import { range } from 'fp-ts/ReadonlyArray'
import { html } from 'uhtml'

import { Counter } from './Counter'
import { patchMicroHtmlEnv } from './infrastructure'

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
        <button onclick=${() => addEffect(removeCounter, {})}>-</button>
        <p style="margin: 0 0.5rem;">Number of Counters: ${count}</p>
        <button onclick=${() => addEffect(addCounter, {})}>+</button>
      </section>

      <section>${counters}</section>
    </div>`
  })

pipe(
  patchOnRaf(main, document.body),
  provideBrowserHooks,
  providePatchRefs,
  provide(patchMicroHtmlEnv),
  provideRafEnv,
  provideWhenIdleEnv,
  runAsFiberWith(newDefaultScheduler()),
)
