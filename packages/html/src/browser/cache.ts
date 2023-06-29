import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { Context } from '@typed/context'
import { persistent } from '@typed/wire'

import { RenderContext } from '../RenderContext.js'
import { Rendered } from '../Rendered.js'
import { globalParser } from '../parser/global.js'
import { PartNode, SparsePartNode, Template } from '../parser/parser.js'
import { AttrPart } from '../part/AttrPart.js'
import { BooleanPart } from '../part/BooleanPart.js'
import { ClassNamePart } from '../part/ClassNamePart.js'
import { CommentPart } from '../part/CommentPart.js'
import { DataPart } from '../part/DataPart.js'
import { EventPart } from '../part/EventPart.js'
import { NodePart } from '../part/NodePart.js'
import { Part, SparsePart } from '../part/Part.js'
import { PropertyPart } from '../part/PropertyPart.js'
import { RefPart } from '../part/RefPart.js'
import { SparseAttrPart } from '../part/SparseAttrPart.js'
import { SparseClassNamePart } from '../part/SparseClassNamePart.js'
import { TextPart } from '../part/TextPart.js'
import { ParentChildNodes, findPath } from '../paths.js'
import { getPreviousNodes, isComment, isCommentWithValue, isHtmlElement } from '../utils.js'

import { buildTemplate } from './buildTemplate.js'

export type BrowserCache = {
  wire: Rendered | null
}

export type BrowserTemplateCache = {
  readonly template: Template
  readonly content: DocumentFragment
}

export type BrowserEntry = {
  readonly template: Template
  readonly cleanup: Effect.Effect<never, never, void>
  readonly parts: ReadonlyArray<Part | SparsePart>
  readonly wire: () => Rendered | null
}

export const makeEmptyBrowerCache = (): BrowserCache => ({
  wire: null,
})

export function getBrowserCache(
  renderCache: RenderContext['renderCache'],
  where: HTMLElement,
): BrowserCache {
  const cache = renderCache.get(where)

  if (cache) return cache as BrowserCache

  const newCache = makeEmptyBrowerCache()

  renderCache.set(where, newCache)

  return newCache
}

export function getRenderEntry({
  document,
  renderContext,
  strings,
  context,
  onCause,
}: {
  document: Document
  renderContext: RenderContext
  strings: TemplateStringsArray
  context: Context<any>
  onCause: (cause: Cause.Cause<any>) => Effect.Effect<any, never, void>
}): BrowserEntry {
  const { template, content } = getBrowserTemplateCache(
    document,
    strings,
    renderContext.templateCache,
    false,
  )

  const parts = template.parts.map(([part, path]): Part | SparsePart =>
    partNodeToPart({
      document,
      node: findPath(content, path) as HTMLElement,
      part,
      context,
      onCause,
      isHydrating: false,
    }),
  )

  const cleanup = makeCleanup(parts)

  let wire: Rendered | null = null

  const entry: BrowserEntry = {
    template,
    cleanup,
    parts,
    wire: () => wire || (wire = persistent(content as DocumentFragment)),
  }

  return entry
}

export function getBrowserTemplateCache(
  document: Document,
  strings: TemplateStringsArray,
  templateCache: RenderContext['templateCache'],
  isHydrating: boolean,
): BrowserTemplateCache {
  const current = templateCache.get(strings)

  if (current) {
    return {
      template: (current as BrowserTemplateCache).template,
      content: isHydrating ? undefined : (current as BrowserTemplateCache).content.cloneNode(true),
    } as BrowserTemplateCache
  }

  const template = globalParser.parse(strings)
  const newCache = {
    template,
    content: isHydrating ? undefined : buildTemplate(document, template),
  } as BrowserTemplateCache

  templateCache.set(strings, newCache)

  return newCache
}

