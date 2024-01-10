import * as Effect from "effect/Effect"
import type { HtmlChunk, PartChunk, SparsePartChunk } from "../HtmlChunk.js"
import type {
  AttributePart,
  ClassNamePart,
  CommentPart,
  Part,
  SparseAttributePart,
  SparseClassNamePart,
  SparseCommentPart,
  SparsePart,
  StaticText
} from "../Part.js"
import type { Renderable } from "../Renderable.js"
import type { PartNode, SparseAttrNode, SparseClassNameNode, SparseCommentNode, SparsePartNode } from "../Template.js"
import {
  AttributePartImpl,
  BooleanPartImpl,
  ClassNamePartImpl,
  CommentPartImpl,
  DataPartImpl,
  NodePartImpl,
  PropertiesPartImpl,
  PropertyPartImpl,
  SparseAttributePartImpl,
  SparseClassNamePartImpl,
  SparseCommentPartImpl,
  StaticTextImpl,
  TextPartImpl
} from "./parts.js"

export type RenderChunk<R, E> =
  | TextRenderChunk
  | PartRenderChunk<R, E>
  | SparsePartRenderChunk<R, E>

export class TextRenderChunk {
  readonly type = "text"

  constructor(
    readonly index: number,
    readonly value: string
  ) {}
}

export class PartRenderChunk<R, E> {
  readonly type = "part"

  constructor(
    readonly index: number,
    readonly chunk: PartChunk,
    readonly part: Part,
    readonly renderable: Renderable<R, E>
  ) {}
}

export class SparsePartRenderChunk<R, E> {
  readonly type = "sparse-part"

  constructor(
    readonly index: number,
    readonly chunk: SparsePartChunk,
    readonly part: SparsePart,
    readonly renderables: Array<Renderable<R, E>>
  ) {}
}

type RenderChunkMap = {
  readonly [K in HtmlChunk["_tag"]]: <R, E>(
    chunk: Extract<HtmlChunk, { _tag: K }>,
    index: number,
    values: ReadonlyArray<Renderable<any, any>>,
    onChunk: (index: number, value: string) => Effect.Effect<never, never, void>
  ) => RenderChunk<R, E>
}

const renderChunkMap: RenderChunkMap = {
  text: (chunk, index) => new TextRenderChunk(index, chunk.value),
  part: (chunk, index, values, onChunk) =>
    // @ts-expect-error
    new PartRenderChunk(
      index,
      chunk,
      partNodeToPart(chunk.node, (v) => onChunk(index, chunk.render(v))),
      values[chunk.node.index]
    ),
  "sparse-part": (chunk, index, values, onChunk) =>
    // @ts-expect-error
    new SparsePartRenderChunk(
      index,
      chunk,
      sparsePartNodeToPart(chunk.node, (v) => onChunk(index, chunk.render(v))),
      // @ts-ignore Type Instantiation is excessively deep and possibly infinite
      chunk.node.nodes.map((n) => (n._tag === "text" ? n.value : values[n.index]))
    )
}

export function htmlChunksToRenderChunks<R, E>(
  chunks: ReadonlyArray<HtmlChunk>,
  values: ReadonlyArray<Renderable<R, E>>,
  onChunk: (index: number, value: string) => Effect.Effect<never, never, void>
) {
  const output: Array<RenderChunk<R, E>> = Array(chunks.length)

  for (let i = 0; i < chunks.length; i++) {
    // @ts-ignore Type Instantiation is excessively deep and possibly infinite
    output[i] = renderChunkMap[chunks[i]._tag](chunks[i] as any, i, values, onChunk)
  }

  return output
}

type PartNodeMap = {
  readonly [K in PartNode["_tag"]]: (
    node: Extract<PartNode, { _tag: K }>,
    onChunk: (value: unknown) => Effect.Effect<never, never, void>
  ) => Part
}

const partNodeMap: PartNodeMap = {
  attr: (node, onChunk) => new AttributePartImpl(node.name, node.index, ({ value }) => onChunk(value), null),
  "boolean-part": (node, onChunk) => new BooleanPartImpl(node.name, node.index, ({ value }) => onChunk(value), null),
  "className-part": (node, onChunk) => new ClassNamePartImpl(node.index, ({ value }) => onChunk(value), null),
  "comment-part": (node, onChunk) => new CommentPartImpl(node.index, ({ value }) => onChunk(value), null),
  "data": (node, onChunk) => new DataPartImpl(node.index, ({ value }) => onChunk(value), null),
  "event": () => {
    throw new Error("Events are not utilized on the server")
  },
  "node": (node, onChunk) => new NodePartImpl(node.index, ({ value }) => onChunk(value), null),
  "property": (node, onChunk) => new PropertyPartImpl(node.name, node.index, ({ value }) => onChunk(value), null),
  "ref": () => {
    throw new Error("Refs are not utilized on the server")
  },
  "text-part": (node, onChunk) => new TextPartImpl(node.index, ({ value }) => onChunk(value), null),
  "properties": (node, onChunk) => new PropertiesPartImpl(node.index, ({ value }) => onChunk(value), null)
}

