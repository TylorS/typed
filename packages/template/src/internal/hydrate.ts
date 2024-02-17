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

import { Either, ExecutionStrategy, Exit } from "effect"
import * as Scope from "effect/Scope"
import type { Template } from "../Template.js"
import { CouldNotFindCommentError, CouldNotFindManyCommentError, CouldNotFindRootElement } from "./errors.js"
import { makeEventSource } from "./EventSource.js"
import { HydrateContext } from "./HydrateContext.js"
import type { RenderPartContext } from "./render.js"
import { getBrowserEntry, renderPart2, renderTemplate } from "./render.js"
import {
  findPath,
  getPreviousNodes,
  isComment,
  isCommentStartingWithValue,
  isCommentWithValue,
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
    Scope.Scope | Placeholder.Context<Values[number]>,
    Placeholder.Error<Values[number]>,
    RenderEvent
  > => {
    return Fx.make((sink) =>
      Effect.gen(function*(_) {
        const context = yield* _(Effect.context<Scope.Scope>())
        const hydrateCtx = unsafeGet(context, HydrateContext)
        const parentScope = unsafeGet(context, Scope.Scope)
        const scope = yield* _(Scope.fork(parentScope, ExecutionStrategy.sequential))

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

        const makeHydrateContext = (index: number): HydrateContext => ({
          where,
          rootIndex: index,
          parentTemplate: template,
          hydrate: true
        })

        const refCounter = yield* _(indexRefCounter2())
        const ctx: RenderPartContext = {
          context,
          document,
          eventSource: makeEventSource(),
          expected: 0,
          refCounter,
          renderContext,
          onCause: sink.onFailure,
          values,
          makeHydrateContext,
          spreadIndex: values.length
        }

        // Connect our interpolated values to our template parts
        const effects: Array<Effect.Effect<void, never, Scope.Scope | Placeholder.Context<Values[number]>>> = []
        for (const [part, path] of template.parts) {
          const eff = renderPart2(part, where, path, ctx)
          if (eff !== null) {
            effects.push(
              ...(Array.isArray(eff) ? eff : [eff]) as Array<
                Effect.Effect<void, never, Scope.Scope | Placeholder.Context<Values[number]>>
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

        yield* _(
          // Ensure our templates last forever in the DOM environment
          // so event listeners are kept attached to the current Scope.
          Effect.never,
          // Close our scope whenever the current Fiber is interrupted
          Effect.ensuring(Scope.close(scope, Exit.unit))
        )
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
  manyIndex?: string
): Either.Either<CouldNotFindRootElement | CouldNotFindManyCommentError | CouldNotFindCommentError, ParentChildNodes> {
  const [, path] = parentTemplate.parts[partIndex]
  const parentNode = findPath(where, path) as HTMLElement
  const childNodesEither = findPartChildNodes(parentNode, childTemplate.hash, partIndex)
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
): Either.Either<CouldNotFindManyCommentError, Array<Node>> {
  const either = findManyComment(childNodes, manyIndex)
  if (Either.isLeft(either)) return Either.left(either.left)

  const [, index] = either.right
  return Either.right(findPreviousManyComment(childNodes.slice(0, index)))
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

      if (partIndex > 0 && isCommentWithValue(node, previousHoleValue)) {
        break
      }
      nodes.unshift(node)
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

export function findManyComment(
  childNodes: ArrayLike<Node>,
  manyIndex: string
): Either.Either<CouldNotFindManyCommentError, readonly [Comment, number]> {
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
  parentTemplate: Template | null
  strings: TemplateStringsArray
  manyIndex?: string
}): Either.Either<
  CouldNotFindRootElement | CouldNotFindCommentError | CouldNotFindManyCommentError,
  { readonly template: Template; readonly wire: Node | Array<Node>; readonly where: ParentChildNodes }
> {
  const { template } = getBrowserEntry(document, renderContext, strings)

  if (parentTemplate) {
    const either = findTemplateResultPartChildNodes(where, parentTemplate, template, rootIndex, manyIndex)
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
