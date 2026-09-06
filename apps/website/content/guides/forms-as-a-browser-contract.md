---
title: "Forms as a browser contract"
summary: "Build a trial-request editor by connecting native controls, decoded schema values, accessible errors, and an explicit submission preview."
section: "UI / Forms"
kind: "guide"
order: 239
---

A form begins with a person trying to complete a task: enter an email address, choose a plan, correct
an invalid quantity, and submit without losing their work. Treating every field as a generic state
setter obscures the browser behavior that makes this possible. `@typed/ui/Form` keeps native
controls and adds a typed boundary between their representations and the values your application
uses.

This walkthrough builds a trial-request editor. Submitting produces a visible preview of decoded
request values; it does not contact a server. That makes the complete interaction available to
inspect before attaching a request service. Read [component construction](/explore/building-ui-components)
and [RefSubject state](/explore/composing-refsubject-state) first if the generator and reactive
content are unfamiliar. The [Form primitive guide](/explore/ui-form) explains the broader API and
its current implementation limits.

## Choose application values before controls

The request needs an email string, a positive integer team size, one of two plans, and a boolean preference.
A number input exposes a string to JavaScript while the request needs a number. A field codec
makes that conversion explicit: `Schema.FiniteFromString` has a string encoding and a finite numeric
Type. The initial form state therefore contains `teamSize: 1`, not `"1"`.

`Form.make` binds a Struct once. Its input methods accept only compatible field names, so selecting
`email` as the name of NumberInput is a type error. This is more useful than choosing a generic
input and casting its event value to the application's expected type.

```ts
import { Schema } from "effect";
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Form from "@typed/ui/Form";

const TrialRequest = Form.make(Schema.Struct({
  email: Schema.String,
  teamSize: Schema.FiniteFromString.pipe(Schema.check(Schema.isInt(), Schema.isGreaterThan(0))),
  plan: Schema.Literals(["starter", "team"]),
  productUpdates: Schema.Boolean,
}));

export const TrialRequestEditor = component(function* () {
  const form = yield* TrialRequest.state(
    { email: "", teamSize: 1, plan: "starter", productUpdates: false },
    { id: "trial-request" },
  );
  const preview = yield* RefSubject.make("No request preview yet.");
  const submitting = RefSubject.map(form, (state) => state.submitting);

  return html`<section aria-labelledby="trial-title">
    <h2 id="trial-title">Preview a trial request</h2>
    <p>Enter your team's details. This editor previews the request locally.</p>
    ${TrialRequest.Root({
      form,
      props: { class: "trial-form" },
      content: [
        TrialRequest.Label({ for: "trial-email", content: "Work email" }),
        TrialRequest.EmailInput({
          name: "email",
          props: { id: "trial-email", autocomplete: "email", required: true },
        }),
        TrialRequest.Error({ name: "email" }),
        TrialRequest.Label({ for: "trial-size", content: "People on your team (at least 1)" }),
        TrialRequest.NumberInput({
          name: "teamSize",
          props: { id: "trial-size", min: 1, step: 1, required: true },
        }),
        TrialRequest.Error({ name: "teamSize" }),
        TrialRequest.Label({ for: "trial-plan", content: "Plan" }),
        TrialRequest.Select({
          name: "plan",
          props: { id: "trial-plan" },
          content: html`<option value="starter">Starter</option>
            <option value="team">Team</option>`,
        }),
        TrialRequest.Group({
          label: "Email preferences",
          content: [
            TrialRequest.Checkbox({ name: "productUpdates", props: { id: "trial-updates" } }),
            TrialRequest.Label({ for: "trial-updates", content: "Send product updates" }),
          ],
        }),
        TrialRequest.Submit({ content: "Preview request", props: { "?disabled": submitting } }),
        TrialRequest.Reset({ content: "Restore defaults" }),
      ],
      onValidSubmit: (values) => RefSubject.set(
        preview,
        `${values.email}: ${values.plan} trial for ${values.teamSize} people. ` +
          `Product updates: ${values.productUpdates ? "yes" : "no"}.`,
      ),
    })}
    <p role="status">${preview}</p>
  </section>`;
});
```

Mount this Fx with the application's existing renderer and Scope, as shown in
[Mounting DOM output](/explore/mounting-dom-output). Its state, listeners, and reactive template
content then share that render lifetime. The preview subject belongs to the enclosing editor
because it appears outside Root; bound fields belong under Root because they consume its current
form service.

## Let the browser do the interaction it already knows

The label's `for` and the input's `id` establish a real native relationship, including click-to-focus
behavior. EmailInput supplies the email input type; `autocomplete`, `required`, and min/step are
native metadata. Select contains actual option elements, so the browser supplies the platform
picker. This is not the popup/listbox [Select primitive](/explore/ui-select).

