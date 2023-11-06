import { TYPED_HASH } from "@typed/template/Meta"
import type {
  Attribute,
  ElementNode,
  Node,
  PartNode,
  SelfClosingElementNode,
  SparseAttrNode,
  SparseClassNameNode,
  Template,
  Text,
  TextOnlyElement
} from "@typed/template/Template"
import escapeHTML from "escape-html"

export type HtmlChunk = TextChunk | PartChunk | SparsePartChunk

export class TextChunk {
  readonly _tag = "text"
  constructor(readonly value: string) {}
}

export class PartChunk {
  readonly _tag = "part"

  constructor(
    readonly node: PartNode,
    readonly render: (value: unknown) => string
  ) {}
}

export class SparsePartChunk {
  readonly _tag = "sparse-part"

  constructor(
    readonly node: SparseAttrNode | SparseClassNameNode,
    readonly render: (value: AttrValue) => string
  ) {}
}

export type AttrValue = string | null | undefined | ReadonlyArray<AttrValue>

// TODO: Should we escape more things?
// TODO: We should manually optimize the text fusion

export function templateToHtmlChunks({ hash, nodes }: Template) {
  return fuseTextChunks(nodes.flatMap((node) => nodeToHtmlChunk(node, hash)))
}

function fuseTextChunks(chunks: Array<HtmlChunk>): ReadonlyArray<HtmlChunk> {
  const output: Array<HtmlChunk> = []

  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) {
      const prevIndex = output.length - 1
      const prev = output[prevIndex]
      const curr = chunks[i]

      if (prev._tag === "text" && curr._tag === "text") {
        output[prevIndex] = new TextChunk(prev.value + curr.value)
      } else {
        output.push(curr)
      }
    } else {
      output.push(chunks[i])
    }
  }

  return output
}

type NodeMap = {
  readonly [K in Node["_tag"]]: (node: Extract<Node, { _tag: K }>, hash?: string) => Array<HtmlChunk>
}

const nodeMap: NodeMap = {
  element: elementToHtmlChunks,
  node: (node) => [new PartChunk(node, String)],
  "self-closing-element": selfClosingElementToHtmlChunks,
  text: (node) => [textToHtmlChunks(node)],
  "text-only-element": textOnlyElementToHtmlChunks,
  comment: (node) => [new TextChunk(`<!--${node.value}-->`)],
  "comment-part": (node) => [
    new PartChunk(node, (value) => `<!--${value}-->`)
  ],
  "sparse-comment": (node) => [
    new TextChunk("<!--"),
    ...node.nodes.map((node) => {
      if (node._tag === "text") {
        return textToHtmlChunks(node)
      } else {
        return new PartChunk(node, (value) => `${value}`)
      }
    }),
    new TextChunk("-->")
  ]
}

function nodeToHtmlChunk(node: Node, hash?: string): Array<HtmlChunk> {
  return nodeMap[node._tag](node as any, hash)
}

function elementToHtmlChunks(
  { attributes, children, tagName }: ElementNode,
  hash?: string
): Array<HtmlChunk> {
  if (attributes.length === 0) {
    return [
      new TextChunk(openTag(tagName, hash) + ">"),
      ...children.flatMap((c) => nodeToHtmlChunk(c)),
      new TextChunk(closeTag(tagName))
    ]
  }

  const chunks: Array<HtmlChunk> = [
    new TextChunk(openTag(tagName, hash)),
    ...attributes.map((a) => attributeToHtmlChunk(a)),
    new TextChunk(">"),
    ...children.flatMap((c) => nodeToHtmlChunk(c)),
    new TextChunk(closeTag(tagName))
  ]

  return chunks
}

function selfClosingElementToHtmlChunks(
  { attributes, tagName }: SelfClosingElementNode,
  hash?: string
): Array<HtmlChunk> {
  if (attributes.length === 0) {
    return [new TextChunk(openTag(tagName, hash) + "/>")]
  }

  const chunks: Array<HtmlChunk> = [
    new TextChunk(openTag(tagName, hash)),
    ...attributes.map((a) => attributeToHtmlChunk(a)),
    new TextChunk(`/>`)
  ]

  return chunks
}

function textToHtmlChunks(text: Text): HtmlChunk {
  return text._tag === "text" ? new TextChunk(text.value) : new PartChunk(text, String)
}

function textOnlyElementToHtmlChunks(
  { attributes, children, tagName }: TextOnlyElement,
  hash?: string
): Array<HtmlChunk> {
  if (attributes.length === 0) {
    return [
      new TextChunk(openTag(tagName, hash) + ">"),
      ...children.map((c) => textToHtmlChunks(c)),
      new TextChunk(closeTag(tagName))
    ]
  }

  const chunks: Array<HtmlChunk> = [
    new TextChunk(openTag(tagName, hash)),
    ...attributes.map((a) => attributeToHtmlChunk(a)),
    new TextChunk(">"),
    ...children.map((c) => textToHtmlChunks(c)),
    new TextChunk(closeTag(tagName))
  ]

  return chunks
}

type AttrMap = {
  [K in Attribute["_tag"]]: (attr: Extract<Attribute, { readonly _tag: K }>) => HtmlChunk
}

const attrMap: AttrMap = {
  attribute: (attr) => new TextChunk(` ${attr.name}="${attr.value}"`),
  attr: (attr) => new PartChunk(attr, (value) => (value == null ? `` : ` ${attr.name}="${value}"`)),
  boolean: (attr) => new TextChunk(" " + attr.name),
  "boolean-part": (attr) => new PartChunk(attr, (value) => (value ? ` ${attr.name}` : "")),
  "className-part": (attr) => new PartChunk(attr, (value) => (value ? ` class="${value}"` : "")),
  data: (attr) =>
    new PartChunk(attr, (value) => value == null ? `` : datasetToString(value as Readonly<Record<string, string>>)),
  event: () => new TextChunk(""),
  property: (attr) => new PartChunk(attr, (value) => (value == null ? `` : ` ${attr.name}="${escape(value)}"`)),
  ref: () => new TextChunk(""),
  "sparse-attr": (attr) =>
    new SparsePartChunk(attr, (values) => {
      return values == null
        ? ``
        : ` ${attr.name}="${Array.isArray(values) ? values.filter(isString).join("") : values}"`
    }),
  "sparse-class-name": (attr) =>
    new SparsePartChunk(attr, (values) => {
      return values == null
        ? ``
        : ` class="${Array.isArray(values) ? values.filter(isString).join(" ") : values}"`
    }),
  text: (attr) => new TextChunk(attr.value)
}

function attributeToHtmlChunk(attr: Attribute): HtmlChunk {
  return attrMap[attr._tag](attr as any)
}

function isString(value: unknown): value is string {
  return typeof value === "string"
}

function datasetToString(dataset: Readonly<Record<string, string | undefined>>) {
  const s = Object.entries(dataset)
    .map(([key, value]) => (value === undefined ? `data-${key}` : `data-${key}="${value}"`))
    .join(" ")

  return s.length === 0 ? "" : " " + s
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
    case "string":
    case "number":
    case "boolean":
      return escapeHTML(String(s))
    default:
      return escapeHTML(JSON.stringify(s))
  }
}
