import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { assert, describe, it, vi } from "vitest";
import * as Checkbox from "../Checkbox.js";
import * as Slider from "../Slider.js";
import * as SpinButton from "../SpinButton.js";
import * as Switch from "../Switch.js";

describe("typed/ui value controls in browsers", () => {
  it("keeps switch state synchronized with its native button activation", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Switch.makeState();
      yield* render(Switch.Switch({ state, content: "Notifications" }), document.body).pipe(
        Fx.take(1),
        Fx.collectAll,
      );

      const control = document.querySelector('[role="switch"]') as HTMLButtonElement;
      control.click();
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).checked, true);
      assert.strictEqual(control.getAttribute("aria-checked"), "true");
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("synchronizes native range and number input changes", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const slider = yield* Slider.makeState({ value: 1 });
      const spinButton = yield* SpinButton.makeState({ value: 1 });
      yield* render(
        [
          Slider.Slider({ state: slider, min: 0, max: 10 }),
          SpinButton.SpinButton({ state: spinButton, min: 0, max: 10 }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const [range, number] = document.querySelectorAll("input");
      (range as HTMLInputElement).value = "7";
      range.dispatchEvent(new Event("input", { bubbles: true }));
      (number as HTMLInputElement).value = "4";
      number.dispatchEvent(new Event("change", { bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* slider).value, 7);
      assert.strictEqual((yield* spinButton).value, 4);

      yield* Slider.setValue(slider, 3);
      yield* SpinButton.setValue(spinButton, 6);
      yield* Effect.promise(() =>
        vi.waitFor(() => {
          assert.strictEqual((range as HTMLInputElement).value, "3");
          assert.strictEqual((number as HTMLInputElement).value, "6");
        }),
      );
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("synchronizes the checkbox indeterminate property", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Checkbox.makeState({ checked: "mixed" });
      yield* render(Checkbox.Input({ state }), document.body).pipe(Fx.take(1), Fx.collectAll);
      const input = document.querySelector('input[type="checkbox"]') as HTMLInputElement;

      assert.strictEqual(input.indeterminate, true);
      yield* Checkbox.setChecked(state, true);
      yield* Effect.sleep(20);
      assert.strictEqual(input.checked, true);
      assert.strictEqual(input.indeterminate, false);
      yield* Checkbox.setChecked(state, false);
      yield* Effect.sleep(20);
      assert.strictEqual(input.checked, false);
      assert.strictEqual(input.indeterminate, false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
