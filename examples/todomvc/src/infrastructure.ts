import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as ParseResult from '@effect/schema/ParseResult'
import * as Schema from '@effect/schema/Schema'
import * as DOM from '@typed/dom'
import { browser } from '@typed/framework/browser'
import * as Fx from '@typed/fx'
import * as Navigation from '@typed/navigation'
import * as Route from '@typed/route'
import * as Router from '@typed/router'

import { TodoRepository, CurrentViewState } from './application.js'
import { TodoId, TodoList, ViewState } from './domain.js'

export const parseJson = <I, A>(schema: Schema.Schema<I, A>) =>
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
    (a) => ParseResult.success(JSON.stringify(a)),
  )

const todosKey = `typed-todos-list` as const

const storage = DOM.SchemaStorage({
  [todosKey]: parseJson(TodoList),
})

export const TodoRepositoryLive = TodoRepository.implement({
  read: () => Effect.flatten(storage.get(todosKey)),
  write: (todoList) => storage.set(todosKey, todoList),
  create: (text) =>
    Effect.succeed({
      id: crypto.randomUUID() as TodoId,
      text,
      completed: false,
      timestamp: new Date(),
    }),
})

const homeRoute = Route.Route('/')
const activeRoute = Route.Route('/active')
const completedRoute = Route.Route('/completed')

const router = Router.redirectEffect(
  Router.match(homeRoute, () => Fx.succeed(ViewState.All))
    .match(activeRoute, () => Fx.succeed(ViewState.Active))
    .match(completedRoute, () => Fx.succeed(ViewState.Completed)),
  Router.Redirect.redirect(homeRoute.path),
)

const viewStatesToPath = {
  [ViewState.All]: homeRoute.path,
  [ViewState.Active]: activeRoute.path,
  [ViewState.Completed]: completedRoute.path,
}

const viewStateToPath = (viewState: ViewState) => viewStatesToPath[viewState]

export const ViewStateLive = Layer.scoped(
  CurrentViewState.tag,
  Effect.gen(function* (_) {
    const ref = yield* _(Fx.makeRef(Effect.succeed<ViewState>(ViewState.All)))

    // Route changes should update the current view state
    yield* _(router, Fx.observe(ref.set), Effect.forkScoped)

    // View state changes should update the route
    yield* _(
      ref,
      Fx.observe((state) => Navigation.navigate(viewStateToPath(state))),
      Effect.forkScoped,
    )

    return ref
  }),
)

export const Live = Layer.provideMerge(
  browser(window),
  Layer.mergeAll(TodoRepositoryLive, ViewStateLive),
)
