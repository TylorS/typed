import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Dialog from "../Dialog.js";

describe("typed/ui/Dialog", () => {
  it("hydrates its open state", () =>
    Effect.gen(function* () {
      const state = yield* Dialog.makeState({ open: true });

      assert.strictEqual(RefSubject.isHydrationRef(state), true);
      assert.strictEqual((yield* state).open, true);
    }).pipe(
      Effect.provideService(RefSubject.CurrentComputedBehavior, "one"),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("owns hydration on the native dialog host", () =>
    Effect.gen(function* () {
      const state = yield* Dialog.makeState();
      const markup = yield* renderToHtmlString(
        Dialog.Content({ state, label: "Test dialog", content: "Body" }),
      );

      assert.match(markup, /<dialog/);
      assert.match(markup, /data-typed-refsubject=/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));

  it("associates an explicit accessible name and description", () =>
    Effect.gen(function* () {
      const state = yield* Dialog.makeState();
      const markup = yield* renderToHtmlString(
        Dialog.Content({
          state,
          id: "delete-dialog",
          labelledBy: "delete-title",
          describedBy: "delete-description",
          content: "Body",
        }),
      );

      assert.match(markup, /aria-labelledby="delete-title"/);
      assert.match(markup, /aria-describedby="delete-description"/);
      assert.match(markup, /id="delete-dialog"/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));

  it("uses the native request-close command when a dialog id is supplied", () =>
    Effect.gen(function* () {
      const state = yield* Dialog.makeState();
      const markup = yield* renderToHtmlString(
        Dialog.RequestClose({ state, controls: "delete-dialog", content: "Cancel" }),
      );

      assert.match(markup, /command="request-close"/);
      assert.match(markup, /commandfor="delete-dialog"/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
