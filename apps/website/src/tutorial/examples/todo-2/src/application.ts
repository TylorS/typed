import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Context from "effect/Context";
import { RefArray, RefSubject } from "@typed/fx";
import * as Domain from "./domain.js";

export class CreateTodo extends Context.Service<
  CreateTodo,
  (text: string) => Effect.Effect<Domain.Todo>
>()("CreateTodo") {
  static readonly call = (text: string) =>
    Effect.flatMap(CreateTodo, (createTodo) => createTodo(text));
}

export class TodoList extends RefSubject.Service<TodoList, Domain.TodoList>()("TodoList") {}

export class TodoText extends RefSubject.Service<TodoText, string>()("TodoText") {}
