import * as Context from "@typed/context"
import * as Computed from "@typed/fx/Computed"
import * as RefArray from "@typed/fx/RefArray"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Effect from "effect/Effect"
import { flow } from "effect/Function"
import * as Option from "effect/Option"

import * as Domain from "./domain"

/* #region Services */

export const CreateTodo = Context.Fn<(text: string) => Effect.Effect<never, never, Domain.Todo>>()("CreateTodo")
export type CreateTodo = Context.Fn.Context<typeof CreateTodo>

/* #endregion */

/* #region Model */

export const TodoList = RefSubject.tagged<Domain.TodoList>()("TodoList")
export type TodoList = RefSubject.Context<typeof TodoList>

export const FilterState = RefSubject.tagged<Domain.FilterState>()("FilterState")
export type FilterState = RefSubject.Context<typeof FilterState>

export const TodoText = RefSubject.tagged<string>()("TodoText")
export type TodoText = RefSubject.Context<typeof TodoText>

export const Todos: Computed.Computed<never, never, Domain.TodoList> = Computed.struct({
  list: TodoList,
  state: FilterState
})
  .map(Domain.filterTodoList)

export const ActiveCount: Computed.Computed<TodoList, never, number> = TodoList.map(Domain.activeCount)

export const SomeAreCompleted: Computed.Computed<TodoList, never, boolean> = TodoList.map((list) =>
  Domain.completedCount(list) > 0
)

export const AllAreCompleted: Computed.Computed<TodoList, never, boolean> = TodoList.map(Domain.allAreCompleted)

/* #endregion */

/* #region Intent */

export const createTodo: Effect.Effect<CreateTodo | TodoList | TodoText, never, Option.Option<Domain.Todo>> = Effect
  .flatMap(TodoText, (text) =>
    Effect.if(text.trim() === "", {
      onFalse: CreateTodo.apply(text).pipe(
        Effect.tap((todo) => RefArray.prepend(TodoList, todo)),
        Effect.tap(() => TodoText.set("")),
        Effect.asSome
      ),
      onTrue: Effect.succeed(Option.none<Domain.Todo>())
    }))

export const editTodo = (id: Domain.TodoId, text: string): Effect.Effect<TodoList, never, Domain.TodoList> =>
  Effect.if(text.trim() === "", {
    onFalse: TodoList.update(Domain.editText(id, text)),
    onTrue: TodoList.update(Domain.deleteTodo(id))
  })

export const toggleTodoCompleted: (id: Domain.TodoId) => Effect.Effect<TodoList, never, Domain.TodoList> = flow(
  Domain.toggleCompleted,
  TodoList.update
)

export const deleteTodo: (id: Domain.TodoId) => Effect.Effect<TodoList, never, Domain.TodoList> = flow(
  Domain.deleteTodo,
  TodoList.update
)

export const clearCompletedTodos: Effect.Effect<TodoList, never, Domain.TodoList> = TodoList.update(
  Domain.clearCompleted
)

export const toggleAllCompleted: Effect.Effect<TodoList, never, Domain.TodoList> = TodoList.update(
  Domain.toggleAllCompleted
)

/* #endregion */
