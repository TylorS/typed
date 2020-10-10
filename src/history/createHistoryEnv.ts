import { HistoryEnv } from './HistoryEnv'

export function createHistoryEnv<A = unknown>(): HistoryEnv<A> {
  return {
    history,
    location,
  }
}
