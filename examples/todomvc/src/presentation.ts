import "./styles.css"

import * as Fx from "@typed/fx/Fx"
import * as Bool from "@typed/fx/RefBoolean"
import type * as RefSubject from "@typed/fx/RefSubject"
import type { RenderEvent, RenderTemplate } from "@typed/template"
import { html, many } from "@typed/template"
import * as EventHandler from "@typed/template/EventHandler"
import type { Scope } from "effect"
import { Effect, flow } from "effect"
import * as App from "./application"
import * as Domain from "./domain"
import * as Infra from "./infrastructure"

const onEnterOrEscape = EventHandler.keys(
  "Enter",
  "Escape"
)

export const TodoApp: Fx.Fx<
  App.CreateTodo | App.TodoList | App.TodoText | RenderTemplate | Scope.Scope,
  never,
  RenderEvent
> = html`<section class="todoapp ${App.FilterState}">
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
      <input class="toggle-all" type="checkbox" ?checked=${App.AllAreCompleted} ?indeterminate=${App.SomeAreCompleted} />
      <label for="toggle-all" onclick=${App.toggleAllCompleted}>Mark all as complete</label>

      <ul class="todo-list">
        ${many(App.Todos, (todo) => todo.id, TodoItem)}
      </ul>

      <footer class="footer">
        <span class="todo-count">
          ${App.ActiveCount} item${App.ActiveCount.map((c) => (c === 1 ? "" : "s"))} left
        </span>

        <ul class="filters">
          ${Object.values(Domain.FilterState).map(FilterLink)}
        </ul>

        ${
  Fx.if(
    App.SomeAreCompleted,
    html`<button class="clear-completed" onclick=${App.clearCompletedTodos}>Clear completed</button>`,
    Fx.succeed(null)
  )
}
      </footer>
    </section>
  </section>`

function TodoItem(todo: RefSubject.RefSubject<never, never, Domain.Todo>, id: Domain.TodoId) {
  return Fx.genScoped(function*(_) {
    // Track whether this todo is being edited
    const isEditing = yield* _(Bool.make(Effect.succeed(false)))

    // Track whether the todo is marked as completed
    const isCompleted = todo.map(Domain.isCompleted)

    // the current text
    const text = todo.map((t) => t.text)

    // Update the todo's text
    const updateText = flow(Domain.updateText, todo.update)

    // Submit the todo when the user is done editing
    const submit = todo.pipe(
      Effect.flatMap((t) => App.editTodo(t.id, t.text)),
      Effect.flatMap(() => isEditing.set(false))
    )

    // Reset the todo's text to the text value before editing it
    const reset = todo.delete.pipe(Effect.zipRight(isEditing.set(false)))

    return html`<li class="${Fx.when(isCompleted, "completed", "")} ${Fx.when(isEditing, "editing", "")}">
      <div class="view">
        <input
          type="checkbox"
          class="toggle"
          .checked=${isCompleted}
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
    </li>`
  })
}

function FilterLink(filterState: Domain.FilterState) {
  return html`<li>
    <a
      class="${Fx.when(App.FilterState.map((state) => state === filterState), "selected", "")}" 
      href="${Infra.filterStateToPath(filterState)}">${filterState}
    </a>
  </li>`
}
