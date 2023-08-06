import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'
import { EventHandler, html } from '@typed/html'

import { makeIntent, makeModel } from './application.js'

type EventWithTarget<T extends HTMLElement> = Event & { target: T }

export const TodoApp = Fx.gen(function* (_) {
  const model = yield* _(makeModel)
  const intent = makeIntent(model)

  return html`<section class="todoapp">
    <header class="todoapp__header">
      <h1 class="todoapp__heading">Todos</h1>

      <input
        class="todoapp__create-todo-input"
        .value=${model.createTodoText}
        oninput=${EventHandler((ev: EventWithTarget<HTMLInputElement>) =>
          model.createTodoText.set(ev.target.value),
        )}
        onkeydown=${EventHandler((ev: KeyboardEvent) =>
          ev.key === 'Enter' ? intent.createTodo : Effect.unit,
        )}
      />
    </header>

    <main class="todoapp__main"></main>

    <footer class="todoapp__footer"></footer>
  </section>`
})
