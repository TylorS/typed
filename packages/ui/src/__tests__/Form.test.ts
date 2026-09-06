import { Effect, Exit, Schema } from "effect";
import { RefSubject } from "@typed/fx";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Form from "../Form.js";

describe("typed/ui/Form", () => {
  it("validates form state values with the provided schema", () =>
    Effect.gen(function* () {
      const schema = Form.StateSchema(Schema.Struct({ email: Schema.String }));
      const input: unknown = {
        values: { email: 123 },
        defaultValues: { email: "" },
        errors: {},
        meta: {},
        submitting: false,
      };
      const result = yield* Effect.exit(Schema.decodeUnknownEffect(schema)(input));

      assert.strictEqual(Exit.isFailure(result), true);
    }).pipe(Effect.runPromise));

  it("owns hydration on a native form host", () =>
    Effect.gen(function* () {
      const state = yield* Form.makeState(Schema.Struct({ email: Schema.String }), {
        values: { email: "" },
      });
      const markup = yield* renderToHtmlString(Form.Form({ state, content: "Fields" }));
      assert.match(markup, /<form data-typed-refsubject=/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));

  it("provides schema-bound form state to its fields", () =>
    Effect.gen(function* () {
      const UserForm = Form.make(Schema.Struct({ email: Schema.String }));
      const form = yield* UserForm.state({ email: "" });
      const markup = yield* renderToHtmlString(
        UserForm.Root({
          form,
          content: UserForm.EmailInput({ name: "email" }),
        }),
      );

      assert.include(markup, 'name="email"');
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));

  it("serializes form values through the provided schema", () =>
    Effect.gen(function* () {
      const createdAt = new Date("2026-08-24T12:34:56.000Z");
      const state = yield* Form.makeState(Schema.Struct({ createdAt: Schema.DateFromString }), {
        values: { createdAt },
      });
      const markup = yield* renderToHtmlString(Form.Form({ state, content: "Fields" }));

      assert.include(markup, "2026-08-24T12:34:56.000Z");
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));

  it("hydrates form values through the provided schema", () =>
    Effect.gen(function* () {
      const codec = Schema.Struct({ createdAt: Schema.DateFromString });
      const createdAt = new Date("2026-08-24T12:34:56.000Z");
      const server = yield* Form.makeState(codec, { values: { createdAt } });
      const attributes = yield* server[RefSubject.HydrationRefTypeId].toAttributes;
      const values = new Map(attributes.map(({ name, value }) => [name, value]));
      const element: RefSubject.HydrationElement = {
        getAttribute: (name) => values.get(name) ?? null,
        setAttribute: (name, value) => values.set(name, value),
        removeAttribute: (name) => {
          values.delete(name);
        },
      };
      const client = yield* Form.makeState(codec, {
        values: { createdAt: new Date("2000-01-01T00:00:00.000Z") },
      });

      yield* client(element);
      const hydrated = yield* client;

      assert.instanceOf(hydrated.values.createdAt, Date);
      assert.strictEqual(hydrated.values.createdAt.toISOString(), createdAt.toISOString());
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders a text input for a string form field", () =>
    Effect.gen(function* () {
      const state = yield* Form.makeState(Schema.Struct({ email: Schema.String }), {
        values: { email: "" },
      });
      const markup = yield* renderToHtmlString(Form.TextInput({ state, name: "email" }));
      assert.strictEqual(markup.includes('type="text"'), true);
      assert.strictEqual(markup.includes('name="email"'), true);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));

  it("renders a number input for a numeric form field", () =>
    Effect.gen(function* () {
      const state = yield* Form.makeState(Schema.Struct({ quantity: Schema.FiniteFromString }), {
        values: { quantity: 0 },
      });
      const markup = yield* renderToHtmlString(Form.NumberInput({ state, name: "quantity" }));
      assert.strictEqual(markup.includes('type="number"'), true);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));

  it("renders a native label", () =>
    Effect.gen(function* () {
      const markup = yield* renderToHtmlString(Form.Label({ for: "email", content: "Email" }));
      assert.strictEqual(markup.includes('<label for="email">'), true);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));

  it("decodes native FormData through a form schema", () =>
    Effect.gen(function* () {
      const data = new FormData();
      data.set("email", "hello@example.com");
      data.set("quantity", "2");
      const values = yield* Form.decodeFormData(
        Schema.Struct({ email: Schema.String, quantity: Schema.FiniteFromString }),
        data,
      );
      assert.deepStrictEqual(values, { email: "hello@example.com", quantity: 2 });
    }).pipe(Effect.runPromise));

  it("validates the decoded state against the type side of the form schema", () =>
    Effect.gen(function* () {
      const state = yield* Form.makeState(
        Schema.Struct({ quantity: Schema.Finite.check(Schema.isGreaterThan(0)) }),
        { values: { quantity: 1 } },
      );
      yield* state;
      yield* Form.setValue(state, "quantity", -1);
      const result = yield* Effect.exit(Form.validate(state));

      assert.strictEqual(Exit.isFailure(result), true);
      assert.isDefined((yield* state).errors.quantity);
    }).pipe(
      Effect.provideService(RefSubject.CurrentComputedBehavior, "one"),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("round-trips a named-slot mask", () =>
    Effect.gen(function* () {
      const phone = Form.mask(
        "(",
        Form.slot("area", Schema.FiniteFromString, { length: 3 }),
        ") ",
        Form.slot("prefix", Schema.FiniteFromString, { length: 3 }),
        "-",
        Form.slot("line", Schema.FiniteFromString, { length: 4 }),
      );
      const value = { area: 555, prefix: 123, line: 4567 };
      const encoded = yield* Schema.encodeUnknownEffect(phone)(value);
      const decoded = yield* Schema.decodeEffect(phone)(encoded);
      assert.strictEqual(encoded, "(555) 123-4567");
      assert.deepStrictEqual(decoded, value);
    }).pipe(Effect.runPromise));

  it("hydrates the serializable form snapshot", () =>
    Effect.gen(function* () {
      const state = yield* Form.makeState(Schema.Struct({ email: Schema.String }), {
        values: { email: "" },
      });
      assert.strictEqual(RefSubject.isHydrationRef(state), true);
      assert.deepStrictEqual((yield* state).values, { email: "" });
    }).pipe(
      Effect.provideService(RefSubject.CurrentComputedBehavior, "one"),
      Effect.scoped,
      Effect.runPromise,
    ));
});
