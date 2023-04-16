import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'
import { type Renderable, renderInto } from '@typed/html'
import type { Redirect } from '@typed/router'

import type { HtmlModule } from './HtmlModule.js'
import type { IntrinsicServices } from './IntrinsicServices.js'

export function runServerHandler(
  htmlModule: HtmlModule,
  getParentElement: (doc: Document) => HTMLElement | null,
  main: Fx.Fx<IntrinsicServices, Redirect, Renderable>,
  url: string,
  provide: (
    window: ReturnType<HtmlModule['makeWindow']>,
    parentElement: HTMLElement,
  ) => <R>(
    fx: Fx.Fx<R, Redirect, Renderable>,
  ) => Fx.Fx<Exclude<R, IntrinsicServices>, Redirect, Renderable>,
): Effect.Effect<Scope.Scope, never, Exit.Exit<Redirect, string>> {
  return Effect.gen(function* ($) {
    const window = htmlModule.makeWindow({ url })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const parentElement = getParentElement(window.document)

    if (!parentElement) {
      return yield* $(Effect.dieMessage(`Unable to find parent element`))
    }

    const exit = yield* $(
      pipe(main, renderInto(parentElement), provide(window, parentElement), Fx.drain, Effect.exit),
    )

    return pipe(
      exit,
      Exit.map(() => htmlModule.docType + window.document.documentElement.outerHTML),
    )
  })
}
