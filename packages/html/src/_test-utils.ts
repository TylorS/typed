import { ok } from 'assert'

import { millis } from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import { DomServices, GlobalThis, makeDomServices } from '@typed/dom'
import { makeServerWindow } from '@typed/framework/makeServerWindow'
import * as Fx from '@typed/fx'

import { RenderContext, makeRenderContext } from './RenderContext.js'
import { RenderTemplate } from './RenderTemplate.js'
import { TemplateResult } from './TemplateResult.js'
import { dom } from './dom.js'
import { Rendered } from './render.js'
import { render } from './render2.js'

export const testRenderTemplate = <R, E, Y extends Effect.EffectGen<any, any, any>, O>(
  template: Fx.Fx<R, E, TemplateResult>,
  f: (
    $: Effect.Adapter,
    rendered: Rendered,
    sendEvent: (config: {
      event: string
      init?: EventInit
    }) => Effect.Effect<GlobalThis, never, void>,
  ) => Generator<Y, O>,
  environment: RenderContext['environment'] = 'browser',
): Effect.Effect<
  | Exclude<Exclude<Exclude<Exclude<R, RenderTemplate>, DomServices>, RenderContext>, Scope.Scope>
  | Exclude<
      Exclude<
        Exclude<
          Exclude<
            [Y] extends [never]
              ? never
              : [Y] extends [Effect.EffectGen<infer R, any, any>]
              ? R
              : never,
            RenderTemplate
          >,
          DomServices
        >,
        RenderContext
      >,
      Scope.Scope
    >,
  [Y] extends [never] ? never : [Y] extends [Effect.EffectGen<any, infer E, any>] ? E : never,
  O
> => {
  const window = makeServerWindow({ url: 'https://example.com' })

  return pipe(
    template,
    render(window.document.body),
    Effect.flatMap((rendered) =>
      Effect.gen(($) =>
        f($, rendered, ({ event, init }) =>
          GlobalThis.withEffect((globalThis) =>
            Effect.gen(function* ($) {
              ok(rendered instanceof globalThis.HTMLElement)

              // Allow for event handlers to be registered
              yield* $(Effect.sleep(millis(1)))

              rendered.dispatchEvent(new globalThis.Event(event, init))

              // Allow for event handlers to be called
              yield* $(Effect.sleep(millis(1)))
            }),
          ),
        ),
      ),
    ),
    Effect.provideSomeLayer(dom),
    Effect.provideSomeContext(makeDomServices(window, window)),
    RenderContext.provide(makeRenderContext(environment)),
    Effect.scoped,
  )
}
