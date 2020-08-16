/**
 * @since 0.0.1
 */ // @ts-ignore - for phantom type parameter
export interface HistoryEnv<A = unknown> {
  readonly location: Location
  readonly history: History
}
