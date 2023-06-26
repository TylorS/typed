import { pipe } from '@effect/data/Function'
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
  return pipe(
    fx,
    Fx.map((event) => (event as HtmlRenderEvent).html),
    Fx.startWith(TYPED_START),
    Fx.continueWith(() => Fx.succeed(TYPED_END)),
    Fx.provideSomeLayer(renderTemplateToHtml),
  )
}

export function renderToHtml<R, E>(
  fx: Fx.Fx<R, E, RenderEvent>,
): Effect.Effect<R | Scope.Scope | RenderContext, E, string> {
  return Effect.map(Fx.toReadonlyArray(renderToHtmlStream(fx)), (chunks) => chunks.join(''))
}
