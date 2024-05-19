import { Context, RefArray, RefSubject } from "@typed/core"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import * as Domain from "./domain"

/* #region Services */

export const CreateTodo = Context.Fn<(text: string) => Effect.Effect<Domain.Todo>>()("CreateTodo")
export type CreateTodo = Context.Fn.Context<typeof CreateTodo>

/* #endregion */

/* #region Model */

export const TodoList = RefSubject.tagged<Domain.TodoList>()("TodoList")
export type TodoList = RefSubject.Identifier<typeof TodoList>

export const FilterState = RefSubject.tagged<Domain.FilterState>()("FilterState")
export type FilterState = RefSubject.Identifier<typeof FilterState>

export const TodoText = RefSubject.tagged<string>()("TodoText")
export type TodoText = RefSubject.Identifier<typeof TodoText>

export const Todos: RefSubject.Computed<Domain.TodoList, never, TodoList | FilterState> = RefSubject.map(
  RefSubject.struct({
    list: TodoList,
    state: FilterState
  }),
  Domain.filterTodoList
)

export const ActiveCount: RefSubject.Computed<number, never, TodoList> = RefSubject.map(TodoList, Domain.activeCount)

export const SomeAreCompleted: RefSubject.Computed<boolean, never, TodoList> = RefSubject.map(
  TodoList,
  Domain.someAreCompleted
)

export const AllAreCompleted: RefSubject.Computed<boolean, never, TodoList> = RefSubject.map(
  TodoList,
  Domain.allAreCompleted
)

/* #endregion */

/* #region Intent */

export const createTodo: Effect.Effect<Option.Option<Domain.Todo>, never, CreateTodo | TodoList | TodoText> = Effect
  .flatMap(TodoText, (text) =>
    Effect.if(text.trim() === "", {
      onFalse: () =>
        CreateTodo(text).pipe(
          Effect.tap((todo) => RefArray.prepend(TodoList, todo)),
          Effect.tap(() => RefSubject.set(TodoText, "")),
          Effect.asSome
        ),
      onTrue: () => Effect.succeed(Option.none<Domain.Todo>())
    }))

export const editTodo = (id: Domain.TodoId, text: string): Effect.Effect<Domain.TodoList, never, TodoList> =>
  Effect.if(text.trim() === "", {
    onFalse: () => RefSubject.update(TodoList, Domain.editText(id, text)),
    onTrue: () => RefSubject.update(TodoList, Domain.deleteTodo(id))
  })

export const toggleTodoCompleted: (id: Domain.TodoId) => Effect.Effect<Domain.TodoList, never, TodoList> = (id) =>
  RefSubject.update(TodoList, Domain.toggleCompleted(id))

export const deleteTodo: (id: Domain.TodoId) => Effect.Effect<Domain.TodoList, never, TodoList> = (id) =>
  RefSubject.update(TodoList, Domain.deleteTodo(id))

export const clearCompletedTodos: Effect.Effect<Domain.TodoList, never, TodoList> = RefSubject.update(
  TodoList,
  Domain.clearCompleted
)

export const toggleAllCompleted: Effect.Effect<Domain.TodoList, never, TodoList> = RefSubject.update(
  TodoList,
  Domain.toggleAllCompleted
)

/* #endregion */
