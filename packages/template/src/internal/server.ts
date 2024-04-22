import type * as Effect from "effect/Effect"
import type { Part } from "../Part.js"
import type { PartNode } from "../Template.js"
import * as impls from "./server-parts.js"

type PartNodeMap = {
  readonly [K in PartNode["_tag"]]: (
    node: Extract<PartNode, { _tag: K }>,
    onChunk: (value: unknown) => Effect.Effect<void>
  ) => Part
}

const partNodeMap: PartNodeMap = {
  attr: (node, onChunk) => new impls.AttributePartImpl(node.name, node.index, ({ value }) => onChunk(value), null),
  "boolean-part": (node, onChunk) =>
    new impls.BooleanPartImpl(node.name, node.index, ({ value }) => onChunk(value), null),
  "className-part": (node, onChunk) => new impls.ClassNamePartImpl(node.index, ({ value }) => onChunk(value), []),
  "comment-part": (node, onChunk) => new impls.CommentPartImpl(node.index, ({ value }) => onChunk(value), null),
  data: (node, onChunk) => new impls.DataPartImpl(node.index, ({ value }) => onChunk(value), null),
  event: () => {
    throw new Error("Events are not utilized on the server")
  },
  node: (node, onChunk) => new impls.NodePartImpl(node.index, ({ value }) => onChunk(value), null),
  property: (node, onChunk) => new impls.PropertyPartImpl(node.name, node.index, ({ value }) => onChunk(value), null),
  ref: () => {
    throw new Error("Refs are not utilized on the server")
  },
  "text-part": (node, onChunk) => new impls.TextPartImpl(node.index, ({ value }) => onChunk(value), null),
  properties: (node, onChunk) => new impls.PropertiesPartImpl(node.index, ({ value }) => onChunk(value), [])
}

export function partNodeToPart(
  node: PartNode,
  onChunk: (value: unknown) => Effect.Effect<void>
): Part {
  return partNodeMap[node._tag](node as any, onChunk)
}
