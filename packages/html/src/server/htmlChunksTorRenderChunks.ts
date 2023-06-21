import * as Effect from '@effect/io/Effect'

import { Renderable } from '../Renderable.js'
import { PartNode, SparsePartNode } from '../parser/parser.js'
import { AttrPart } from '../partV2/AttrPart.js'
import { BooleanPart } from '../partV2/BooleanPart.js'
import { ClassNamePart } from '../partV2/ClassNamePart.js'
import { CommentPart } from '../partV2/CommentPart.js'
import { DataPart } from '../partV2/DataPart.js'
import { EventPart } from '../partV2/EventPart.js'
import { NodePart } from '../partV2/NodePart.js'
import { Part, SparsePart } from '../partV2/Part.js'
import { PropertyPart } from '../partV2/PropertyPart.js'
import { RefPart } from '../partV2/RefPart.js'
import { SparseAttrPart } from '../partV2/SparseAttrPart.js'
import { SparseClassNamePart } from '../partV2/SparseClassNamePart.js'
import { TextPart } from '../partV2/TextPart.js'

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

export function htmlChunksToRenderChunks<R, E>(
  chunks: readonly HtmlChunk[],
  values: ReadonlyArray<Renderable<R, E>>,
  onChunk: (index: number, value: string) => Effect.Effect<never, never, void>,
) {
  const output: RenderChunk<R, E>[] = Array(chunks.length)

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const index = i

    if (chunk.type === 'text') {
      output[index] = new TextRenderChunk(index, chunk.value)
    } else if (chunk.type === 'part') {
      output[index] = new PartRenderChunk(
        index,
        chunk,
        partNodeToPart(chunk.node, (v) => onChunk(index, chunk.render(v))),
        values[chunk.node.index],
      )
    } else {
      output[index] = new SparsePartRenderChunk(
        index,
        chunk,
        sparsePartNodeToPart(chunk.node, (v) => onChunk(index, chunk.render(v))),
        chunk.node.nodes.map((n) => (n.type === 'text' ? n.value : values[n.index])),
      )
    }
  }

  return output
}

function partNodeToPart(
  node: PartNode,
  onChunk: (value: unknown) => Effect.Effect<never, never, void>,
): Part {
  switch (node.type) {
    case 'attr':
      return new AttrPart(onChunk, () => onChunk(null), node.index)
    case 'boolean-part':
      return new BooleanPart(onChunk, node.index)
    case 'className-part':
      return new ClassNamePart(onChunk, node.index, [])
    case 'comment-part':
      return new CommentPart(onChunk, node.index)
    case 'data':
      return new DataPart(onChunk, node.index)
    case 'event':
      return new EventPart(onChunk, onChunk(null), node.name, node.index)
    case 'node':
      // TODO: Figure out how to handle node elements
      return new NodePart(
        node.index,
        (_, nodes, isText) => Effect.as(onChunk(isText ? nodes[0] : nodes), nodes),
        (value) => Effect.succeed(textFacade(value)),
      )
    case 'property':
      return new PropertyPart(onChunk, node.index, null)
    case 'ref':
      return new RefPart(Effect.succeed(null), node.index)
    case 'text-part':
      return new TextPart(onChunk, node.index, '')
  }
}

function sparsePartNodeToPart(
  node: SparsePartNode,
  onChunk: (value: string) => Effect.Effect<never, never, void>,
) {
  switch (node.type) {
    case 'sparse-attr':
      return SparseAttrPart.fromPartNodes((s) => onChunk(s || ''), node.nodes)
    case 'sparse-class-name':
      return SparseClassNamePart.fromPartNodes((s) => onChunk(s || ''), node.nodes)
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
