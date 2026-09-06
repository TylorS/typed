import { DateTime, Effect, Layer, Context, Schema } from "effect";
import { Fx } from "@typed/fx";
import * as Router from "@typed/router";
import * as App from "./application.js";
import * as Domain from "./domain.js";

const TODOS_STORAGE_KEY = `@typed/tutorial/todo-10`;

// Parsed JSON is not yet a TodoList; decode at the storage boundary.
const TodoListJson = Schema.fromJsonString(Schema.toCodecJson(Domain.TodoList));
const decodeTodoList = Schema.decodeEffect(TodoListJson);
const encodeTodoList = Schema.encodeEffect(TodoListJson);

class Todos extends Context.Service<
  Todos,
  {
    readonly load: Effect.Effect<Domain.TodoList, unknown>;
    readonly save: (todos: Domain.TodoList) => Effect.Effect<void, unknown>;
  }
>()("TodosService") {
  static readonly get = Todos.pipe(
    Effect.flatMap((service) => service.load),
    Effect.catchCause(() => Effect.succeed([])),
  );

  static readonly set = (todos: Domain.TodoList) =>
    Effect.flatMap(Todos, (service) => service.save(todos)).pipe(
      Effect.catchCause((cause) =>
        Effect.logError("Failed to write todos to key value store", cause),
      ),
    );

  static readonly replicateToStorage = App.TodoList.pipe(Fx.observeLayer(Todos.set));

  static readonly local = Layer.succeed(Todos, {
    load: Effect.try(() => localStorage.getItem(TODOS_STORAGE_KEY)).pipe(
      Effect.flatMap((value) =>
        value === null ? Effect.succeed<Domain.TodoList>([]) : decodeTodoList(value),
      ),
    ),
    save: (todos) =>
      encodeTodoList(todos).pipe(
        Effect.flatMap((value) => Effect.try(() => localStorage.setItem(TODOS_STORAGE_KEY, value))),
      ),
  });
}

const FilterState = Router.match(Router.Slash, "all")
  .match(Router.Parse("active"), "active")
  .match(Router.Parse("completed"), "completed")
  .redirectTo("/")
  .pipe(
    Fx.catchCause(() => Fx.succeed("all" as const)),
  );

// Load before observing changes, so an empty default cannot overwrite saved items.
const Model = Layer.mergeAll(
  App.TodoList.make(Todos.get),
  App.FilterState.make(FilterState),
  App.TodoText.make(""),
);

const CreateTodo = Layer.sync(
  App.CreateTodo,
  () => (text: string) =>
    Effect.sync((): Domain.Todo => ({
      id: Domain.TodoId.make(crypto.randomUUID()),
      text,
      completed: false,
      timestamp: DateTime.makeUnsafe(new Date()),
    })),
);

export const makeServices = (router = Router.BrowserRouter()) =>
  Layer.mergeAll(CreateTodo, Todos.replicateToStorage).pipe(
    Layer.provideMerge(Model),
    Layer.provideMerge([Todos.local, router]),
  );

export const Services = makeServices();
