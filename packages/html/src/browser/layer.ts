import * as Layer from '@effect/io/Layer'
import { GlobalThis, Window, domServices } from '@typed/dom'

export const browser = (window: Window & GlobalThis) =>
  Layer.provideMerge(
    Layer.succeedContext(GlobalThis.build(window).merge(Window.build(window)).context),
    domServices,
  )
