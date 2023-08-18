import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import { Storage } from '@typed/dom'
import { RenderContext, makeRenderContext } from '@typed/html'
import * as html from '@typed/html/server'
import * as Navigation from '@typed/navigation'
import * as Router from '@typed/router'
import { mockStorage } from 'mock-storage'

import { IntrinsicServices } from '../IntrinsicServices.js'

export type ServerLayerOptions = Omit<html.ServerLayerOptions, 'url'> &
  Navigation.MemoryNavigationOptions & {
    readonly initialStorage?: Map<string, string>
  }

export function server(
  options: ServerLayerOptions,
): Layer.Layer<never, never, Exclude<IntrinsicServices, Scope.Scope>> {
  return Layer.mergeAll(
    Layer.provideMerge(
      html.server({ ...options, url: options.initialUrl.toString() }),
      Router.memory(options),
    ),
    RenderContext.layerOf(makeRenderContext({ environment: 'server', isBot: options.isBot })),
    Storage.layerOf(mockStorage(options.initialStorage)),
  )
}

function static_(
  options: ServerLayerOptions,
): Layer.Layer<never, never, Exclude<IntrinsicServices, Scope.Scope>> {
  return Layer.mergeAll(
    Layer.provideMerge(
      html.static({ ...options, url: options.initialUrl.toString() }),
      Router.memory(options),
    ),
    RenderContext.layerOf(makeRenderContext({ environment: 'static', isBot: options.isBot })),
    Storage.layerOf(mockStorage(options.initialStorage)),
  )
}

export { static_ as static }
