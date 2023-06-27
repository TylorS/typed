import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import { Tag, unsafeGet } from '@typed/context'
import { Document } from '@typed/dom'
import * as Fx from '@typed/fx'

import { isDirective } from '../Directive.js'
import { Placeholder } from '../Placeholder.js'
import { RenderContext } from '../RenderContext.js'
import { DomRenderEvent, RenderEvent } from '../RenderEvent.js'
import { RenderTemplate } from '../RenderTemplate.js'
import { Renderable } from '../Renderable.js'
import { Rendered } from '../Rendered.js'
import { Template } from '../parser/parser.js'
import { Part, SparsePart } from '../part/Part.js'
import { ParentChildNodes } from '../paths.js'

import { renderTemplate } from './RenderTemplate.js'
import {
  CouldNotFindCommentError,
  CouldNotFindRootElement,
  getHydrateEntry,
  makeEmptyBrowerCache,
} from './cache.js'
import { indexRefCounter } from './indexRefCounter.js'

type HydrateInput = {
  readonly document: Document
  readonly renderContext: RenderContext
}

/**
 * Used Internally to pass context down to components for hydration
 * @internal
 */
export type HydrateContext = {
  readonly where: ParentChildNodes
  readonly rootIndex: number
  readonly parentTemplate: Template | null
}

/**
 * Used Internally to pass context down to components for hydration
 * @internal
 */
export const HydrateContext = Tag<HydrateContext>('@typed/html/HydrateContext')

export const hydrateTemplateInDom: Layer.Layer<Document | RenderContext, never, RenderTemplate> =
  RenderTemplate.layer(
    // eslint-disable-next-line require-yield
    Effect.gen(function* ($) {
      const input: HydrateInput = {
        document: yield* $(Document),
        renderContext: yield* $(RenderContext),
      }

      const impl: RenderTemplate = {
        renderTemplate: <Values extends readonly Renderable<any, any>[]>(
          strings: TemplateStringsArray,
          values: Values,
        ) => hydrateTemplate(input, strings, values),
      }

      return impl
    }),
  )

function hydrateTemplate<Values extends readonly Renderable<any, any>[]>(
  input: HydrateInput,
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

      try {
        const [{ template, cleanup, wire, parts }, where] = getHydrateEntry({
          ...input,
          ...unsafeGet(context, HydrateContext),
          browserCache,
          strings,
          context,
          onCause: sink.error,
        })

        const makeHydrateContext = (index: number): HydrateContext => ({
          where,
          parentTemplate: template,
          rootIndex: index,
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
                    makeHydrateContext,
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
      } catch (error) {
        // If hydration begins to fail, we'll just render the template as normal
        if (error instanceof CouldNotFindCommentError || error instanceof CouldNotFindRootElement) {
          return yield* $(renderTemplate(input, strings, values).run(sink))
        }

        throw error
      }
    }),
  )
}

function renderPart<R, E>(
  values: ReadonlyArray<Renderable<any, any>>,
  part: Part | SparsePart,
  makeHydrateContext: (index: number) => HydrateContext,
  sink: Fx.Sink<R, E, unknown>,
): Effect.Effect<R, never, void> {
  return Effect.gen(function* ($) {
    if (part._tag === 'Node') {
      const renderable = values[part.index]

      if (isDirective<R, E>(renderable)) {
        yield* $(
          renderable.f(part),
          Effect.matchCauseEffect(sink.error, () => sink.event(part.value)),
        )
      } else {
        yield* $(
          part.observe(values[part.index], sink),
          HydrateContext.provide(makeHydrateContext(part.index)),
        )
      }
    } else if (part._tag === 'SparseClassName' || part._tag === 'SparseAttr') {
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
