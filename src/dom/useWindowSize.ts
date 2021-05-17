import * as E from '@fp/Env'
import { getCurrentFiber, usingFiberRefs } from '@fp/Fiber'
import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import * as H from '@fp/hooks'
import { exec } from '@fp/Resume'

import { WindowEnv } from './env'
import { useEventListener } from './useEventListener'

export type WindowSize = {
  readonly height: number
  readonly width: number
}

const options = { passive: true }

export const useWindowSize = usingFiberRefs(
  Do(function* (_) {
    const { window } = yield* _(E.ask<WindowEnv>())
    const Size = yield* _(H.useRef(E.fromIO((): WindowSize => getWindowSize(window))))
    const fiber = yield* _(getCurrentFiber)
    const listener = yield* _(
      H.useFn(
        () => pipe({ refs: fiber.refs }, pipe(window, getWindowSize, Size.set), exec),
        [fiber],
      ),
    )

    yield* _(useEventListener(window, 'resize', listener, options))

    return yield* _(Size.get)
  }),
)

const getWindowSize = (window: Window): WindowSize => ({
  height: window.innerHeight,
  width: window.innerWidth,
})
