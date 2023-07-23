import * as Layer from '@effect/io/Layer'
import { DomServices, GlobalThis, Window, domServices } from '@typed/dom'

import { Environment, RenderContext, makeRenderContext } from '../RenderContext.js'
import { RenderTemplate } from '../RenderTemplate.js'

import { renderTemplateToHtml } from './RenderTemplate.js'
import { ServerWindowOptions, makeServerWindow } from './makeServerWindow.js'

export type ServerLayerOptions = ServerWindowOptions & { readonly isBot?: boolean }

const layer =
  (environment: Environment) =>
  (
    options?: ServerLayerOptions,
  ): Layer.Layer<never, never, DomServices | RenderContext | RenderTemplate> => {
    const window = makeServerWindow(options)

    const { context } = GlobalThis.build(window)
      .merge(Window.build(window))
      .merge(RenderContext.build(makeRenderContext({ environment, isBot: options?.isBot })))

    return Layer.provideMerge(
      Layer.succeedContext(context),
      Layer.mergeAll(domServices(), renderTemplateToHtml),
    )
  }

export const server = layer('server')

const static_ = layer('static')
export { static_ as static }

export * from './makeServerWindow.js'
