import { Effect } from '@effect/io/Effect'

import { Part } from './part/Part.js'
import { Rendered } from './render.js'

export type RenderEvent = HtmlRenderEvent | DomRenderEvent

export type HtmlRenderEvent = FullHtml | PartialHtml

export type DomRenderEvent = RenderedDom | RenderUpdate

export type PartialHtml = {
  readonly _tag: 'PartialHtml'
  readonly html: string
  readonly isLast: boolean
}

export function PartialHtml(html: string, isLast: boolean): PartialHtml {
  return { _tag: 'PartialHtml', html, isLast }
}

export type FullHtml = {
  readonly _tag: 'FullHtml'
  readonly html: string
}

export function FullHtml(html: string): FullHtml {
  return { _tag: 'FullHtml', html }
}

export type RenderedDom = {
  readonly _tag: 'RenderedDom'
  readonly rendered: Rendered
}

export function RenderedDom(rendered: Rendered): RenderedDom {
  return { _tag: 'RenderedDom', rendered }
}

export type RenderUpdate = {
  readonly _tag: 'RenderUpdate'
  readonly part: Part<any, any>
  readonly update: Effect<never, never, unknown>
}

export function RenderUpdate(
  part: Part<any, any>,
  update: Effect<never, never, unknown>,
): RenderUpdate {
  return { _tag: 'RenderUpdate', part, update }
}
