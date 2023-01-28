import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'

import type { IntrinsicServices } from '../IntrinsicServices.js'
import type { Module } from '../Module.js'
import type { RuntimeModule } from '../RuntimeModule.js'

export function getAllStaticPaths({
  modules,
}: RuntimeModule): Effect.Effect<IntrinsicServices, never, readonly string[]> {
  return pipe(
    modules,
    Effect.forEach(getStaticPathsFromModule),
    Effect.map((x) => x.toReadonlyArray().flat()),
  )
}

function getStaticPathsFromModule<R, P extends string>(
  m: Module<R, P>,
): Effect.Effect<IntrinsicServices, never, readonly string[]> {
  // Prefer the getStaticPaths function from the module's meta
  if (m.meta?.getStaticPaths) {
    return m.meta.getStaticPaths
  }

  // If the route has params, we can't statically generate the page
  if (m.route.path.includes(':')) {
    return Effect.succeed([])
  }

  return Effect.succeed([m.route.path])
}
