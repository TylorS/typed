import { doEffect, Effect, EnvOf, Pure } from '@typed/fp/Effect/exports'
import { getState, updateState, useState } from '@typed/fp/hooks/exports'
import { AddEffect } from '@typed/fp/patch/exports'
import { Ref } from '@typed/fp/SharedRef/exports'
import { html, Renderable } from 'uhtml'

const useCount = useState(Pure.of(0))

export type UHtmlRef = Ref<Node | null | undefined>

export const Counter = (
  ref: UHtmlRef,
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
