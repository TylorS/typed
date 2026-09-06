import { Deferred, Effect, Schema, SchemaTransformation } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, EventHandler, render } from "@typed/template";
import { assert, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import * as Form from "../Form.js";

const phone = Form.mask(
  "(",
  Form.slot("area", Schema.String, { length: 3, charset: /[0-9]/ }),
  ") ",
  Form.slot("prefix", Schema.String, { length: 3, charset: /[0-9]/ }),
  "-",
  Form.slot("line", Schema.String, { length: 4, charset: /[0-9]/ }),
);
const Phone = Form.make(Schema.Struct({ phone }));
const initial = { area: "555", prefix: "123", line: "4567" };

const setup = Effect.fn(function* (explicit = false) {
  document.body.replaceChildren();
  const state = yield* Phone.state({ phone: initial }, { id: "test-phone" });
  const submit = vi.fn();
  yield* render(
    Phone.Root({
      form: state,
      onValidSubmit: (values) => Effect.sync(() => submit(values)),
      content: [
        Phone.Label({ for: "phone-input", content: "Phone" }),
        explicit
          ? Form.MaskedInput({ state, name: "phone", mask: phone, props: { id: "phone-input" } })
          : Phone.MaskedInput({ name: "phone", props: { id: "phone-input" } }),
        Phone.Error({ name: "phone" }),
        Phone.Submit({ content: "Save" }),
      ],
    }),
    document.body,
  ).pipe(Fx.take(1), Fx.collectAll);
  return { state, input: document.querySelector("input")!, submit };
});
const run = <E>(
  effect: Effect.Effect<
    void,
    E,
    import("effect/Scope").Scope | import("@typed/template").RenderTemplate
  >,
) =>
  effect.pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);

it("formats a phone as digits are typed instead of rejecting the unformatted draft", () =>
  run(
    Effect.gen(function* () {
      const { state, input } = yield* setup();
      yield* Effect.promise(() => userEvent.clear(input));
      assert.strictEqual(input.value, "");
      yield* Effect.promise(() => userEvent.type(input, "2128675309"));
      assert.strictEqual(input.value, "(212) 867-5309");
      assert.strictEqual(input.selectionStart, 14);
      assert.deepStrictEqual((yield* state).values.phone, {
        area: "212",
        prefix: "867",
        line: "5309",
      });
      assert.strictEqual(input.validity.valid, true);
    }),
  ));

it("preserves leading zeros and formatted or unformatted paste on the explicit API", () =>
  run(
    Effect.gen(function* () {
      const { state, input } = yield* setup(true);
      for (const pasted of ["0200010002", "(020) 001-0002"]) {
        input.value = pasted;
        input.setSelectionRange(pasted.length, pasted.length);
        input.dispatchEvent(
          new InputEvent("input", { bubbles: true, inputType: "insertFromPaste", data: pasted }),
        );
        yield* Effect.promise(() =>
          vi.waitFor(() => assert.strictEqual(input.value, "(020) 001-0002")),
        );
        assert.deepStrictEqual((yield* state).values.phone, {
          area: "020",
          prefix: "001",
          line: "0002",
        });
      }
    }),
  ));

it("replaces selected digits without moving the caret to the end", () =>
  run(
    Effect.gen(function* () {
      const { input } = yield* setup();
      input.focus();
      input.setSelectionRange(6, 9);
      yield* Effect.promise(() => userEvent.keyboard("867"));
      assert.strictEqual(input.value, "(555) 867-4567");
      assert.strictEqual(input.selectionStart, 9);
    }),
  ));

it("backspace and delete cross literals instead of getting stuck restoring punctuation", () =>
  run(
    Effect.gen(function* () {
      const { input, state } = yield* setup();
      input.focus();
      input.setSelectionRange(6, 6);
      yield* Effect.promise(() => userEvent.keyboard("{Backspace}"));
      assert.strictEqual(input.value, "(551) 234-567");
      assert.strictEqual(input.selectionStart, 3);
      yield* Form.reset(state);
      yield* Effect.promise(() =>
        vi.waitFor(() => assert.strictEqual(input.value, "(555) 123-4567")),
      );
      input.setSelectionRange(9, 9);
      yield* Effect.promise(() => userEvent.keyboard("{Delete}"));
      assert.strictEqual(input.value, "(555) 123-567");
      assert.strictEqual(input.selectionStart, 9);
    }),
  ));

