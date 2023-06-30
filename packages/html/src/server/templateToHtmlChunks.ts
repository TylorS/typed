import escapeHTML from 'escape-html'

import { TYPED_SELF_CLOSING_END, TYPED_SELF_CLOSING_START, TYPED_HASH } from '../meta.js'
import {
  Attribute,
  ElementNode,
  Node,
  PartNode,
  SelfClosingElementNode,
  SparseAttrNode,
  SparseClassNameNode,
  Template,
  Text,
  TextOnlyElement,
} from '../parser/parser.js'

export type HtmlChunk = TextChunk | PartChunk | SparsePartChunk

export class TextChunk {
  readonly type = 'text'
  constructor(readonly value: string) {}
}

export class PartChunk {
  readonly type = 'part'

  constructor(readonly node: PartNode, readonly render: (value: unknown) => string) {}
}

export class SparsePartChunk {
  readonly type = 'sparse-part'

  constructor(
    readonly node: SparseAttrNode | SparseClassNameNode,
    readonly render: (value: AttrValue) => string,
  ) {}
}

export type AttrValue = string | null | undefined | readonly AttrValue[]

// TODO: Should we escape more things?

export function templateToHtmlChunks({ nodes, hash }: Template) {
  const chunks: HtmlChunk[] = []

  for (let i = 0; i < nodes.length; i++) {
    chunks.push(...nodeToHtmlChunk(nodes[i], hash))
  }

  return fuseTextChunks(chunks)
}

function fuseTextChunks(chunks: HtmlChunk[]): readonly HtmlChunk[] {
  const output: HtmlChunk[] = []

  for (let i = 0; i < chunks.length; i++) {
    if (i === 0) output.push(chunks[i])
    else {
      const prevIndex = output.length - 1
      const prev = output[prevIndex]
      const curr = chunks[i]

      if (prev.type === 'text' && curr.type === 'text') {
        output[prevIndex] = new TextChunk(prev.value + curr.value)
      } else {
        output.push(curr)
      }
    }
  }

  return output
}

type NodeMap = {
  readonly [K in Node['type']]: (node: Extract<Node, { type: K }>, hash?: string) => HtmlChunk[]
}

const nodeMap: NodeMap = {
  element: elementToHtmlChunks,
  node: (node) => [new PartChunk(node, String)],
  'self-closing-element': selfClosingElementToHtmlChunks,
  text: (node) => [textToHtmlChunks(node)],
  'text-only-element': textOnlyElementToHtmlChunks,
  comment: (node) => [new TextChunk(`<!--${node.value}-->`)],
  'comment-part': (node) => [
    new PartChunk(node, (value) => `<!--${node.before}${value}${node.after}-->`),
  ],
}

function nodeToHtmlChunk(node: Node, hash?: string): HtmlChunk[] {
  return nodeMap[node.type](node as any, hash)
}

function elementToHtmlChunks(
  { tagName, attributes, children }: ElementNode,
  hash?: string,
): HtmlChunk[] {
  if (attributes.length === 0) {
    return [
      new TextChunk(openTag(tagName, hash) + '>'),
      ...children.flatMap((c) => nodeToHtmlChunk(c)),
      new TextChunk(closeTag(tagName)),
    ]
  }

  const chunks: HtmlChunk[] = [
    new TextChunk(openTag(tagName, hash)),
    ...attributes.map((a) => attributeToHtmlChunk(a)),
    new TextChunk('>'),
    ...children.flatMap((c) => nodeToHtmlChunk(c)),
    new TextChunk(closeTag(tagName)),
  ]

  return chunks
}

function selfClosingElementToHtmlChunks(
  { tagName, attributes }: SelfClosingElementNode,
  hash?: string,
): HtmlChunk[] {
  if (attributes.length === 0) {
    return [
      new TextChunk(
        TYPED_SELF_CLOSING_START(hash) +
          openTag(tagName, hash) +
          '/>' +
          TYPED_SELF_CLOSING_END(hash),
      ),
    ]
  }

  const chunks: HtmlChunk[] = [
    new TextChunk(TYPED_SELF_CLOSING_START(hash) + openTag(tagName, hash)),
    ...attributes.map((a) => attributeToHtmlChunk(a)),
    new TextChunk(`/>`),
    new TextChunk(TYPED_SELF_CLOSING_END(hash)),
  ]

  return chunks
}

function textToHtmlChunks(text: Text): HtmlChunk {
  return text.type === 'text' ? new TextChunk(text.value) : new PartChunk(text, String)
}

function textOnlyElementToHtmlChunks(
  { tagName, attributes, children }: TextOnlyElement,
  hash?: string,
): HtmlChunk[] {
  if (attributes.length === 0) {
    return [
      new TextChunk(openTag(tagName, hash) + '>'),
      ...children.map((c) => textToHtmlChunks(c)),
      new TextChunk(closeTag(tagName)),
    ]
  }

  const chunks: HtmlChunk[] = [
    new TextChunk(openTag(tagName, hash)),
    ...attributes.map((a) => attributeToHtmlChunk(a)),
    new TextChunk('>'),
    ...children.map((c) => textToHtmlChunks(c)),
    new TextChunk(closeTag(tagName)),
  ]

  return chunks
}

type AttrMap = {
  [K in Attribute['type']]: (attr: Extract<Attribute, { readonly type: K }>) => HtmlChunk
}

const attrMap: AttrMap = {
  attribute: (attr) => new TextChunk(` ${attr.name}="${attr.value}"`),
  attr: (attr) => new PartChunk(attr, (value) => (value == null ? `` : ` ${attr.name}="${value}"`)),
  boolean: (attr) => new TextChunk(' ' + attr.name),
  'boolean-part': (attr) => new PartChunk(attr, (value) => (value ? ` ${attr.name}` : '')),
  'className-part': (attr) => new PartChunk(attr, (value) => (value ? ` class="${value}"` : '')),
  data: (attr) =>
    new PartChunk(attr, (value) =>
      value == null ? `` : datasetToString(value as Readonly<Record<string, string>>),
    ),
  event: () => new TextChunk(''),
  property: (attr) =>
    new PartChunk(attr, (value) => (value == null ? `` : ` ${attr.name}="${escape(value)}"`)),
  ref: () => new TextChunk(''),
  'sparse-attr': (attr) =>
    new SparsePartChunk(attr, (values) => {
      return values == null
        ? ``
        : ` ${attr.name}="${Array.isArray(values) ? values.filter(isString).join('') : values}"`
    }),
  'sparse-class-name': (attr) =>
    new SparsePartChunk(attr, (values) => {
      return values == null
        ? ``
        : ` class="${Array.isArray(values) ? values.filter(isString).join(' ') : values}"`
    }),
  text: (attr) => new TextChunk(attr.value),
}

function attributeToHtmlChunk(attr: Attribute): HtmlChunk {
  return attrMap[attr.type](attr as any)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function datasetToString(dataset: Readonly<Record<string, string | undefined>>) {
  const s = Object.entries(dataset)
    .map(([key, value]) => (value === undefined ? `data-${key}` : `data-${key}="${value}"`))
    .join(' ')

  return s.length === 0 ? '' : ' ' + s
}

function openTag(tagName: string, hash?: string): string {
  if (hash === undefined) return `<${tagName}`

  return `<${tagName} ${TYPED_HASH(hash)}`
}

function closeTag(tagName: string): string {
  return `</${tagName}>`
}

function escape(s: unknown) {
  switch (typeof s) {
    case 'string':
    case 'number':
    case 'boolean':
      return escapeHTML(String(s))
    default:
      return escapeHTML(JSON.stringify(s))
  }
}
