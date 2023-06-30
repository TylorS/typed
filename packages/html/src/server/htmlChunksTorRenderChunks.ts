import * as Effect from '@effect/io/Effect'

import { Renderable } from '../Renderable.js'
import { PartNode, SparsePartNode } from '../parser/parser.js'
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

import { HtmlChunk, PartChunk, SparsePartChunk } from './templateToHtmlChunks.js'

export type RenderChunk<R, E> =
  | TextRenderChunk
  | PartRenderChunk<R, E>
  | SparsePartRenderChunk<R, E>

export class TextRenderChunk {
  readonly type = 'text'

  constructor(readonly index: number, readonly value: string) {}
}

export class PartRenderChunk<R, E> {
  readonly type = 'part'

  constructor(
    readonly index: number,
    readonly chunk: PartChunk,
    readonly part: Part,
    readonly renderable: Renderable<R, E>,
  ) {}
}

export class SparsePartRenderChunk<R, E> {
  readonly type = 'sparse-part'

  constructor(
    readonly index: number,
    readonly chunk: SparsePartChunk,
    readonly part: SparsePart,
    readonly renderables: Renderable<R, E>[],
  ) {}
}

type RenderChunkMap = {
  readonly [K in HtmlChunk['type']]: <R, E>(
    chunk: Extract<HtmlChunk, { type: K }>,
    index: number,
    values: ReadonlyArray<Renderable<R, E>>,
    onChunk: (index: number, value: string) => Effect.Effect<never, never, void>,
  ) => RenderChunk<R, E>
}

const renderChunkMap: RenderChunkMap = {
  text: (chunk, index) => new TextRenderChunk(index, chunk.value),
  part: (chunk, index, values, onChunk) =>
    new PartRenderChunk(
      index,
      chunk,
      partNodeToPart(chunk.node, (v) => onChunk(index, chunk.render(v))),
      values[chunk.node.index],
    ),
  'sparse-part': (chunk, index, values, onChunk) =>
    new SparsePartRenderChunk(
      index,
      chunk,
      sparsePartNodeToPart(chunk.node, (v) => onChunk(index, chunk.render(v))),
      chunk.node.nodes.map((n) => (n.type === 'text' ? n.value : values[n.index])),
    ),
}

export function htmlChunksToRenderChunks<R, E>(
  chunks: readonly HtmlChunk[],
  values: ReadonlyArray<Renderable<R, E>>,
  onChunk: (index: number, value: string) => Effect.Effect<never, never, void>,
) {
  const output: RenderChunk<R, E>[] = Array(chunks.length)

  for (let i = 0; i < chunks.length; i++) {
    output[i] = renderChunkMap[chunks[i].type](chunks[i] as any, i, values, onChunk)
  }

  return output
}

type PartNodeMap = {
  readonly [K in PartNode['type']]: (
    node: Extract<PartNode, { type: K }>,
    onChunk: (value: unknown) => Effect.Effect<never, never, void>,
  ) => Part
}

const partNodeMap: PartNodeMap = {
  attr: (node, onChunk) => new AttrPart(onChunk, () => onChunk(null), node.index),
  'boolean-part': (node, onChunk) => new BooleanPart(onChunk, node.index),
  'className-part': (node, onChunk) => new ClassNamePart(onChunk, node.index, []),
  'comment-part': (node, onChunk) => new CommentPart(onChunk, node.index),
  data: (node, onChunk) => new DataPart(onChunk, node.index),
  event: (node, onChunk) => new EventPart(onChunk, onChunk(null), node.name, node.index),
  node: (node, onChunk) =>
    new NodePart(
      node.index,
      (_, nodes, isText) => Effect.as(onChunk(isText ? nodes[0] : nodes), nodes),
      (value) => Effect.succeed(textFacade(value)),
    ),
  property: (node, onChunk) => new PropertyPart(onChunk, node.index, null),
  ref: (node) => new RefPart(Effect.succeed(null), node.index),
  'text-part': (node, onChunk) => new TextPart(onChunk, node.index, ''),
}

export function partNodeToPart(
  node: PartNode,
  onChunk: (value: unknown) => Effect.Effect<never, never, void>,
): Part {
  return partNodeMap[node.type](node as any, onChunk)
}

function sparsePartNodeToPart(
  node: SparsePartNode,
  onChunk: (value: string | null) => Effect.Effect<never, never, void>,
) {
  if (node.type === 'sparse-attr') {
    return SparseAttrPart.fromPartNodes((s) => onChunk(s), node.nodes)
  } else {
    return SparseClassNamePart.fromPartNodes((s) => onChunk(s), node.nodes)
  }
}

function textFacade(nodeValue: string): Text {
  const text = {
    TEXT_NODE: 3,
    COMMENT_NODE: 8,
    DOCUMENT_FRAGMENT_NODE: 11,
    ATTRIBUTE_NODE: 2,
    nodeType: 3,
    nodeValue,
    textContent: nodeValue,
    valueOf: () => text,
  }

  return text as unknown as Text
}
