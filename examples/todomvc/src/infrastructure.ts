import { SchemaStorage, Storage } from "@typed/dom/Storage"
import * as Fx from "@typed/fx/Fx"
import { Effect, Layer, ReadonlyRecord, Tuple } from "effect"
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

const hashesToFilterState = ReadonlyRecord.fromEntries(ReadonlyRecord.toEntries(Domain.FilterState).map(Tuple.swap))

const getFilterState = () => {
  const hash = location.hash.slice(1)

  if (hash in hashesToFilterState) {
    return Domain.FilterState[hashesToFilterState[hash]]
  } else {
    return Domain.FilterState.All
  }
}

const currentFilterState = Fx.fromEmitter<never, never, Domain.FilterState>((emitter) =>
  Effect.suspend(() => {
    const onHashChange = () => emitter.succeed(getFilterState())

    window.addEventListener("hashchange", onHashChange)

    onHashChange()

    return Effect.addFinalizer(() => Effect.sync(() => window.removeEventListener("hashchange", onHashChange)))
  })
)

const writeFilterState = Fx.tap(
  App.FilterState,
  (state) =>
    Effect.sync(() => {
      const hash = `#${state}`

      if (location.hash !== hash) {
        location.hash = hash
      }
    })
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

const SubscriptionsLive = Fx.drainLayer(writeTodos, writeFilterState)

export const Live = Layer.provideMerge(
  Storage.layer(localStorage),
  Layer.provideMerge(
    ModelLive,
    Layer.mergeAll(
      CreateTodoLive,
      SubscriptionsLive
    )
  )
)

/* #endregion */
