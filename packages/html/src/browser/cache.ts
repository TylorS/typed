import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
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
import { CouldNotFindRootElement, CouldNotFindCommentError } from './errors.js'

export type BrowserCache = {
  wire: Rendered | null
}

export type BrowserTemplateCache = {
  readonly template: Template
  readonly content: DocumentFragment
}

export type BrowserEntry = {
  readonly template: Template
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
  const cache = getBrowserTemplateCache(document, strings, renderContext.templateCache)
  const { template } = cache
  const content = document.importNode(cache.content, true)

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

  let wire: Rendered | null = null

  const entry: BrowserEntry = {
    template,
    parts,
    wire: () => wire || (wire = persistent(content as DocumentFragment)),
  }

  return entry
}

export function getBrowserTemplateCache(
  document: Document,
  strings: TemplateStringsArray,
  templateCache: RenderContext['templateCache'],
): BrowserTemplateCache {
  const current = templateCache.get(strings)

  if (current) {
    return current as BrowserTemplateCache
  }

  const template = globalParser.parse(strings)
  const newCache = {
    template,
    content: buildTemplate(document, template),
  } as BrowserTemplateCache

  templateCache.set(strings, newCache)

  return newCache
}

type PartInput<Part = PartNode | SparsePartNode> = {
  document: Document
  node: HTMLElement
  part: Part
  context: Context<any>
  onCause: (cause: Cause.Cause<any>) => Effect.Effect<any, never, void>
  isHydrating: boolean
}

type CreatePart = {
  readonly [K in PartNode['type']]: (
    input: PartInput<Extract<PartNode, { readonly type: K }>>,
  ) => Part
} & {
  readonly [K in SparsePartNode['type']]: (
    input: PartInput<Extract<SparsePartNode, { readonly type: K }>>,
  ) => SparsePart
}

const createPart: CreatePart = {
  attr: ({ node, part }) => AttrPart.fromElement(node, part.name, part.index),
  'boolean-part': ({ node, part }) => BooleanPart.fromElement(node, part.name, part.index),
  'className-part': ({ node, part }) => ClassNamePart.fromElement(node, part.index),
  'comment-part': ({ node, part }) => CommentPart.fromParentElement(node, part.index),
  data: ({ node, part }) => DataPart.fromHTMLElement(node, part.index),
  event: ({ node, part, onCause, context }) =>
    EventPart.fromHTMLElement(
      node,
      part.name,
      part.index,
      (cause) => Effect.provideContext(onCause(cause), context),
      context,
    ),
  node: ({ document, node, part, isHydrating }) =>
    NodePart.fromParentElement(document, node, part.index, isHydrating),
  property: ({ node, part }) => PropertyPart.fromElement(node, part.name, part.index),
  ref: ({ node, part }) => RefPart.fromElement(node, part.index),
  'sparse-attr': ({ node, part }) =>
    SparseAttrPart.fromPartNodes(
      (value) =>
        Effect.sync(() =>
          value ? node.setAttribute(part.name, value) : node.removeAttribute(part.name),
        ),
      part.nodes,
    ),
  'sparse-class-name': ({ node, part }) =>
    SparseClassNamePart.fromPartNodes(
      (value) => Effect.sync(() => (node.className = value ?? '')),
      part.nodes,
    ),
  'text-part': ({ node, part }) => TextPart.fromElement(node, part.index),
}

export function partNodeToPart(input: PartInput): Part | SparsePart {
  return createPart[input.part.type](input as any)
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
  childIndex,
}: {
  document: Document
  renderContext: RenderContext
  where: ParentChildNodes
  rootIndex: number
  parentTemplate: Template | null
  strings: TemplateStringsArray
  context: Context<any>
  onCause: (cause: Cause.Cause<any>) => Effect.Effect<any, never, void>
  childIndex?: number
}) {
  const { template } = getBrowserTemplateCache(document, strings, renderContext.templateCache)

  if (parentTemplate) {
    where = findTemplateResultPartChildNodes(where, parentTemplate, template, rootIndex, childIndex)
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

  const wire = (() => {
    if (!parentTemplate) {
      const childNodes = Array.from(where.childNodes).filter((node) =>
        isComment(node) ? !isCommentWithValue(node, END) : true,
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

const START = 'typed-start'
const END = 'typed-end'

// Finds all of the childNodes between the "typed-start" and "typed-end" comments
export function findRootChildNodes(where: HTMLElement): Node[] {
  const childNodes: Node[] = []

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
  childIndex?: number,
) {
  const [, path] = parentTemplate.parts[partIndex]
  const parentNode = findPath(where, path) as HTMLElement
  const childNodes = findPartChildNodes(parentNode, childTemplate?.hash, partIndex)
  const parentChildNodes = {
    parentNode,
    childNodes: childIndex !== undefined ? [childNodes[childIndex]] : childNodes,
  }

  console.log('findTemplateResultPartChildNodes', parentChildNodes)

  return parentChildNodes
}

export function findPartChildNodes(
  { childNodes }: ParentChildNodes,
  hash: string | null | undefined,
  partIndex: number,
) {
  const [comment, index] = findPartComment(childNodes, partIndex)

  const nodes: Node[] = []
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
