// oxlint-disable require-yield
import { Effect } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { component, EventHandler, html, many } from "@typed/template";
import * as App from "./application.js";
import * as Domain from "./domain.js";
import { Link } from "@typed/ui/Link";

const onInput = EventHandler.make((event: InputEvent & { target: HTMLInputElement }) =>
  RefSubject.set(App.TodoText, event.target.value),
);

const onNewTodoKeydown = EventHandler.make((event: KeyboardEvent) =>
  event.key === "Enter" ? App.createTodo : undefined,
);

export const TodoApp = html`<section class="todoapp">
  <header class="header">
    <h1>todos</h1>
    <input
      class="new-todo"
      aria-label="New todo"
      autofocus
      autocomplete="off"
      .value=${App.TodoText}
      oninput=${onInput}
      onkeydown=${onNewTodoKeydown}
      placeholder="What needs to be done?"
    />
  </header>
</section>
<footer class="info">
  <p>Double-click to edit a todo</p>
  <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
</footer>`;
