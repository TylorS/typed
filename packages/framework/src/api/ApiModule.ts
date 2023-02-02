import type { FetchHandler } from './FetchHandler.js'

export interface ApiModule {
  readonly handlers: ReadonlyArray<FetchHandler<never, never, string>>
}
