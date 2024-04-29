import type { Placeholder, RenderEvent } from "@typed/core"
import { EventHandler, html, Navigation } from "@typed/core"

export function Link<E, R>(
  params: {
    readonly href: string
    readonly className?: string
    readonly content: Placeholder<string | RenderEvent, E, R>
  }
) {
  return html` <a
      onclick=${EventHandler.preventDefault(() => Navigation.navigate(params.href))} 
      class=${params.className}
      href=${params.href}
    >
      ${params.content}
    </a>`
}
