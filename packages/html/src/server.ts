import * as Layer from '@effect/io/Layer'
import { GlobalThis, Window, domServices } from '@typed/dom'

import { RenderContext, makeRenderContext } from './RenderContext.js'
import { RenderTemplate, renderTemplate } from './RenderTemplate.js'
import { ServerWindowOptions, makeServerWindow } from './makeServerWindow.js'

export const server = (options?: ServerWindowOptions & { readonly isBot?: boolean }) => {
  const window = makeServerWindow(options)

  const { context } = GlobalThis.build(window)
    .merge(Window.build(window))
    .merge(RenderTemplate.build({ renderTemplate }))
    .merge(RenderContext.build(makeRenderContext('server', options?.isBot)))

  return Layer.provideMerge(Layer.succeedContext(context), domServices)
}
