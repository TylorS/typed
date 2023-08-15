import { flow } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Context from '@typed/context'
import * as Fx from '@typed/fx'

import * as Domain from './domain.js'

/* #region Services */

export const ReadTodoList = Context.Fn<() => Effect.Effect<never, never, Domain.TodoList>>()(
  '@typed/TodoApp/ReadTodoList',
)

export const WriteTodoList = Context.Fn<
  (todoList: Domain.TodoList) => Effect.Effect<never, never, void>
>()('@typed/TodoApp/WriteTodoList')

export const CreateTodo = Context.Fn<(text: string) => Effect.Effect<never, never, Domain.Todo>>()(
  '@typed/TodoApp/CreateTodo',
)

export const CurrentFilterState = Context.Ref(
  Effect.succeed<Domain.FilterState>(Domain.FilterState.All),
)('@typed/TodoApp/CurrentViewState')
/* #endregion */

/* #region Model */

export const makeModel = Effect.gen(function* (_) {
  const todoList = yield* _(Fx.makeRefArray(ReadTodoList.apply()))
  const createTodoText = yield* _(Fx.makeRef(Effect.succeed('')))
  const filterState = yield* _(CurrentFilterState.tag)
  const todos = Fx.RefSubject.struct({ list: todoList, state: filterState }).map(
    Domain.filterTodoList,
  )
  const activeCount = todoList.map(Domain.activeCount)
  const completedCount = todoList.map(Domain.completedCount)
  const allAreCompleted = todoList.map(Domain.allAreCompleted)

  return {
    todoList,
    createTodoText,
    filterState,
    todos,
    activeCount,
    completedCount,
    allAreCompleted,
  } as const
})

export type Model = Effect.Effect.Success<typeof makeModel>

/* #endregion */

/* #region Intent */

export function makeIntent(model: Model) {
  return {
    createTodo: makeCreateTodo(model),
    editTodo: makeEditTodo(model),
    toggleTodoCompleted: flow(Domain.toggleCompleted, model.todoList.update),
    deleteTodo: flow(Domain.deleteTodo, model.todoList.update),
    clearCompletedTodos: model.todoList.update(Domain.clearCompleted),
    toggleAllCompleted: model.todoList.update(Domain.toggleAllCompleted),
  } as const
}

export function makeCreateTodo({
  createTodoText,
  todoList,
}: Model): Effect.Effect<
  Context.Tag.Identifier<typeof CreateTodo>,
  never,
  Option.Option<Domain.Todo>
> {
  return Effect.flatMap(createTodoText, (text) =>
    Effect.if(text.trim() === '', {
      onFalse: CreateTodo.apply(text).pipe(
        Effect.tap(todoList.prepend),
        Effect.tap(() => createTodoText.set('')),
        Effect.map(Option.some),
      ),
      onTrue: Effect.succeedNone,
    }),
  )
}

export function makeEditTodo({ todoList }: Model) {
  return (id: Domain.TodoId, text: string) =>
    Effect.if(text.trim() === '', {
      onFalse: todoList.update(Domain.editText(id, text)),
      onTrue: todoList.update(Domain.deleteTodo(id)),
    })
}

export type Intent = ReturnType<typeof makeIntent>

/* #endregion */
