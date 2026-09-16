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

export const createTodo: Effect.Effect<
  Option.Option<Domain.Todo>,
  never,
  CreateTodo | TodoList | TodoText
> = Effect.flatMap(TodoText, (text: string) =>
  text.trim() === ""
    ? Effect.succeed(Option.none<Domain.Todo>())
    : CreateTodo.call(text).pipe(
        Effect.tap((todo) => RefArray.prepend(TodoList, todo)),
        Effect.tap(() => RefSubject.set(TodoText, "")),
        Effect.asSome,
      ),
);
