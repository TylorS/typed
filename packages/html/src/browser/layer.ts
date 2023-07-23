import * as Layer from '@effect/io/Layer'
import { DomServices, DomServicesElementParams, GlobalThis, Window, domServices } from '@typed/dom'

import { RenderContext, makeRenderContext } from '../RenderContext.js'

export const browser = (
  window: Window & GlobalThis,
  params?: DomServicesElementParams,
): Layer.Layer<never, never, DomServices | RenderContext> =>
  Layer.mergeAll(
    Layer.provideMerge(
      Layer.succeedContext(GlobalThis.build(window).merge(Window.build(window)).context),
      domServices(params),
    ),
    RenderContext.layerOf(makeRenderContext({ environment: 'browser' })),
  )
