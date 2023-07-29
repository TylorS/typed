import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import { DomServicesElementParams } from '@typed/dom'
import { IntrinsicServices } from '@typed/framework'
import { browser } from '@typed/framework/browser'
import { DomNavigationOptions } from '@typed/navigation'

export const sharedEnvironment = (
  options?: DomNavigationOptions & DomServicesElementParams,
): Layer.Layer<never, never, Exclude<IntrinsicServices, Scope.Scope>> => {
  // Clear the DOM before each test
  const range = document.createRange()
  range.setStart(document.body.childNodes[0], 0)
  range.setEnd(document.body.childNodes[document.childNodes.length - 1], 0)
  range.deleteContents()

  return browser(window, options)
}
