import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import { Document } from '@typed/dom'
import * as Fx from '@typed/fx'

import { isDirective } from '../Directive.js'
import { Placeholder } from '../Placeholder.js'
import { RenderContext } from '../RenderContext.js'
import { DomRenderEvent, RenderEvent } from '../RenderEvent.js'
import { RenderTemplate } from '../RenderTemplate.js'
import { Renderable } from '../Renderable.js'
import { Rendered } from '../Rendered.js'
import { Part, SparsePart } from '../part/Part.js'

import { getRenderEntry, makeEmptyBrowerCache } from './cache.js'
import { indexRefCounter } from './indexRefCounter.js'

type RenderToDomInput = {
  readonly document: Document
  readonly renderContext: RenderContext
}

export const renderTemplateToDom: Layer.Layer<Document | RenderContext, never, RenderTemplate> =
  RenderTemplate.layer(
    // eslint-disable-next-line require-yield
    Effect.gen(function* ($) {
      const input: RenderToDomInput = {
        document: yield* $(Document),
        renderContext: yield* $(RenderContext),
      }

      const impl: RenderTemplate = {
        renderTemplate: (strings, values) => renderTemplate(input, strings, values),
      }

      return impl
    }),
  )

export function renderTemplate<Values extends readonly Renderable<any, any>[]>(
  input: RenderToDomInput,
  strings: TemplateStringsArray,
  values: Values,
): Fx.Fx<
  Placeholder.ResourcesOf<Values[number]> | Scope.Scope,
  Placeholder.ErrorsOf<Values[number]>,
  RenderEvent
> {
  return Fx.Fx(<R2>(sink: Fx.Sink<R2, Placeholder.ErrorsOf<Values[number]>, RenderEvent>) =>
    Effect.gen(function* ($) {
      const browserCache = makeEmptyBrowerCache()
      const context = yield* $(
        Effect.context<Placeholder.ResourcesOf<Values[number]> | R2 | Scope.Scope>(),
      )
      const { cleanup, wire, parts } = getRenderEntry({
        ...input,
        browserCache,
        strings,
        context,
        onCause: sink.error,
      })

      yield* $(Effect.addFinalizer(() => cleanup))

      if (parts.length === 0) {
        yield* $(sink.event(DomRenderEvent(wire() as Rendered)))
      } else {
        const { onReady, onValue } = yield* $(indexRefCounter(parts.length))

        yield* $(
          Effect.all(
            parts.map((part, i) =>
              Effect.forkScoped(
                renderPart<
                  R2 | Placeholder.ResourcesOf<Values[number]>,
                  Placeholder.ErrorsOf<Values[number]>
                >(
                  values,
                  part,
                  Fx.Sink(() => onValue(i), sink.error),
                ),
              ),
            ),
          ),
        )

        yield* $(onReady)

        yield* $(sink.event(DomRenderEvent(wire() as Rendered)))
      }

      // A Template runs forever in the browser, the stream being unsubscribed
      // will cleanup any associated resources.
      return yield* $(Effect.never())
    }),
  )
}

function renderPart<R, E>(
  values: ReadonlyArray<Renderable<any, any>>,
  part: Part | SparsePart,
  sink: Fx.Sink<R, E, unknown>,
): Effect.Effect<R, never, void> {
  return Effect.gen(function* ($) {
    if (part._tag === 'SparseClassName' || part._tag === 'SparseAttr') {
      yield* $(
        part.observe(
          part.parts.map((p) => (p._tag === 'StaticText' ? Fx.succeed(p.text) : values[p.index])),
          sink,
        ),
      )
    } else {
      const renderable = values[part.index]

      if (isDirective<R, E>(renderable)) {
        yield* $(
          renderable.f(part),
          Effect.matchCauseEffect(sink.error, () => sink.event(part.value)),
        )
      } else {
        yield* $(part.observe(values[part.index], sink))
      }
    }
  })
}
