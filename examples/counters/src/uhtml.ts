import { provideRafEnv } from '@typed/fp/dom/exports'
import { doEffect, execPure, provideAll, provideSome } from '@typed/fp/Effect/exports'
import { provideSchedulerEnv } from '@typed/fp/fibers/exports'
import {
  getRenderRef,
  getSendSharedEvent,
  Namespace,
  provideSharedEnv,
  renderOnRaf,
  runWithNamespace,
  useListEffect,
} from '@typed/fp/Shared/exports'
import { pipe } from 'fp-ts/pipeable'
import { range } from 'fp-ts/ReadonlyArray'
import { html, Renderable } from 'uhtml'

import { patchUhtmlEnv } from './infrastructure'
import { useCounter } from './useCounter'

const main = doEffect(function* () {
  const { count, decrement, increment } = yield* useCounter
  const send = yield* getSendSharedEvent
  const counters = yield* useListEffect(
    range(0, count),
    (i) => runWithNamespace(Namespace.wrap(i), Counter),
    {
      onDelete: (i) => send({ type: 'namespace/deleted', namespace: Namespace.wrap(i) }),
    },
  )

  return html`<div>
    <section style="display:flex;align-items:center;">
      <button onclick=${decrement}>-</button>
      <p style="margin: 0 0.5rem;">Number of Counters: ${count}</p>
      <button onclick=${increment}>+</button>
    </section>

    <section>${counters}</section>
  </div>` as Renderable
})

export const Counter = doEffect(function* () {
  const ref = yield* getRenderRef<Node>()

  const { count, decrement, increment } = yield* useCounter

  return html`<section ref=${ref}>
    <section style="display:flex;align-items:center;">
      <button onclick=${decrement}>-</button>
      <p style="margin: 0 0.5rem;">${count}</p>
      <button onclick=${increment}>+</button>
    </section>
  </section>`
})

pipe(
  renderOnRaf(main, document.body as Node),
  provideSome(patchUhtmlEnv),
  provideRafEnv,
  provideSharedEnv,
  provideSchedulerEnv,
  provideAll({ count: 0 }),
  execPure,
)

document.title = `uhtml: Counter Example`
