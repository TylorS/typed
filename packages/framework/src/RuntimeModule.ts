import { Redirect, RouteMatcher } from '@typed/router'

import { Fallback } from './FallbackModule.js'
import { IntrinsicServices } from './IntrinsicServices.js'
import { Module } from './Module.js'

export interface RuntimeModule {
  readonly modules: ReadonlyArray<Module<IntrinsicServices, string>>
  readonly matcher: RouteMatcher<IntrinsicServices, Redirect>
  readonly fallback: Fallback | null
}
