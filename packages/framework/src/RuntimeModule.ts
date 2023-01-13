import type { Redirect, RouteMatcher } from '@typed/router'

import type { Fallback } from './FallbackModule.js'
import type { IntrinsicServices } from './IntrinsicServices.js'
import type { Module } from './Module.js'

export interface RuntimeModule {
  readonly modules: ReadonlyArray<Module<IntrinsicServices, string>>
  readonly matcher: RouteMatcher<IntrinsicServices, Redirect>
  readonly fallback: Fallback | null
}
