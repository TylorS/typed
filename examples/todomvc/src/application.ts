import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as ParseResult from '@effect/schema/ParseResult'
import * as Context from '@typed/context'
import * as Fx from '@typed/fx'

import * as D from './domain.js'

export const ReadTodoList =
  Context.Fn<
    () => Effect.Effect<never, ParseResult.ParseError | Cause.NoSuchElementException, D.TodoList>
  >()('ReadTodoList')

export const WriteTodoList =
  Context.Fn<(todoList: D.TodoList) => Effect.Effect<never, never, void>>()('WriteTodoList')

export const CreateTodo =
  Context.Fn<(text: string) => Effect.Effect<never, never, D.Todo>>()('CreateTodo')

export const TodoRepository = Context.repository({
  read: ReadTodoList,
  write: WriteTodoList,
  create: CreateTodo,
})

export const CurrentViewState = Context.Ref(Effect.succeed<D.ViewState>(D.ViewState.All))(
  'CurrentViewState',
)

export const makeModel = Effect.gen(function* (_) {
  const todoList = yield* _(Fx.makeRefArray(ReadTodoList.apply()))
  const createTodoText = yield* _(Fx.makeRef(Effect.succeed('')))
  const viewState = yield* _(CurrentViewState.tag)
  const todos = Fx.RefSubject.tuple(todoList, viewState).map((args) => D.filterViewState(...args))

  // Write todoList whenever it changes
  yield* _(todoList, Fx.observe(WriteTodoList.apply), Effect.fork)

  return {
    todoList,
    createTodoText,
    viewState,
    todos,
  } as const
})

export type Model = Effect.Effect.Success<typeof makeModel>

export const makeIntent = (model: Model) =>
  ({
    createTodo: model.createTodoText.pipe(
      Effect.flatMap(CreateTodo.apply),
      Effect.flatMap((todo) => model.todoList.append(todo)),
    ),
    editTodo: (id: D.TodoId, text: string) =>
      model.todoList.update((todos) => D.editText(todos, id, text)),
    toggleTodoCompletion: (id: D.TodoId) =>
      model.todoList.update((todos) => D.toggleCompleted(todos, id)),
    deleteTodo: (id: D.TodoId) => model.todoList.update((todos) => D.deleteTodo(todos, id)),
    clearCompletedTodos: model.todoList.update(D.clearCompleted),
  }) as const

export type Intent = ReturnType<typeof makeIntent>
