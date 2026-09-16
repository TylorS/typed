---
title: "Build a save control with a complete interaction policy"
summary: "Build a save control with an explicit pending, failure, retry, and focused test policy."
section: "UI"
kind: "guide"
order: 4
---

Build a Save button that ignores overlapping submissions, displays an expected rejection, and permits retry. The caller supplies the save operation; the control owns its pending state and status message. Its policy can be tested without a renderer, then connected to a native button.

This is a complete interaction recipe. For basic composition and per-instance setup, start with [Component](/explore/ui-component). Here, `Effect.fn` builds the state and command, a plain template displays them, and `component` gives each rendered control its own state.

## A template is already a view

A view that only arranges inputs needs no generator. `html` returns renderable output, and UI primitives such as `Button` do the same. Start there:

```ts
import { Effect } from "effect";
import { html } from "@typed/template";
import { Button } from "@typed/ui/Button";

const SaveAction = <E, R>(save: Effect.Effect<void, E, R>) => html`<div class="account-actions">
  ${Button({ content: "Save account", onclick: save })}
</div>`;

const action = SaveAction(Effect.log("Save requested"));
```

This is a useful composition boundary, but it has no asynchronous interaction policy yet. Calling `SaveAction` does not run `save`; the button event runs that Effect. Introducing `component(function* ...)` around this template would add ceremony without doing any setup.

## Give the save operation one owner

We need two pieces of local state: whether this control currently owns a save, and the message shown to the person using it. The function below allocates them. It accepts a caller-supplied operation with one expected failure, `SaveRejected`, and preserves whatever services that operation requires.

The submit command atomically claims the busy state with `RefSubject.modify`. A read followed by a separate write would leave a gap where two callers could both see “not busy.” The disabled button communicates availability; the atomic claim also protects calls made directly by application code.

Save this module as `SaveAccount.ts`:

```ts file="SaveAccount.ts"
import { Data, Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { Button } from "@typed/ui/Button";
import { component } from "@typed/template";

export class SaveRejected extends Data.TaggedError("SaveRejected")<{
  readonly message: string;
}> {}

export interface SaveState<R> {
  readonly busy: RefSubject.Computed<boolean>;
  readonly status: RefSubject.Computed<string>;
  readonly submit: Effect.Effect<void, never, R>;
}

export const makeSaveState = Effect.fn("makeSaveState")(function* <R>(
  save: Effect.Effect<void, SaveRejected, R>,
) {
  const busy = yield* RefSubject.make(false);
  const status = yield* RefSubject.make("Ready to save");

  const submit = Effect.acquireUseRelease(
    // Claim atomically; acquisition and release cannot be interrupted.
    RefSubject.modify(busy, (current) => [!current, true] as const),
    (acquired) => acquired
      ? Effect.gen(function* () {
          yield* RefSubject.set(status, "Saving…");

          yield* save;

          yield* RefSubject.set(status, "Saved");
        }).pipe(
          // Expected rejections become UI messages; defects remain failures.
          Effect.catchTag("SaveRejected", ({ message }) => RefSubject.set(status, message)),
          Effect.asVoid,
        )
      : Effect.void,

    // A competing caller must not release the first caller's claim.
    (acquired) => acquired ? RefSubject.set(busy, false) : Effect.void,
  );

  const state: SaveState<R> = { busy, status, submit };

  return state;
});

export const SaveStatus = <R>({ busy, status, submit }: SaveState<R>) => html`<section aria-busy=${busy}>
  ${Button({ content: "Save account", disabled: busy, onclick: submit })}
  <p role="status">${status}</p>
</section>`;

export const SaveAccount = component(function* <R>(
  save: Effect.Effect<void, SaveRejected, R>,
) {
  return SaveStatus(yield* makeSaveState(save));
});
```

`makeSaveState` is an Effect-returning function, so it uses `Effect.fn`. `SaveStatus` only arranges live values and an action, so it returns `html` directly. `SaveAccount` allocates the state when rendered, so it uses `component`. These are three different jobs with three small, ordinary contracts.

The `SaveState<R>` annotation exposes `busy` and `status` as `Computed` values, so callers can read and observe them while updates go through `submit`. The same RefSubjects are returned directly. The annotation narrows the public TypeScript API without changing their runtime behavior. Each execution of `SaveAccount` owns separate state; passing the same save Effect to two controls does not serialize their writes together.

## Decide what failure means before styling it

`SaveRejected` is an expected result that this interaction knows how to present. Its message becomes visible status, and finalization releases busy state so another attempt can run. A defect is not silently relabeled as a validation message; it remains available to the application's error reporting boundary.

