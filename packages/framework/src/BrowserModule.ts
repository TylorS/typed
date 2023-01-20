import type { Fx } from '@typed/fx'

import type { RuntimeModule } from './RuntimeModule.js'

export interface BrowserModule extends RuntimeModule {
  readonly render: <T extends HTMLElement | DocumentFragment>(
    parentElement: T,
  ) => Fx<never, never, T>
}
