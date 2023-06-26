import * as Layer from '@effect/io/Layer'
import { GlobalThis, Window, domServices } from '@typed/dom'

import { RenderContext, makeRenderContext } from '../RenderContext.js'

export const browser = (window: Window & GlobalThis) =>
  Layer.provideMerge(
    Layer.succeedContext(GlobalThis.build(window).merge(Window.build(window)).context),
    Layer.provideMerge(domServices, RenderContext.layerOf(makeRenderContext({ environment: 'browser' }))),
  )
