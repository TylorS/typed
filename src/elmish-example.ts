import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'

import { EventHandler, html } from './HTML/index.js'

interface Model {
  readonly count: number
}

type Msg = Increment | Decrement

class Increment {
  readonly type = 'Increment'
}

class Decrement {
  readonly type = 'Decrement'
}

export const Counter = component(
  Effect.succeed({ count: 0 }),
  (model: Model, msg: Msg) =>
    Effect.succeed({
      count: model.count + (msg.type === 'Increment' ? +1 : -1),
    }),
  (model: Model, dispatch: Dispatch<Msg>) =>
    html.effect`<div>
      <button onclick=${EventHandler(() => dispatch(new Decrement()))}>Decrement</button>
      <button onclick=${EventHandler(() => dispatch(new Increment()))}>Increment</button>
      <p>Count: ${model.count}</p>
    </div>`,
)

// const program = pipe(
//   Counter,
//   drainInto(document.body),
//   RenderContext.provide,
//   Document.provide(document),
// )

// Effect.unsafeRunAsync(program)

// Library Code

type Dispatch<Msg> = (msg: Msg) => Effect.Effect<never, never, void>

function component<R, E, Model, Msg, R2, E2, R3, E3, B>(
  init: Effect.Effect<R, E, Model>,
  update: (model: Model, msg: Msg) => Effect.Effect<R2, E2, Model>,
  view: (model: Model, dispatch: Dispatch<Msg>) => Effect.Effect<R3, E3, B>,
): Fx.Fx<R | R2 | R3, E | E2 | E3, B> {
  return Fx.fromFxGen(function* ($) {
    const msgs = yield* $(Fx.makeSubject<never, Msg>())
    const initial = yield* $(init)
    const model = yield* $(Fx.makeSynchronizedSubject(() => initial))

    // Replicate dispatches into model
    yield* $(
      pipe(
        msgs,
        Fx.tapEffect((msg) => model.updateEffect((m) => update(m, msg))),
        Fx.runDrain,
        Effect.fork,
      ),
    )

    return pipe(
      model,
      Fx.mapEffect((m) => view(m, msgs.emit)),
    )
  })
}
