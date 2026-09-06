---
title: "Build a save control with a complete interaction policy"
summary: "Start with a normal template, add local state when needed, and test the same save behavior the button runs."
section: "UI"
kind: "guide"
order: 4
---

An account page has a Save button. While a request is running, another click should not send a duplicate. If the server rejects the change, the page should explain why and allow another attempt. A successful save should be announced without moving focus. Removing the page should release its subscriptions and interrupt work owned by that page.

Those requirements give the component its shape. The account data and remote operation belong to the caller. This control owns the availability and status of one save interaction. We will keep that policy usable without a renderer, then connect it to a native button.

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
import { component } from "@typed/ui/Component";

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

  return {
    busy: RefSubject.map(busy, (value) => value),
    status: RefSubject.map(status, (value) => value),
    submit,
  } satisfies SaveState<R>;
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

The returned state exposes Computed views. A consumer can read or observe them, but cannot set the internal busy flag to manufacture an available button. It can run `submit`, which owns the whole transition. The local state is independent for each execution of `SaveAccount`; passing the same save Effect to two controls does not serialize their writes together.

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

## Reuse the host instead of rebuilding its behavior

Add classes through the primitive's `props` option. If a design system needs different markup inside the native button, use its host function and spread the complete composed props onto that button:

```ts
import { Effect } from "effect";
import { html } from "@typed/template";
import { Button } from "@typed/ui/Button";

const action = Button(
  { content: "Save account", onclick: Effect.void, props: { class: "btn btn-primary" } },
  (props, content) => html`<button ...${props}><span>${content}</span></button>`,
);
```

The props include behavior and references as well as styling. Moving them onto the inner span changes the host contract. Learn [Button](/explore/ui-button) for activation and availability, [Component](/explore/ui-component) for generator ergonomics, and [Dom](/explore/ui-dom) when you need to author a new semantic host. Keep this control's contract small until a real requirement calls for something else.
