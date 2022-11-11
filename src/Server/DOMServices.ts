import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as happyDom from 'happy-dom'

import { DomServices, provideDomServices } from '../DOM/DomServices.js'
import { GlobalThis } from '../DOM/GlobalThis.js'
import { RenderContext } from '../HTML/RenderContext.js'

export interface ServerWindowOptions {
  readonly innerWidth?: number
  readonly innerHeight?: number
  readonly url?: string

  readonly headHtml?: string
  readonly bodyHtml?: string
}

export const makeServerWindow = (options?: ServerWindowOptions): Window & GlobalThis => {
  const win = new happyDom.Window(options) as any

  if (options?.headHtml) {
    win.document.head.innerHTML = options.headHtml
  }

  if (options?.bodyHtml) {
    win.document.body.innerHTML = options.bodyHtml
  }

  return win
}

export const provideServerEnvironmentWith =
  (options: ServerWindowOptions = {}) =>
  <R, E, A>(effect: Effect.Effect<R | RenderContext | DomServices, E, A>) =>
    pipe(effect, provideDomServices(makeServerWindow(options)), RenderContext.provide)

export const provideServerEnvironment = provideServerEnvironmentWith()
