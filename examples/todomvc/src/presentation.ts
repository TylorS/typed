import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'
import { EventHandler, html, many } from '@typed/html'
import * as Navigation from '@typed/navigation'

import { Intent, makeIntent, makeModel } from './application.js'
import { Todo, ViewState } from './domain.js'
import { viewStateToPath } from './infrastructure.js'

type EventWithTarget<T extends HTMLElement> = Event & { target: T }

export const TodoApp = Fx.gen(function* (_) {
  const model = yield* _(makeModel)
  const intent = makeIntent(model)

  return html`<section class="todoapp">
    <header class="todoapp__header">
      <h1 class="todoapp__heading">todos</h1>

      <input
        class="todoapp__create-todo-input"
        placeholder="What needs to be done?"
        .value=${model.createTodoText}
        oninput=${EventHandler((ev: EventWithTarget<HTMLInputElement>) =>
          model.createTodoText.set(ev.target.value),
        )}
        onkeydown=${EventHandler((ev: KeyboardEvent) =>
          ev.key === 'Enter' ? intent.createTodo : Effect.unit,
        )}
      />
    </header>

    <main class="todoapp__main">
      <ul class="todoapp__list">
        ${many(
          model.todos,
          (todo) => TodoItem(todo, intent),
          (todo) => todo.id,
        )}
      </ul>
    </main>

    <footer class="todoapp__footer">
      <p class="todoapp__todo-count">
        ${model.remainingCount} item${model.remainingCount.map((x) => (x === 1 ? '' : 's'))} left
      </p>

      <ul class="todoapp__actions">
        ${Object.values(ViewState).map(ActionLink)}
      </ul>

      ${Fx.switchMap(model.completedCount, (count) =>
        count === 0
          ? Fx.succeed(null)
          : html`<button onclick=${intent.clearCompletedTodos}>Clear completed</button>`,
      )}
    </footer>
  </section>`
})

const ActionLink = (viewState: ViewState) =>
  html`<li class="todoapp__action">
    <a
      class="todoapp__action-link"
      href=${viewStateToPath(viewState)}
      onclick=${EventHandler.preventDefault(() => Navigation.navigate(viewStateToPath(viewState)))}
      >${viewState}</a
    >
  </li>`

const TodoItem = (todo: Fx.RefSubject<never, Todo>, intent: Intent) =>
  Fx.gen(function* (_) {
    const { id } = yield* _(todo)

    return html`<li class="todoapp__list-item">
      <input
        type="checkbox"
        class="todoapp__checkbox"
        .checked=${todo.map((t) => t.completed)}
        onclick=${intent.toggleTodoCompletion(id)}
      />

      <input
        class="todoapp__input"
        .value=${todo.map((t) => t.text)}
        oninput=${EventHandler((ev: EventWithTarget<HTMLInputElement>) =>
          todo.update((t) => ({ ...t, text: ev.target.value })),
        )}
        onblur=${Effect.flatMap(todo, (t) => intent.editTodo(t.id, t.text))}
      />

      <button class="todoapp__remove-button" onclick=${intent.deleteTodo(id)}>×</button>
    </li>`
  })
