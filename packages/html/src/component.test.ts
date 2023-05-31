import { deepStrictEqual, ok } from 'assert'

import * as Duration from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import { GlobalThis, makeDomServices } from '@typed/dom'
import { makeServerWindow } from '@typed/framework/makeServerWindow.js'
import * as Fx from '@typed/fx'
import { describe, it } from 'vitest'

import { makeElementRef } from './ElementRef.js'
import { RenderContext } from './RenderContext.js'
import { component$, componentAs$ } from './component.js'
import { dom } from './dom.js'
import { stripHoleComments } from './parseTemplate.js'

describe(import.meta.url, () => {
  describe(component$.name, () => {
    it('serializes state to data attributes', async () => {
      const window = makeServerWindow({ url: 'https://example.com' })
      const test = pipe(
        Effect.gen(function* (_) {
          const globalThis = yield* _(GlobalThis)
          const component = componentAs$<HTMLDivElement>()(function* (_) {
            const count = yield* _.useState(Effect.succeed<number>(0))

            return _.html`<div ref="${
              _.ref
            }" onclick="${count.update((x) => x + 1)}">${count}</div>`
          })

          const rendered = yield* _(makeElementRef<HTMLDivElement>())

          yield* _(
            component,
            Fx.map((x) => Option.some(x as HTMLDivElement)),
            Fx.observe(rendered.set),
            Effect.forkScoped,
          )

          // Let fiber start
          yield* _(Effect.sleep(Duration.millis(1)))

          const element = yield* _(rendered)

          ok(Option.isSome(element))

          ok(element.value instanceof globalThis.HTMLDivElement)
          ok(stripHoleComments(element.value.outerHTML) === '<div data-0="0">0</div>')
          deepStrictEqual(element.value.dataset[0], '0')

          element.value.click()

          // Let event handler run
          yield* _(Effect.sleep(Duration.millis(1)))

          console.log(element.value.outerHTML)

          deepStrictEqual(element.value.dataset[0], '1')

          ok(stripHoleComments(element.value.outerHTML) === '<div data-0="1">1</div>')
        }),
        Effect.provideSomeLayer(dom),
        Effect.provideSomeContext(makeDomServices(window, window)),
        RenderContext.provide(RenderContext.make('browser')),
      )

      await Effect.runPromise(Effect.scoped(test))
    })
  })
})
