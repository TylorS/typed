import { Context, Effect } from "effect";
import { RefSubject } from "@typed/fx";
import * as Domain from "./domain.js";

// Layers supply these cells, so each application or test can own fresh state.
export class TodoList extends RefSubject.Service<TodoList, Domain.TodoList>()("TodoList") {}
export class TodoText extends RefSubject.Service<TodoText, string>()("TodoText") {}
export class CreateTodo extends Context.Service<
  CreateTodo,
  (text: string) => Effect.Effect<Domain.Todo>
>()("CreateTodo") {}
