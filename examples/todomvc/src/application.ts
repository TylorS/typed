import * as Context from "@typed/context"
import * as M from "@typed/fx/Model"
import * as RefArray from "@typed/fx/RefArray"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Effect from "effect/Effect"
import { flow } from "effect/Function"
import * as Option from "effect/Option"

import * as Domain from "./domain"

/* #region Services */

export const CreateTodo = Context.Fn<(text: string) => Effect.Effect<never, never, Domain.Todo>>()(
  (_) => class CreateTodo extends _("@typed/TodoApp/CreateTodo") {}
)

/* #endregion */

/* #region Model */

export const TodoList = RefArray.tagged<never, Domain.Todo>()((_) =>
  class TodoList extends _("@typed/todomvc/TodoList") {}
)

export const FilterState = RefSubject.tagged<never, Domain.FilterState>()((_) =>
  class FilterState extends _("@typed/TodoApp/FilterState") {}
)

export const TodoText = RefSubject.tagged<never, string>()((_) =>
  class TodoText extends _("@typed/TodoApp/TodoText") {}
)

export const Todos = M.tagged({ list: TodoList, state: FilterState }).map(Domain.filterTodoList)

export const ActiveCount = TodoList.map(Domain.activeCount)

export const CompletedCount = TodoList.map(Domain.completedCount)

export const AllAreCompleted = TodoList.map(Domain.allAreCompleted)

/* #endregion */

/* #region Intent */

export const createTodo = Effect.flatMap(TodoText, (text) =>
  Effect.if(text.trim() === "", {
    onFalse: Effect.asSome(CreateTodo.apply(text)),
    onTrue: Effect.succeed(Option.none())
  }))

export const editTodo = (id: Domain.TodoId, text: string) =>
  Effect.if(text.trim() === "", {
    onFalse: TodoList.update(Domain.editText(id, text)),
    onTrue: TodoList.update(Domain.deleteTodo(id))
  })

export const toggleTodoCompleted = flow(Domain.toggleCompleted, TodoList.update)

export const deleteTodo = flow(Domain.deleteTodo, TodoList.update)

export const clearCompletedTodos = TodoList.update(Domain.clearCompleted)

export const toggleAllCompleted = TodoList.update(Domain.toggleAllCompleted)

/* #endregion */
