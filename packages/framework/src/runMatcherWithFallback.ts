import type { Fx } from '@typed/fx'
import type { Renderable } from '@typed/html'
import type { Redirect, RouteMatcher } from '@typed/router'

import type { Fallback } from './FallbackModule.js'
import type { IntrinsicServices } from './IntrinsicServices.js'

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