Submit is a native submit button. Enter in an eligible field and button activation converge on the
same form submit event, rather than two separate request handlers. Browser constraint validation
can stop an invalid form before that event occurs. Root then prevents native navigation and runs
its decoded-value validation. The [HTML form standard](https://html.spec.whatwg.org/multipage/forms.html#the-form-element)
is the platform baseline; a form is not a single APG composite widget with one universal keyboard
pattern.

Native and application validation solve different problems. In this example `required` rejects an
empty email through the browser, while `Schema.String` alone does not enforce that policy on a
programmatic value. Schema checks enforce a positive integer team size and the two allowed plans,
while `step: 1` configures native integer stepping. Before connecting a service, define its email
and business rules and validate requests at the service boundary too.

## Follow an edit through decoding and feedback

On a successful edit the input codec decodes browser text, updates the corresponding `values`
field, records metadata, and clears its field error. A failed decode keeps the last decoded value
and records an error. Because the renderer encodes state back into `.value`, it does not promise
to retain arbitrary invalid draft text unchanged. Test empty numbers, partial dates, and the codecs
your product actually uses.

`Form.Error` renders an alert with a generated field-error ID. The input uses that ID for
`aria-describedby` and sets `aria-invalid` when an error exists. This makes the message reachable
from the field as well as available for announcement. [W3C ARIA21](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA21)
explains why identifying the invalid field matters. Authors must provide useful labels, stable IDs,
and correction instructions; Typed provides the field binding and generated error relationship.

Description is a neutral visible host and creates no automatic association. In the current input
implementation, the generated error description is authoritative; do not assume another
`aria-describedby` in consumer props is merged with it. Put essential short constraints in the
label or visible nearby text, or design a custom field relationship carefully.

Whole-form validation checks current decoded values, clears errors on success, and copies its
aggregate error message across fields on failure. A prior field decode error alone does not ensure
submission fails if the retained decoded value still validates. When a workflow must reject any
invalid draft, add that policy explicitly and test it. This distinction is especially important for
programmatic submission and custom controls that do not use native validity checks.

## Attach request work at the submission boundary

The example handler updates a local preview, which makes the decoded result visible. To perform
an actual request, return the service Effect from `onValidSubmit`. Root marks `submitting` during
validation and the returned Effect and clears it on finalization. Binding it to Submit gives the
user visible interaction feedback; it is not a cross-request lock or a server idempotency guarantee.

Choose recovery before launching remote work: retain entered values after a server rejection,
explain what can be retried, and distinguish a business rejection from a transport failure. Form
does not infer field errors from an HTTP response. Keep those errors within an explicit application
model, and use an [Alert](/explore/ui-alert) only when the message warrants interruption. Do not
launch a detached promise inside the callback and immediately return; Root can only track work
represented by the returned Effect.

This submit path reads decoded state, not native FormData. The separate `formDataToRecord` and
`decodeFormData` APIs are useful when actual FormData is your boundary. In particular, native
checkbox omission and disabled-field omission are not the same thing as a boolean or value already
stored in form state.

## Reset an editor rather than only its DOM

Reset restores `defaultValues`, clears errors and metadata, and clears submitting. It does not
cancel a request already running. In this walkthrough it also leaves the previous request preview
visible, because that preview is an independently owned result. If “start over” should clear both,
make it a named application action that updates both subjects rather than hiding that behavior
inside a generic reset button.

Use `Form.setValue` to assign an already-decoded field value. It updates touched/dirty metadata
without validating the value or clearing an existing field error. Decode unknown data with Effect
Schema first; call `Form.validate(form)` for an explicit whole-form check. Successful validation
clears errors, while failure returns a `SchemaError`. Dirty tracking compares the new value with
the default; touched is not specifically a blur flag. A new record should get the correct defaults
and identity instead of silently inheriting the
old record's errors. For server rendering, use stable explicit form/control IDs and matching
initial data; [hydration](/explore/server-rendering-and-hydration) covers that handoff.

## Verify one complete user path

Style the native hosts through classes and `[aria-invalid]`. Preserve focus rings and visible error
text in each theme; color alone cannot explain a correction. Custom hosts must forward native
props, events, and hydration refs. Swapping a select for styled divs is a different control
implementation, not a CSS adjustment.

For this editor, exercise the label targets, native empty-email feedback, positive team-size rule,
keyboard submission, displayed decoded preview, and reset. Add a service-level test for whatever
request contract replaces the preview handler. These are verification tasks for the consuming
application, not claims that copying this example establishes accessibility compliance.

Continue with the [Form API](/reference/modules/%40typed%2Fui%2FForm),
[Button activation](/explore/ui-button), [Checkbox state](/explore/ui-checkbox),
and [SpinButton](/explore/ui-spin-button) to compare the thinner standalone control boundary.
