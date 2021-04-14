import { fromIO } from '@fp/Env'
import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import { withGlobalRefs } from '@fp/Global'
import { useMemo } from '@fp/hooks'
import * as RA from '@fp/RefAdapter'
import { createSink, Sink } from '@fp/Stream'
import { Refinement } from 'fp-ts/Refinement'

import { SharedEvent } from './SharedEvent'

export const SharedEvents = RA.createRefAdapter<SharedEvent<unknown>>()

export const sendSharedEvent = <A>(event: SharedEvent<A>) =>
  pipe(event, RA.sendEvent(SharedEvents), withGlobalRefs)

export const getSendSharedEvent = pipe(RA.getSendEvent(SharedEvents), withGlobalRefs)

export const listenToSharedEvents = (sink: Readonly<Partial<Sink<SharedEvent<unknown>>>>) =>
  pipe(sink, RA.listenToEvents(SharedEvents), withGlobalRefs)

export const getListenToSharedEvents = pipe(RA.getListenToEvents(SharedEvents), withGlobalRefs)

export const useSharedEvents = <A extends SharedEvent<any>>(
  refinement: Refinement<SharedEvent<unknown>, A>,
  onEvent: (event: A) => void,
) =>
  Do(function* (_) {
    const sink = yield* _(
      useMemo(
        fromIO(() =>
          createSink<SharedEvent<any>>({
            event: (_, x) => {
              if (refinement(x)) {
                onEvent(x)
              }
            },
          }),
        ),
      ),
    )

    return yield* _(pipe(sink, listenToSharedEvents, useMemo))
  })
