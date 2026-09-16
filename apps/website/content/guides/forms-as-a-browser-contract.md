---
title: "Forms as a browser contract"
summary: "Build one trial-request path with native controls, decoded values, errors, reset, and submit."
section: "UI / Forms"
kind: "guide"
order: 239
---

Build a native form that decodes field values, displays errors, and previews a valid submission.
The trial request below uses an email, a numeric team size, a plan, and an email preference.
Submission updates a local preview so you can inspect the decoded result without a server.

Read [component construction](/explore/ui-component) and
[RefSubject state](/explore/composing-refsubject-state) if the generator and reactive content are
unfamiliar. The [Form reference](/explore/ui-form) covers the individual APIs and their limits.

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
import { html, component } from "@typed/template";
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

Bound fields belong under Root because they consume its current-form service. The preview belongs
to the enclosing component and appears outside Root. Use the application's existing renderer;
[Mounting DOM output](/explore/mounting-dom-output) covers setup.

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

For custom descriptions or submission with invalid drafts, see the
[Form reference](/explore/ui-form). It explains generated description IDs and why whole-form
validation checks retained decoded values rather than every editing draft.

## Attach request work at the submission boundary

The handler receives decoded values and updates the preview. To perform a request, return its
Effect from `onValidSubmit`. Root keeps `submitting` true through validation and the returned
Effect, then clears it on finalization. The example binds this state to the submit button.
A detached promise would not be tracked. For remote failures, handle recovery in the returned
Effect; [errors and recovery](/explore/fx-errors-and-recovery) covers that composition.

## Reset an editor rather than only its DOM

Reset restores `defaultValues`, clears errors and metadata, and clears submitting. It does not
cancel a request already running. In this walkthrough it also leaves the previous request preview
visible, because that preview is an independently owned result. If “start over” should clear both,
make it a named application action that updates both subjects rather than hiding that behavior
inside a generic reset button.

For programmatic assignments, metadata, and explicit validation, see the
[Form state reference](/explore/ui-form#follow-a-value-through-the-field-boundary).

## Verify one complete user path

For this editor, exercise the label targets, native empty-email feedback, positive team-size rule,
keyboard submission, displayed decoded preview, and reset. Add a service-level test for whatever
request contract replaces the preview handler. Keep focus indicators and error text visible while testing those interactions.

Continue with the [Form API](/reference/modules/%40typed%2Fui%2FForm),
[Button activation](/explore/ui-button), [Checkbox state](/explore/ui-checkbox),
and [SpinButton](/explore/ui-spin-button) to compare the thinner standalone control boundary.
