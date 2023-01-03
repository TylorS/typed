import * as Effect from '@effect/io/Effect'
import { EventHandler, html, Placeholder } from '@typed/html'
import { Router } from '@typed/router'

export function Link<R = never>(props: LinkProps<R>) {
  return html`<a
    class=${props.className}
    href="${props.href}"
    onclick=${EventHandler.preventDefault<
      MouseEvent & { currentTarget: HTMLAnchorElement },
      Router | R
    >((event) =>
      Effect.gen(function* ($) {
        const { currentPath } = yield* $(Router.get)

        yield* $(currentPath.set(props.href))

        if (props.onClick) {
          yield* $(props.onClick(event))
        }
      }),
    )}
    >${props.label}</a
  >`
}

export interface LinkProps<R> {
  readonly href: string
  readonly label: string | Placeholder
  readonly className?: string
  readonly onClick?: (
    event: MouseEvent & { currentTarget: HTMLAnchorElement },
  ) => Effect.Effect<R, never, unknown>
}
