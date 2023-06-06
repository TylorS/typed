import * as Fx from '@typed/fx'
import { Placeholder } from '@typed/html'
import { NavigateOptions } from '@typed/navigation'

import { Redirect } from './Redirect.js'

export interface NavigationParams<R, E, R2, E2> {
  // Configure the URL to navigate to
  readonly url: Placeholder<R, E, string>
  // Configure the options for the navigation, using @typed/navigation
  readonly options?: Placeholder<R2, E2, NavigateOptions>
}

export function Navigation<R = never, E = never, R2 = never, E2 = never>(
  params: NavigationParams<R, E, R2, E2>,
): Fx.Fx<R | R2, E | E2 | Redirect, null> {
  return Fx.startWith(
    Fx.switchMapEffect(
      Fx.combine(Placeholder.asFx(params.url), Placeholder.asFx(params.options)),
      ([url, options]) => Redirect.redirect(url, options),
    ),
    null,
  )
}
