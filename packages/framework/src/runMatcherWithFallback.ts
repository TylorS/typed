import { Fx } from '@typed/fx'
import { Renderable } from '@typed/html'
import { Redirect, RouteMatcher } from '@typed/router'

import { Fallback } from './FallbackModule.js'
import { IntrinsicServices } from './IntrinsicServices.js'

export function runMatcherWithFallback<R, E>(
  matcher: RouteMatcher<R, E>,
  fallback: Fallback | null,
): Fx<R | IntrinsicServices, E | Redirect, Renderable> {
  if (!fallback) {
    return matcher.run
  }

  switch (fallback.type) {
    case 'Renderable':
      return matcher.notFound(fallback.fallback, fallback)
    case 'Redirect':
      return matcher.redirectTo(fallback.route, fallback.params)
  }
}
