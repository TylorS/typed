import { SchemaStorage, Storage } from "@typed/dom/Storage"
import * as Fx from "@typed/fx/Fx"
import * as RefArray from "@typed/fx/RefArray"
import { Effect, Layer, ReadonlyRecord, Tuple } from "effect"
import * as App from "./application"
import * as Domain from "./domain"

const TODOS_STORAGE_KEY = `@typed/todo-app/todos`

const storage = SchemaStorage(({ json }) => ({
  [TODOS_STORAGE_KEY]: json(Domain.TodoList)
}))

const todos = storage.key(TODOS_STORAGE_KEY)

const getTodos = todos.get({ errors: "all", onExcessProperty: "error" }).pipe(
  Effect.flatten,
  Effect.catchAll(() => Effect.succeed([]))
)

const writeTodos = Fx.tap(App.TodoList, (list) => todos.set(list).pipe(Effect.catchAll(() => Effect.unit)))

const hashesToFilterState = ReadonlyRecord.fromEntries(ReadonlyRecord.toEntries(Domain.FilterState).map(Tuple.swap))

const currentFilterState = Fx.fromEmitter<never, never, Domain.FilterState>((emitter) =>
  Effect.sync(() => {
    const onHashChange = () => {
      const hash = location.hash.replace("#", "")

      if (hash in hashesToFilterState) {
        emitter.succeed(Domain.FilterState[hashesToFilterState[hash]])
      } else {
        emitter.succeed(Domain.FilterState.All)
      }
    }

    window.addEventListener("hashchange", onHashChange)

    onHashChange()
  })
)

const writeFilterState = Fx.tap(
  App.FilterState,
  (state) =>
    Effect.sync(() => {
      if (location.hash !== `#${state}`) {
        location.hash = `#${state}`
      }
    })
)

const ModelLive = Layer.mergeAll(
  App.TodoList.make(getTodos),
  App.FilterState.make(currentFilterState), // TODO: Replicate this information into the URL
  App.TodoText.make(Effect.succeed(""))
)

const CreateTodoLive = App.CreateTodo.implement((text) =>
  Effect.gen(function*(_) {
    const todo: Domain.Todo = {
      id: Domain.TodoId(crypto.randomUUID()),
      text,
      completed: false,
      timestamp: new Date()
    }

    yield* _(RefArray.prepend(App.TodoList, todo))
    yield* _(App.TodoText.set(""))

    return todo
  })
)

const SubscriptionsLive = Layer.scopedDiscard(Effect.forkScoped(Fx.drain(Fx.merge([
  writeTodos,
  writeFilterState
]))))

export const Live = Layer.provideMerge(
  Storage.layer(Effect.succeed(localStorage)),
  Layer.provideMerge(
    ModelLive,
    Layer.mergeAll(
      CreateTodoLive,
      SubscriptionsLive
    )
  )
)
