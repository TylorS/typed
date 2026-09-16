// oxlint-disable require-yield
import { Effect } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { component, EventHandler, html, many } from "@typed/template";
import * as App from "./application.js";
import * as Domain from "./domain.js";


const HasTodos = RefSubject.map(App.TodoList, (list) => list.length > 0).pipe(Fx.skipRepeats);

const TodoItem = component(function* (todo: RefSubject.RefSubject<Domain.Todo>, id: Domain.TodoId) {
  const editing = yield* RefSubject.make(false);
  const draft = yield* RefSubject.make("");

  const text = RefSubject.map(todo, (value) => value.text);
  const completed = RefSubject.map(todo, (value) => value.completed);

  const begin = text.pipe(
    Effect.flatMap((value) => RefSubject.set(draft, value)),
    Effect.flatMap(() => RefSubject.set(editing, true)),
  );
  const cancel = RefSubject.set(editing, false);
  const save = draft.pipe(
    Effect.flatMap((value) => App.editTodo(id, value)),
    Effect.flatMap(() => cancel),
  );

  return html`<li
    class="${Fx.when(completed, { onTrue: "completed", onFalse: "" })} ${Fx.when(editing, { onTrue: "editing", onFalse: "" })}"
  >
    <div class="view">
      <input
        class="toggle"
        type="checkbox"
        aria-label="Complete ${text}"
        ?checked=${completed}
        onchange=${App.toggleTodoCompleted(id)}
      />
      <label ondblclick=${begin}>${text}</label>
      <button
        class="destroy"
        type="button"
        aria-label="Delete ${text}"
        onclick=${App.deleteTodo(id)}
      ></button>
    </div>
    <input
      class="edit"
      aria-label="Edit todo"
      .value=${draft}
      oninput=${EventHandler.make((event: InputEvent & { target: HTMLInputElement }) =>
        RefSubject.set(draft, event.target.value),
      )}
      onblur=${EventHandler.make(
        () => Effect.flatMap(editing, (isEditing) => (isEditing ? save : Effect.void)),
        { capture: true },
      )}
      onkeydown=${EventHandler.make((event: KeyboardEvent) => {
        if (event.key === "Escape") return cancel;
        if (event.key === "Enter") return save;

        return undefined;
      })}
    />
  </li>`;
});

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
  ${Fx.if(HasTodos, {
    onTrue: html`<section class="main">
      <ul class="todo-list">
        ${many(App.Todos, (todo) => todo.id, TodoItem)}
      </ul>
    </section>
`,
    onFalse: Fx.null,
  })}
</section>
<footer class="info">
  <p>Double-click to edit a todo</p>
  <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
</footer>`;
