import { popstate } from '@most/dom-event'
import { doEffect, Effect } from '@typed/fp/Effect/exports'
import {
  fromKey,
  getShared,
  getSharedState,
  SharedEnv,
  useMemo,
  useStream,
} from '@typed/fp/Shared/exports'

import { SchedulerEnv } from '../Scheduler/exports'
import { HistoryEnv } from './HistoryEnv'

export const CurrentLocation = fromKey<Location>()('location')
export const getLocation = getShared(CurrentLocation)

/**
 * Listen to PopState events from a given EventTarget and return
 * the most up-to-date Location.
 */
export const useLocation = (
  target: EventTarget,
): Effect<SharedEnv & HistoryEnv & SchedulerEnv, Location> =>
  doEffect(function* () {
    const [getLocation, setLocation] = yield* getSharedState(CurrentLocation)
    const stream = yield* useMemo(() => popstate(target), [target])

    yield* useStream(stream, () => setLocation(getLocation()))

    return getLocation()
  })
