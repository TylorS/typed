import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/core/io/Effect'
import * as Ref from '@effect/core/io/Ref'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'

import { addEventListener } from './EventTarget.js'

import { makeServerWindow } from '@/Server/DomServices.js'

describe(import.meta.url, () => {
  describe(addEventListener.name, () => {
    it('adds an event listener to the given target', async () => {
      const { document } = makeServerWindow()
      const ref = Ref.unsafeMake(0)
      const test = pipe(
        document.body,
        addEventListener('click'),
        Fx.mapEffect(() => ref.updateAndGet((x) => x + 1)),
        Fx.take(2),
        Fx.runCollect,
      )

      const events = Effect.unsafeRunPromise(test)

      document.body.click()
      document.body.click()

      deepStrictEqual(await events, [1, 2])
    })
  })
})
