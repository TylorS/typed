---
title: "Form: schema-bound controls and submission state"
summary: "Understand decoded values, field codecs, form context, validation, metadata, and the native submit boundary."
section: "UI / Forms"
kind: "guide"
order: 238
---

A form crosses three representations: browser text and checked properties, decoded application values, and the request sent to a service. `Form` connects the first two with Schema codecs; the application decides the third. Read [Forms as a browser contract](/explore/forms-as-a-browser-contract) for the full trial-request walkthrough. This guide explains the module's mechanisms and their limits.

## Bind a field codec once

`Form.make(Schema.Struct(...))` returns a schema-bound factory. Its `state` takes decoded defaults; its `Root` accepts the resulting `form` and provides current-form context to bound child controls. NumberInput requires a numeric decoded field with a string encoding. A plain string field cannot accidentally become the name of a NumberInput.

```ts
import { Schema } from "effect";
import { html } from "@typed/template";
import { RefSubject } from "@typed/fx";
import { component } from "@typed/ui/Component";
import * as Form from "@typed/ui/Form";

const Order = Form.make(Schema.Struct({
  copies: Schema.FiniteFromString.pipe(Schema.check(Schema.isInt(), Schema.isGreaterThan(0))),
  includeNotes: Schema.Boolean,
}));

export const PrintOrder = component(function* () {
  const form = yield* Order.state({ copies: 1, includeNotes: false }, { id: "print-order" });
  const submitting = RefSubject.map(form, (state) => state.submitting);
  const preview = yield* RefSubject.make("No print request preview yet.");
  return html`<section>${Order.Root({
    form,
    content: [
      Order.Label({ for: "order-copies", content: "Copies" }),
      Order.NumberInput({ name: "copies", props: { id: "order-copies", min: 1, required: true } }),
      Order.Error({ name: "copies" }),
      Order.Checkbox({ name: "includeNotes", props: { id: "order-notes" } }),
      Order.Label({ for: "order-notes", content: "Include speaker notes" }),
      Order.Submit({ content: "Preview print request", props: { "?disabled": submitting } }),
      Order.Reset({ content: "Restore defaults" }),
    ],
    onValidSubmit: (values) => RefSubject.set(
      preview,
      `${values.copies} copies; notes ${values.includeNotes ? "included" : "excluded"}.`,
    ),
  })}<p role="status">${preview}</p></section>`;
});
```

This example renders decoded request values in a status paragraph. Supply the actual service Effect in `onValidSubmit`; its errors and environment remain part of the component contract. Do not launch it with a detached runPromise inside a DOM callback, which separates it from render lifetime and submitting cleanup.

## Follow a value through the field boundary

Input handlers decode native strings using the field codec. A successful edit updates `values` and metadata, then clears that field's error. A failed decode records an error while retaining the last decoded value. The renderer encodes that retained value back into `.value`; this is not a promise to preserve arbitrary incomplete draft text. Test partial numeric/date editing when selecting codecs and controls.

`State` contains values, defaultValues, errors, meta, and submitting. `FieldMeta.dirty` compares the new field value with its default using reference/value inequality; `touched` becomes true on a successful update, including `setValue`. It is not specifically a blur flag, and object/array dirty tracking is not deep equality. `reset` restores defaults and clears errors/meta/submitting; it does not cancel an outstanding request.

`Form.setValue` assigns an already-decoded value and updates metadata; it does not run the field codec or clear an existing error. Decode unknown data with Effect Schema before assigning it. Use `Form.validate(form)` when you need an explicit whole-form check; successful validation clears errors, while failed validation returns a `SchemaError` as described below.

The factory includes string input variants, NumberInput/RangeInput, DateInput, boolean Checkbox, native Select, MaskedInput, and array Push/Remove. `mask` and `slot` build string codecs for structured text. When every slot declares a fixed length and a character set distinct from the punctuation, MaskedInput adds that punctuation while typing or pasting and preserves the caret across edits. Incomplete or invalid text remains visible until corrected; only decoded values reach form state. Use string slot codecs for identifiers such as phone numbers so leading zeroes survive. Variable-width or ambiguous masks still validate drafts but leave formatting to the user. Push/Remove operate on top-level array fields and do not invent nested field paths or a repeated editor. Explicit-state APIs (`makeState`, `Form`, and controls with `state`) are useful when library components receive state directly.

## Submission is not simply reading FormData

Root prevents native submission, validates the current decoded values through the schema's Type, and invokes the handler on success. It sets submitting while that work runs and clears it with finalization. Native constraint validation may prevent the browser from dispatching submit first; the [HTML form standard](https://html.spec.whatwg.org/multipage/forms.html#the-form-element) explains that platform boundary.

Current whole-form validation clears errors on success and assigns its aggregate schema error message across fields on failure. It does not build precise per-field issue paths. Because validation reads retained decoded values, a previous field decode error is not itself proof that whole-form validation will fail. Account for that distinction when a workflow must reject submission while any draft is invalid.

`formDataToRecord` and `decodeFormData` provide a separate boundary for actual FormData, preserving repeated entries as arrays. Root's submit flow does not implicitly call them. Browser field omission and decoded-state submission are therefore different models, especially for unchecked or disabled controls.

## Preserve relationships and recovery

Labels still need matching IDs. Error renders a field alert and the control receives generated `aria-invalid`/`aria-describedby`; Description is a neutral div and creates no automatic relationship. The error description is authoritative in the current input props, so do not assume a competing consumer description ID is merged. See [W3C ARIA21](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA21) for identifying invalid fields.

Style actual hosts with classes and `[aria-invalid]`, preserve focus rings, and retain error text beyond color. Bind submitting to appropriate controls, but treat duplicate request prevention and server errors as application policies. A bound input outside Root lacks CurrentForm; a nested form is not a remedy. Custom hosts must forward field props, native handlers, and hydration refs. The [Form API](/reference/modules/%40typed%2Fui%2FForm), [Button](/explore/ui-button), and [Checkbox](/explore/ui-checkbox) provide the underlying contracts.