`acquireUseRelease` protects acquisition and release from interruption while leaving the save interruptible. Once a caller claims busy state, its release restores availability on success, failure, or interruption. A competing caller acquires no claim and must not release another caller's work. This control has no separate Cancel command: interruption normally comes from its owner ending the interaction. If a save must survive navigation, provide a longer-lived command service that owns that work and let the view observe it.

A status region announces changed text without moving focus. Use a meaningful native button label and retain focus on the button through a retry. A whole form also needs validation, field errors, and submission semantics; compose [Form](/explore/ui-form) when those responsibilities enter the design.

## Test the policy the button actually uses

Save the following file next to `SaveAccount.ts`. It imports the implementation above. The deferred request lets the test choose exactly when work starts and ends; no network delay or fixed sleep is involved.

```ts file="SaveAccount.test.ts"
// @vitest-environment happy-dom
import { Deferred, Effect, Fiber } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { expect, it, vi } from "vitest";
import { makeSaveState, SaveAccount, SaveRejected } from "./SaveAccount.js";

it("ignores overlapping submissions and permits retry after rejection", () =>
  Effect.gen(function* () {
    const started = yield* Deferred.make<void>();
    const pending = yield* Deferred.make<void, SaveRejected>();
    let attempts = 0;
    const save = Effect.suspend(() => ++attempts === 1
      ? Deferred.succeed(started, undefined).pipe(Effect.andThen(Deferred.await(pending)))
      : Effect.void);

    const state = yield* makeSaveState(save);
    const running = yield* Effect.forkScoped(state.submit);

    // Compete with a request that has actually started, independent of scheduler timing.
    yield* Deferred.await(started);
    expect(yield* state.busy).toBe(true);
    expect(yield* state.status).toBe("Saving…");

    yield* state.submit;
    expect(yield* state.busy).toBe(true); // The competing call did not release the owner.
    expect(attempts).toBe(1);

    yield* Deferred.fail(pending, new SaveRejected({ message: "The account changed. Review and retry." }));
    yield* Fiber.join(running);
    expect(yield* state.busy).toBe(false);
    expect(yield* state.status).toContain("Review and retry");

    yield* state.submit;
    expect(attempts).toBe(2);
    expect(yield* state.status).toBe("Saved");
  }).pipe(Effect.scoped, Effect.runPromise));

it("releases its claim when interrupted", () =>
  Effect.gen(function* () {
    const started = yield* Deferred.make<void>();
    const state = yield* makeSaveState(
      Deferred.succeed(started, undefined).pipe(Effect.andThen(Effect.never)),
    );

    const running = yield* Effect.forkScoped(state.submit);
    yield* Deferred.await(started);
    expect(yield* state.busy).toBe(true);

    yield* Fiber.interrupt(running);
    expect(yield* state.busy).toBe(false);
  }).pipe(Effect.scoped, Effect.runPromise));

it("connects a native button click to visible pending and saved states", async () => {
  const host = document.createElement("div");
  document.body.append(host);

  try {
    await Effect.gen(function* () {
      const pending = yield* Deferred.make<void, SaveRejected>();
      const mounted = yield* Deferred.make<void>();

      // Keep the render subscription alive while testing the component's events.
      yield* render(SaveAccount(Deferred.await(pending)), host).pipe(
        Fx.observe(() => Deferred.succeed(mounted, undefined)),
        Effect.forkScoped,
      );
      yield* Deferred.await(mounted);

      const button = host.querySelector<HTMLButtonElement>("button")!;
      button.click();
      yield* Effect.promise(() => vi.waitFor(() => {
        expect(button.disabled).toBe(true);
        expect(host.querySelector('[role="status"]')?.textContent).toBe("Saving…");
      }));

      yield* Deferred.succeed(pending, undefined);
      yield* Effect.promise(() => vi.waitFor(() => {
        expect(button.disabled).toBe(false);
        expect(host.querySelector('[role="status"]')?.textContent).toBe("Saved");
      }));
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  } finally {
    host.remove();
  }
});
```

Run `npm install --save-dev vitest happy-dom`, then `npx vitest run SaveAccount.test.ts`. The first two tests prove overlap, retry, and interruption without rendering. The browser fixture test proves that a native event reaches that policy and that the live properties and status text reflect its progress. Both close their Effect Scope even if an assertion fails.

A real-browser test should additionally check keyboard activation and focus retention. Happy DOM checks event wiring, not what a screen reader announces or how a browser lays out the control.

For styling or a custom native-button host, see [Button](/explore/ui-button). Keep its composed props on the button so event handling, references, and availability remain attached to the interactive element.