it("retains incomplete drafts, links a useful error, blocks native submission, and resets", () =>
  run(
    Effect.gen(function* () {
      const { state, input, submit } = yield* setup();
      yield* Effect.promise(() => userEvent.clear(input));
      yield* Effect.promise(() => userEvent.type(input, "212"));
      assert.strictEqual(input.value, "(212");
      assert.deepStrictEqual((yield* state).values.phone, initial);
      yield* Effect.promise(() =>
        vi.waitFor(() => assert.isNotNull(input.getAttribute("aria-describedby"))),
      );
      const error = document.getElementById(input.getAttribute("aria-describedby")!)!;
      assert.match(error.textContent!, /Enter a complete value in the format/);
      assert.strictEqual(input.getAttribute("aria-invalid"), "true");
      yield* Effect.promise(() => userEvent.click(document.querySelector("button")!));
      assert.strictEqual(submit.mock.calls.length, 0);
      yield* Form.reset(state);
      yield* Effect.promise(() =>
        vi.waitFor(() => assert.strictEqual(input.value, "(555) 123-4567")),
      );
      assert.strictEqual(input.validity.valid, true);
      yield* Effect.promise(() =>
        vi.waitFor(() => assert.strictEqual(input.hasAttribute("aria-invalid"), false)),
      );
    }),
  ));

it("does not rewrite composing text and formats once composition ends", () =>
  run(
    Effect.gen(function* () {
      const { input, state } = yield* setup();
      input.focus();
      input.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
      input.value = "2128675309";
      input.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          isComposing: true,
          inputType: "insertCompositionText",
        }),
      );
      assert.strictEqual(input.value, "2128675309");
      assert.deepStrictEqual((yield* state).values.phone, initial);
      input.setSelectionRange(10, 10);
      input.dispatchEvent(
        new CompositionEvent("compositionend", { bubbles: true, data: "2128675309" }),
      );
      yield* Effect.promise(() =>
        vi.waitFor(() => assert.strictEqual(input.value, "(212) 867-5309")),
      );
      assert.deepStrictEqual((yield* state).values.phone, {
        area: "212",
        prefix: "867",
        line: "5309",
      });
    }),
  ));

it("keeps invalid and oversized paste visible and allows replacing it with a valid value", () =>
  run(
    Effect.gen(function* () {
      const { input, state } = yield* setup();
      for (const text of ["21286753090", "212abc5309"]) {
        input.value = text;
        input.dispatchEvent(
          new InputEvent("input", { bubbles: true, inputType: "insertFromPaste", data: text }),
        );
        yield* Effect.promise(() =>
          vi.waitFor(() => assert.strictEqual(input.validity.customError, true)),
        );
        assert.strictEqual(input.value, text);
        assert.deepStrictEqual((yield* state).values.phone, initial);
      }
      yield* Effect.promise(() => userEvent.clear(input));
      yield* Effect.promise(() => userEvent.type(input, "0200010002"));
      assert.strictEqual(input.value, "(020) 001-0002");
      assert.strictEqual(input.validity.valid, true);
    }),
  ));

