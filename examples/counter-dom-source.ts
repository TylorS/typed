import { pipe } from '@fp-ts/data/Function'
import { provideBrowserIntrinsics } from '@typed/framework/provideIntrinsics.js'

import * as Fx from '@typed/fx/index.js'
import { makeElementRef, html, renderInto } from '@typed/html/index.js'

const Counter = Fx.gen(function* ($) {
  // An ElementRef is a special type of RefSubject which can be passed to the `ref` attribute of
  // an element in @typed/html. It will be populated with the element once it is mounted.
  const ref = yield* $(makeElementRef<HTMLDivElement>())

  // Each ElementRef is also a DomSource which can be utilized to query for elements
  // and events declaratively as Fx, and has a slightly better testing story.
  const inc = Fx.as(+1)(ref.query('.inc').events('click'))
  const dec = Fx.as(-1)(ref.query('.dec').events('click'))
  const count = pipe(
    Fx.mergeAll(inc, dec),
    Fx.scan(0, (x, y) => x + y),
  )

  return html`<div ref=${ref}>
    <button class="dec">Decrement</button>
    <button class="inc">Increment</button>
    <p>Count: ${count}</p>
  </div>`
})

pipe(Counter, renderInto(document.body), provideBrowserIntrinsics(window), Fx.unsafeRunAsync)
