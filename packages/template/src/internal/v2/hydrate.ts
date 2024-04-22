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
import { CouldNotFindCommentError, CouldNotFindManyCommentError } from "../errors.js"
import type { CouldNotFindRootElement } from "../errors.js"
import { HydrateContext } from "../HydrateContext.js"
import {
  findHydratePath,
  getPreviousNodes,
  isComment,
  isCommentStartingWithValue,
  isCommentWithValue,
  type ParentChildNodes
} from "../utils.js"
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

export function findTemplateResultPartChildNodes(
  where: ParentChildNodes,
  parentTemplate: Template.Template,
  partIndex: number,
  manyIndex?: string
): Either.Either<ParentChildNodes, CouldNotFindRootElement | CouldNotFindManyCommentError | CouldNotFindCommentError> {
  const [, path] = parentTemplate.parts[partIndex]
  const parentNode = findHydratePath(where, path) as HTMLElement

  const childNodesEither = findPartChildNodes(parentNode, partIndex)
  if (Either.isLeft(childNodesEither)) return Either.left(childNodesEither.left)

  const childNodes = childNodesEither.right

  if (manyIndex) {
    const manyChildNodes = findManyChildNodes(childNodes, manyIndex)
    if (Either.isLeft(manyChildNodes)) return Either.left(manyChildNodes.left)
    return Either.right<ParentChildNodes>({ parentNode, childNodes: manyChildNodes.right })
  }

  return Either.right<ParentChildNodes>({
    parentNode,
    childNodes
  })
}

export function findManyChildNodes(
  childNodes: Array<Node>,
  manyIndex: string
): Either.Either<Array<Node>, CouldNotFindManyCommentError> {
  const either = findManyComment(childNodes, manyIndex)
  if (Either.isLeft(either)) return Either.left(either.left)

  const [, index] = either.right
  const toCheck = childNodes.slice(0, index)
  const nodes = findPreviousManyComment(toCheck)

  return Either.right(nodes)
}

export function findPartChildNodes(
  { childNodes }: ParentChildNodes,
  partIndex: number
): Either.Either<Array<Node>, CouldNotFindRootElement | CouldNotFindCommentError> {
  const either = findPartComment(childNodes, partIndex)
  if (Either.isLeft(either)) return Either.left(either.left)
  const [comment] = either.right
  return Either.right([...getPreviousNodes(comment, partIndex), comment])
}

export function findPartComment(
  childNodes: ArrayLike<Node>,
  partIndex: number
): Either.Either<readonly [Comment, number], CouldNotFindCommentError> {
  const search = partIndex === -1 ? `typed-end` : `hole${partIndex}`

  for (let i = 0; i < childNodes.length; ++i) {
    const node = childNodes[i]

    if (isCommentWithValue(node, search)) {
      return Either.right([node, i] as const)
    }
  }

  return Either.left(new CouldNotFindCommentError(partIndex))
}

export function findManyComment(
  childNodes: ArrayLike<Node>,
  manyIndex: string
): Either.Either<readonly [Comment, number], CouldNotFindManyCommentError> {
  const search = `many${manyIndex}`

  for (let i = 0; i < childNodes.length; ++i) {
    const node = childNodes[i]

    if (isCommentWithValue(node, search)) {
      return Either.right([node, i] as const)
    }
  }

  return Either.left(new CouldNotFindManyCommentError(manyIndex))
}

export function findPreviousManyComment(
  childNodes: Array<Node>
) {
  for (let i = childNodes.length - 1; i > -1; --i) {
    const node = childNodes[i]

    if (isCommentStartingWithValue(node, "many")) {
      return childNodes.slice(i + 1)
    }
  }
  return childNodes
}

export function getHydrateEntry({
  document,
  manyIndex,
  parentTemplate,
  renderContext,
  rootIndex,
  strings,
  where
}: {
  document: Document
  renderContext: RenderContext
  where: ParentChildNodes
  rootIndex: number
  parentTemplate: Template.Template | null
  strings: TemplateStringsArray
  manyIndex?: string
}): Either.Either<
  { readonly template: Template.Template; readonly wire: Node | Array<Node>; readonly where: ParentChildNodes },
  CouldNotFindRootElement | CouldNotFindCommentError | CouldNotFindManyCommentError
> {
  const { template } = getBrowserEntry(document, renderContext, strings)

  if (parentTemplate) {
    const either = findTemplateResultPartChildNodes(where, parentTemplate, rootIndex, manyIndex)
    if (Either.isLeft(either)) {
      return Either.left(either.left)
    }
    where = either.right
  }

  const wire = (() => {
    if (!parentTemplate) {
      const childNodes = Array.from(where.childNodes).filter((node) =>
        isComment(node) ? !isCommentWithValue(node, END) : true
      )

      if (childNodes.length === 1) {
        return childNodes[0]
      }

      return childNodes
    }

    if (where.childNodes.length === 1) {
      return where.childNodes[0]
    }

    return Array.from(where.childNodes).filter(
      (node) => !isCommentWithValue(node, `hole${rootIndex}`)
    )
  })()

  return Either.right(
    {
      template,
      wire,
      where
    } as const
  )
}
