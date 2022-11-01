import * as Effect from '@effect/core/io/Effect'
import { millis } from '@tsplus/stdlib/data/Duration'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'

import { Document } from './DOM/Document.js'
import { element, text } from './VDOM/VNode.js'
import { render } from './VDOM/render.js'

const count = pipe(
  Fx.periodic(millis(1000)),
  Fx.scan(0, (a) => a + 1),
  Fx.map((x) => `Count: ${String(x)}`),
)

const program = pipe(
  element(
    'div',
    {
      style: pipe(
        Fx.mergeAll([
          Fx.succeed('color:red;'),
          Fx.at(millis(3000))('color:blue;'),
          Fx.at(millis(6000))('color:green;'),
          Fx.at(millis(9000))('color:yellow;'),
          Fx.at(millis(12000))('color:orange;'),
          Fx.at(millis(15000))('color:purple;'),
          Fx.at(millis(18000))('color:red;'),
        ]),
      ),
    },
    [text(count)],
  ),
  render,
  Fx.runObserve((element) => Effect.sync(() => document.body.appendChild(element))),
  Effect.provideService(Document.Tag, document),
)

Effect.unsafeRunAsync(program)
