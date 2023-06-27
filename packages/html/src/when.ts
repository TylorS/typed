import { Fx } from '@typed/fx'

import { RenderContext } from './RenderContext.js'

export const whenBrowser = <R, E, A, R2, E2, B>(
  onBrowser: Fx<R, E, A>,
  onOther: Fx<R2, E2, B>,
): Fx<R | R2 | RenderContext, E | E2, A | B> =>
  RenderContext.withFx(
    (ctx): Fx<R | R2, E | E2, A | B> => (ctx.environment === 'browser' ? onBrowser : onOther),
  )

export const whenServer = <R, E, A, R2, E2, B>(
  onServer: Fx<R, E, A>,
  onOther: Fx<R2, E2, B>,
): Fx<R | R2 | RenderContext, E | E2, A | B> =>
  RenderContext.withFx(
    (ctx): Fx<R | R2, E | E2, A | B> => (ctx.environment === 'server' ? onServer : onOther),
  )

export const whenStatic = <R, E, A, R2, E2, B>(
  onStatic: Fx<R, E, A>,
  onOther: Fx<R2, E2, B>,
): Fx<R | R2 | RenderContext, E | E2, A | B> =>
  RenderContext.withFx(
    (ctx): Fx<R | R2, E | E2, A | B> => (ctx.environment === 'static' ? onStatic : onOther),
  )
