import { Provider, provideSome } from '@fp/Effect/exports'
import { HistoryEnv } from '@fp/history/exports'

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
