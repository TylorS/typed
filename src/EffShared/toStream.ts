import { chain, filter, merge } from '@most/core'
import { Stream } from '@most/types'
import { Eff, toEnv, URI } from '@typed/fp/Eff'
import { RuntimeEnv } from '@typed/fp/Shared'
import { fromResume } from '@typed/fp/Stream'
import { pipe } from 'fp-ts/dist/function'

/**
 * Converts an environment into a Stream sampling the latest value produced by the provided Eff.
 * Note that the provided requirements.currentNamespace will be used to filter which SharedEvents
 * are considered updates.
 */
export function toStream<E extends RuntimeEnv<URI>, A>(eff: Eff<E, A>, requirements: E): Stream<A> {
  const env = toEnv(eff)
  const namespace = requirements.currentNamespace
  const start = fromResume(env(requirements))
  const updates = pipe(
    requirements.sharedEvents[1],
    filter(
      (event) =>
        event.namespace === namespace &&
        (event.type === 'namespace/updated' || event.type === 'sharedValue/updated'),
    ),
    chain(() => fromResume(env(requirements))),
  )

  return merge(start, updates)
}
