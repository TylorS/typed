---
title: "Handle native events with Effect"
summary: "Attach real browser listeners whose work is an Effect, while keeping listener options, errors, services, and lifetime explicit."
section: "Template bindings"
kind: "guide"
order: 4
---

Saving a search begins as a native form submission and ends as application work. The browser owns
submit dispatch, cancellation, propagation, and the form's fields. The application owns validation,
the save operation, its errors, and feedback. An event part connects those responsibilities without
creating a synthetic event system.

Build the field first in [Authoring Typed templates](/explore/authoring-typed-templates). Here the
form's handler will read native input, call an Effect service, and remain owned by the running view.

## Use a plain Effect when the event carries no needed data

A clear button already knows which state it should change:

```ts
import { RefSubject } from "@typed/fx";
import { component } from "@typed/ui/Component";
import { html } from "@typed/template";

export const ClearSearch = component(function* () {
  const query = yield* RefSubject.make("scope");
  return html`<section>
    <output>${query}</output>
    <button type="button" onclick=${RefSubject.set(query, "")}>Clear search</button>
  </section>`;
});
```

The Effect is a reusable description. Each click runs it; constructing the template does not run
it once at module initialization. There is no need to wrap it in a callback that ignores an event.

## Read browser data at the event boundary

When the event selects the work, use `EventHandler.make`. The following handler reads a form field,
validates that it is a string, and delegates persistence to a service:

```ts
import { Context, Data, Effect } from "effect";
import { html } from "@typed/template";
import * as EventHandler from "@typed/template/EventHandler";

class SaveRejected extends Data.TaggedError("SaveRejected")<{
  readonly message: string;
}> {}
interface SavedSearches {
  readonly save: (query: string) => Effect.Effect<void, SaveRejected>;
}
const SavedSearches = Context.Service<SavedSearches>("SavedSearches");

const saveSearch = EventHandler.make(
  (event: SubmitEvent) => {
    const form = event.currentTarget as HTMLFormElement;
    const query = new FormData(form).get("query");
    if (typeof query !== "string" || query.trim() === "") {
      return Effect.fail(new SaveRejected({ message: "Enter search terms before saving" }));
    }
    return Effect.flatMap(SavedSearches, (searches) => searches.save(query));
  },
  { preventDefault: true },
);

export const saveForm = html`<form onsubmit=${saveSearch}>
  <label>Search terms <input name="query" type="search" required /></label>
  <button type="submit">Save search</button>
</form>`;
```

The template retains the handler's error and service channels from the
[Effect type](https://github.com/Effect-TS/effect/blob/main/packages/effect/src/Effect.ts). The application provides
`SavedSearches` and decides how `SaveRejected` becomes feedback. The handler transports ordinary
query data into that service; the service does not need a DOM event or form element.

A delegated handler receives a forwarding event value. Browser properties and methods forward to
the original event, while `currentTarget` is the element registered for this handler. `target` is
where the event originated, possibly a nested icon. The forwarding value is not object-identical
to the native event; do not use object identity as a cross-library protocol.

## Decide native cancellation before awaiting application work

The form in this example is handled by the application, so its handler records `preventDefault`
as a pre-handler option. Waiting for a save request and then attempting to cancel submission would
confuse event dispatch with asynchronous completion.

`EventHandler.make` accepts native `AddEventListenerOptions` plus `preventDefault`,
`stopPropagation`, and `stopImmediatePropagation`. Native `capture`, `passive`, and `signal` keep
their meaning. A passive listener cannot cancel the default action, and a noncancelable event
cannot be canceled; these follow the browser's
[`preventDefault` contract](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault).

`once` consumes a delegated registration after its first *matching* event, across active mounts.
An unrelated click does not use up another element's once handler. Choose `once` for a one-time
capability, not as a replacement for a save-in-progress policy.

## Keep repeated work and failure explicit

Two submissions can start two Effects. An event registration is not automatically a debounce,
latest-only request, or lock. If concurrent saves are invalid, put that policy in the operation's
state/concurrency logic and reflect pending state in the button. Disabling the button communicates
state but does not replace the service's invariants.

Expected failure remains in the template's `E` channel. Recover where the page can present a useful
result, or transform a reusable handler with `EventHandler.catchCause`:

```ts
import { Effect } from "effect";
import { html } from "@typed/template";
import * as EventHandler from "@typed/template/EventHandler";

const submit = EventHandler.make(() => Effect.fail("Save rejected"), { preventDefault: true });
const reported = EventHandler.catchCause(submit, (cause) => Effect.logError(cause));
export const form = html`<form onsubmit=${reported}><button>Save search</button></form>`;
```

Logging here illustrates the recovery boundary; it does not provide the user-facing error message
a real form needs. A `try/catch` around `html` cannot catch a failure from a later submission.

## Verify dispatch and lifetime independently from persistence

Test the save operation without a document. Then mount the form with a test service, dispatch a real
cancelable `SubmitEvent`, and assert cancellation and the received query. Close the render's scope
and dispatch again; the service should not run. Also test that a pending handler is interrupted when
its owner closes.

The scope owns both registrations and started handler fibers. Removing one handler must leave
another owner's native listener alone. Renderer authors who need to implement that boundary should
continue with [EventSource delegation](/explore/event-source-delegation); application templates
should keep using event parts.