export function partNodeToPart(
  node: PartNode,
  onChunk: (value: unknown) => Effect.Effect<never, never, void>
): Part {
  return partNodeMap[node._tag](node as any, onChunk)
}

function sparsePartNodeToPart(
  node: SparsePartNode,
  onChunk: (value: string | null) => Effect.Effect<never, never, void>
) {
  if (node._tag === "sparse-attr") {
    return renderSparseAttr(node, onChunk)
  } else if (node._tag === "sparse-class-name") {
    return renderSparseClassName(node, onChunk)
  } else {
    return renderSparseComment(node, onChunk)
  }
}

function renderSparseAttr(
  attrNode: SparseAttrNode,
  setAttribute: (value: string | null) => Effect.Effect<never, never, void>
): SparseAttributePart {
  const { nodes } = attrNode
  const values: Map<number, string | null> = new Map()

  function getValue() {
    return (part.value = Array.from({ length: nodes.length }, (_, i) => values.get(i) || ""))
  }

  function setValue(value: string | null, index: number) {
    return Effect.suspend(() => {
      values.set(index, value)

      if (values.size === nodes.length) return setAttribute(getValue().join(""))

      return Effect.unit
    })
  }

  const parts: Array<StaticText | AttributePart> = []

  let partIndex = 0
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    if (node._tag === "text") {
      values.set(i, node.value)
      parts.push(new StaticTextImpl(node.value))
    } else {
      parts.push(
        new AttributePartImpl(
          node.name,
          partIndex++,
          ({ value }) => setValue(value || "", i),
          null
        )
      )
    }
  }

  const part = new SparseAttributePartImpl(attrNode.name, parts, ({ value }) => setAttribute(value.join("")))

  return part
}

function renderSparseClassName(
  classNameNode: SparseClassNameNode,
  setClassName: (value: string | null) => Effect.Effect<never, never, void>
): SparseClassNamePart {
  const { nodes } = classNameNode
  const values: Map<number, string | null> = new Map()

  function getValue() {
    return (part.value = Array.from({ length: nodes.length }, (_, i) => values.get(i) || ""))
  }

  function setValue(value: string | null, index: number) {
    return Effect.suspend(() => {
      values.set(index, value)

      if (values.size === nodes.length) return setClassName(getValue().join(""))

      return Effect.unit
    })
  }

  const parts: Array<StaticText | ClassNamePart> = []

  let partIndex = 0
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    if (node._tag === "text") {
      values.set(i, node.value)
      parts.push(new StaticTextImpl(node.value))
    } else {
      parts.push(
        new ClassNamePartImpl(
          partIndex++,
          ({ value }) => setValue(value?.join(" ") || null, i),
          null
        )
      )
    }
  }

  const part = new SparseClassNamePartImpl(parts, ({ value }) => setClassName(value.join("")), [])

  return part
}

function renderSparseComment(
  commentNode: SparseCommentNode,
  setComment: (value: string | null) => Effect.Effect<never, never, void>
): SparseCommentPart {
  const { nodes } = commentNode
  const values: Map<number, string | null | undefined> = new Map()

  function getValue(): ReadonlyArray<string> {
    return (part.value = Array.from({ length: nodes.length }, (_, i) => values.get(i) || ""))
  }

  function setValue(value: string | null | undefined, index: number) {
    return Effect.suspend(() => {
      values.set(index, value)

      if (values.size === nodes.length) return setComment(getValue().join(""))

      return Effect.unit
    })
  }

  const parts: Array<StaticText | CommentPart> = []

  let partIndex = 0
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    if (node._tag === "text") {
      values.set(i, node.value)
      parts.push(new StaticTextImpl(node.value))
    } else {
      parts.push(
        new CommentPartImpl(
          partIndex++,
          ({ value }) => setValue(value, i),
          null
        )
      )
    }
  }

  const part = new SparseCommentPartImpl(parts, ({ value }) => setComment(value.join("")), [])

  return part
}
