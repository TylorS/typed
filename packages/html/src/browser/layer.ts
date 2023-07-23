import * as Layer from '@effect/io/Layer'
import { DomServices, DomServicesElementParams, GlobalThis, Window, domServices } from '@typed/dom'

export const browser = (
  window: Window & GlobalThis,
  params?: DomServicesElementParams,
): Layer.Layer<never, never, DomServices> =>
  Layer.provideMerge(
    Layer.succeedContext(GlobalThis.build(window).merge(Window.build(window)).context),
    domServices(params),
  )
