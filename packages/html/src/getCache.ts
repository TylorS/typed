import { RenderCache } from './RenderCache.js'
import { RenderContext } from './RenderContext.js'
import { TemplateCache } from './TemplateCache.js'
import { TemplateResult } from './TemplateResult.js'
import { parseTemplate } from './parseTemplate.js'

export function getRenderCache(
  where: HTMLElement | DocumentFragment,
  renderCache: WeakMap<HTMLElement | DocumentFragment, RenderCache>,
) {
  const cache = renderCache.get(where)

  if (cache) return cache

  const created = RenderCache()

  renderCache.set(where, created)

  return created
}

export function getTemplateCache(
  document: Document,
  templateCache: RenderContext['templateCache'],
  { template, options }: TemplateResult,
): TemplateCache {
  const cache = templateCache.get(template)

  if (cache) return cache as TemplateCache

  const isSvg = options?.isSvg ?? false
  const created = parseTemplate(template, document, isSvg)

  templateCache.set(template, created)

  return created
}
