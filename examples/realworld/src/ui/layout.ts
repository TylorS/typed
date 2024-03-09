import type { Fx } from "@typed/fx"
import type { RenderEvent } from "@typed/template"
import { html } from "@typed/template"

export function layout<E, R>(content: Fx<RenderEvent, E, R>) {
  return html`<div>${content}</div>`
}
