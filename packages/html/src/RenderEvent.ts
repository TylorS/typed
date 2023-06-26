import { Rendered } from './Rendered.js'

export type RenderEvent = DomRenderEvent | HtmlRenderEvent

export type DomRenderEvent = {
  readonly _tag: 'dom'
  readonly rendered: Rendered
}

export function DomRenderEvent(rendered: Rendered): DomRenderEvent {
  return { _tag: 'dom', rendered }
}

export type HtmlRenderEvent = {
  readonly _tag: 'html'
  readonly html: string
}

export function HtmlRenderEvent(html: string): HtmlRenderEvent {
  return { _tag: 'html', html }
}
