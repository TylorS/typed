import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import { Context, unsafeGet } from '@typed/context'
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

import { HydrateContext } from './HydrateContext.js'
import { renderTemplate } from './RenderTemplate.js'
import { getHydrateEntry } from './cache.js'
import { CouldNotFindCommentError, CouldNotFindRootElement } from './errors.js'
import { indexRefCounter } from './indexRefCounter.js'

type HydrateInput = {
  readonly document: Document
  readonly renderContext: RenderContext
}

const toNever_ = Effect.flatMap(() => Effect.never)

export const hydrateTemplateInDom: Layer.Layer<Document | RenderContext, never, RenderTemplate> =
  RenderTemplate.layer(
    Effect.map(Effect.all({ document: Document, renderContext: RenderContext }), (input) => ({
      renderTemplate: (strings, values) => hydrateTemplate(input, strings, values),
    })),
  )

function hydrateTemplate<Values extends readonly Renderable<any, any>[]>(
  input: HydrateInput,
  strings: TemplateStringsArray,
  values: Values,
): Fx.Fx<
  Placeholder.Context<Values[number]> | Scope.Scope,
  Placeholder.Error<Values[number]>,
  RenderEvent
> {
  return Fx.Fx(<R2>(sink: Fx.Sink<R2, Placeholder.Error<Values[number]>, RenderEvent>) =>
    Effect.catchAllDefect(
      Effect.contextWithEffect(
        (context: Context<Placeholder.Context<Values[number]> | R2 | Scope.Scope>) => {
          const ctx = unsafeGet(context, HydrateContext)

          if (!ctx.hydrate) {
            return renderTemplate(input, strings, values).run(sink)
          }

          const [{ template, wire, parts }, where] = getHydrateEntry({
            ...input,
            ...ctx,
            strings,
            context,
            onCause: sink.error,
          })

          if (parts.length === 0) {
            ctx.hydrate = false
            return sink.event(DomRenderEvent(wire() as Rendered))
          }

          const makeHydrateContext = (index: number): HydrateContext => ({
            where,
            rootIndex: index,
            parentTemplate: template,
            hydrate: true,
          })

          return toNever_(
            Effect.flatMap(indexRefCounter(parts.length), ({ onValue, onReady }) =>
              Effect.tap(
                Effect.all(
                  parts.map((part, index) =>
                    renderPart<R2, Placeholder.Error<Values[number]>>(
                      values,
                      part,
                      makeHydrateContext,
                      Fx.Sink(() => onValue(index), sink.error),
                    ),
                  ),
                ),
                () =>
                  Effect.flatMap(onReady, () => {
                    ctx.hydrate = false
                    return sink.event(DomRenderEvent(wire() as Rendered))
                  }),
              ),
            ),
          )
        },
      ),
      (error) => {
        // If hydration begins to fail, we'll just render the template as normal
        if (error instanceof CouldNotFindCommentError || error instanceof CouldNotFindRootElement) {
          return renderTemplate(input, strings, values).run(sink)
        }

        throw error
      },
    ),
  )
}

function renderPart<R, E>(
  values: ReadonlyArray<Renderable<any, any>>,
  part: Part | SparsePart,
  makeHydrateContext: (index: number) => HydrateContext,
  sink: Fx.Sink<R, E, unknown>,
): Effect.Effect<R, never, void> {
  if (part._tag === 'SparseClassName' || part._tag === 'SparseAttr') {
    return part.observe(
      part.parts.map((p) => (p._tag === 'StaticText' ? Fx.succeed(p.text) : values[p.index])),
      sink,
    )
  } else {
    const renderable = values[part.index]

    if (isDirective<R, E>(renderable)) {
      return Effect.matchCauseEffect(renderable.f(part), {
        onFailure: sink.error,
        onSuccess: () => sink.event(part.value),
      })
    } else if (part._tag === 'Node') {
      return HydrateContext.provide(makeHydrateContext(part.index))(
        part.hydrate(values[part.index], sink),
      )
    } else {
      return part.observe(values[part.index], sink)
    }
  }
}
