import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as ParseResult from '@effect/schema/ParseResult'
import * as Schema from '@effect/schema/Schema'
import * as DOM from '@typed/dom'
import { browser } from '@typed/framework/browser'
import * as Fx from '@typed/fx'
import * as Route from '@typed/route'
import * as Router from '@typed/router'

import { CreateTodo, CurrentViewState, ReadTodoList, WriteTodoList } from './application.js'
import { TodoId, TodoList, ViewState } from './domain.js'

const parseJson = <I, A>(schema: Schema.Schema<I, A>) =>
  Schema.transformResult(
    Schema.string,
    schema,
    (s, options) => {
      try {
        return Schema.parseResult(Schema.from(schema))(JSON.parse(s), options)
      } catch {
        return ParseResult.failure(ParseResult.type(schema.ast, s))
      }
    },
    (i) => ParseResult.success(JSON.stringify(i)),
  )

const todosKey = 'todos'
const storage = DOM.SchemaStorage({
  [todosKey]: parseJson(TodoList),
})

export const TodosLive = Layer.mergeAll(
  ReadTodoList.implement(() =>
    storage.get(todosKey).pipe(
      Effect.tap(Effect.log),
      Effect.some,
      Effect.catchAll(() => Effect.succeed([])),
    ),
  ),
  WriteTodoList.implement((todoList) =>
    storage.set(todosKey, todoList).pipe(Effect.catchAll(() => Effect.unit)),
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

const homeRoute = Route.Route('/')
const activeRoute = Route.Route('/active')
const completedRoute = Route.Route('/completed')

const router = Router.match(activeRoute, () => Fx.succeed(ViewState.Active))
  .match(completedRoute, () => Fx.succeed(ViewState.Completed))
  .match(homeRoute, () => Fx.succeed(ViewState.All))
  .notFound(() => Fx.succeed(ViewState.All))

const viewStatesToPath = {
  [ViewState.All]: homeRoute.path,
  [ViewState.Active]: activeRoute.path,
  [ViewState.Completed]: completedRoute.path,
}

export const viewStateToPath = (viewState: ViewState) => viewStatesToPath[viewState]

export const ViewStateLive = CurrentViewState.tag.layer(
  Effect.gen(function* (_) {
    const { navigation } = yield* _(Router.Router)
    const currentRoute = navigation.currentEntry.map((entry) => getCurrentRoute(entry.url.pathname))
    const ref = yield* _(Fx.makeRef(currentRoute))

    // Route changes should update the view state
    yield* _(router, Fx.observe(ref.set), Effect.forkScoped)

    // View state changes should update the route
    yield* _(
      ref,
      Fx.observe((state) =>
        Effect.gen(function* (_) {
          const current = yield* _(currentRoute)

          // Avoid circular update loop
          if (current === state) return Effect.unit

          return navigation.navigate(viewStateToPath(state))
        }),
      ),
      Effect.forkScoped,
    )

    return ref
  }),
)

function getCurrentRoute(path: string) {
  if (Option.isSome(activeRoute.match(path))) {
    return ViewState.Active
  } else if (Option.isSome(completedRoute.match(path))) {
    return ViewState.Completed
  } else {
    return ViewState.All
  }
}

export const Live = Layer.provideMerge(browser(window), Layer.mergeAll(TodosLive, ViewStateLive))
