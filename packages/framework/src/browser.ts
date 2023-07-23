import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import { DomServicesElementParams, GlobalThis, localStorage } from '@typed/dom'
import * as html from '@typed/html/browser'
import * as Navigation from '@typed/navigation'
import * as Router from '@typed/router'

import { IntrinsicServices } from './IntrinsicServices.js'

export function browser(
  window: Window & GlobalThis,
  options?: Navigation.DomNavigationOptions & DomServicesElementParams,
): Layer.Layer<never, never, Exclude<IntrinsicServices, Scope.Scope>> {
  return Layer.provideMerge(
    html.browser(window, options),
    Layer.provideMerge(localStorage, Router.dom(options)),
  )
}
