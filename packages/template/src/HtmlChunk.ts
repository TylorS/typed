/**
 * @since 1.0.0
 */
import { keyToPartType } from "./internal/utils.js"
import { isNullOrUndefined } from "./internal/v2/helpers.js"
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
} from "./Template.js"

/**
 * @since 1.0.0
 */
export type HtmlChunk = TextChunk | PartChunk | SparsePartChunk

/**
 * @since 1.0.0
 */
export class TextChunk {
  readonly _tag = "text"
  constructor(readonly value: string) {}
}

/**
 * @since 1.0.0
 */
export class PartChunk {
  readonly _tag = "part"

  constructor(
    readonly node: PartNode,
    readonly render: (value: unknown) => string
  ) {}
}

/**
 * @since 1.0.0
 */
export class SparsePartChunk {
  readonly _tag = "sparse-part"

  constructor(
    readonly node: SparseAttrNode | SparseClassNameNode,
    readonly render: (value: AttrValue) => string
  ) {}
}

/**
 * @since 1.0.0
 */
export type AttrValue = string | null | undefined | ReadonlyArray<AttrValue>

// TODO: Should we escape more things?
// TODO: We should manually optimize the text fusion

/**
 * @since 1.0.0
 */
export function templateToHtmlChunks({ hash, nodes }: Template, isStatic: boolean) {
  if (isStatic) {
    return fuseTextChunks(nodes.flatMap((node) => nodeToHtmlChunk(node)))
  }

  const chunks = fuseTextChunks([
    templateStart(hash),
    ...nodes.flatMap((node) => nodeToHtmlChunk(node, hash)),
    templateEnd(hash)
  ])

  return chunks
}

function templateStart(hash: string): HtmlChunk {
  return new TextChunk(`<!--typed-${hash}-->`)
}

function templateEnd(hash: string): HtmlChunk {
  return new TextChunk(`<!--/typed-${hash}-->`)
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
  doctype: (node) => [new TextChunk(`<!DOCTYPE ${node.name}>`)],
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
  { attributes, children, tagName }: ElementNode
): Array<HtmlChunk> {
  if (attributes.length === 0) {
    return [
      new TextChunk(openTag(tagName) + ">"),
      ...children.flatMap((c) => nodeToHtmlChunk(c)),
      new TextChunk(closeTag(tagName))
    ]
  }

  const chunks: Array<HtmlChunk> = [
    new TextChunk(openTag(tagName)),
    ...attributes.map((a) => attributeToHtmlChunk(a)),
    new TextChunk(">"),
    ...children.flatMap((c) => nodeToHtmlChunk(c)),
    new TextChunk(closeTag(tagName))
  ]

  return chunks
}

function selfClosingElementToHtmlChunks(
  { attributes, tagName }: SelfClosingElementNode
): Array<HtmlChunk> {
  if (attributes.length === 0) {
    return [new TextChunk(openTag(tagName) + " />")]
  }

  const chunks: Array<HtmlChunk> = [
    new TextChunk(openTag(tagName)),
    ...attributes.map((a) => attributeToHtmlChunk(a)),
    new TextChunk(`/>`)
  ]

  return chunks
}

function textToHtmlChunks(text: Text): HtmlChunk {
  return text._tag === "text" ? new TextChunk(text.value) : new PartChunk(text, String)
}

