import { SchemaStorage, Storage } from "@typed/dom/Storage"
import { Window } from "@typed/dom/Window"
import * as Fx from "@typed/fx/Fx"
import * as Match from "@typed/fx/Match"
import * as Navigation from "@typed/navigation"
import * as Route from "@typed/route/Route2"
import { Effect, Layer, Option } from "effect"
import * as App from "./application"
import * as Domain from "./domain"

/* #region Storage */

const TODOS_STORAGE_KEY = `@typed/todomvc/todos`

const storage = SchemaStorage(({ json }) => ({
  [TODOS_STORAGE_KEY]: json(Domain.TodoList)
}))

const todos = storage.key(TODOS_STORAGE_KEY)

const getTodos = todos.get({ errors: "all", onExcessProperty: "error" }).pipe(
  Effect.flatten,
  Effect.catchAll(() => Effect.succeed([]))
)

const writeTodos = Fx.tap(App.TodoList, (list) => todos.set(list).pipe(Effect.catchAll(() => Effect.unit)))

/* #endregion */

/* #region Routing */

const allRoute = Route.fromPath("/", { match: { end: true } })
const activeRoute = Route.fromPath("/active")
const completedRoute = Route.fromPath("/completed")

// Expose conversion to route for the UI
export const filterStateToPath = (state: Domain.FilterState) => {
  switch (state) {
    case Domain.FilterState.All:
      return allRoute.path
    case Domain.FilterState.Active:
      return activeRoute.path
    case Domain.FilterState.Completed:
      return completedRoute.path
  }
}

const currentFilterState = Match.value(Navigation.CurrentPath)
  .when(allRoute, () => Fx.succeed(Domain.FilterState.All))
  .when(activeRoute, () => Fx.succeed(Domain.FilterState.Active))
  .when(completedRoute, () => Fx.succeed(Domain.FilterState.Completed))
  .run
  .pipe(
    Fx.map(Option.getOrElse(() => Domain.FilterState.All))
  )

/* #endregion */

/* #region Layers */

const ModelLive = Layer.mergeAll(
  App.TodoList.make(getTodos),
  App.FilterState.make(currentFilterState),
  App.TodoText.of("")
)

const CreateTodoLive = App.CreateTodo.implement((text) =>
  Effect.sync(() => ({
    id: Domain.TodoId(crypto.randomUUID()),
    text,
    completed: false,
    timestamp: new Date()
  }))
)

const SubscriptionsLive = Fx.drainLayer(writeTodos)

const AppLive = Layer.provideMerge(
  ModelLive,
  Layer.mergeAll(
    CreateTodoLive,
    SubscriptionsLive
  )
)

export const Live = AppLive
  .pipe(
    Layer.useMerge(Layer.mergeAll(Storage.layer(localStorage), Navigation.polyfill({}))),
    Layer.useMerge(Window.layer(window))
  )

/* #endregion */
