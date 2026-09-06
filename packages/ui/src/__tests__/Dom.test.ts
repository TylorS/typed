import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { EventHandler } from "@typed/template";
import { Window } from "happy-dom";
import { assert, describe, it } from "vitest";
import * as Dom from "../Dom.js";

describe("typed/ui/Dom", () => {
  it("runs a user event handler before the internal handler", () =>
    Effect.gen(function* () {
      const calls: Array<string> = [];
      const window = makeWindow();
      const event = new window.Event("click", { cancelable: true });
      const handler = Dom.chainEvent(
        EventHandler.make(Effect.fn(() => Effect.sync(() => calls.push("user")))),
        EventHandler.make(Effect.fn(() => Effect.sync(() => calls.push("internal")))),
      );

      assert.isDefined(handler);
      yield* handler.handler(event as unknown as Event);
      assert.deepEqual(calls, ["user", "internal"]);
    }).pipe(Effect.runPromise));

  it("skips internal behavior when the user prevents the default", () =>
    Effect.gen(function* () {
      const calls: Array<string> = [];
      const window = makeWindow();
      const event = new window.Event("click", { cancelable: true });
      const handler = Dom.chainEvent(
        EventHandler.make(
          Effect.fn(() => Effect.sync(() => calls.push("user"))),
          {
            preventDefault: true,
          },
        ),
        EventHandler.make(Effect.fn(() => Effect.sync(() => calls.push("internal")))),
      );

      assert.isDefined(handler);
      yield* handler.handler(event);
      assert.strictEqual(event.defaultPrevented, true);
      assert.deepEqual(calls, ["user"]);
    }).pipe(Effect.runPromise));

  it("keeps user once options from removing internal behavior", () =>
    Effect.gen(function* () {
      const calls: Array<string> = [];
      const window = makeWindow();
      const handler = Dom.chainEvent(
        EventHandler.make(
          Effect.fn(function* () {
            yield* Effect.sync(() => calls.push("user"));
          }),
          { once: true, passive: true, capture: true },
        ),
        EventHandler.make(
          Effect.fn(function* () {
            yield* Effect.sync(() => calls.push("internal"));
          }),
        ),
      );

      assert.isDefined(handler);
      assert.notStrictEqual(handler.options?.once, true);
      assert.strictEqual(handler.options?.passive, true);
      assert.strictEqual(handler.options?.capture, true);
      yield* handler.handler(new window.Event("click", { cancelable: true }));
      yield* handler.handler(new window.Event("click", { cancelable: true }));

      assert.deepEqual(calls, ["user", "internal", "internal"]);
    }).pipe(Effect.runPromise));

  it("does not invoke consumer activation for an aria-disabled host", () =>
    Effect.gen(function* () {
      const calls: Array<string> = [];
      const window = makeWindow();
      const merged = Dom.mergeProps(
        {
          onclick: EventHandler.make(
            Effect.fn(function* () {
              yield* Effect.sync(() => calls.push("user"));
            }),
          ),
        } satisfies Dom.HostProps<HTMLDivElement>,
        {
          role: "menuitem",
          "aria-disabled": true,
          onclick: EventHandler.make(
            Effect.fn(function* () {
              yield* Effect.sync(() => calls.push("internal"));
            }),
          ),
        } satisfies Dom.HostProps<HTMLDivElement>,
      );

      const onclick = merged.onclick;
      assert.isDefined(onclick);
      if (EventHandler.isEventHandler(onclick)) {
        yield* onclick.handler(new window.MouseEvent("click", { cancelable: true }));
      }

      assert.deepEqual(calls, ["internal"]);
    }).pipe(Effect.runPromise));

  it("preserves one hydration protocol while invoking both refs once", () =>
    Effect.gen(function* () {
      const window = makeWindow();
      const button = window.document.createElement("button") as unknown as HTMLButtonElement;
      const calls: Array<string> = [];
      const metadata = {
        members: [],
        server: Effect.void,
        toAttributes: Effect.succeed([]),
      };
      const hydration = Object.assign(
        Effect.fn(() => Effect.sync(() => calls.push("hydrate"))),
        {
          [RefSubject.HydrationRefTypeId]: metadata,
        },
      );
      const composed = Dom.composeRefs(
        hydration,
        Effect.fn(() => Effect.sync(() => calls.push("user"))),
      );

      assert.isDefined(composed);
      assert.strictEqual(RefSubject.isHydrationRef(composed), true);
      assert.strictEqual(composed[RefSubject.HydrationRefTypeId], metadata);
      const result = composed(button);
      assert.strictEqual(Effect.isEffect(result), true);
      if (Effect.isEffect(result)) yield* result;
      assert.deepEqual(calls, ["hydrate", "user"]);
    }).pipe(Effect.runPromise));

  it("rejects multiple hydration owners", () => {
    const hydration = Effect.fn(() => Effect.void);
    const first = Object.assign(hydration, {
      [RefSubject.HydrationRefTypeId]: {
        members: [],
        server: Effect.void,
        toAttributes: Effect.succeed([]),
      },
    });
    const second = Object.assign(
      Effect.fn(() => Effect.void),
      {
        [RefSubject.HydrationRefTypeId]: {
          members: [],
          server: Effect.void,
          toAttributes: Effect.succeed([]),
        },
      },
    );

    assert.throws(
      () => Dom.composeRefs(first, second),
      /Only one hydration ref can own an element/,
    );
  });

  it("merges semantic props, events, and refs with their specified ownership", () =>
    Effect.gen(function* () {
      const window = makeWindow();
      const button = window.document.createElement("button") as unknown as HTMLButtonElement;
      const calls: Array<string> = [];
      const user = {
        type: "submit",
        onclick: EventHandler.make(Effect.fn(() => Effect.sync(() => calls.push("user-event")))),
        ref: Effect.fn(() => Effect.sync(() => calls.push("user-ref"))),
      } satisfies Dom.HostProps<HTMLButtonElement>;
      const internal = {
        type: "button",
        onclick: EventHandler.make(
          Effect.fn(() => Effect.sync(() => calls.push("internal-event"))),
        ),
        ref: Effect.fn(() => Effect.sync(() => calls.push("internal-ref"))),
      } satisfies Dom.HostProps<HTMLButtonElement>;
      const merged = Dom.mergeProps(user, internal);

      assert.strictEqual(merged.type, "button");
      const onclick = merged.onclick;
      assert.isDefined(onclick);
      assert.strictEqual(EventHandler.isEventHandler(onclick), true);
      if (EventHandler.isEventHandler(onclick)) {
        yield* onclick.handler(new window.MouseEvent("click", { cancelable: true }));
      }
      const refResult = merged.ref?.(button);
      if (Effect.isEffect(refResult)) yield* refResult;

      assert.deepEqual(calls, ["user-event", "internal-event", "internal-ref", "user-ref"]);
    }).pipe(Effect.runPromise));

  it("composes @ event handlers with the same ownership as native on handlers", () =>
    Effect.gen(function* () {
      const calls: Array<string> = [];
      const window = makeWindow();
      const merged = Dom.mergeProps(
        {
          "@click": EventHandler.make(Effect.fn(() => Effect.sync(() => calls.push("user")))),
        } satisfies Dom.HostProps<HTMLButtonElement>,
        {
          "@click": EventHandler.make(Effect.fn(() => Effect.sync(() => calls.push("internal")))),
        } satisfies Dom.HostProps<HTMLButtonElement>,
      );

      const handler = merged["@click"];
      assert.isDefined(handler);
      assert.strictEqual(EventHandler.isEventHandler(handler), true);
      if (EventHandler.isEventHandler(handler)) {
        yield* handler.handler(new window.Event("click", { cancelable: true }));
      }

      assert.deepEqual(calls, ["user", "internal"]);
    }).pipe(Effect.runPromise));
});

function makeWindow() {
  return new Window() as unknown as typeof globalThis.window & typeof globalThis;
}
