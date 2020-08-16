import { HistoryEnv } from './HistoryEnv'

/**
 * @since 0.0.1
 */
export function createHistoryEnv<A = unknown>(): HistoryEnv<A> {
  return {
    history,
    location,
  }
}
