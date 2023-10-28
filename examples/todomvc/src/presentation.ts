import "./styles.css"

import * as Fx from "@typed/fx/Fx"
import * as Bool from "@typed/fx/RefBoolean"
import type { RefSubject } from "@typed/fx/RefSubject"
import * as EventHandler from "@typed/template/EventHandler"
import type { RenderEvent } from "@typed/template/RenderEvent"
import type { RenderTemplate } from "@typed/template/RenderTemplate"
import { html } from "@typed/template/RenderTemplate"
import { Effect } from "effect"
import * as App from "./application"
import * as Domain from "./domain"
import { Live } from "./infrastructure"

const filterClasses = (filterState: Domain.FilterState) =>
  App.FilterState.map((state) => state === filterState ? "selected" : "")

const FilterLink = (filterState: Domain.FilterState) =>
  html`<li>
        <a
          class="${filterClasses(filterState)}" 
          href="${`#${filterState}`}"
        >
          ${filterState}
        </a>
      </li>`

const onEnterOrEscape = EventHandler.keys(
  "Enter",
  "Escape"
)

const TodoItem = (todo: RefSubject<never, never, Domain.Todo>, id: Domain.TodoId) =>
  Fx.genScoped(function*(_) {
    // Track whether this todo is being edited
    const isEditing = yield* _(Bool.make(Effect.succeed(false)))

    // Update the todo's text using the provided RefSubject
    const updateText = (text: string) => todo.update((t) => ({ ...t, text }))

    // Submit the todo when the user is done editing
    const submit = todo.pipe(
      Effect.flatMap((t) => App.editTodo(t.id, t.text)),
      Effect.flatMap(() => isEditing.set(false))
    )

    // Reset the todo's text to the current text value
    const reset = todo.delete.pipe(Effect.zipRight(isEditing.set(false)))

    // The current text value
    const text = todo.map((t) => t.text)

    return yield* _(html`<li
      class="${todo.map((t) => Domain.isCompleted(t) ? "completed" : "")} ${isEditing.map((b) => b ? "editing" : "")}"
    >
      <div class="view">
        <input
          type="checkbox"
          class="toggle"
          .checked=${todo.map(Domain.isCompleted)}
          onclick=${App.toggleTodoCompleted(id)}
        />

        <label ondblclick=${isEditing.set(true)}>${text}</label>

        <button class="destroy" onclick=${App.deleteTodo(id)}></button>
      </div>

      <input
        class="edit"
        .value=${text}
        oninput=${EventHandler.target<HTMLInputElement>()((ev) => updateText(ev.target.value))}
        onfocusout=${EventHandler.make(() => submit)}
        onkeydown=${onEnterOrEscape((ev) => (ev.key === "Enter" ? submit : reset))}
      />
    </li>`)
  })

export const TodoApp: Fx.Fx<RenderTemplate, never, RenderEvent> = Fx.genScoped(function*(_) {
  return yield* _(html`<section class="todoapp ${App.FilterState}">
    <header class="header">
      <h1>todos</h1>
      <form class="add-todo" onsubmit=${EventHandler.preventDefault(() => App.createTodo)}>
        <input
          class="new-todo"
          placeholder="What needs to be done?"
          .value=${App.TodoText}
          oninput=${EventHandler.target<HTMLInputElement>()((ev) => App.TodoText.set(ev.target.value))}
        />
      </form>
    </header>

    <section class="main">
      <input class="toggle-all" type="checkbox" ?checked=${App.AllAreCompleted} />
      <label for="toggle-all" onclick=${App.toggleAllCompleted}>Mark all as complete</label>

      <ul class="todo-list">
        ${Fx.keyed(App.Todos, TodoItem, (todo) => todo.id)}
      </ul>

      <footer class="footer">
        <span class="todo-count">
          ${App.ActiveCount} item${App.ActiveCount.map((c) => (c === 1 ? "" : "s"))} left
        </span>

        <ul class="filters">
          ${Object.values(Domain.FilterState).map((state) => FilterLink(state))}
        </ul>

         ${
    Fx.switchLatest(
      App.CompletedCount.map((count) =>
        count > 0 ?
          Fx.fromFxEffect(html`<button class="clear-completed" onclick=${App.clearCompletedTodos}>
            Clear completed
          </button>`) :
          Fx.succeed(null)
      )
    )
  }
      </footer>
    </section>
  </section>`)
}).pipe(
  Fx.provide(Live)
)
