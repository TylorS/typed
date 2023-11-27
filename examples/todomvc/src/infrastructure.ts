import { SchemaStorage, Storage } from "@typed/dom/Storage"
import { Window } from "@typed/dom/Window"
import * as Fx from "@typed/fx/Fx"
import * as Navigation from "@typed/navigation"
import * as Route from "@typed/route"
import * as Router from "@typed/router"
import { Effect, Layer } from "effect"
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

// Everytime there is a change to our TodoList, write its value back to storage
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

const currentFilterState = Router
  .to(allRoute, () => Domain.FilterState.All)
  .to(activeRoute, () => Domain.FilterState.Active)
  .to(completedRoute, () => Domain.FilterState.Completed)
  .redirect(allRoute)

/* #endregion */

/* #region Layers */

const ModelLive = Layer.mergeAll(
  // Ininialize our TodoList from storage
  App.TodoList.make(getTodos),
  // Update our FilterState everytime the current path changes
  App.FilterState.make(currentFilterState),
  // Initialize our TodoText
  App.TodoText.of("")
)

const CreateTodoLive = App.CreateTodo.implement((text) =>
  // Create a new Todo with the provided text
  Effect.sync(() => ({
    id: Domain.TodoId(crypto.randomUUID()),
    text,
    completed: false,
    timestamp: new Date()
  }))
)

// Create our subscriptiosn to streams
const SubscriptionsLive = Fx.drainLayer(writeTodos)

const AppLive = ModelLive.pipe(Layer.provideMerge(
  Layer.mergeAll(
    CreateTodoLive,
    SubscriptionsLive
  )
))

export const Live = AppLive
  .pipe(
    Layer.use(Layer.mergeAll(Storage.layer(localStorage), Navigation.fromWindow)),
    Layer.use(Window.layer(window))
  )

/* #endregion */
