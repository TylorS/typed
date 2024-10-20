import * as S from "@effect/schema/Schema"
import { Fx, Route, Router } from "@typed/core"
import { SchemaStorage } from "@typed/dom/Storage"
import { Effect, Layer, pipe } from "effect"
import * as App from "./application"
import * as Domain from "./domain"

/* #region Storage */

const TODOS_STORAGE_KEY = `@typed/todomvc/todos`

const storage = SchemaStorage({
  [TODOS_STORAGE_KEY]: S.parseJson(Domain.TodoList)
})

const todos = storage.key(TODOS_STORAGE_KEY)

const getTodos = todos.get({ errors: "all", onExcessProperty: "error" }).pipe(
  Effect.flatten,
  Effect.catchAll(() => Effect.succeed([]))
)

// Everytime there is a change to our TodoList, write its value back to storage
const writeTodos = Fx.tapEffect(App.TodoList, (list) => todos.set(list).pipe(Effect.catchAll(() => Effect.void)))

/* #endregion */

/* #region Routing */

const allRoute = Route.home
const activeRoute = Route.literal("active")
const completedRoute = Route.literal("completed")

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

const currentFilterState = pipe(
  Router.to(allRoute, () => Domain.FilterState.All)
    .to(activeRoute, () => Domain.FilterState.Active)
    .to(completedRoute, () => Domain.FilterState.Completed),
  Router.redirectTo(allRoute),
  Fx.switchMapCause(() => Fx.succeed(Domain.FilterState.All))
)

/* #endregion */

/* #region Layers */

const ModelLive = Layer.mergeAll(
  // Ininialize our TodoList from storage
  App.TodoList.make(getTodos),
  // Update our FilterState everytime the current path changes
  App.FilterState.make(currentFilterState),
  // Initialize our TodoText
  App.TodoText.make(Effect.succeed(""))
)

const CreateTodoLive = App.CreateTodo.implement((text) =>
  // Create a new Todo with the provided text
  Effect.sync((): Domain.Todo => ({
    id: Domain.TodoId.make(crypto.randomUUID()),
    text,
    completed: false,
    timestamp: new Date()
  }))
)

// Create our subscriptiosn to streams
const SubscriptionsLive = Fx.drainLayer(writeTodos)

export const Live = Layer.mergeAll(CreateTodoLive, SubscriptionsLive).pipe(Layer.provideMerge(ModelLive))

/* #endregion */
