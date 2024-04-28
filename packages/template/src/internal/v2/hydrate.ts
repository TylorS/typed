import * as Fx from "@typed/fx"
import { isText } from "@typed/wire"
import type { Chunk } from "effect"
import { Effect, flow, Scope } from "effect"
import { unsafeGet } from "effect/Context"
import type { BrowserEntry } from "../../Entry.js"
import type { Placeholder } from "../../Placeholder.js"
import type { Renderable } from "../../Renderable.js"
import type { RenderContext } from "../../RenderContext.js"
import { DomRenderEvent, type RenderEvent } from "../../RenderEvent.js"
import type { RenderQueue } from "../../RenderQueue.js"
import type { RenderTemplate } from "../../RenderTemplate.js"
import type * as Template from "../../Template.js"
import { CouldNotFindCommentError, isHydrationError } from "../errors.js"
import { HydrateContext } from "../HydrateContext.js"
import { findHydratePath, isCommentWithValue, type ParentChildNodes } from "../utils.js"
import type { HydrationHole, HydrationNode, HydrationTemplate } from "./hydration-template.js"
import {
  findHydrationHole,
  findHydrationMany,
  findHydrationTemplate,
  getChildNodes,
  getNodes,
  getPreviousNodes
} from "./hydration-template.js"
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
  readonly where: HydrationNode
  readonly manyKey: string | undefined
  readonly makeHydrateContext: (where: HydrationNode, index: number) => HydrateContext
}

function findWhere(hydrateCtx: HydrateContext, entry: BrowserEntry): HydrationTemplate | null {
  // If there is not a manyKey, we can just find the template by its hash
  if (hydrateCtx.manyKey === undefined) {
    return findHydrationTemplate(getChildNodes(hydrateCtx.where), entry.template.hash)
  }

  // If there is a manyKey, we need to find the many node first
  const many = findHydrationMany(getChildNodes(hydrateCtx.where), hydrateCtx.manyKey)

  if (many === null) return null

  // Then we can find the template by its hash
  return findHydrationTemplate(getChildNodes(many), entry.template.hash)
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
      Effect.catchAllDefect(
        Effect.gen(function*() {
          const ctx = yield* makeTemplateContext(entry.content, document, renderContext, values, sink.onFailure)
          const hydrateCtx = unsafeGet(ctx.context, HydrateContext)

          // If we're not longer hydrating, just render normally
          if (hydrateCtx.hydrate === false) {
            return yield* render_(templateStrings, values).run(sink)
          }

          const where: HydrationTemplate | null = findWhere(hydrateCtx, entry)

          if (where === null) {
            hydrateCtx.hydrate = false
            return yield* render_(templateStrings, values).run(sink)
          }

          const wire = getNodes(where)

          if (entry.template.parts.length === 0) return yield* sink.onSuccess(DomRenderEvent(wire))

          const makeHydrateContext = (where: HydrationNode): HydrateContext => ({
            where,
            parentTemplate: entry.template,
            hydrate: true
          })

          const effects = setupParts(entry.template.parts, {
            ...ctx,
            where,
            manyKey: hydrateCtx.manyKey,
            makeHydrateContext
          })
          if (effects.length > 0) {
            yield* Effect.forEach(effects, flow(Effect.catchAllCause(ctx.onCause), Effect.forkIn(ctx.scope)))
          }

          // Setup our event listeners for our wire.
          // We use the parentScope to allow event listeners to exist
          // beyond the lifetime of the current Fiber, but no further than its parent template.
          yield* ctx.eventSource.setup(wire, ctx.parentScope)

          // Emit our DomRenderEvent
          yield* sink.onSuccess(DomRenderEvent(wire)).pipe(
            // Ensure our templates last forever in the DOM environment
            // so event listeners are kept attached to the current Scope.
            Effect.zipRight(Effect.never),
            // Close our scope whenever the current Fiber is interrupted
            Effect.onExit((exit) => Scope.close(ctx.scope, exit))
          )
        }),
        (defect) =>
          Effect.gen(function*() {
            if (isHydrationError(defect)) {
              console.error(defect)
              const hydrateCtx = yield* HydrateContext
              hydrateCtx.hydrate = false
              return yield* render_(templateStrings, values).run(sink)
            } else {
              return yield* Effect.die(defect)
            }
          })
      )
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
  switch (part._tag) {
    case "attr":
      return setupAttrPart(part, findHydratePath(ctx.where, path) as any, ctx, ctx.values[part.index])
    case "boolean-part":
      return setupBooleanPart(part, findHydratePath(ctx.where, path) as any, ctx, ctx.values[part.index])
    case "className-part":
      return setupClassNamePart(part, findHydratePath(ctx.where, path) as any, ctx, ctx.values[part.index])
    case "comment-part":
      return setupCommentPart(part, findHydratePath(ctx.where, path) as any, ctx)
    case "data":
      return setupDataPart(part, findHydratePath(ctx.where, path) as any, ctx, ctx.values[part.index])
    case "event":
      return setupEventPart(part, findHydratePath(ctx.where, path) as any, ctx, ctx.values[part.index])
    case "node": {
      const hole = findHydrationHole(getChildNodes(ctx.where), part.index)
      if (hole === null) {
        throw new CouldNotFindCommentError(part.index)
      }
      return setupHydratedNodePart(part, hole, ctx)
    }
    case "properties":
      return setupPropertiesPart(part, findHydratePath(ctx.where, path) as any, ctx)
    case "property":
      return setupPropertyPart(part, findHydratePath(ctx.where, path) as any, ctx, ctx.values[part.index])
    case "ref":
      return setupRefPart(part, findHydratePath(ctx.where, path) as any, ctx)
    case "sparse-attr":
      return setupSparseAttrPart(part, findHydratePath(ctx.where, path) as any, ctx)
    case "sparse-class-name":
      return setupSparseClassNamePart(part, findHydratePath(ctx.where, path) as any, ctx)
    case "sparse-comment":
      return setupSparseCommentPart(part, findHydratePath(ctx.where, path) as any, ctx)
    case "text-part": {
      const hole = findHydrationHole(getChildNodes(ctx.where), part.index)
      if (hole === null) throw new CouldNotFindCommentError(part.index)
      return setupTextPart(part, hole.endComment, ctx)
    }
  }
}

