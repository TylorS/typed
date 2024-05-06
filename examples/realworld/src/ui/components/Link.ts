import type { Placeholder, RenderEvent } from "@typed/core"
import { Link as UiLink } from "@typed/ui/Link"

export function Link<E, R>(
  params: {
    readonly href: string
    readonly className?: string
    readonly content: Placeholder<string | RenderEvent, E, R>
  }
) {
  return UiLink(
    {
      to: params.href,
      className: params.className,
      relative: false
    },
    params.content
  )
}
