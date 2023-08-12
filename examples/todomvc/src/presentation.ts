import * as Predicate from '@effect/data/Predicate'
import * as Effect from '@effect/io/Effect'
import { getIsUsingKeyModifier } from '@typed/dom'
import * as Fx from '@typed/fx'
import { EventHandler, html, many, when } from '@typed/html'
import * as Navigation from '@typed/navigation'

import { Intent, makeIntent, makeModel } from './application.js'
import { Todo, ViewState } from './domain.js'
import { viewStateToPath } from './infrastructure.js'

export const TodoApp = Fx.gen(function* (_) {
  const model = yield* _(makeModel)
  const intent = makeIntent(model)

  return html`<section class="todoapp ${model.viewState.map((s) => s.toLowerCase())}">
    <header class="header">
      <h1>todos</h1>

      <form class="add-todo" onsubmit=${EventHandler.preventDefault(() => intent.createTodo)}>
        <input
          class="new-todo"
          placeholder="What needs to be done?"
          .value=${model.createTodoText}
          oninput=${EventHandler.target<HTMLInputElement>()((ev) =>
            model.createTodoText.set(ev.target.value),
          )}
        />
      </div>
    </header>

    <section class="main">
      <input class="toggle-all" type="checkbox" ?checked=${model.allAreCompleted} />
      <label for="toggle-all" onclick=${intent.toggleAllCompleted}>Mark all as complete</label>

      <ul class="todo-list">
        ${many(
          model.todos,
          (todo) => TodoItem(todo, intent),
          (todo) => todo.id,
        )}
      </ul>

      <footer class="footer">
        <span class="todo-count">
          ${model.remainingCount} item${model.remainingCount.map((c) => (c === 1 ? '' : 's'))} left
        </span>

        <ul class="filters">
          ${Object.values(ViewState).map((s) => ActionLink(s, model.viewState))}
        </ul>

        ${when(
          model.completedCount,
          (count) => count > 0,
          () =>
            html`<button class="clear-completed" onclick=${intent.clearCompletedTodos}>
              Clear completed
            </button>`,
        )}
      </footer>
    </section>
  </section>`
})

const ActionLink = (viewState: ViewState, currentViewState: Fx.RefSubject<never, ViewState>) =>
  html`<li>
    <a
      class="${currentViewState.map((current) => (current === viewState ? 'selected' : null))}"
      href=${viewStateToPath(viewState)}
      onclick=${EventHandler.preventDefault.if(Predicate.not(getIsUsingKeyModifier), () =>
        Navigation.navigate(viewStateToPath(viewState)),
      )}
      >${viewState}</a
    >
  </li>`

const TodoItem = (todo: Fx.RefSubject<never, Todo>, intent: Intent) =>
  Fx.gen(function* (_) {
    const { id } = yield* _(todo)

    // Update the todo's text using the provided RefSubject
    const updateText = (text: string) => todo.update((t) => ({ ...t, text }))

    // Track whether the todo is being edited
    const isEditing = yield* _(Fx.makeRef(Effect.succeed(false)))

    // Submit the todo when the user is done editing
    const submit = todo.pipe(
      Effect.flatMap((t) =>
        t.text.trim() === '' ? intent.deleteTodo(t.id) : intent.editTodo(t.id, t.text),
      ),
      Effect.flatMap(() => isEditing.set(false)),
    )

    return html`<li
      class="${todo.map((t) => (t.completed ? 'completed' : ''))} ${isEditing.map((editing) =>
        editing ? 'editing' : '',
      )}"
    >
      <div class="view">
        <input
          type="checkbox"
          class="toggle"
          .checked=${todo.map((t) => t.completed)}
          onclick=${intent.toggleTodoCompletion(id)}
        />

        <label ondblclick=${isEditing.set(true)}>${todo.map((t) => t.text)} </label>

        <button class="destroy" onclick=${intent.deleteTodo(id)}></button>
      </div>

      <input
        class="edit"
        .value=${todo.map((t) => t.text)}
        oninput=${EventHandler.target<HTMLInputElement>()((ev) => updateText(ev.target.value))}
        onblur=${EventHandler(() => submit, { capture: true })}
        onkeydown=${EventHandler.target<HTMLInputElement, KeyboardEvent>()((ev) =>
          ev.key === 'Enter' ? submit : Effect.unit,
        )}
      />
    </li>`
  })
