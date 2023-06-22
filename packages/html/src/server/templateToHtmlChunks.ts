import escapeHTML from 'escape-html'

import {
  TYPED_ATTR,
  TYPED_SELF_CLOSING_END,
  TYPED_SELF_CLOSING_START,
  TYPED_HASH,
} from '../meta.js'
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
    readonly render: (value: readonly string[] | string | null | undefined) => string,
  ) {}
}

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

function nodeToHtmlChunk(node: Node, hash?: string): HtmlChunk[] {
  switch (node.type) {
    case 'element':
      return elementToHtmlChunks(node, hash)
    case 'node':
      return [new PartChunk(node, String)]
    case 'self-closing-element':
      return selfClosingElementToHtmlChunks(node, hash)
    case 'text':
      return [textToHtmlChunks(node)]
    case 'text-only-element':
      return textOnlyElementToHtmlChunks(node, hash)
    case 'comment':
      return [new TextChunk(`<!--${node.value}-->`)]
    case 'comment-part':
      return [new PartChunk(node, (value) => `<!--${node.before}${value}${node.after}-->`)]
  }
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
    ...attributeComments(attributes),
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
    ...attributeComments(attributes),
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
    ...attributeComments(attributes),
    ...children.map((c) => textToHtmlChunks(c)),
    new TextChunk(closeTag(tagName)),
  ]

  return chunks
}

function attributeToHtmlChunk(attr: Attribute): HtmlChunk {
  switch (attr.type) {
    case 'attribute':
      return new TextChunk(` ${attr.name}="${attr.value}"`)
    case 'attr':
      return new PartChunk(attr, (value) => (value == null ? `` : ` ${attr.name}="${value}"`))
    case 'boolean':
      return new TextChunk(' ' + attr.name)
    case 'boolean-part':
      return new PartChunk(attr, (value) => (value ? ` ${attr.name}` : ''))
    case 'className-part':
      return new PartChunk(attr, (value) => (value ? ` class="${value}"` : ''))
    case 'data':
      return new PartChunk(attr, (value) =>
        value == null ? `` : datasetToString(value as Readonly<Record<string, string>>),
      )
    // Event and ref attributes are not rendered into HTML
    case 'event':
    case 'ref':
      return new TextChunk('')
    case 'property':
      return new PartChunk(attr, (value) =>
        value == null ? `` : ` ${attr.name}="${escape(value)}"`,
      )
    case 'sparse-attr': {
      return new SparsePartChunk(attr, (values) => {
        return values == null
          ? ``
          : ` ${attr.name}="${Array.isArray(values) ? values.join('') : values}"`
      })
    }
    case 'sparse-class-name':
      return new SparsePartChunk(attr, (values) => {
        return values == null ? `` : ` class="${Array.isArray(values) ? values.join(' ') : values}"`
      })
    case 'text':
      return new TextChunk(attr.value)
  }
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

function attributeComments(attributes: Attribute[]): readonly TextChunk[] {
  return attributes.flatMap((a) => {
    switch (a.type) {
      // Attribute, boolean, and text nodes are static
      case 'attribute':
      case 'boolean':
      case 'text':
        return []
      // Dynamic parts
      case 'attr':
      case 'boolean-part':
      case 'className-part':
      case 'event':
      case 'data':
      case 'property':
      case 'ref':
        return new TextChunk(TYPED_ATTR(a.index))
      // Sparse parts
      case 'sparse-attr':
      case 'sparse-class-name':
        return attributeComments(a.nodes)
    }
  })
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
