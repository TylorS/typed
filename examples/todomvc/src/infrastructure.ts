import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as DOM from '@typed/dom'
import { browser } from '@typed/framework/browser'
import * as Route from '@typed/route'
import * as Router from '@typed/router'

import { CreateTodo, CurrentViewState, ReadTodoList, WriteTodoList } from './application.js'
import { TodoId, TodoList, ViewState } from './domain.js'

const todosKey = 'todos'
const storage = DOM.SchemaStorage(({ json }) => ({
  [todosKey]: json(TodoList),
}))
const todos = storage.key(todosKey)

export const TodosLive = Layer.mergeAll(
  ReadTodoList.implement(() =>
    todos.get().pipe(
      Effect.some,
      Effect.catchAll(() => Effect.succeed([])),
    ),
  ),
  WriteTodoList.implement((todoList) =>
    todos.set(todoList).pipe(Effect.catchAll(() => Effect.unit)),
  ),
  CreateTodo.implement((text) =>
    Effect.succeed({
      id: TodoId(crypto.randomUUID()),
      text,
      completed: false,
      timestamp: new Date(),
    }),
  ),
)

const homeRoute = Route.Route('/', { match: { end: true } })
const activeRoute = Route.Route('/active')
const completedRoute = Route.Route('/completed')

const viewStatesToPath = {
  [ViewState.All]: homeRoute.path,
  [ViewState.Active]: activeRoute.path,
  [ViewState.Completed]: completedRoute.path,
}

export const viewStateToPath = (viewState: ViewState) => viewStatesToPath[viewState]

export const ViewStateLive = CurrentViewState.fromFx(
  Router.matchTo(activeRoute, () => ViewState.Active)
    .matchTo(completedRoute, () => ViewState.Completed)
    .matchTo(homeRoute, () => ViewState.All)
    .redirect(homeRoute),
)

export const Live = Layer.provideMerge(browser(window), Layer.mergeAll(TodosLive, ViewStateLive))
