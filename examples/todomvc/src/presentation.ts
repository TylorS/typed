import './styles.css'

import * as Predicate from '@effect/data/Predicate'
import * as Effect from '@effect/io/Effect'
import { getIsUsingKeyModifier } from '@typed/dom'
import * as Fx from '@typed/fx'
import { EventHandler, html, many, when } from '@typed/html'
import * as Navigation from '@typed/navigation'

import { Intent, WriteTodoList, makeIntent, makeModel } from './application.js'
import { Todo, ViewState, isCompleted } from './domain.js'
import { viewStateToPath } from './infrastructure.js'

export const TodoApp = Fx.gen(function* (_) {
  const model = yield* _(makeModel)
  const intent = makeIntent(model)

  // Write todoList whenever it changes
  yield* _(model.todoList, Fx.observe(WriteTodoList.apply), Effect.fork)

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
      </form>
    </header>

    <section class="main">
      <input class="toggle-all" type="checkbox" ?checked=${model.allAreCompleted} />
      <label for="toggle-all" onclick=${intent.toggleAllCompleted}>Mark all as complete</label>

      <ul class="todo-list">
        ${many(model.todos, TodoItem(intent), (todo) => todo.id)}
      </ul>

      <footer class="footer">
        <span class="todo-count">
          ${model.activeCount} item${model.activeCount.map((c) => (c === 1 ? '' : 's'))} left
        </span>

        <ul class="filters">
          ${Object.values(ViewState).map(ActionLink(model.viewState))}
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

const ActionLink = (currentViewState: Fx.RefSubject<never, ViewState>) => (viewState: ViewState) =>
  html`<li>
    <a
      class="${when(
        currentViewState,
        (current) => current === viewState,
        () => 'selected',
      )}"
      href=${viewStateToPath(viewState)}
      onclick=${EventHandler.preventDefault.if(Predicate.not(getIsUsingKeyModifier), () =>
        Navigation.navigate(viewStateToPath(viewState)),
      )}
    >
      ${viewState}
    </a>
  </li>`

const TodoItem = (intent: Intent) => (todo: Fx.RefSubject<never, Todo>) =>
  Fx.gen(function* (_) {
    const { id } = yield* _(todo)

    // Track whether this todo is being edited
    const isEditing = yield* _(Fx.makeRef(Effect.succeed(false)))

    // Update the todo's text using the provided RefSubject
    const updateText = (text: string) => todo.update((t) => ({ ...t, text }))

    // Submit the todo when the user is done editing
    const submit = todo.pipe(
      Effect.flatMap((t) => intent.editTodo(t.id, t.text)),
      Effect.flatMap(() => isEditing.set(false)),
    )

    // The current text value
    const text = todo.map((t) => t.text)

    // Computed class names for the todo item
    const completedClassName = when(todo, isCompleted, () => 'completed')
    const editingClassName = when(isEditing, Boolean, () => 'editing')

    return html`<li class="${completedClassName} ${editingClassName}">
      <div class="view">
        <input
          type="checkbox"
          class="toggle"
          .checked=${todo.map(isCompleted)}
          onclick=${intent.toggleTodoCompleted(id)}
        />

        <label ondblclick=${isEditing.set(true)}>${text}</label>

        <button class="destroy" onclick=${intent.deleteTodo(id)}></button>
      </div>

      <input
        class="edit"
        .value=${text}
        oninput=${EventHandler.target<HTMLInputElement>()((ev) => updateText(ev.target.value))}
        onfocusout=${EventHandler(() => submit)}
        onkeydown=${EventHandler.target<HTMLInputElement, KeyboardEvent>()((ev) =>
          ev.key === 'Enter' ? submit : Effect.unit,
        )}
      />
    </li>`
  })
