import { Ids } from "@typed/id/Ids";
import { DateTimes } from "@typed/id/DateTimes";
import { DateTime, Effect, Layer } from "effect";
import * as App from "./application.js";
import * as Domain from "./domain.js";

export const Services = Layer.mergeAll(
  App.TodoList.make([]),
  App.TodoText.make(""),
  Layer.effect(App.CreateTodo, Effect.gen(function* () {
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
  })),

);
