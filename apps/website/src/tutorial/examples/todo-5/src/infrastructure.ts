import { DateTime, Effect, Layer } from "effect";
import * as App from "./application.js";
import * as Domain from "./domain.js";

export const Services = Layer.mergeAll(
  App.TodoList.make([]),
  App.TodoText.make(""),
  Layer.succeed(App.CreateTodo, (text: string) =>
    Effect.sync((): Domain.Todo => ({
      id: Domain.TodoId.make(crypto.randomUUID()),
      text,
      completed: false,
      timestamp: DateTime.makeUnsafe(new Date()),
    })),
  ),
);
