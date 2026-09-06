import * as Schema from "effect/Schema";
import { Fx, RefSubject } from "@typed/fx";
import { BrowserRouter } from "@typed/router/Router";
import { html } from "@typed/template";
import * as ButtonComponent from "../src/Button.js";
import * as CheckboxComponent from "../src/Checkbox.js";
import { component } from "../src/Component.js";
import * as FormComponent from "../src/Form.js";
import { Link as LinkComponent } from "../src/Link.js";
import * as MeterComponent from "../src/Meter.js";
import * as RadioGroupComponent from "../src/RadioGroup.js";
import * as SliderComponent from "../src/Slider.js";
import * as SpinButtonComponent from "../src/SpinButton.js";
import * as SwitchComponent from "../src/Switch.js";
import { story } from "./story.js";

export default { title: "Inputs" };

interface ButtonStoryProps {
  readonly label: string;
  readonly initialCount: number;
  readonly disabled: boolean;
}

const button = component(function* ({ label, initialCount, disabled }: ButtonStoryProps) {
  const state = yield* RefSubject.hydrate(Schema.FiniteFromString, initialCount, {
    name: "button-story",
  });
  const saveStatus = RefSubject.map(state, (count: number) =>
    count === 0 ? "Changes pending" : `Changes saved ${count} time${count === 1 ? "" : "s"}`,
  );

  return html`<section aria-label="Save changes" ref=${state}>
    <p>Use the typed event handler to persist the change.</p>
    ${ButtonComponent.Button({
      content: label,
      disabled,
      onclick: RefSubject.increment(state),
    })}
    <output aria-live="polite">${saveStatus}</output>
  </section>`;
});

export const Button = story(
  button,
  { label: "Save changes", initialCount: 0, disabled: false },
  {
    initialCount: { control: { type: "range", min: 0, max: 5, step: 1 } },
  },
);

const checkbox = Fx.gen(function* () {
  const state = yield* CheckboxComponent.makeState({ checked: true });
  return html`<label>Subscribe to updates ${CheckboxComponent.Input({ state })}</label>`;
});

export const Checkbox = story(checkbox);

const form = component(function* () {
  const phone = FormComponent.mask(
    "(",
    FormComponent.slot("area", Schema.String, { length: 3, charset: /[0-9]/ }),
    ") ",
    FormComponent.slot("prefix", Schema.String, { length: 3, charset: /[0-9]/ }),
    "-",
    FormComponent.slot("line", Schema.String, { length: 4, charset: /[0-9]/ }),
  );
  const ContactForm = FormComponent.make(Schema.Struct({ email: Schema.String, phone }));
  const formState = yield* ContactForm.state(
    {
      email: "hello@example.com",
      phone: { area: "555", prefix: "123", line: "4567" },
    },
    { id: "contact-information" },
  );
  const saved = yield* RefSubject.make("No changes saved yet.");

  return html`${ContactForm.Root({
      form: formState,
      onValidSubmit: (values) =>
        RefSubject.set(
          saved,
          `Saved ${values.email}: (${values.phone.area}) ${values.phone.prefix}-${values.phone.line}.`,
        ),
      content: [
        ContactForm.Group({
          label: "Contact information",
          content: html`<div class="story-field">
              ${ContactForm.Label({ for: "email", content: "Email" })}
              ${ContactForm.EmailInput({ name: "email", props: { id: "email", required: true, autocomplete: "email" } })}
              ${ContactForm.Error({ name: "email", props: { class: "story-error" } })}
            </div>
            <div class="story-field">
              ${ContactForm.Label({ for: "phone", content: "Phone (10 digits)" })}
              ${ContactForm.MaskedInput({
                name: "phone",
                props: {
                  id: "phone",
                  inputmode: "tel",
                  autocomplete: "tel-national",
                  required: true,
                },
              })}
              <small>Type or paste 10 digits. Parentheses and the dash are added for you.</small>
              ${ContactForm.Error({ name: "phone", props: { class: "story-error" } })}
            </div>`,
        }),
        ContactForm.Submit({ content: "Save contact" }),
        ContactForm.Reset({ content: "Reset" }),
      ],
    })}<output aria-live="polite">${saved}</output>`;
});

export const Form = story(form);

export const Link = story(
  Fx.provide(LinkComponent({ href: "/components", content: "Browse components" }), BrowserRouter()),
);

const meter = Fx.gen(function* () {
  const state = yield* MeterComponent.makeState({ value: 40 });
  return html`<div class="story-field">
    <label for="storage">Storage</label>
    ${MeterComponent.Meter({
      state,
      min: 0,
      max: 100,
      low: 25,
      high: 75,
      props: { id: "storage" },
    })}
  </div>`;
});

export const Meter = story(meter);

const radioGroup = Fx.gen(function* () {
  const state = yield* RadioGroupComponent.makeState({ value: "small" });
  const collection = yield* RadioGroupComponent.makeCollection();

  return RadioGroupComponent.Root({
    state,
    collection,
    label: "Size",
    content: html`<label for="small">Small</label>
      ${RadioGroupComponent.Item({ state, collection, id: "small", name: "size", value: "small" })}
      <label for="large">Large</label>
      ${RadioGroupComponent.Item({ state, collection, id: "large", name: "size", value: "large" })}`,
  });
});

export const RadioGroup = story(radioGroup);

const slider = Fx.gen(function* () {
  const state = yield* SliderComponent.makeState({ value: 60 });
  return html`<div class="story-field">
    <label for="volume">Volume</label>
    ${SliderComponent.Slider({ state, min: 0, max: 100, step: 1, props: { id: "volume" } })}
  </div>`;
});

export const Slider = story(slider);

const spinButton = Fx.gen(function* () {
  const state = yield* SpinButtonComponent.makeState({ value: 2 });
  return html`<div class="story-field">
    <label for="quantity">Quantity</label>
    ${SpinButtonComponent.SpinButton({ state, min: 0, max: 10, step: 1, props: { id: "quantity" } })}
  </div>`;
});

export const SpinButton = story(spinButton);

const switchControl = Fx.gen(function* () {
  const state = yield* SwitchComponent.makeState({ checked: true });
  return SwitchComponent.Switch({ state, content: "Notifications" });
});

export const Switch = story(switchControl);
