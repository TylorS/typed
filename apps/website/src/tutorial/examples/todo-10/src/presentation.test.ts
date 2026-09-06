// @vitest-environment happy-dom
import { DateTime, Deferred, Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import { ServerRouter } from "@typed/router";
import { DomRenderTemplate, render } from "@typed/template";
import { expect, it, vi } from "vitest";
import * as App from "./application.js";
import * as Domain from "./domain.js";
import { TodoApp } from "./presentation.js";

it("keeps the keyed row and discards its edit draft on Escape", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  let nextId = 0;
  const services = Layer.mergeAll(
    App.TodoList.make([]),
    App.TodoText.make(""),
    App.FilterState.make("all"),
    ServerRouter({ url: "https://tutorial.local/" }),
    Layer.succeed(App.CreateTodo, (text) =>
      Effect.sync((): Domain.Todo => ({
        id: Domain.TodoId.make(`todo-${++nextId}`),
        text,
        completed: false,
        timestamp: DateTime.makeUnsafe("2026-01-01T00:00:00Z"),
      })),
    ),
  );
  // Assigning .value alone does not emit the input event our application observes.
  const type = (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const submit = () =>
    host
      .querySelector(".add-todo")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

  try {
    await Effect.gen(function* () {
      const ready = yield* Deferred.make<void>();
      yield* render(TodoApp, host).pipe(
        Fx.observe(() => Deferred.succeed(ready, undefined)),
        Effect.scoped,
        Effect.forkScoped,
      );
      yield* Deferred.await(ready);
      yield* Effect.promise(async () => {
        const draft = host.querySelector<HTMLInputElement>(".new-todo")!;
        type(draft, "Same title");
        submit();
        await vi.waitFor(() => expect(host.querySelectorAll(".todo-list > li")).toHaveLength(1));
        // Retain the node: equal labels cannot prove that keyed identity survived.
        const original = host.querySelector(".todo-list > li")!;

        type(draft, "Same title");
        submit();
        await vi.waitFor(() => expect(host.querySelectorAll(".todo-list > li")).toHaveLength(2));
        expect(host.querySelectorAll(".todo-list > li")[1]).toBe(original);

        original.querySelector<HTMLButtonElement>(".edit-trigger")!.click();
        await vi.waitFor(() => expect(original.querySelector(".edit")).not.toBeNull());
        const edit = original.querySelector<HTMLInputElement>(".edit")!;
        type(edit, "Uncommitted text");
        edit.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        await vi.waitFor(() => expect(original.querySelector(".edit")).toBeNull());
        expect(original.querySelector(".view label")?.textContent).toBe("Same title");
        expect(host.querySelectorAll(".todo-list > li")[1]).toBe(original);
      });
    }).pipe(
      Effect.provide([services, DomRenderTemplate.using(document)]),
      Effect.scoped,
      Effect.runPromise,
    );
  } finally {
    host.remove();
  }
});
