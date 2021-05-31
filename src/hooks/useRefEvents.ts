import { DoF, getCurrentFiber } from '@fp/Fiber'
import { Ref, RefEvent, RefId } from '@fp/Ref'
import { kv } from '@fp/RefMap'
import { filter, Stream } from '@fp/Stream'
import { isSome } from 'fp-ts/Option'

import { EnvSink, useSink } from './useSink'
import { useStream } from './useStream'

const RefEvents = kv<RefId, Stream<RefEvent<unknown>>>()

/**
 * Hook for listening to events related to a specific reference
 */
export function useRefEvents<E, A, E1 = unknown, E2 = unknown, E3 = unknown>(
  ref: Ref<E, A>,
  sink: EnvSink<RefEvent<A>, E1, E2, E3> = {},
) {
  return DoF(function* (_) {
    const stream = yield* _(getRefEventStream(ref))

    return yield* _(useStream(stream, yield* _(useSink(sink))))
  })
}

const getRefEventStream = <E, A>(ref: Ref<E, A>) =>
  DoF(function* (_) {
    const fiber = yield* _(getCurrentFiber)
    const option = yield* _(RefEvents.lookup(ref.id))

    if (isSome(option)) {
      return option.value
    }

    const stream = filter((e): e is RefEvent<A> => e.id === ref.id, fiber.refs.events)

    yield* _(RefEvents.upsertAt(ref.id, stream))

    return stream
  })