export function partNodeToPart({
  document,
  node,
  part,
  context,
  onCause,
  isHydrating,
}: {
  document: Document
  node: HTMLElement
  part: PartNode | SparsePartNode
  context: Context<any>
  onCause: (cause: Cause.Cause<any>) => Effect.Effect<any, never, void>
  isHydrating: boolean
}): Part | SparsePart {
  switch (part.type) {
    case 'attr':
      return AttrPart.fromElement(node, part.name, part.index)
    case 'boolean-part':
      return BooleanPart.fromElement(node, part.name, part.index)
    case 'className-part':
      return ClassNamePart.fromElement(node, part.index)
    case 'comment-part':
      return CommentPart.fromParentElement(node, part.index)
    case 'data':
      return DataPart.fromHTMLElement(node, part.index)
    case 'event':
      return EventPart.fromHTMLElement(
        node,
        part.name,
        part.index,
        (cause) => Effect.provideContext(onCause(cause), context),
        context,
      )
    case 'node':
      return NodePart.fromParentElemnt(document, node, part.index, isHydrating)
    case 'property':
      return PropertyPart.fromElement(node, part.name, part.index)
    case 'ref':
      return RefPart.fromElement(node, part.index)
    case 'sparse-attr':
      return SparseAttrPart.fromPartNodes(
        (value) =>
          Effect.sync(() =>
            value ? node.setAttribute(part.name, value) : node.removeAttribute(part.name),
          ),
        part.nodes,
      )
    case 'sparse-class-name':
      return SparseClassNamePart.fromPartNodes(
        (value) => Effect.sync(() => (node.className = value ?? '')),
        part.nodes,
      )
    case 'text-part':
      return TextPart.fromElement(node, part.index)
  }
}

export function getHydrateEntry({
  document,
  renderContext,
  where,
  rootIndex,
  parentTemplate,
  strings,
  context,
  onCause,
}: {
  document: Document
  renderContext: RenderContext
  where: ParentChildNodes
  rootIndex: number
  parentTemplate: Template | null
  strings: TemplateStringsArray
  context: Context<any>
  onCause: (cause: Cause.Cause<any>) => Effect.Effect<any, never, void>
}) {
  const { template } = getBrowserTemplateCache(document, strings, renderContext.templateCache, true)

  if (parentTemplate) {
    where = findTemplateResultPartChildNodes(where, parentTemplate, template, rootIndex)
  }

  const parts = template.parts.map(([part, path]): Part | SparsePart =>
    partNodeToPart({
      document,
      node: findPath(where, path) as HTMLElement,
      part,
      context,
      onCause,
      isHydrating: true,
    }),
  )

  const cleanup = makeCleanup(parts)

  const wire = (() => {
    if (!parentTemplate) {
      const childNodes = Array.from(where.childNodes).filter((node) =>
        isComment(node) ? !isCommentWithValue(node, 'typed-end') : true,
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
      (node) => !isCommentWithValue(node, `hole${rootIndex}`),
    )
  })()

  const entry: BrowserEntry = {
    template,
    cleanup,
    parts,
    wire: () => wire,
  }

  return [entry, where] as const
}

export function findRootParentChildNodes(where: HTMLElement): ParentChildNodes {
  const childNodes = findRootChildNodes(where)

  return {
    parentNode: where,
    childNodes,
  }
}

// Finds all of the childNodes between the "typed-start" and "typed-end" comments
export function findRootChildNodes(where: HTMLElement): Node[] {
  const childNodes: Node[] = []

  let start = 0
  let end = childNodes.length

  for (let i = 0; i < where.childNodes.length; i++) {
    const node = where.childNodes[i]

    if (node.nodeType === node.COMMENT_NODE) {
      if (node.nodeValue === 'typed-start') {
        start = i
        break
      }
    }
  }

  for (let i = where.childNodes.length - 1; i >= start; i--) {
    const node = where.childNodes[i]

    if (node.nodeType === node.COMMENT_NODE) {
      if (node.nodeValue === 'typed-end') {
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
) {
  const [, path] = parentTemplate.parts[partIndex]
  const parentNode = findPath(where, path) as HTMLElement
  const childNodes = findPartChildNodes(parentNode, childTemplate?.hash, partIndex)

  return {
    parentNode,
    childNodes,
  }
}

export function findPartChildNodes(
  { childNodes }: ParentChildNodes,
  hash: string | null | undefined,
  partIndex: number,
) {
  const [comment, index] = findPartComment(childNodes, partIndex)

  const nodes: Node[] = []

  if (hash) {
    for (let i = index; i > -1; --i) {
      const node = childNodes[i]

      if (isHtmlElement(node) && node.dataset.typed === hash) {
        nodes.unshift(node)
      } else if (partIndex > 0 && isCommentWithValue(node, `hole${partIndex - 1}`)) {
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

export class CouldNotFindCommentError extends Error {
  constructor(readonly partIndex: number) {
    super(`Could not find comment for part ${partIndex}`)
  }
}

export class CouldNotFindRootElement extends Error {
  constructor(readonly partIndex: number) {
    super(`Could not find root elements for part ${partIndex}`)
  }
}

function makeCleanup(parts: Array<Part | SparsePart>) {
  return Effect.forkDaemon(
    Effect.suspend(() => Fiber.interruptAll(parts.flatMap((p) => Array.from(p.fibers)))),
  )
}
