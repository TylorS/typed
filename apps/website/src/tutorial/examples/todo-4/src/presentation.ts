import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import * as App from "./application.js";

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
</section>`;
