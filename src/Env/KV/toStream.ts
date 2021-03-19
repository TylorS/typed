import { chain, filter, merge } from '@most/core'
import { Stream } from '@most/types'
import { Shared } from '@typed/fp/Shared'
import { fromResume } from '@typed/fp/Stream'
import { pipe } from 'fp-ts/dist/function'

import { Env } from '../Env'
import { URI } from '../fp-ts'

/**
 * Converts an environment into a Stream sampling the latest value produced by the provided Env.
 * Note that the provided requirements.currentNamespace will be used to filter which SharedEvents
 * are considered updates.
 */
export function toStream<E extends Shared<URI>, A>(env: Env<E, A>, requirements: E): Stream<A> {
  const namespace = requirements.currentNamespace
  const start = fromResume(env(requirements))
  const updates = pipe(
    requirements.sharedEvents[1],
    filter(
      (event) =>
        event.namespace === namespace &&
        (event.type === 'namespace/updated' || event.type === 'kv/updated'),
    ),
    chain(() => fromResume(env(requirements))),
  )

  return merge(start, updates)
}