function textOnlyElementToHtmlChunks(
  { attributes, children, tagName }: TextOnlyElement
): Array<HtmlChunk> {
  if (attributes.length === 0) {
    return [
      new TextChunk(openTag(tagName) + ">"),
      ...children.map((c) => textToHtmlChunks(c)),
      new TextChunk(closeTag(tagName))
    ]
  }

  const chunks: Array<HtmlChunk> = [
    new TextChunk(openTag(tagName)),
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
  attribute: (attr) => new TextChunk(` ${attr.name}="${escape(attr.value)}"`),
  attr: (attr) => new PartChunk(attr, (value) => (value == null ? `` : ` ${attr.name}="${escape(value)}"`)),
  boolean: (attr) => new TextChunk(" " + attr.name),
  "boolean-part": (attr) => new PartChunk(attr, (value) => (value ? ` ${attr.name}` : "")),
  "className-part": (attr) => new PartChunk(attr, (value) => (value ? ` class="${escape(value)}"` : "")),
  data: (attr) =>
    new PartChunk(attr, (value) => value == null ? `` : datasetToString(value as Readonly<Record<string, string>>)),
  event: () => new TextChunk(""),
  property: (attr) => new PartChunk(attr, (value) => (value == null ? `` : ` ${attr.name}="${escape(value)}"`)),
  properties: (attr) =>
    new PartChunk(
      attr,
      (
        value
      ) => {
        if (value == null) return ""

        // Each call has only 1 key-value pair
        const [k, v] = Object.entries(value)[0]

        if (value == null) return ""

        const [type, key] = keyToPartType(k)

        switch (type) {
          case "attr":
          case "property":
            return v == null ? "" : ` ${key}="${escape(v)}"`
          case "boolean":
            return v ? key : ""
          case "class":
            return ` class="${escape(v)}"`
          case "data": {
            const d = datasetToString(v)
            return d.length === 0 ? "" : ` ${d}`
          }
          default:
            return ""
        }
      }
    ),
  ref: () => new TextChunk(""),
  "sparse-attr": (attr) =>
    new SparsePartChunk(attr, (values) => {
      return values == null
        ? ``
        : ` ${attr.name}="${Array.isArray(values) ? escape(values.filter(isString).join("")) : escape(values)}"`
    }),
  "sparse-class-name": (attr) =>
    new SparsePartChunk(attr, (values) => {
      return values == null
        ? ``
        : ` class="${Array.isArray(values) ? escape(values.filter(isString).join("")) : escape(values)}"`
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
    .map(([key, value]) => (value === undefined ? `data-${key}` : `data-${key}="${escape(value)}"`))
    .join(" ")

  return s.length === 0 ? "" : " " + s
}

function openTag(tagName: string): string {
  return `<${tagName}`
}

function closeTag(tagName: string): string {
  return `</${tagName}>`
}

/**
 * @since 1.0.0
 */
export function escape(s: unknown): string {
  switch (typeof s) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
      return escapeHtml(String(s))
    case "object": {
      if (isNullOrUndefined(s)) {
        return ""
      } else if (Array.isArray(s)) {
        return s.map(escape).join("")
      } else if (s instanceof Date) {
        return escapeHtml(s.toISOString())
      } else if (s instanceof RegExp) {
        return escapeHtml(s.toString())
      } else {
        return escapeHtml(JSON.stringify(s))
      }
    }
    default:
      return escapeHtml(JSON.stringify(s))
  }
}

/**
 * @since 1.0.0
 */
export function unescape(s: string) {
  const unescaped = unescapeHtml(s)
  const couldBeJson = unescaped[0] === "[" || unescaped === "{"
  if (couldBeJson) {
    try {
      return JSON.parse(unescaped)
    } catch {
      return unescaped
    }
  } else {
    return unescaped
  }
}

const unescapeHtmlRules = [
  [/&quot;/g, "\""],
  [/&#39;/g, "'"],
  [/&#x3A;/g, ":"],
  [/&lt;/g, "<"],
  [/&gt;/g, ">"],
  [/&amp;/g, "&"]
] as const

const matchHtmlRegExp = /["'&<>]/

/**
 * @since 1.0.0
 */
export function escapeHtml(str: string): string {
  const match = matchHtmlRegExp.exec(str)

  if (!match) {
    return str
  }

  let escape
  let html = ""
  let index = 0
  let lastIndex = 0

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escape = "&quot;"
        break
      case 38: // &
        escape = "&amp;"
        break
      case 39: // '
        escape = "&#39;"
        break
      case 60: // <
        escape = "&lt;"
        break
      case 62: // >
        escape = "&gt;"
        break
      default:
        continue
    }

    if (lastIndex !== index) {
      html += str.substring(lastIndex, index)
    }

    lastIndex = index + 1
    html += escape
  }

  return lastIndex !== index
    ? html + str.substring(lastIndex, index)
    : html
}

/**
 * @since 1.0.0
 */
export function unescapeHtml(html: string) {
  for (const [from, to] of unescapeHtmlRules) {
    html = html.replace(from, to)
  }

  return html
}
