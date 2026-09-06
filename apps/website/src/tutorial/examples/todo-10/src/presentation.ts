import { Effect } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { EventHandler, html, many } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as App from "./application.js";
import * as Domain from "./domain.js";
import { Link } from "@typed/ui/Link";

const TodoItem = component(function* (todo: RefSubject.RefSubject<Domain.Todo>, id: Domain.TodoId) {
  // A keyed row owns its draft until that item is hidden or removed.
  const editing = yield* RefSubject.make(false);
  const draft = yield* RefSubject.make("");
  const text = RefSubject.map(todo, (value) => value.text);
  const completed = RefSubject.map(todo, (value) => value.completed);
  const begin = text.pipe(
    Effect.flatMap((value) => RefSubject.set(draft, value)),
    Effect.flatMap(() => RefSubject.set(editing, true)),
  );
  // Only Save writes committed text, so Cancel needs no rollback.
  const cancel = RefSubject.set(editing, false);
  const save = draft.pipe(
    Effect.flatMap((value) => App.editTodo(id, value)),
    Effect.flatMap(() => cancel),
  );
  const editor = Fx.if(editing, {
    onTrue: html`<form
      class="edit-form"
      onsubmit=${EventHandler.make(() => save, { preventDefault: true })}
    >
      <input
        class="edit"
        aria-label="Edit todo"
        .value=${draft}
        oninput=${EventHandler.make((event: InputEvent & { target: HTMLInputElement }) =>
          RefSubject.set(draft, event.target.value),
        )}
        onkeydown=${EventHandler.make((event: KeyboardEvent) => (event.key === "Escape" ? cancel : undefined))}
      />
      <button type="submit">Save</button>
      <button type="button" onclick=${cancel}>Cancel</button>
    </form>`,
    onFalse: html`<div class="view">
      <input
        class="toggle"
        type="checkbox"
        aria-label="Complete ${text}"
        ?checked=${completed}
        onchange=${App.toggleTodoCompleted(id)}
      />
      <label ondblclick=${begin}>${text}</label>
      <button
        class="edit-trigger"
        type="button"
        aria-label="Edit ${text}"
        onclick=${begin}
      >
        Edit
      </button>
      <button
        class="destroy"
        type="button"
        aria-label="Delete ${text}"
        onclick=${App.deleteTodo(id)}
      >
        ×
      </button>
    </div>`,
  });
  return html`<li
    class="${Fx.when(completed, { onTrue: "completed", onFalse: "" })} ${Fx.when(editing, { onTrue: "editing", onFalse: "" })}"
  >
    ${editor}
  </li>`;
});

// Read browser edits here; the .value binding also reflects resets from the action.
const onInput = EventHandler.make((event: InputEvent & { target: HTMLInputElement }) =>
  RefSubject.set(App.TodoText, event.target.value),
);
// The shell binds existing state and actions; it needs no component-local setup.
export const TodoApp = html`<section class="todoapp">
  <header class="header">
    <h1>todos</h1>
    <form
      class="add-todo"
      onsubmit=${EventHandler.make(() => App.createTodo, { preventDefault: true })}
    >
      <input
        class="new-todo"
        aria-label="New todo"
        autocomplete="off"
        .value=${App.TodoText}
        oninput=${onInput}
        placeholder="What needs to be done?"
      />
      <button type="submit" class="add-todo-button">Add todo</button>
    </form>
  </header>
  <section class="main">
    <label class="toggle-all-label"><input
        class="toggle-all"
        type="checkbox"
        ?checked=${App.AllAreCompleted}
        onchange=${App.toggleAllCompleted}
      />
      Mark all complete</label>
    <ul class="todo-list">
      ${many(App.Todos, (todo) => todo.id, TodoItem)}
    </ul>
    <footer class="footer">
      <span class="todo-count">${App.ActiveCount}
        ${RefSubject.map(App.ActiveCount, (count) => (count === 1 ? "item" : "items"))}
        left</span>
      <ul class="filters">
        ${Domain.FilterState.literals.map(
          (filter) =>
            html`<li>
            ${Link({
              href: filter === "all" ? "/" : "/" + filter,
              content: filter[0]!.toUpperCase() + filter.slice(1),
              class: Fx.when(
                RefSubject.map(App.FilterState, (current) => current === filter),
                { onTrue: "selected", onFalse: "" },
              ),
            })}
          </li>`,
        )}
      </ul>
      ${Fx.if(App.SomeAreCompleted, {
        onTrue: html`<button
          class="clear-completed"
          type="button"
          onclick=${App.clearCompletedTodos}
        >
          Clear completed
        </button>`,
        onFalse: Fx.null,
      })}
    </footer>
  </section>
</section>`;
