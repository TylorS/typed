import { Effect, Schema } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { assert, describe, it, vi } from "vitest";
import * as Form from "../Form.js";

describe("typed/ui/Form in Chromium", () => {
  it("scopes schema-bound fields to their owning form", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const UserForm = Form.make(Schema.Struct({ email: Schema.String }));
      const first = yield* UserForm.state({ email: "first@example.com" });
      const second = yield* UserForm.state({ email: "second@example.com" });
      yield* render(
        [
          UserForm.Root({
            form: first,
            content: UserForm.EmailInput({ name: "email" }),
          }),
          UserForm.Root({
            form: second,
            content: UserForm.EmailInput({ name: "email" }),
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const inputs = document.querySelectorAll<HTMLInputElement>('input[name="email"]');
      inputs[1].value = "updated@example.com";
      inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* first).values.email, "first@example.com");
      assert.strictEqual((yield* second).values.email, "updated@example.com");
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("uses unique error relationships for identical field names in separate forms", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const UserForm = Form.make(Schema.Struct({ email: Schema.String }));
      const first = yield* UserForm.state(
        { email: "" },
        {
          errors: { email: "First error" },
        },
      );
      const second = yield* UserForm.state(
        { email: "" },
        {
          errors: { email: "Second error" },
        },
      );
      yield* render(
        [
          UserForm.Root({
            form: first,
            content: [UserForm.EmailInput({ name: "email" }), UserForm.Error({ name: "email" })],
          }),
          UserForm.Root({
            form: second,
            content: [UserForm.EmailInput({ name: "email" }), UserForm.Error({ name: "email" })],
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const inputs = document.querySelectorAll<HTMLInputElement>('input[name="email"]');
      const errors = document.querySelectorAll<HTMLElement>('[role="alert"]');

      assert.notStrictEqual(errors[0].id, errors[1].id);
      assert.strictEqual(inputs[0].getAttribute("aria-describedby"), errors[0].id);
      assert.strictEqual(inputs[1].getAttribute("aria-describedby"), errors[1].id);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("keeps invalid checkbox and select errors until each field becomes valid", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Form.makeState(
        Schema.Struct({ accepted: Schema.Literal(true), plan: Schema.Literal("pro") }),
        {
          values: { accepted: true, plan: "pro" },
          errors: { accepted: "Required", plan: "Choose a plan" },
        },
      );
      yield* render(
        Form.Form({
          state,
          content: [
            Form.Checkbox({ state, name: "accepted" }),
            Form.Error({ state, name: "accepted" }),
            Form.Select({
              state,
              name: "plan",
              content: html`<option value="free">Free</option>
                <option value="pro">Pro</option>`,
            }),
            Form.Error({ state, name: "plan" }),
          ],
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const checkbox = document.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
      const select = document.querySelector("select")!;

      assert.strictEqual(checkbox.getAttribute("aria-invalid"), "true");
      assert.strictEqual(select.getAttribute("aria-invalid"), "true");
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      yield* Effect.sleep(20);
      select.value = "free";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      yield* Effect.sleep(20);

      assert.ok((yield* state).errors.accepted);
      assert.ok((yield* state).errors.plan);
      assert.strictEqual(checkbox.getAttribute("aria-invalid"), "true");
      assert.strictEqual(select.getAttribute("aria-invalid"), "true");

      checkbox.checked = true;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      select.value = "pro";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      yield* Effect.sleep(40);

      assert.deepStrictEqual((yield* state).errors, {});
      assert.strictEqual(checkbox.hasAttribute("aria-invalid"), false);
      assert.strictEqual(select.hasAttribute("aria-invalid"), false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("keeps submitting true for the lifetime of an async valid submission", async () => {
    document.body.replaceChildren();
    let observedSubmitting = false;
    await Effect.gen(function* () {
      const state = yield* Form.makeState(Schema.Struct({ email: Schema.String }), {
        values: { email: "hello@example.com" },
      });
      yield* render(
        Form.Form({
          state,
          content: Form.Submit({ content: "Submit" }),
          onValidSubmit: Effect.fn(() =>
            Effect.gen(function* () {
              observedSubmitting = (yield* state).submitting;
              yield* Effect.sleep(10);
            }),
          ),
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      document
        .querySelector("form")
        ?.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
      yield* Effect.sleep(20);
      assert.strictEqual(observedSubmitting, true);
      assert.strictEqual((yield* state).submitting, false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("decodes native input into its hydrated field state", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Form.makeState(Schema.Struct({ quantity: Schema.FiniteFromString }), {
        values: { quantity: 1 },
      });
      yield* render(
        Form.Form({
          state,
          content: Form.NumberInput({ state, name: "quantity" }),
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const input = document.querySelector('input[name="quantity"]') as HTMLInputElement;
      input.value = "3";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).values.quantity, 3);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("submits current decoded state instead of re-parsing DOM FormData", async () => {
    document.body.replaceChildren();
    let submitted = 0;
    await Effect.gen(function* () {
      const state = yield* Form.makeState(Schema.Struct({ quantity: Schema.FiniteFromString }), {
        values: { quantity: 1 },
      });
      yield* render(
        Form.Form({
          state,
          content: Form.NumberInput({ state, name: "quantity" }),
          onValidSubmit: Effect.fn((values) =>
            Effect.sync(() => {
              submitted = values.quantity;
            }),
          ),
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const form = document.querySelector("form")!;
      const input = document.querySelector('input[name="quantity"]') as HTMLInputElement;
      input.value = "7";
      const event = new SubmitEvent("submit", { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
      yield* Effect.sleep(0);

      assert.strictEqual(event.defaultPrevented, true);
      assert.strictEqual((yield* state).values.quantity, 1);
      assert.strictEqual(submitted, 1);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("decodes a masked input into its named slot object", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const phone = Form.mask(
        "(",
        Form.slot("area", Schema.FiniteFromString, { length: 3 }),
        ") ",
        Form.slot("line", Schema.FiniteFromString, { length: 4 }),
      );
      const PhoneForm = Form.make(Schema.Struct({ phone }));
      const state = yield* PhoneForm.state({ phone: { area: 555, line: 1234 } });
      yield* render(
        PhoneForm.Root({
          form: state,
          content: PhoneForm.MaskedInput({ name: "phone" }),
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const input = document.querySelector('input[name="phone"]') as HTMLInputElement;
      assert.strictEqual(input.value, "(555) 1234");
      input.value = "(212) 8675";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      yield* Effect.sleep(0);

      assert.deepStrictEqual((yield* state).values.phone, { area: 212, line: 8675 });

      input.value = "not a phone";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      yield* Effect.sleep(0);

      assert.deepStrictEqual((yield* state).values.phone, { area: 212, line: 8675 });
      assert.notStrictEqual((yield* state).errors.phone, undefined);

      input.value = "(646) 5555";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual(Object.hasOwn((yield* state).errors, "phone"), false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("restores the live input value when form state resets", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const UserForm = Form.make(Schema.Struct({ email: Schema.String }));
      const state = yield* UserForm.state({ email: "initial@example.com" });
      yield* render(
        UserForm.Root({
          form: state,
          content: UserForm.EmailInput({ name: "email" }),
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const input = document.querySelector('input[name="email"]') as HTMLInputElement;

      input.value = "changed@example.com";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      yield* Effect.sleep(0);
      yield* Form.reset(state);
      yield* Effect.promise(() =>
        vi.waitFor(() => assert.strictEqual(input.value, "initial@example.com")),
      );
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
