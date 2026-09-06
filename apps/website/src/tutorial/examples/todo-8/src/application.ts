import { Context, Effect } from "effect";
import { RefArray, RefSubject } from "@typed/fx";
import * as Domain from "./domain.js";

// Layers supply these cells, so each application or test can own fresh state.
export class TodoList extends RefSubject.Service<TodoList, Domain.TodoList>()("TodoList") {}
export class FilterState extends RefSubject.Service<FilterState, Domain.FilterState>()(
  "FilterState",
) {}
export class TodoText extends RefSubject.Service<TodoText, string>()("TodoText") {}
export class CreateTodo extends Context.Service<
  CreateTodo,
  (text: string) => Effect.Effect<Domain.Todo>
>()("CreateTodo") {}

// Filtering changes the view, leaving hidden items in the committed list.
export const Todos = RefSubject.map(
  RefSubject.struct({ list: TodoList, state: FilterState }),
  Domain.filterTodoList,
);

// Count the full list even when the current filter hides some rows.
export const ActiveCount = RefSubject.map(TodoList, Domain.activeCount);
export const SomeAreCompleted = RefSubject.map(TodoList, Domain.someAreCompleted);
export const AllAreCompleted = RefSubject.map(TodoList, Domain.allAreCompleted);

export const createTodo = Effect.gen(function* () {
  const text = yield* TodoText;
  if (text.trim() === "") return;
  const create = yield* CreateTodo;
  // Commit a complete item before clearing the draft; a failed factory preserves input.
  yield* RefArray.prepend(TodoList, yield* create(text.trim()));
  yield* RefSubject.set(TodoText, "");
});

export const editTodo = (id: Domain.TodoId, text: string) =>
  text.trim() === ""
    ? deleteTodo(id)
    : RefSubject.update(TodoList, Domain.editText(id, text.trim()));

export const toggleTodoCompleted = (id: Domain.TodoId) =>
  RefSubject.update(TodoList, Domain.toggleCompleted(id));

export const deleteTodo = (id: Domain.TodoId) => RefSubject.update(TodoList, Domain.deleteTodo(id));

export const clearCompletedTodos = RefSubject.update(TodoList, Domain.clearCompleted);
export const toggleAllCompleted = RefSubject.update(TodoList, Domain.toggleAllCompleted);
