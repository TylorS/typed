import { deepStrictEqual, ok } from 'assert'

import { millis } from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import { DomServices, GlobalThis, makeDomServices } from '@typed/dom'
import { makeServerWindow } from '@typed/framework/makeServerWindow'
import * as Fx from '@typed/fx'

import { RenderContext, makeRenderContext } from './RenderContext.js'
import { RenderTemplate, renderTemplate } from './RenderTemplate.js'
import { TemplateResult } from './TemplateResult.js'
import { Rendered, render } from './render.js'
import { HtmlEvent, renderToHtml, renderToHtmlStream } from './renderHtml.js'

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
) => {
  const window = makeServerWindow({ url: 'https://example.com' })
  const { context } = RenderTemplate.build({ renderTemplate })
    .mergeContext(makeDomServices(window, window))
    .merge(RenderContext.build(makeRenderContext(environment)))

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
    Effect.provideSomeContext(context),
    Effect.scoped,
  )
}

export const testHtmlEvents = <R, E>(
  template: Fx.Fx<R, E, TemplateResult>,
  expected: readonly HtmlEvent[],
  environment: RenderContext['environment'] = 'browser',
): Effect.Effect<
  Exclude<Exclude<R, RenderContext | Scope.Scope | RenderTemplate | DomServices>, Scope.Scope>,
  E,
  readonly HtmlEvent[]
> => {
  const window = makeServerWindow({ url: 'https://example.com' })
  const scope = Effect.runSync(Scope.make())
  const { context } = RenderTemplate.build({ renderTemplate })
    .mergeContext(makeDomServices(window, window))
    .merge(RenderContext.build(makeRenderContext(environment)))
    .add(Scope.Scope, scope)

  return pipe(
    renderToHtmlStream(template),
    Fx.toReadonlyArray,
    Effect.provideSomeContext(context),
    Effect.scoped,
    Effect.map((events) => {
      try {
        deepStrictEqual(events.map(trimHtmlEvent), expected.map(trimHtmlEvent))
      } catch (error) {
        console.log(`Actual:`, ...events.map(trimHtmlEvent))
        console.log(`Expected:`, ...expected.map(trimHtmlEvent))
      }

      return events
    }),
  )
}

function trimHtmlEvent(event: HtmlEvent) {
  return event.html.replace(/\s+/g, ' ').trim()
}

export const testHtml = <R, E>(
  template: Fx.Fx<R, E, TemplateResult>,
  environment: RenderContext['environment'] = 'browser',
): Effect.Effect<
  Exclude<R, RenderContext | Scope.Scope | RenderTemplate | DomServices>,
  E,
  string
> => {
  const window = makeServerWindow({ url: 'https://example.com' })
  const scope = Effect.runSync(Scope.make())
  const { context } = RenderTemplate.build({ renderTemplate })
    .mergeContext(makeDomServices(window, window))
    .merge(RenderContext.build(makeRenderContext(environment)))
    .add(Scope.Scope, scope)

  return Effect.provideSomeContext(renderToHtml(template), context)
}
