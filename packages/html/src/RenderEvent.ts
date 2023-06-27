import { Rendered } from './Rendered.js'

export type RenderEvent = DomRenderEvent | HtmlRenderEvent

export type DomRenderEvent = {
  readonly _tag: 'dom'
  readonly rendered: Rendered
  readonly valueOf: () => Rendered
}

export function DomRenderEvent(rendered: Rendered): DomRenderEvent {
  return {
    _tag: 'dom',
    rendered,
    valueOf() {
      return rendered
    },
  }
}

export type HtmlRenderEvent = {
  readonly _tag: 'html'
  readonly html: string
  readonly valueOf: () => string
}

export function HtmlRenderEvent(html: string): HtmlRenderEvent {
  return {
    _tag: 'html',
    html,
    valueOf() {
      return html
    },
  }
}

export function isRenderEvent(value: unknown): value is RenderEvent {
  return isTaggedObject(value) && (value._tag === 'html' || value._tag === 'dom')
}

function isTaggedObject(
  value: unknown,
): value is Record<string, unknown> & { readonly _tag: unknown } {
  return isObject(value) && '_tag' in value
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object'
}
