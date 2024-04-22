import * as Fx from "@typed/fx"
import type { Chunk } from "effect"
import { Effect, Either, flow, Scope } from "effect"
import { unsafeGet } from "effect/Context"
import type { Placeholder } from "../../Placeholder.js"
import type { Renderable } from "../../Renderable.js"
import type { RenderContext } from "../../RenderContext.js"
import { DomRenderEvent, type RenderEvent } from "../../RenderEvent.js"
import type { RenderQueue } from "../../RenderQueue.js"
import type { RenderTemplate } from "../../RenderTemplate.js"
import type * as Template from "../../Template.js"
import { getHydrateEntry } from "../hydrate.js"
import { HydrateContext } from "../HydrateContext.js"
import { findHydratePath, type ParentChildNodes } from "../utils.js"
import { getBrowserEntry } from "./render-entry.js"
import type { TemplateContext } from "./render.js"
import {
  makeTemplateContext,
  renderTemplate,
  setupAttrPart,
  setupBooleanPart,
  setupClassNamePart,
  setupCommentPart,
  setupDataPart,
  setupEventPart,
  setupNodePart,
  setupPropertiesPart,
  setupPropertyPart,
  setupRefPart,
  setupSparseAttrPart,
  setupSparseClassNamePart,
  setupSparseCommentPart,
  setupTextPart
} from "./render.js"

type HydrateTemplateContext = TemplateContext & {
  readonly where: ParentChildNodes
  readonly makeHydrateContext: (index: number) => HydrateContext
}

export const hydrateTemplate: (document: Document, ctx: RenderContext) => RenderTemplate = (
  document,
  renderContext
) => {
  const render_ = renderTemplate(document, renderContext)

  return <Values extends ReadonlyArray<Renderable<any, any>>>(
    templateStrings: TemplateStringsArray,
    values: Values
  ): Fx.Fx<
    RenderEvent,
    Placeholder.Error<Values[number]>,
    Scope.Scope | RenderQueue | Placeholder.Context<Values[number]>
  > => {
    const entry = getBrowserEntry(document, renderContext, templateStrings)

    return Fx.make((sink) =>
      Effect.gen(function*(_) {
        const ctx = yield* _(makeTemplateContext(entry.content, document, renderContext, values, sink.onFailure))
        const hydrateCtx = unsafeGet(ctx.context, HydrateContext)

        // If we're not longer hydrating, just render normally
        if (hydrateCtx.hydrate === false) {
          return render_(templateStrings, values).run(sink)
        }

        const either = getHydrateEntry({
          ...hydrateCtx,
          document,
          renderContext,
          strings: templateStrings
        })

        // If we can't hydrate, just render normally
        if (Either.isLeft(either)) {
          hydrateCtx.hydrate = false
          return yield* _(render_(templateStrings, values).run(sink))
        }

        const { template, where, wire } = either.right

        if (template.parts.length === 0) return yield* _(sink.onSuccess(DomRenderEvent(wire)))

        const makeHydrateContext = (index: number): HydrateContext => ({
          where,
          rootIndex: index,
          parentTemplate: template,
          hydrate: true
        })

        const effects = setupParts(template.parts, { ...ctx, where, makeHydrateContext })
        if (effects.length > 0) {
          yield* _(Effect.forEach(effects, flow(Effect.catchAllCause(ctx.onCause), Effect.forkIn(ctx.scope))))
        }

        // Setup our event listeners for our wire.
        // We use the parentScope to allow event listeners to exist
        // beyond the lifetime of the current Fiber, but no further than its parent template.
        yield* _(ctx.eventSource.setup(wire, ctx.parentScope))

        yield* _(
          // Emit our DomRenderEvent
          sink.onSuccess(DomRenderEvent(wire)),
          // Ensure our templates last forever in the DOM environment
          // so event listeners are kept attached to the current Scope.
          Effect.zipRight(Effect.never),
          // Close our scope whenever the current Fiber is interrupted
          Effect.onExit((exit) => Scope.close(ctx.scope, exit))
        )
      })
    )
  }
}

function setupParts(parts: Template.Template["parts"], ctx: HydrateTemplateContext) {
  const effects: Array<Effect.Effect<void, any, any>> = []

  for (const [part, path] of parts) {
    const effect = setupPart(part, path, ctx)
    if (effect) {
      effects.push(effect)
    }
  }

  return effects
}

function setupPart(
  part: Template.PartNode | Template.SparsePartNode,
  path: Chunk.Chunk<number>,
  ctx: HydrateTemplateContext
) {
  try {
    const node = findHydratePath(ctx.where, path)

    switch (part._tag) {
      case "attr":
        return setupAttrPart(part, node as any, ctx, ctx.values[part.index])
      case "boolean-part":
        return setupBooleanPart(part, node as any, ctx, ctx.values[part.index])
      case "className-part":
        return setupClassNamePart(part, node as any, ctx, ctx.values[part.index])
      case "comment-part":
        return setupCommentPart(part, node as any, ctx)
      case "data":
        return setupDataPart(part, node as any, ctx, ctx.values[part.index])
      case "event":
        return setupEventPart(part, node as any, ctx, ctx.values[part.index])
      case "node": {
        const effect = setupNodePart(part, node as any, ctx, true)
        if (effect === null) return null
        return Effect.provideService(effect, HydrateContext, ctx.makeHydrateContext(part.index))
      }
      case "properties":
        return setupPropertiesPart(part, node as any, ctx)
      case "property":
        return setupPropertyPart(part, node as any, ctx, ctx.values[part.index])
      case "ref":
        return setupRefPart(part, node as any, ctx)
      case "sparse-attr":
        return setupSparseAttrPart(part, node as any, ctx)
      case "sparse-class-name":
        return setupSparseClassNamePart(part, node as any, ctx)
      case "sparse-comment":
        return setupSparseCommentPart(part, node as any, ctx)
      case "text-part":
        return setupTextPart(part, node as any, ctx)
    }
  } catch (error) {
    console.error(error)
    throw error
  }
}
