import * as Layer from '@effect/io/Layer'
import { GlobalThis, Window, domServices } from '@typed/dom'

import { RenderContext, makeRenderContext } from './RenderContext.js'
import { RenderTemplate, renderTemplate } from './RenderTemplate.js'
import { ServerWindowOptions, makeServerWindow } from './makeServerWindow.js'

const static_ = (options?: ServerWindowOptions & { readonly isBot?: boolean }) => {
  const window = makeServerWindow(options)

  return Layer.provideMerge(
    Layer.succeedContext(
      GlobalThis.build(window)
        .merge(Window.build(window))
        .merge(RenderTemplate.build({ renderTemplate })).context,
    ),
    Layer.provideMerge(
      domServices,
      RenderContext.layerOf(makeRenderContext('static', options?.isBot)),
    ),
  )
}

export { static_ as static }
