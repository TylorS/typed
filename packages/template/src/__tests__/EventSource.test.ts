import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Scope from "effect/Scope";
import { Window } from "happy-dom";
import { expect, it, vi } from "vitest";
import { makeEventSource } from "../EventSource.js";
import { make } from "../EventHandler.js";

for (const delegated of [false, true]) {
  it.each([false, true])(
    `allows a handler to close its own mount (delegated: ${delegated}, yielded: %s)`,
    (yielded) =>
      Effect.gen(function* () {
        const document = new Window().document;
        const button = document.createElement("button");
        const root = delegated ? document.createElement("div") : button;
        if (delegated) root.append(button);
        const scope = yield* Scope.make();
        const source = makeEventSource();
        let started = 0;
        let finalized = 0;
        source.addEventListener(
          button as unknown as EventTarget,
          "click",
          make(() =>
            Effect.gen(function* () {
              started++;
              if (yielded) yield* Effect.yieldNow;
              // State publication can be uninterruptible while it removes this mount.
              yield* Effect.uninterruptible(Scope.close(scope, Exit.void));
            }).pipe(
              Effect.ensuring(
                Effect.sync(() => {
                  finalized++;
                }),
              ),
            ),
          ),
        );
        yield* source.setup(root as unknown as Node, scope);
        button.click();
        yield* Effect.promise(() => vi.waitFor(() => expect(finalized).toBe(1)));
        button.click();
        expect(started).toBe(1);
      }).pipe(Effect.runPromise),
  );

  it(`does not await slow handler finalizers during mount teardown (delegated: ${delegated})`, () =>
    Effect.gen(function* () {
      const document = new Window().document;
      const button = document.createElement("button");
      const root = delegated ? document.createElement("div") : button;
      if (delegated) root.append(button);
      const scope = yield* Scope.make();
      const closing = yield* Deferred.make<void>();
      const finish = yield* Deferred.make<void>();
      const done = yield* Deferred.make<void>();
      const source = makeEventSource();
      let started = 0;
      source.addEventListener(
        button as unknown as EventTarget,
        "click",
        make(() =>
          Effect.gen(function* () {
            started++;
            return yield* Effect.never;
          }).pipe(
            Effect.ensuring(
              Effect.gen(function* () {
                yield* Deferred.succeed(closing, undefined);
                yield* Deferred.await(finish);
                yield* Deferred.succeed(done, undefined);
              }),
            ),
          ),
        ),
      );
      yield* source.setup(root as unknown as Node, scope);
      button.click();
      yield* Effect.gen(function* () {
        yield* Scope.close(scope, Exit.void).pipe(Effect.timeout("1 second"));
        yield* Deferred.await(closing);
        button.click();
        expect(started).toBe(1);
        expect(yield* Deferred.isDone(done)).toBe(false);
      }).pipe(Effect.ensuring(Deferred.succeed(finish, undefined)));
      yield* Deferred.await(done);
    }).pipe(Effect.runPromise));

  it(`interrupts pending handlers and removes listeners on teardown (delegated: ${delegated})`, () =>
    Effect.gen(function* () {
      const document = new Window().document;
      const button = document.createElement("button");
      const root = delegated ? document.createElement("div") : button;
      if (delegated) root.append(button);
      const scope = yield* Scope.make();
      const done = yield* Deferred.make<void>();
      const source = makeEventSource();
      let started = 0;
      source.addEventListener(
        button as unknown as EventTarget,
        "click",
        make(() =>
          Effect.gen(function* () {
            started++;
            return yield* Effect.never;
          }).pipe(Effect.ensuring(Deferred.succeed(done, undefined))),
        ),
      );
      yield* source.setup(root as unknown as Node, scope);
      button.click();
      yield* Scope.close(scope, Exit.void);
      yield* Deferred.await(done);
      button.click();
      expect(started).toBe(1);
    }).pipe(Effect.runPromise));
}
