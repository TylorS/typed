import * as Fx from "@typed/fx/Fx"
import * as Effect from "effect/Effect"
import type { Placeholder } from "../Placeholder.js"
import type { Renderable } from "../Renderable.js"
import type { RenderContext } from "../RenderContext.js"
import type { RenderEvent } from "../RenderEvent.js"
import { DomRenderEvent } from "../RenderEvent.js"
import type { RenderTemplate } from "../RenderTemplate.js"
import { indexRefCounter2 } from "./indexRefCounter.js"

import { unsafeGet } from "@typed/context"

import { Either } from "effect"
import { Scope } from "effect/Scope"
import type { Template } from "../Template.js"
import { CouldNotFindCommentError, CouldNotFindRootElement } from "./errors.js"
import { makeEventSource } from "./EventSource.js"
import { HydrateContext } from "./HydrateContext.js"
import type { RenderPartContext } from "./render.js"
import { getBrowserEntry, renderPart2, renderTemplate } from "./render.js"
import {
  findPath,
  getPreviousNodes,
  isComment,
  isCommentWithValue,
  isHtmlElement,
  type ParentChildNodes
} from "./utils.js"

/**
 * Here for "standard" browser rendering, a TemplateInstance is effectively a live
 * view into the contents rendered by the Template.
 */
export const hydrateTemplate: (document: Document, ctx: RenderContext) => RenderTemplate = (
  document,
  renderContext
) => {
  const render_ = renderTemplate(document, renderContext)

  return <Values extends ReadonlyArray<Renderable<any, any>>>(
    templateStrings: TemplateStringsArray,
    values: Values
  ): Fx.Fx<
    Scope | Placeholder.Context<Values[number]>,
    Placeholder.Error<Values[number]>,
    RenderEvent
  > => {
    return Fx.make((sink) =>
      Effect.gen(function*(_) {
        const context = yield* _(Effect.context<Scope>())
        const hydrateCtx = unsafeGet(context, HydrateContext)
        const scope = unsafeGet(context, Scope)

        // If we're not longer hydrating, just render normally
        if (hydrateCtx.hydrate === false) {
          return render_(templateStrings, values)
        }

        const either = getHydrateEntry({
          ...hydrateCtx,
          document,
          renderContext,
          strings: templateStrings
        })

        if (Either.isLeft(either)) {
          hydrateCtx.hydrate = false
          return render_(templateStrings, values)
        }

        const { template, where, wire } = either.right

        if (values.length === 0) return yield* _(sink.onSuccess(DomRenderEvent(wire)), Effect.zipRight(Effect.never))

        const refCounter = yield* _(indexRefCounter2())
        const ctx: RenderPartContext = {
          context,
          document,
          eventSource: makeEventSource(),
          expected: 0,
          refCounter,
          renderContext,
          onCause: sink.onFailure,
          values
        }

        // Connect our interpolated values to our template parts
        const effects: Array<Effect.Effect<Scope | Placeholder.Context<Values[number]>, never, void>> = []
        for (const [part, path] of template.parts) {
          const eff = renderPart2(part, where, path, ctx)
          if (eff !== null) {
            effects.push(
              ...(Array.isArray(eff) ? eff : [eff]) as Array<
                Effect.Effect<Scope | Placeholder.Context<Values[number]>, never, void>
              >
            )
          }
        }

        // Fork any effects necessary
        if (effects.length > 0) {
          yield* _(Effect.forkAll(effects))
        }

        // Set the element when it is ready
        yield* _(ctx.eventSource.setup(wire, scope))

        // Emit our DomRenderEvent
        yield* _(sink.onSuccess(DomRenderEvent(wire)))

        // Stop hydrating
        hydrateCtx.hydrate = false

        // Ensure our templates last forever in the DOM environment
        // so event listeners are kept attached to the current Scope.
        yield* _(Effect.never)
      })
    )
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

  for (let i = length - 1; i >= start; i--) {
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
  parentTemplate: Template,
  childTemplate: Template,
  partIndex: number,
  childIndex?: number
): Either.Either<CouldNotFindRootElement | CouldNotFindCommentError, ParentChildNodes> {
  const [, path] = parentTemplate.parts[partIndex]
  const parentNode = findPath(where, path) as HTMLElement
  const childNodesEither = findPartChildNodes(parentNode, childTemplate.hash, partIndex)
  if (Either.isLeft(childNodesEither)) return Either.left(childNodesEither.left)

  const childNodes = childNodesEither.right
  const parentChildNodes = {
    parentNode,
    childNodes: childIndex !== undefined ? [childNodes[childIndex]] : childNodes
  }

  return Either.right(parentChildNodes)
}

export function findPartChildNodes(
  { childNodes }: ParentChildNodes,
  hash: string,
  partIndex: number
): Either.Either<CouldNotFindRootElement | CouldNotFindCommentError, Array<Node>> {
  const either = findPartComment(childNodes, partIndex)
  if (Either.isLeft(either)) return Either.left(either.left)
  const [comment, index] = either.right
  const nodes: Array<Node> = []
  const previousHoleValue = `hole${partIndex - 1}`

  if (hash) {
    for (let i = index; i > -1; --i) {
      const node = childNodes[i]

      if (isHtmlElement(node) && node.dataset.typed === hash) {
        nodes.unshift(node)
      } else if (partIndex > 0 && isCommentWithValue(node, previousHoleValue)) {
        break
      }
    }
  } else {
    return Either.right([...getPreviousNodes(comment, partIndex), comment])
  }

  if (nodes.length === 0) {
    return Either.left(new CouldNotFindRootElement(partIndex))
  }

  nodes.push(comment)

  return Either.right(nodes)
}

export function findPartComment(
  childNodes: ArrayLike<Node>,
  partIndex: number
): Either.Either<CouldNotFindCommentError, readonly [Comment, number]> {
  const search = partIndex === -1 ? `typed-end` : `hole${partIndex}`

  for (let i = 0; i < childNodes.length; ++i) {
    const node = childNodes[i]

    if (isCommentWithValue(node, search)) {
      return Either.right([node, i] as const)
    }
  }

  return Either.left(new CouldNotFindCommentError(partIndex))
}

export function getHydrateEntry({
  childIndex,
  document,
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
  parentTemplate: Template | null
  strings: TemplateStringsArray
  childIndex?: number
}): Either.Either<
  CouldNotFindRootElement | CouldNotFindCommentError,
  { readonly template: Template; readonly wire: Node | Array<Node>; readonly where: ParentChildNodes }
> {
  const { template } = getBrowserEntry(document, renderContext, strings)

  if (parentTemplate) {
    const either = findTemplateResultPartChildNodes(where, parentTemplate, template, rootIndex, childIndex)
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
