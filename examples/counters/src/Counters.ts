import { doEffect } from '@typed/fp/Effect/exports'
import { Namespace, useListEffect } from '@typed/fp/Shared/exports'
import { eqNumber } from 'fp-ts/Eq'
import { range } from 'fp-ts/ReadonlyArray'
import { html } from 'lighterhtml-plus'

import { Counter } from './Counter'
import { useCounter } from './useCounter'

export const Counters = doEffect(function* () {
  const { increment, decrement, count } = yield* useCounter
  const counters = yield* useListEffect(range(1, count + 1), Namespace.wrap, Counter, eqNumber)

  return html`<section style="display:flex; align-items:center; margin-top: 0.5rem;">
      <button onclick=${decrement}>-</button>
      <p style="margin: 0 0.5rem;">Number of Counters: ${count + 1}</p>
      <button onclick=${increment}>+</button>
    </section>
    ${counters}`
})
