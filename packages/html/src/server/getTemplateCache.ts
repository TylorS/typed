import { RenderContext } from '../RenderContext.js'
import { globalParser } from '../parser/global.js'
import { Template } from '../parser/parser.js'

import { HtmlChunk, templateToHtmlChunks } from './templateToHtmlChunks.js'

export type ServerTemplateCache = {
  readonly template: Template
  readonly chunks: readonly HtmlChunk[]
}

export function getTemplateCache(
  templateStrings: TemplateStringsArray,
  templateCache: RenderContext['templateCache'],
): ServerTemplateCache {
  const cache = templateCache.get(templateStrings)

  if (cache) return cache as ServerTemplateCache

  const template = globalParser.parse(templateStrings)
  const chunks = templateToHtmlChunks(template)

  const newCache = { template, chunks }

  templateCache.set(templateStrings, newCache)

  return newCache
}
