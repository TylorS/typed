import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import * as Context from '@typed/context'
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
    Effect.map(Effect.all({ document: Document, renderContext: RenderContext }), (input) => ({
      renderTemplate: (strings, values) => renderTemplate(input, strings, values),
    })),
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
    Effect.contextWithEffect(
      (context: Context.Context<Placeholder.ResourcesOf<Values[number]> | R2 | Scope.Scope>) => {
        const browserCache = makeEmptyBrowerCache()
        const { cleanup, wire, parts } = getRenderEntry({
          ...input,
          browserCache,
          strings,
          context,
          onCause: sink.error,
        })

        return Effect.flatMap(
          Effect.flatMap(
            Effect.addFinalizer(() => cleanup),
            () =>
              parts.length === 0
                ? sink.event(DomRenderEvent(wire() as Rendered))
                : Effect.flatMap(
                    Effect.tap(indexRefCounter(parts.length), ({ onValue }) =>
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
                    ),
                    ({ onReady }) =>
                      Effect.flatMap(onReady, () => sink.event(DomRenderEvent(wire() as Rendered))),
                  ),
          ),
          () => Effect.never(),
        )
      },
    ),
  )
}

function renderPart<R, E>(
  values: ReadonlyArray<Renderable<any, any>>,
  part: Part | SparsePart,
  sink: Fx.Sink<R, E, unknown>,
): Effect.Effect<R, never, void> {
  return Effect.suspend((): Effect.Effect<R, never, void> => {
    if (part._tag === 'SparseClassName' || part._tag === 'SparseAttr') {
      return part.observe(
        part.parts.map((p) => (p._tag === 'StaticText' ? Fx.succeed(p.text) : values[p.index])),
        sink,
      )
    } else {
      const renderable = values[part.index]

      if (isDirective<R, E>(renderable)) {
        return Effect.matchCauseEffect(renderable.f(part), sink.error, () => sink.event(part.value))
      } else {
        return part.observe(values[part.index], sink)
      }
    }
  })
}
