import * as Layer from '@effect/io/Layer'
import { GlobalThis, Window, domServices } from '@typed/dom'

import { Environment, RenderContext, makeRenderContext } from '../RenderContext.js'

import { renderTemplateToHtml } from './RenderTemplate.js'
import { ServerWindowOptions, makeServerWindow } from './makeServerWindow.js'

const layer =
  (environment: Environment) => (options?: ServerWindowOptions & { readonly isBot?: boolean }) => {
    const window = makeServerWindow(options)

    const { context } = GlobalThis.build(window)
      .merge(Window.build(window))
      .merge(RenderContext.build(makeRenderContext({ environment, isBot: options?.isBot })))

    return Layer.provideMerge(
      Layer.succeedContext(context),
      Layer.mergeAll(domServices, renderTemplateToHtml),
    )
  }

export const server = layer('server')

const static_ = layer('static')
export { static_ as static }

export * from './makeServerWindow.js'
