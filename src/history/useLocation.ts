import { doEffect, Effect } from '@fp/Effect/exports'
import {
  fromKey,
  getShared,
  getSharedState,
  SharedEnv,
  useMemo,
  useStream,
  usingGlobal,
} from '@fp/Shared/exports'
import { popstate } from '@most/dom-event'
import { pipe } from 'fp-ts/function'

import { SchedulerEnv } from '../Scheduler/exports'
import { HistoryEnv } from './HistoryEnv'

/**
 * A Shared instance of the current Location
 */
export const CurrentLocation = fromKey<Location>()('location')

/**
 * Get the current Location.
 */
export const getLocation = usingGlobal(getShared(CurrentLocation))

/**
 * Listen to PopState events from a given EventTarget and return
 * the most up-to-date Location.
 */
export const useLocation = (
  target: EventTarget,
): Effect<SharedEnv & HistoryEnv & SchedulerEnv, Location> =>
  doEffect(function* () {
    const [getLocation, setLocation] = yield* pipe(getSharedState(CurrentLocation), usingGlobal)
    const stream = yield* useMemo(() => popstate(target), [target])

    yield* useStream(stream, () => setLocation(getLocation()))

    return getLocation()
  })
