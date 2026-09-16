import { DateTime, Effect, Layer, Context, Schema } from "effect";
import { Fx } from "@typed/fx";
import * as Router from "@typed/router";
import * as App from "./application.js";
import * as Domain from "./domain.js";

const FilterState = Router.match(Router.Slash, "all")
  .match(Router.Parse("active"), "active")
  .match(Router.Parse("completed"), "completed")
  .redirectTo("/")
  .pipe(
    Fx.catchCause(() => Fx.succeed("all" as const)),
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
  Layer.mergeAll(
    CreateTodo,
    App.TodoList.make([]),
    App.TodoText.make(""),
    App.FilterState.make(FilterState),
  ).pipe(Layer.provideMerge(router));

export const Services = makeServices();
