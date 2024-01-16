import "./styles.css"

import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import * as EventHandler from "@typed/template/EventHandler"
import { many } from "@typed/template/Many"
import { html } from "@typed/template/RenderTemplate"
import { Link } from "@typed/ui/Link"
import { Effect } from "effect"
import * as App from "./application"
import * as Domain from "./domain"
import * as Infra from "./infrastructure"

const onEnterOrEscape = EventHandler.keys(
  "Enter",
  "Escape"
)

const clearCompletedButton = html`<button
  class="clear-completed"
  onclick="${App.clearCompletedTodos}"
>
  Clear completed
</button>`

export const TodoApp = html`<section class="todoapp ${App.FilterState}">
    <header class="header">
      <h1>todos</h1>
      <form class="add-todo" onsubmit=${EventHandler.preventDefault(() => App.createTodo)}>
        <input
          class="new-todo"
          placeholder="What needs to be done?"
          .value="${App.TodoText}"
          oninput="${EventHandler.target<HTMLInputElement>()((ev) => RefSubject.set(App.TodoText, ev.target.value))}"
        />
      </form>
    </header>

    <section class="main">
      <input class="toggle-all" type="checkbox" ?checked="${App.AllAreCompleted}" ?indeterminate="${App.SomeAreCompleted}" />
      <label for="toggle-all" onclick="${App.toggleAllCompleted}">Mark all as complete</label>

      <ul class="todo-list">
        ${many(App.Todos, (todo) => todo.id, TodoItem)}
      </ul>

      <footer class="footer">
        <span class="todo-count">
          ${App.ActiveCount} item${RefSubject.map(App.ActiveCount, (c) => (c === 1 ? "" : "s"))} left
        </span>

        <ul class="filters">
          ${Object.values(Domain.FilterState).map(FilterLink)}
        </ul>

        ${
  Fx.if(
    App.SomeAreCompleted,
    {
      onTrue: clearCompletedButton,
      onFalse: Fx.succeed(null)
    }
  )
}
      </footer>
    </section>
  </section>`

function TodoItem(todo: RefSubject.RefSubject<never, never, Domain.Todo>, id: Domain.TodoId) {
  return Fx.genScoped(function*(_) {
    // Track whether this todo is being edited
    const isEditing = yield* _(RefSubject.of(false))

    // Track whether the todo is marked as completed
    const isCompleted = RefSubject.map(todo, Domain.isCompleted)

    // the current text
    const text = RefSubject.map(todo, (t) => t.text)

    // Update the todo's text
    const updateText = (text: string) => RefSubject.update(todo, Domain.updateText(text))

    // Reset the todo's text to the text value before editing it
    const reset = RefSubject.delete(todo).pipe(Effect.zipLeft(RefSubject.set(isEditing, false)))

    // Submit the todo when the user is done editing
    const submit = text.pipe(
      Effect.flatMap((t) => App.editTodo(id, t)),
      Effect.zipRight(reset)
    )

    return html`<li class="${Fx.when(isCompleted, { onTrue: "completed", onFalse: "" })} ${
      Fx.when(isEditing, { onTrue: "editing", onFalse: "" })
    }">
      <div class="view">
        <input
          type="checkbox"
          class="toggle"
          ?checked="${isCompleted}"
          onclick="${App.toggleTodoCompleted(id)}"
        />

        <label ondblclick="${RefSubject.update(isEditing, (x) => !x)}">${text}</label>

        <button class="destroy" onclick="${App.deleteTodo(id)}"></button>
      </div>

      <input
        class="edit"
        .value="${text}"
        oninput="${EventHandler.target<HTMLInputElement>()((ev) => updateText(ev.target.value))}"
        onfocusout="${EventHandler.make(() => submit)}"
        onkeydown="${onEnterOrEscape((ev) => (ev.key === "Enter" ? submit : reset))}"
      />
    </li>`
  })
}

function FilterLink(filterState: Domain.FilterState) {
  return html`<li>
    ${
    Link(
      {
        className: Fx.when(RefSubject.map(App.FilterState, (state) => state === filterState), {
          onTrue: "selected",
          onFalse: ""
        }),
        to: Infra.filterStateToPath(filterState)
      },
      filterState
    )
  }
  </li>`
}
