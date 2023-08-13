import * as Effect from '@effect/io/Effect'
import * as E from '@typed/error'
import * as Fx from '@typed/fx'
import { NavigateOptions } from '@typed/navigation'

export class Redirect extends E.tagged('@typed/router/Redirect') {
  constructor(
    readonly url: string,
    readonly options?: NavigateOptions,
  ) {
    super(`Redirect to ${url}`)
  }

  static redirect(
    url: string,
    options: NavigateOptions = { history: 'replace' },
  ): Effect.Effect<never, Redirect, never> {
    return Effect.fail(new Redirect(url, options))
  }

  static redirectFx(
    url: string,
    options: NavigateOptions = { history: 'replace' },
  ): Fx.Fx<never, Redirect, never> {
    return Fx.fail(new Redirect(url, options))
  }
}
