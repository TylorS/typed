import { Fx } from '@typed/fx/Fx'

import { RenderContext } from './RenderContext.js'

export const whenBrowser = <R, E, A, R2, E2, B>(
  onBrowser: Fx<R, E, A>,
  onOther: Fx<R2, E2, B>,
): Fx<R | R2 | RenderContext, E | E2, A | B> =>
  RenderContext.withFx(
    (ctx): Fx<R | R2, E | E2, A | B> => (ctx.environment === 'browser' ? onBrowser : onOther),
  )
