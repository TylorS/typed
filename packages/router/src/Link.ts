import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import { assign } from '@typed/dom'
import * as Fx from '@typed/fx'
import { EventHandler, html, RenderContext, type Placeholder } from '@typed/html'
import { pathJoin } from '@typed/path'

import { Router, getBasePath } from './router.js'

export function Link<R = never, E = never, R2 = never>(
  props: LinkProps<R, E, R2>,
): Fx.Fx<R | R2 | Document | RenderContext | Router | Scope.Scope, E, HTMLAnchorElement> {
  return Fx.gen(function* ($) {
    const useBase = props.useBase ?? true
    const href = useBase ? pathJoin(yield* $(getBasePath), props.href) || '/' : props.href
    const router = yield* $(Router)
    const clickHandler = (event: MouseEvent & { currentTarget: HTMLAnchorElement }) =>
      Effect.gen(function* ($) {
        if (props.fullReload) {
          yield* $(assign(href))
        } else {
          yield* $(router.currentPath.set(href))
        }

        if (props.onClick) {
          yield* $(props.onClick(event))
        }
      })

    return html.as<HTMLAnchorElement>()`<a
      class=${props.className}
      href=${href}
      onclick=${EventHandler.preventDefault(clickHandler)}
      >${props.label}</a>`
  })
}

export interface LinkProps<R, E, R2> {
  readonly href: string
  readonly label: string | Placeholder<R, E>
  readonly className?: string
  readonly onClick?: (
    event: MouseEvent & { currentTarget: HTMLAnchorElement },
  ) => Effect.Effect<R2, never, unknown>

  readonly useBase?: boolean
  readonly fullReload?: boolean
}
