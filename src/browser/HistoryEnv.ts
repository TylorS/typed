import { provideSome } from '@typed/fp/Effect/exports'
import { HistoryEnv } from '@typed/fp/history/exports'

export const historyEnv: HistoryEnv = {
  history,
  location,
}

export const provideHistoryEnv = provideSome<HistoryEnv>(historyEnv)
