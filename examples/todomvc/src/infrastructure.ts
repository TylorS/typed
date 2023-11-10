import { SchemaStorage, Storage } from "@typed/dom/Storage"
import { Window } from "@typed/dom/Window"
import * as Fx from "@typed/fx/Fx"
import * as Match from "@typed/fx/Match"
import { CurrentPath, polyfill } from "@typed/navigation"
import * as Route from "@typed/route/Route2"
import { Effect, Layer } from "effect"
import { getOrElse } from "effect/Option"
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

// TODO: Replace this with @typed/router when it is ready.

const allRoute = Route.fromPath("/", { match: { end: true } })
const activeRoute = Route.fromPath("/active")
const completedRoute = Route.fromPath("/completed")

const currentFilterState = Match.value(CurrentPath)
  .when(allRoute, () => Fx.succeed(Domain.FilterState.All))
  .when(activeRoute, () => Fx.succeed(Domain.FilterState.Active))
  .when(completedRoute, () => Fx.succeed(Domain.FilterState.Completed))
  .run
  .pipe(
    Fx.map(getOrElse(() => Domain.FilterState.All))
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

export const Live = Layer.provideMerge(
  Window.layer(window),
  Layer.provideMerge(
    Layer.mergeAll(Storage.layer(localStorage), polyfill({})),
    Layer.provideMerge(
      ModelLive,
      Layer.mergeAll(
        CreateTodoLive,
        SubscriptionsLive
      )
    )
  )
)

/* #endregion */
