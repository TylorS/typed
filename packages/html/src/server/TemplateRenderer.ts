import { pipe } from '@effect/data/Function'
import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'
import { withScopedFork } from '@typed/fx/helpers.js'

import { RenderContext } from '../RenderContext.js'
import { TemplateResult } from '../TemplateResult.js'
import { Parser, PartNode, Template } from '../parser/parser.js'
import { nodeToHtml } from '../part/templateHelpers.js'

import { AttrPart } from './part/AttrPart.js'
import { BooleanPart } from './part/BooleanPart.js'
import { ClassNamePart } from './part/ClassNamePart.js'
import { CommentPart } from './part/CommentPart.js'
import { DataPart } from './part/DataPart.js'
import { EventPart } from './part/EventPart.js'
import { NodePart } from './part/NodePart.js'
import { Part } from './part/Part.js'
import { PropertyPart } from './part/PropertyPart.js'
import { RefPart } from './part/RefPart.js'
import { SparseAttrPart } from './part/SparseAttrPart.js'
import { SparseClassNamePart } from './part/SparseClassNamePart.js'
import { TextPart } from './part/TextPart.js'
import { HtmlChunk, templateToHtmlChunks } from './templateToHtmlChunks.js'

const parser = new Parser()

type ServerTemplateCache = {
  readonly template: Template
  readonly chunks: readonly HtmlChunk[]
}

function renderTemplateResult(
  context: RenderContext,
  result: TemplateResult,
): Fx.Fx<never, never, string> {
  const { template, chunks } = getTemplateCache(result.template, context.templateCache)

  if (result.values.length === 0) {
    return Fx.succeed(chunksToHtmlWithoutParts(chunks))
  }

  return Fx.Fx<never, never, string>((sink) =>
    withScopedFork((fork) =>
      Effect.gen(function* ($) {
        const fiberId = yield* $(Effect.fiberId())
        const indexToHtml = new Map<number, string>()
        const pendingHtml = new Map<number, string>()
        const partsWithTemplateResults = new Set<number>()
      }),
    ),
  )
}

function chunksToHtmlWithoutParts(chunk: readonly HtmlChunk[]): string {
  let html = ''

  for (const c of chunk) {
    switch (c.type) {
      case 'text':
        html += c.value
        break
      case 'part':
      case 'sparse-part':
        throw new Error(`Invalid chunk type: ${c.type} for template with no interpolations.`)
    }
  }

  return html
}

function getTemplateCache(
  templateStrings: TemplateStringsArray,
  templateCache: RenderContext['templateCache'],
): ServerTemplateCache {
  const cache = templateCache.get(templateStrings)

  if (cache) return cache as ServerTemplateCache

  const template = parser.parse(templateStrings)
  const chunks = templateToHtmlChunks(template)

  const newCache = { template, chunks }

  templateCache.set(templateStrings, newCache)

  return newCache
}

function partNodeToParts(
  node: PartNode,
  onChunk: (value: unknown) => Effect.Effect<never, never, void>,
): Part {
  switch (node.type) {
    case 'attr':
      return new AttrPart(onChunk, () => Effect.unit(), node.index)
    case 'boolean-part':
      return new BooleanPart(onChunk, node.index)
    case 'className-part':
      return new ClassNamePart(onChunk, node.index, [])
    case 'comment-part':
      return new CommentPart(onChunk, node.index)
    case 'data':
      return new DataPart(onChunk, node.index)
    case 'event':
      return new EventPart(onChunk, Effect.unit(), node.name, node.index)
    case 'node':
      // TODO: Figure out how to handle node elements
      return new NodePart(
        node.index,
        (_, nodes) => Effect.as(onChunk(nodes.map(nodeToHtml).join('')), nodes),
        (value) => Effect.succeed(textFacade(value)),
      )
    case 'property':
      return new PropertyPart(onChunk, node.index, null)
    case 'ref':
      return new RefPart(Effect.succeed(null), node.index)
    case 'text-part':
      return new TextPart(onChunk, node.index, '')
    case 'sparse-attr':
      return SparseAttrPart.fromPartNodes((s) => onChunk(s || ''), node.nodes)
    case 'sparse-class-name':
      return SparseClassNamePart.fromPartNodes(onChunk, node.nodes)
  }
}

function textFacade(nodeValue: string): Text {
  const text = {
    nodeType: 3,
    nodeValue,
    valueOf: () => text,
  }

  return text as unknown as Text
}

export class ServeTemplateInstance {
  constructor(readonly result: TemplateResult, readonly cache: ServerTemplateCache) {}
}
