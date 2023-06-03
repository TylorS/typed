import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Fx from '@typed/fx'

import { RenderEvent } from './RenderEvent.js'
import { getElementsFromRendered } from './getElementsFromRendered.js'
import { nodeToHtml } from './part/NodePart.js'

export function renderHtmlStream<R, E>(fx: Fx.Fx<R, E, RenderEvent>): Fx.Fx<R, E, string> {
  return Fx.Fx((sink) =>
    Effect.gen(function* ($) {
      const deferred = yield* $(Deferred.make<never, void>())
      const done = Deferred.succeed(deferred, void 0)

      const onEvent = (event: RenderEvent) =>
        Effect.gen(function* ($) {
          switch (event._tag) {
            case 'FullHtml': {
              yield* $(sink.event(event.html))

              return yield* $(done)
            }
            case 'PartialHtml': {
              const { html, isLast } = event

              yield* $(sink.event(html))

              if (isLast) {
                return yield* $(done)
              }

              return
            }
            case 'RenderedDom': {
              const { rendered } = event
              const elements = getElementsFromRendered(rendered)
              const html = elements.map(nodeToHtml).join('')

              yield* $(sink.event(html))

              return yield* $(done)
            }
            default: {
              // Should never really happen
              return yield* $(done)
            }
          }
        })

      const fiber = yield* $(fx.run(Fx.Sink(onEvent, sink.error)), Effect.fork)

      yield* $(Deferred.await(deferred))
      yield* $(Fiber.interruptFork(fiber))
    }),
  )
}

export function renderToHtml<R, E>(fx: Fx.Fx<R, E, RenderEvent>): Effect.Effect<R, E, string> {
  return Effect.scoped(
    Effect.map(Fx.toReadonlyArray(renderHtmlStream(fx)), (html) => html.join('')),
  )
}
