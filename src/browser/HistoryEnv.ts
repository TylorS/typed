import { Provider, provideSome } from '@typed/fp/Effect/exports'
import { HistoryEnv } from '@typed/fp/history/exports'

/**
 * Browser implementation of HistoryEnv. Uses the native History and Location APIs.
 */
export const historyEnv: HistoryEnv = {
  history,
  location,
}

/**
 * Provide an Effect with a browser implementation of HistoryEnv
 */
export const provideHistoryEnv: Provider<HistoryEnv> = provideSome<HistoryEnv>(historyEnv)