function setupHydratedNodePart(
  part: Template.NodePart,
  hole: HydrationHole,
  ctx: HydrateTemplateContext
) {
  const nestedCtx = ctx.makeHydrateContext(hole, part.index)
  const previousNodes = getPreviousNodes(hole)
  const text = previousNodes.length === 2 && isCommentWithValue(previousNodes[0], "text") && isText(previousNodes[1])
    ? previousNodes[1]
    : null
  const effect = setupNodePart(part, hole.endComment, ctx, text, text === null ? previousNodes : [text])
  if (effect === null) return null
  return Effect.provideService(effect, HydrateContext, nestedCtx)
}

export function findRootParentChildNodes(where: HTMLElement): ParentChildNodes {
  const childNodes = findRootChildNodes(where)

  return {
    parentNode: where,
    childNodes
  }
}

const START = "typed-start"
const END = "typed-end"

// Finds all of the childNodes between the "typed-start" and "typed-end" comments
export function findRootChildNodes(where: HTMLElement): Array<Node> {
  let start = -1
  let end = -1

  const { childNodes } = where
  const length = childNodes.length

  for (let i = 0; i < length; i++) {
    const node = childNodes[i]

    if (node.nodeType === node.COMMENT_NODE && node.nodeValue === START) {
      start = i
      break
    }
  }

  for (let i = length - 1; i >= Math.max(start, 0); i--) {
    const node = childNodes[i]

    if (node.nodeType === node.COMMENT_NODE && node.nodeValue === END) {
      end = i
      break
    }
  }

  // If we can't find the start and end comments, just return all childNodes
  if (start === -1 && end === -1) {
    return Array.from(childNodes)
  }

  start = start === -1 ? 0 : start
  end = end === -1 ? length - 1 : end

  const rootChildNodes: Array<Node> = Array(end - start)

  for (let i = start + 1, j = 0; i <= end; i++) {
    rootChildNodes[j++] = childNodes[i]
  }

  return rootChildNodes
}
