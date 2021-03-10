import { chain, filter, merge } from '@most/core'
import { Stream } from '@most/types'
import { RuntimeEnv } from '@typed/fp/Shared'
import { fromIO } from '@typed/fp/Stream'
import { pipe } from 'fp-ts/dist/function'
import { Reader, URI } from 'fp-ts/dist/Reader'

/**
 * Converts an environment into a Stream sampling the latest value produced by the provided Reader.
 * Note that the provided requirements.currentNamespace will be used to filter which SharedEvents
 * are considered updates.
 */
export function toStream<E extends RuntimeEnv<URI>, A>(
  reader: Reader<E, A>,
  requirements: E,
): Stream<A> {
  const namespace = requirements.currentNamespace
  const effect = fromIO(() => reader(requirements))
  const updates = pipe(
    requirements.sharedEvents[1],
    filter(
      (event) =>
        event.namespace === namespace &&
        (event.type === 'namespace/updated' || event.type === 'sharedValue/updated'),
    ),
    chain(() => effect),
  )

  return merge(effect, updates)
}
