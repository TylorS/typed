import * as Context from "@typed/context"
import * as RefArray from "@typed/fx/RefArray"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"

import * as Domain from "./domain"

/* #region Services */

export const CreateTodo = Context.Fn<(text: string) => Effect.Effect<never, never, Domain.Todo>>()("CreateTodo")
export type CreateTodo = Context.Fn.Context<typeof CreateTodo>

/* #endregion */

/* #region Model */

export const TodoList = RefSubject.tagged<never, Domain.TodoList>()("TodoList")
export type TodoList = RefSubject.Context<typeof TodoList>

export const FilterState = RefSubject.tagged<never, Domain.FilterState>()("FilterState")
export type FilterState = RefSubject.Context<typeof FilterState>

export const TodoText = RefSubject.tagged<never, string>()("TodoText")
export type TodoText = RefSubject.Context<typeof TodoText>

export const Todos: RefSubject.Computed<TodoList | FilterState, never, Domain.TodoList> = RefSubject.map(
  RefSubject.struct({
    list: TodoList,
    state: FilterState
  }),
  Domain.filterTodoList
)

export const ActiveCount: RefSubject.Computed<TodoList, never, number> = RefSubject.map(TodoList, Domain.activeCount)

export const SomeAreCompleted: RefSubject.Computed<TodoList, never, boolean> = RefSubject.map(
  TodoList,
  Domain.someAreCompleted
)

export const AllAreCompleted: RefSubject.Computed<TodoList, never, boolean> = RefSubject.map(
  TodoList,
  Domain.allAreCompleted
)

/* #endregion */

/* #region Intent */

export const createTodo: Effect.Effect<CreateTodo | TodoList | TodoText, never, Option.Option<Domain.Todo>> = Effect
  .flatMap(TodoText, (text) =>
    Effect.if(text.trim() === "", {
      onFalse: CreateTodo.apply(text).pipe(
        Effect.tap((todo) => RefArray.prepend(TodoList, todo)),
        Effect.tap(() => RefSubject.set(TodoText, "")),
        Effect.asSome
      ),
      onTrue: Effect.succeed(Option.none<Domain.Todo>())
    }))

export const editTodo = (id: Domain.TodoId, text: string): Effect.Effect<TodoList, never, Domain.TodoList> =>
  Effect.if(text.trim() === "", {
    onFalse: RefSubject.update(TodoList, Domain.editText(id, text)),
    onTrue: RefSubject.update(TodoList, Domain.deleteTodo(id))
  })

export const toggleTodoCompleted: (id: Domain.TodoId) => Effect.Effect<TodoList, never, Domain.TodoList> = (id) =>
  RefSubject.update(TodoList, Domain.toggleCompleted(id))

export const deleteTodo: (id: Domain.TodoId) => Effect.Effect<TodoList, never, Domain.TodoList> = (id) =>
  RefSubject.update(TodoList, Domain.deleteTodo(id))

export const clearCompletedTodos: Effect.Effect<TodoList, never, Domain.TodoList> = RefSubject.update(
  TodoList,
  Domain.clearCompleted
)

export const toggleAllCompleted: Effect.Effect<TodoList, never, Domain.TodoList> = RefSubject.update(
  TodoList,
  Domain.toggleAllCompleted
)

/* #endregion */
