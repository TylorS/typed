import { doEffect, ReturnOf } from '@typed/fp/Effect/exports'
import { getRenderRef } from '@typed/fp/Patch/exports'
import { Ref } from '@typed/fp/Shared/Ref/Ref'
import { pipe } from 'fp-ts/function'
import { html } from 'lighterhtml-plus'

import { useCounter } from './useCounter'

const view = (label: string, ref: Ref<Node | null | undefined>) => ({
  count,
  increment,
  decrement,
}: ReturnOf<typeof useCounter>) => html`<section
  style="display:flex; align-items:center; margin-top: 0.5rem;"
  ref=${ref}
>
  <button onclick=${decrement}>-</button>
  <p style="margin: 0 0.5rem;">${label}: ${count}</p>
  <button onclick=${increment}>+</button>
</section>`

export const Counter = (i: number) =>
  doEffect(function* () {
    const ref = yield* getRenderRef<Node>()
    const state = yield* useCounter

    return pipe(state, view(`Counter ${i}`, ref))
  })
