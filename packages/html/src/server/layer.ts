import * as Layer from '@effect/io/Layer'
import { GlobalThis, Window, domServices } from '@typed/dom'

import { Environment, RenderContext, makeRenderContext } from '../RenderContext.js'

import { ServerWindowOptions, makeServerWindow } from './makeServerWindow.js'

export const layer =
  (environment: Environment) => (options?: ServerWindowOptions & { readonly isBot?: boolean }) => {
    const window = makeServerWindow(options)

    const { context } = GlobalThis.build(window)
      .merge(Window.build(window))
      .merge(RenderContext.build(makeRenderContext(environment, options?.isBot)))

    return Layer.provideMerge(Layer.succeedContext(context), domServices)
  }

export const server = layer('server')

const static_ = layer('static')
export { static_ as static }

export const test = layer('test')

export * from './makeServerWindow.js'
