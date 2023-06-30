import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

import { RenderContext } from '../RenderContext.js'
import { HtmlRenderEvent, RenderEvent } from '../RenderEvent.js'
import { RenderTemplate } from '../RenderTemplate.js'
import { TYPED_END, TYPED_START } from '../meta.js'
import { Template } from '../parser/parser.js'

import { renderTemplateToHtml } from './RenderTemplate.js'
import { HtmlChunk } from './templateToHtmlChunks.js'

export type ServerTemplateCache = {
  readonly template: Template
  readonly chunks: readonly HtmlChunk[]
}

export function renderToHtmlStream<R, E>(
  fx: Fx.Fx<R, E, RenderEvent>,
): Fx.Fx<RenderContext | Exclude<R, RenderTemplate>, E, string> {
  return Fx.Fx((sink) =>
    Effect.provideSomeLayer(
      Effect.flatMap(
        Effect.flatMap(sink.event(TYPED_START), () =>
          fx.run(Fx.Sink((event) => sink.event((event as HtmlRenderEvent).html), sink.error)),
        ),
        () => sink.event(TYPED_END),
      ),
      renderTemplateToHtml,
    ),
  )
}

export function renderToHtml<R, E>(
  fx: Fx.Fx<R, E, RenderEvent>,
): Effect.Effect<Exclude<R, RenderTemplate> | Scope.Scope | RenderContext, E, string> {
  return Effect.map(Fx.toReadonlyArray(renderToHtmlStream(fx)), (chunks) => chunks.join(''))
}