it("retains a static prefix and suffix after completing a fixed-width value", () =>
  run(
    Effect.gen(function* () {
      document.body.replaceChildren();
      const weight = Form.mask(
        "Weight: ",
        Form.slot("amount", Schema.String, { length: 3, charset: /[0-9]/ }),
        " kg",
      );
      const Weight = Form.make(Schema.Struct({ weight }));
      const state = yield* Weight.state({ weight: { amount: "123" } });
      yield* render(
        Weight.Root({ form: state, content: Weight.MaskedInput({ name: "weight" }) }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const input = document.querySelector("input")!;
      yield* Effect.promise(() => userEvent.clear(input));
      yield* Effect.promise(() => userEvent.type(input, "045"));
      assert.strictEqual(input.value, "Weight: 045 kg");
      assert.deepStrictEqual((yield* state).values.weight, { amount: "045" });
    }),
  ));

it("keeps drafts independent across controls and responds to external field replacement", () =>
  run(
    Effect.gen(function* () {
      document.body.replaceChildren();
      const first = yield* Phone.state({ phone: initial }, { id: "first-phone" });
      const second = yield* Phone.state({ phone: initial }, { id: "second-phone" });
      yield* render(
        [
          Phone.Root({ form: first, content: Phone.MaskedInput({ name: "phone" }) }),
          Phone.Root({ form: second, content: Phone.MaskedInput({ name: "phone" }) }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const [firstInput, secondInput] = document.querySelectorAll("input");
      yield* Effect.promise(() => userEvent.clear(firstInput));
      yield* Effect.promise(() => userEvent.type(firstInput, "020"));
      assert.strictEqual(firstInput.value, "(020");
      assert.strictEqual(secondInput.value, "(555) 123-4567");
      yield* Form.setValue(first, "phone", { area: "212", prefix: "867", line: "5309" });
      yield* Effect.promise(() =>
        vi.waitFor(() => assert.strictEqual(firstInput.value, "(212) 867-5309")),
      );
      assert.strictEqual(firstInput.validity.valid, true);
    }),
  ));

it("allocates composition and draft state separately when the same explicit field Fx is mounted twice", () =>
  run(
    Effect.gen(function* () {
      document.body.replaceChildren();
      const state = yield* Phone.state({ phone: initial });
      const field = Form.MaskedInput({ state, name: "phone", mask: phone });
      yield* render(Phone.Root({ form: state, content: [field, field] }), document.body).pipe(
        Fx.take(1),
        Fx.collectAll,
      );
      const [first, second] = document.querySelectorAll("input");
      first.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
      first.value = "composing";
      first.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true }));
      second.value = "2128675309";
      second.setSelectionRange(10, 10);
      second.dispatchEvent(new InputEvent("input", { bubbles: true }));
      yield* Effect.promise(() =>
        vi.waitFor(() => assert.strictEqual(second.value, "(212) 867-5309")),
      );
      assert.deepStrictEqual((yield* state).values.phone, {
        area: "212",
        prefix: "867",
        line: "5309",
      });
    }),
  ));

it("honors an Effectful consumer cancellation before modifying a literal-boundary deletion", () =>
  run(
    Effect.gen(function* () {
      document.body.replaceChildren();
      const state = yield* Phone.state({ phone: initial });
      yield* render(
        Phone.Root({
          form: state,
          content: Form.MaskedInput({
            state,
            name: "phone",
            mask: phone,
            onbeforeinput: EventHandler.make((event: InputEvent) =>
              Effect.sync(() => event.preventDefault()),
            ),
          }),
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const input = document.querySelector("input")!;
      input.focus();
      input.setSelectionRange(6, 6);
      yield* Effect.promise(() => userEvent.keyboard("{Backspace}"));
      assert.strictEqual(input.value, "(555) 123-4567");
      assert.deepStrictEqual((yield* state).values.phone, initial);
    }),
  ));

it("does not let a slow slot decoder overwrite a newer edit or reset", () =>
  run(
    Effect.gen(function* () {
      for (const action of ["edit", "reset", "other-field"] as const) {
        document.body.replaceChildren();
        const release = yield* Deferred.make<void>();
        const started = yield* Deferred.make<void>();
        const finished = yield* Deferred.make<void>();
        const delayed = Schema.String.pipe(
          Schema.decodeTo(
            Schema.String,
            SchemaTransformation.transformOrFail({
              decode: (value) =>
                value === "111"
                  ? Effect.gen(function* () {
                      yield* Deferred.succeed(started, undefined);
                      yield* Deferred.await(release);
                      yield* Deferred.succeed(finished, undefined);
                      return value;
                    })
                  : Effect.succeed(value),
              encode: (value) => Effect.succeed(value),
            }),
          ),
        );
        const code = Form.mask(Form.slot("digits", delayed, { length: 3, charset: /[0-9]/ }));
        const Codes = Form.make(Schema.Struct({ code, email: Schema.String }));
        const state = yield* Codes.state({ code: { digits: "000" }, email: "before@example.com" });
        yield* render(
          Codes.Root({ form: state, content: Codes.MaskedInput({ name: "code" }) }),
          document.body,
        ).pipe(Fx.take(1), Fx.collectAll);
        const input = document.querySelector("input")!;
        input.value = "111";
        input.dispatchEvent(new InputEvent("input", { bubbles: true }));
        yield* Deferred.await(started);
        if (action === "reset") yield* Form.reset(state);
        else if (action === "other-field")
          yield* Form.setValue(state, "email", "after@example.com");
        else {
          input.value = "222";
          input.dispatchEvent(new InputEvent("input", { bubbles: true }));
        }
        yield* Deferred.succeed(release, undefined);
        yield* Deferred.await(finished);
        yield* Effect.sleep(0);
        const expected = action === "reset" ? "000" : action === "edit" ? "222" : "111";
        assert.deepStrictEqual((yield* state).values.code, { digits: expected });
        assert.strictEqual(
          (yield* state).values.email,
          action === "other-field" ? "after@example.com" : "before@example.com",
        );
        yield* Effect.promise(() => vi.waitFor(() => assert.strictEqual(input.value, expected)));
      }
    }),
  ));

it("resets to defaults replaced after mounting", () =>
  run(
    Effect.gen(function* () {
      const { state, input } = yield* setup();
      const replacement = { area: "020", prefix: "001", line: "0002" };
      yield* RefSubject.update(state, (current) => ({
        ...current,
        defaultValues: { phone: replacement },
      }));
      yield* Form.reset(state);
      assert.deepStrictEqual((yield* state).values.phone, replacement);
      yield* Effect.promise(() =>
        vi.waitFor(() => assert.strictEqual(input.value, "(020) 001-0002")),
      );
      assert.strictEqual(input.validity.valid, true);
    }),
  ));
