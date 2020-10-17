import { html as $html, svg as $svg } from 'uhtml'

import { createTaggedTemplate, TaggedEffectTemplate } from './createTaggedTemplate'

export const html: TaggedEffectTemplate<typeof $html> = createTaggedTemplate($html)

export const htmlFor = (
  object: object,
  id?: string | undefined,
): TaggedEffectTemplate<ReturnType<typeof $html['for']>> =>
  createTaggedTemplate($html.for(object, id))

export const htmlNode: TaggedEffectTemplate<typeof $html['node']> = createTaggedTemplate($html.node)

export const svg: TaggedEffectTemplate<typeof $svg> = createTaggedTemplate($svg)

export const svgFor = (
  object: object,
  id?: string | undefined,
): TaggedEffectTemplate<ReturnType<typeof $svg['for']>> =>
  createTaggedTemplate($svg.for(object, id))

export const svgNode: TaggedEffectTemplate<typeof $svg['node']> = createTaggedTemplate($svg.node)
