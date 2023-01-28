import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import { pipe } from '@fp-ts/core/Function'
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
  ) => (fx: Fx.Fx<IntrinsicServices, Redirect, Renderable>) => Fx.Fx<never, Redirect, Renderable>,
): Effect.Effect<never, never, Exit.Exit<Redirect, string>> {
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
