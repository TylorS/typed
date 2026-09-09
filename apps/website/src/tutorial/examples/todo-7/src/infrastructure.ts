import { Ids } from "@typed/id/Ids";
import { DateTimes } from "@typed/id/DateTimes";
import { DateTime, Effect, Layer } from "effect";
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

const Model = Layer.mergeAll(
  App.TodoList.make([]),
  App.FilterState.make(FilterState),
  App.TodoText.make(""),
);

const CreateTodo = Layer.effect(App.CreateTodo, Effect.gen(function* () {
    const ids = yield* Ids;
    const time = yield* DateTimes;
    return Effect.fn("createTodo")(function* (text: string) {
      return {
        id: Domain.TodoId.make(yield* ids.uuid4),
        text,
        completed: false,
        timestamp: DateTime.makeUnsafe(yield* time.now),
      } satisfies Domain.Todo;
    });
  }));

export const makeServices = (router = Router.BrowserRouter()) =>
  Layer.mergeAll(CreateTodo).pipe(
    Layer.provideMerge(Model),
    Layer.provideMerge(router),
  );

export const Services = makeServices();
