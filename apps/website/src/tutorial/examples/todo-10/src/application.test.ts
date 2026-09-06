import { DateTime, Effect, Exit, Layer } from "effect";
import { RefSubject } from "@typed/fx";
import { describe, expect, it } from "vitest";
import * as App from "./application.js";
import * as Domain from "./domain.js";

const timestamp = DateTime.makeUnsafe("2026-01-01T00:00:00Z");

const model = Layer.mergeAll(
  App.TodoList.make([]),
  App.TodoText.make(""),
  App.FilterState.make("all"),
);

describe("createTodo", () => {
  it("ignores blank drafts and commits trimmed text before clearing the input", () => {
    // A blank draft must not reach the factory, even if it leaves the list unchanged.
    let calls = 0;
    const create = Layer.succeed(App.CreateTodo, (text) =>
      Effect.sync((): Domain.Todo => ({
        id: Domain.TodoId.make(`todo-${++calls}`),
        text,
        completed: false,
        timestamp,
      })),
    );

    return Effect.gen(function* () {
      yield* RefSubject.set(App.TodoText, "   ");
      yield* App.createTodo;
      expect(calls).toBe(0);
      expect(yield* App.TodoList).toEqual([]);
      expect(yield* App.TodoText).toBe("   ");

      yield* RefSubject.set(App.TodoText, "  Learn Typed  ");
      yield* App.createTodo;
      expect(calls).toBe(1);
      expect(yield* App.TodoList).toEqual([
        { id: Domain.TodoId.make("todo-1"), text: "Learn Typed", completed: false, timestamp },
      ]);
      expect(yield* App.TodoText).toBe("");
      expect(yield* App.ActiveCount).toBe(1);
    }).pipe(Effect.provide([model, create]), Effect.scoped, Effect.runPromise);
  });

  it("preserves the draft when the factory cannot create an item", () =>
    Effect.gen(function* () {
      yield* RefSubject.set(App.TodoText, "Keep this draft");
      const exit = yield* Effect.exit(App.createTodo);
      expect(Exit.isFailure(exit)).toBe(true);
      expect(yield* App.TodoList).toEqual([]);
      expect(yield* App.TodoText).toBe("Keep this draft");
    }).pipe(
      Effect.provide([
        model,
        Layer.succeed(App.CreateTodo, () => Effect.die("ID factory unavailable")),
      ]),
      Effect.scoped,
      Effect.runPromise,
    ));
});
