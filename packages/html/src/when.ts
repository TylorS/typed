import * as Fx from '@typed/fx'

import { Placeholder } from './Placeholder.js'
import { RenderContext } from './RenderContext.js'

export const whenBrowser = <R, E, A, R2, E2, B>(
  onBrowser: Placeholder<R, E, A>,
  onOther: Placeholder<R2, E2, B>,
): Fx.Fx<R | R2 | RenderContext, E | E2, A | B> =>
  RenderContext.withFx(
    (ctx): Fx.Fx<R | R2, E | E2, A | B> =>
      ctx.environment === 'browser' ? Placeholder.asFx(onBrowser) : Placeholder.asFx(onOther),
  )

export const whenServer = <R, E, A, R2, E2, B>(
  onServer: Placeholder<R, E, A>,
  onOther: Placeholder<R2, E2, B>,
): Fx.Fx<R | R2 | RenderContext, E | E2, A | B> =>
  RenderContext.withFx(
    (ctx): Fx.Fx<R | R2, E | E2, A | B> =>
      ctx.environment === 'server' ? Placeholder.asFx(onServer) : Placeholder.asFx(onOther),
  )

export const whenStatic = <R, E, A, R2, E2, B>(
  onStatic: Placeholder<R, E, A>,
  onOther: Placeholder<R2, E2, B>,
): Fx.Fx<R | R2 | RenderContext, E | E2, A | B> =>
  RenderContext.withFx(
    (ctx): Fx.Fx<R | R2, E | E2, A | B> =>
      ctx.environment === 'static' ? Placeholder.asFx(onStatic) : Placeholder.asFx(onOther),
  )

export const when = <
  R = never,
  E = never,
  A = unknown,
  R2 = never,
  E2 = never,
  B = unknown,
  R3 = never,
  E3 = never,
  C = null,
>(
  placeholder: Placeholder<R, E, A>,
  predicate: (a: A) => boolean,
  onTrue: (a: A) => Placeholder<R2, E2, B>,
  onFalse: (a: A) => Placeholder<R3, E3, C> = () => Fx.succeed(null) as any,
) =>
  Placeholder.switchMap(placeholder, (a) =>
    Placeholder.asFx<R2 | R3, E2 | E3, B | C>(predicate(a) ? onTrue(a) : onFalse(a)),
  )

when.true = <
  R = never,
  E = never,
  R2 = never,
  E2 = never,
  B = unknown,
  R3 = never,
  E3 = never,
  C = null,
>(
  placeholder: Placeholder<R, E, boolean>,
  onTrue: Placeholder<R2, E2, B>,
  onFalse: Placeholder<R3, E3, C> = Fx.succeed(null) as any,
) =>
  when(
    placeholder,
    Boolean,
    () => onTrue,
    () => onFalse,
  )

when.false = <
  R = never,
  E = never,
  R2 = never,
  E2 = never,
  B = unknown,
  R3 = never,
  E3 = never,
  C = null,
>(
  placeholder: Placeholder<R, E, boolean>,
  onTrue: Placeholder<R2, E2, B>,
  onFalse: Placeholder<R3, E3, C> = Fx.succeed(null) as any,
) =>
  when(
    placeholder,
    (x) => !x,
    () => onTrue,
    () => onFalse,
  )
