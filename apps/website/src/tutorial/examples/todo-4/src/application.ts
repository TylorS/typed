import { Context, Effect } from "effect";
import { RefArray, RefSubject } from "@typed/fx";
import * as Domain from "./domain.js";

// Layers supply these cells, so each application or test can own fresh state.
export class TodoList extends RefSubject.Service<TodoList, Domain.TodoList>()("TodoList") {}
export class TodoText extends RefSubject.Service<TodoText, string>()("TodoText") {}
export class CreateTodo extends Context.Service<
  CreateTodo,
  (text: string) => Effect.Effect<Domain.Todo>
>()("CreateTodo") {}

export const createTodo = Effect.gen(function* () {
  const text = yield* TodoText;
  if (text.trim() === "") return;
  const create = yield* CreateTodo;
  // Commit a complete item before clearing the draft; a failed factory preserves input.
  yield* RefArray.prepend(TodoList, yield* create(text.trim()));
  yield* RefSubject.set(TodoText, "");
});
