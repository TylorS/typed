import { pipe } from '@fp-ts/data/Function'
import * as Fx from '@typed/fx'
import { html, makeElementRef } from '@typed/html'

/**
 * This is an @typed/html example which allows you to access a DOM reference
 * using an ElementRef. An ElementRef is a RefSubject<Option<*>> where * is
 * the type of the element you are referencing.
 *
 * An ElementRef also implements the DomSource interface as described in @typed/dom,
 * which allows querying for elements relative to the element you are referencing
 * and access Fx of events or the elements themselves. Anyone coming from Cycle.js
 * will be familiar with this pattern of separating your code using Model-View-Intent (MVI)
 * https://cycle.js.org/model-view-intent.html. The biggest difference howerver is you have
 * access to all of Effect, including dependency injection. Solving problems of prop-drilling and
 * the ability to create reusable components.
 */
export const Counter = Fx.gen(function* ($) {
  const ref = yield* $(makeElementRef<HTMLDivElement>())

  const dec = Fx.as(-1)(ref.query('.dec').events('click'))
  const inc = Fx.as(+1)(ref.query('.inc').events('click'))
  const count = pipe(
    Fx.mergeAll(dec, inc),
    Fx.scan(0, (x, y) => x + y),
  )

  return html`<div ref=${ref}>
    <button class="dec">Decrement</button>
    <button class="inc">Increment</button>

    <p>${count}</p>
  </div> `
})
