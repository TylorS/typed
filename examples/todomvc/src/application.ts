import * as Effect from '@effect/io/Effect'
import * as Context from '@typed/context'
import * as Fx from '@typed/fx'

import * as Domain from './domain.js'

export const ReadTodoList = Context.Fn<() => Effect.Effect<never, never, Domain.TodoList>>()(
  '@typed/TodoApp/ReadTodoList',
)

export const WriteTodoList = Context.Fn<
  (todoList: Domain.TodoList) => Effect.Effect<never, never, void>
>()('@typed/TodoApp/WriteTodoList')

export const CreateTodo = Context.Fn<(text: string) => Effect.Effect<never, never, Domain.Todo>>()(
  '@typed/TodoApp/CreateTodo',
)

export const CurrentViewState = Context.Ref(Effect.succeed<Domain.ViewState>(Domain.ViewState.All))(
  '@typed/TodoApp/CurrentViewState',
)

export const makeModel = Effect.gen(function* (_) {
  const todoList = yield* _(Fx.makeRef(ReadTodoList.apply()))
  const createTodoText = yield* _(Fx.makeRef(Effect.succeed('')))
  const viewState = yield* _(CurrentViewState.tag)
  const todos = Fx.RefSubject.tuple(todoList, viewState).map((args) =>
    Domain.filterViewState(...args),
  )
  const remainingCount = todoList.map(Domain.remainingCount)
  const completedCount = todoList.map(Domain.completedCount)

  // Write todoList whenever it changes
  yield* _(todoList, Fx.observe(WriteTodoList.apply), Effect.fork)

  return {
    todoList,
    createTodoText,
    viewState,
    todos,
    remainingCount,
    completedCount,
  } as const
})

export type Model = Effect.Effect.Success<typeof makeModel>

export function makeIntent(model: Model) {
  return {
    createTodo: model.createTodoText.pipe(
      Effect.flatMap(CreateTodo.apply),
      Effect.tap((todo) => model.todoList.update((todos) => [...todos, todo])),
      Effect.tap(() => model.createTodoText.set('')),
    ),
    editTodo: (id: Domain.TodoId, text: string) =>
      model.todoList.update((todos) => Domain.editText(todos, id, text)),
    toggleTodoCompletion: (id: Domain.TodoId) =>
      model.todoList.update((todos) => Domain.toggleCompleted(todos, id)),
    deleteTodo: (id: Domain.TodoId) =>
      model.todoList.update((todos) => Domain.deleteTodo(todos, id)),
    clearCompletedTodos: model.todoList.update(Domain.clearCompleted),
  } as const
}

export type Intent = ReturnType<typeof makeIntent>
