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

export class FilterState extends RefSubject.Service<FilterState, Domain.FilterState>()(
  "FilterState",
) {}

export class TodoText extends RefSubject.Service<TodoText, string>()("TodoText") {}

export const Todos: RefSubject.Computed<Domain.TodoList, never, TodoList | FilterState> =
  RefSubject.map(
    RefSubject.struct({
      list: TodoList,
      state: FilterState,
    }),
    Domain.filterTodoList,
  );

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

export const editTodo = (
  id: Domain.TodoId,
  text: string,
): Effect.Effect<Domain.TodoList, never, TodoList> =>
  text.trim() === "" ? deleteTodo(id) : RefSubject.update(TodoList, Domain.editText(id, text));

export const toggleTodoCompleted: (
  id: Domain.TodoId,
) => Effect.Effect<Domain.TodoList, never, TodoList> = (id) =>
  RefSubject.update(TodoList, Domain.toggleCompleted(id));

export const deleteTodo: (id: Domain.TodoId) => Effect.Effect<Domain.TodoList, never, TodoList> = (
  id,
) => RefSubject.update(TodoList, Domain.deleteTodo(id));
