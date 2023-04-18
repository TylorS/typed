import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import type { Redirect } from '@typed/router'

import type { IntrinsicServices } from '../IntrinsicServices.js'
import type { Module } from '../Module.js'
import type { RuntimeModule } from '../RuntimeModule.js'

export function getAllStaticPaths({
  modules,
}: RuntimeModule): Effect.Effect<IntrinsicServices, Redirect, readonly string[]> {
  return pipe(
    modules,
    Effect.forEachPar(getStaticPathsFromModule),
    Effect.map((x) => x.flat(1)),
  )
}

function getStaticPathsFromModule<R, E, P extends string>(
  m: Module<R, E, P>,
): Effect.Effect<IntrinsicServices, E, readonly string[]> {
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
