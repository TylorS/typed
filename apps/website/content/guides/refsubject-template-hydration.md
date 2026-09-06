---
title: "Hydrate RefSubject state through Template"
summary: "Carry Schema-checked RefSubject state from Typed HTML into the adopted browser DOM."
section: "State"
kind: "guide"
order: 2.04
---

`RefSubject.hydrate` is the hydration-aware form of RefSubject construction. It accepts the same
initial value shapes as `RefSubject.make`, but adds an Effect Schema codec and a `HydrationRef`
protocol. On the server it encodes the ref's current value into HTML; during Typed DOM hydration it
decodes that value before the ref's ordinary initializer continues.

Use it only for state that crosses this server-to-browser boundary. Use `RefSubject.make` for state
that begins and stays in one runtime. Hydration is not a general persistence mechanism: the browser
must be adopting compatible Typed HTML from the same template.

## Hydrate one state value on its element host

Pass the hydrated ref to Template's `ref` directive. The directive gives the HTML renderer an
attribute host and gives the DOM renderer the exact element from which it restores the value. The
ref remains ordinary writable state after hydration.

```ts
import { Schema } from "effect"
import { component } from "@typed/ui/Component"
import { RefSubject } from "@typed/fx"
import { html } from "@typed/template"

const counter = component(function* () {
  const count = yield* RefSubject.hydrate(Schema.Finite, 0)

  return html`<button ref=${count} onclick=${RefSubject.increment(count)}>
    ${count}
  </button>`
})
```

Unnamed hydrated refs are stored together in Typed's versioned `data-typed-refsubject` envelope.
The DOM renderer removes that consumed envelope after it decodes successfully. A decoding failure
remains a typed `Schema.SchemaError` on the ref; it is not silently converted into a different
client-side default.

## Combine related state with `hydrateAll`

`hydrateAll` produces one `HydrationRef` for several hydrated refs. Attach the combined value to
one element with `ref`; it serializes and restores every member before ordinary reactive parts run.
Unnamed members share one envelope. Named members use their own readable `data-*` attributes and
stay synchronized with later successful state updates.

```ts
import { Schema } from "effect"
import { component } from "@typed/ui/Component"
import { RefSubject } from "@typed/fx"
import { html } from "@typed/template"

const preferences = component(function* () {
  const page = yield* RefSubject.hydrate(Schema.FiniteFromString, 1, { name: "page" })
  const density = yield* RefSubject.hydrate(Schema.String, "comfortable")
  const state = RefSubject.hydrateAll(page, density)

  return html`<section ref=${state} data-density=${density}>
    <p>Page ${page}</p>
  </section>`
})
```

Each member retains its own value type, typed failures, and codec-service requirements. Combining
two refs with the same named hydration attribute fails immediately, because there would be no
unambiguous DOM owner. Keep `hydrateAll` at the Template boundary; it does not make unrelated
RefSubjects one shared state model.

For the full DOM adoption contract, read [Hydrating Typed HTML](/explore/hydrating-typed-html). For
element references that acquire browser resources, read [Template references and element access](/explore/template-references-and-element-access).

## Keep the server snapshot and browser initializer in agreement

Hydration transfers the state that produced the HTML. A request-scoped server model may initialize
from a database; the browser may initialize from a client service. The encoded snapshot is the
handoff between them. Avoid running a second independent client fetch before restoration and then
expecting hydration to reconcile two unrelated results. If data should refresh immediately after
adoption, make that an explicit operation over the restored state.

Hydration gates the supplied initializer until the renderer chooses the server or DOM path.
On the DOM path, a live Fx/Stream first publishes the restored value, then starts its original
producer. Test that handoff and subsequent updates. This ordering applies to the supplied source;
it cannot coordinate an external producer that application code has already started independently.

Only serialize data intended for the browser. A schema validates its encoded shape; it does not
make hidden service credentials or internal records appropriate to embed in HTML. Project the
server model to the client contract before hydration. Keep stable entity IDs in that snapshot so
[keyed children](/explore/keyed-template-collections) adopt the same identities.

## Diagnose hydration failures at the handoff

Check the server's emitted attribute, the exact DOM element used by `ref`, the codec's encoded and
decoded types, and whether another process changed the markup. A string codec and a number codec
are different contracts even when both can display the same text. Named attributes remain readable
and synchronized; the unnamed envelope is consumed after successful decoding, so its removal is
expected and is not evidence that state was lost.

A useful integration test renders a non-default server value, hydrates it with a deliberately
different client initializer, and asserts both the adopted DOM and subsequent ref update. Also
exercise an invalid encoded payload and confirm the typed schema failure. Testing only the codec
round trip cannot prove the element-host protocol, while testing only the initial text cannot prove
that the browser adopted reactive state.
