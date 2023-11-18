import * as Fx from "@typed/fx/Fx"
import { makeSubject } from "@typed/fx/internal/core-subject"
import * as ElementRef from "@typed/template/ElementRef"
import { indexRefCounter } from "@typed/template/internal/indexRefCounter"
import type { Placeholder } from "@typed/template/Placeholder"
import type { Renderable } from "@typed/template/Renderable"
import type { RenderContext } from "@typed/template/RenderContext"
import { DomRenderEvent } from "@typed/template/RenderEvent"
import type { RenderTemplate } from "@typed/template/RenderTemplate"
import { TemplateInstance } from "@typed/template/TemplateInstance"
import type { Rendered } from "@typed/wire"
import type { Cause } from "effect"
import { Effect } from "effect"

import { unsafeGet } from "@typed/context"

import { CouldNotFindCommentError, CouldNotFindRootElement } from "@typed/template/internal/errors"
import { HydrateContext } from "@typed/template/internal/HydrateContext"
import { buildParts, getBrowserEntry, renderTemplate, renderValues } from "@typed/template/internal/render"
import {
  findPath,
  getPreviousNodes,
  isComment,
  isCommentWithValue,
  isHtmlElement,
  type ParentChildNodes
} from "@typed/template/internal/utils"
import type { Template } from "@typed/template/Template"

/**
 * Here for "standard" browser rendering, a TemplateInstance is effectively a live
 * view into the contents rendered by the Template.
 */
export const hydrateTemplate: (document: Document, ctx: RenderContext) => RenderTemplate =
  (document, renderContext) =>
  <Values extends ReadonlyArray<Renderable<any, any>>, T extends Rendered = Rendered>(
    templateStrings: TemplateStringsArray,
    values: Values,
    providedRef?: ElementRef.ElementRef<T>
  ) => {
    return Effect.gen(function*(_) {
      const context = yield* _(Effect.context<never>())
      const hydrateCtx = unsafeGet(context, HydrateContext)

      // If we're not longer hydrating, just render normally
      if (!hydrateCtx.hydrate) {
        return yield* _(renderTemplate(document, renderContext)(templateStrings, values, providedRef))
      }

      const elementRef = providedRef || (yield* _(ElementRef.make<T>()))
      const events = Fx.map(elementRef, DomRenderEvent)
      const errors = makeSubject<Placeholder.Error<Values[number]>, never>()

      const { getParts, template, where, wire } = getHydrateEntry({
        ...hydrateCtx,
        document,
        renderContext,
        elementRef,
        strings: templateStrings,
        onCause: errors.onFailure
      })
      const parts = yield* _(getParts)

      // If there are parts we need to render them before constructing our Wire
      if (parts.length > 0) {
        const refCounter = yield* _(indexRefCounter(parts.length))

        // Do the work
        yield* _(renderValues(values, parts, refCounter, errors.onFailure, (index: number): HydrateContext => ({
          where,
          rootIndex: index,
          parentTemplate: template,
          hydrate: true
        })))

        // Wait for initial work to be completed
        yield* _(refCounter.wait)
      }

      hydrateCtx.hydrate = false

      // Set the element when it is ready
      yield* _(ElementRef.set(elementRef, wire as T))

      // Return the Template instance
      return TemplateInstance(Fx.merge([events, errors]), elementRef)
    })
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
  const childNodes: Array<Node> = []

  let start = 0
  let end = childNodes.length

  for (let i = 0; i < where.childNodes.length; i++) {
    const node = where.childNodes[i]

    if (node.nodeType === node.COMMENT_NODE) {
      if (node.nodeValue === START) {
        start = i
        break
      }
    }
  }

  for (let i = where.childNodes.length - 1; i >= start; i--) {
    const node = where.childNodes[i]

    if (node.nodeType === node.COMMENT_NODE) {
      if (node.nodeValue === END) {
        end = i
        break
      }
    }
  }

  for (let i = start + 1; i <= end; i++) {
    childNodes.push(where.childNodes[i])
  }

  return childNodes
}

export function findTemplateResultPartChildNodes(
  where: ParentChildNodes,
  parentTemplate: Template,
  childTemplate: Template | null,
  partIndex: number,
  childIndex?: number
) {
  const [, path] = parentTemplate.parts[partIndex]
  const parentNode = findPath(where, path) as HTMLElement
  const childNodes = findPartChildNodes(parentNode, childTemplate?.hash, partIndex)
  const parentChildNodes = {
    parentNode,
    childNodes: childIndex !== undefined ? [childNodes[childIndex]] : childNodes
  }

  return parentChildNodes
}

export function findPartChildNodes(
  { childNodes }: ParentChildNodes,
  hash: string | null | undefined,
  partIndex: number
) {
  const [comment, index] = findPartComment(childNodes, partIndex)

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
    return [...getPreviousNodes(comment, partIndex), comment]
  }

  if (nodes.length === 0) {
    throw new CouldNotFindRootElement(partIndex)
  }

  nodes.push(comment)

  return nodes
}

export function findPartComment(childNodes: ArrayLike<Node>, partIndex: number) {
  const search = partIndex === -1 ? `typed-end` : `hole${partIndex}`

  for (let i = 0; i < childNodes.length; ++i) {
    const node = childNodes[i]

    if (isCommentWithValue(node, search)) {
      return [node, i] as const
    }
  }

  throw new CouldNotFindCommentError(partIndex)
}

export function getHydrateEntry({
  childIndex,
  document,
  elementRef,
  onCause,
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
  elementRef: ElementRef.ElementRef<any>
  onCause: (cause: Cause.Cause<any>) => Effect.Effect<never, never, void>
  childIndex?: number
}) {
  const { template } = getBrowserEntry(document, renderContext, strings)

  if (parentTemplate) {
    where = findTemplateResultPartChildNodes(where, parentTemplate, template, rootIndex, childIndex)
  }

  const getParts = buildParts(document, renderContext, template, where, elementRef, onCause, true)

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

  return {
    template,
    wire,
    getParts,
    where
  } as const
}
