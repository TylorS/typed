---
title: "Handle native events with Effect"
summary: "Use a direct Effect for a known action, or read native event data with EventHandler.make."
section: "Template bindings"
kind: "guide"
order: 4
---

<span id="keep-repeated-work-and-failure-explicit"></span>

A template event binding runs an Effect when the browser dispatches an event. Use the Effect
directly when it already has the data it needs; use `EventHandler.make` when the work needs the event.
Building on [the search field](/explore/authoring-typed-templates), first clear a known value, then
read a submitted query without navigating away from the page.

## Use a plain Effect when the event carries no needed data

A clear button already knows which state it should change:

```ts
import { RefSubject } from "@typed/fx";
import { component, html } from "@typed/template";

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

A form submission needs data from the form. `EventHandler.make` receives the event and returns the
Effect to run. This example publishes the submitted query to an output:

```ts
import { RefSubject } from "@typed/fx";
import { component, html } from "@typed/template";
import * as EventHandler from "@typed/template/EventHandler";

export const SearchForm = component(function* () {
  const submitted = yield* RefSubject.make("");

  const submit = EventHandler.make(
    (event: SubmitEvent) => {
      const form = event.currentTarget as HTMLFormElement;
      const query = new FormData(form).get("query");

      return RefSubject.set(submitted, typeof query === "string" ? query : "");
    },
    { preventDefault: true },
  );

  return html`<form onsubmit=${submit}>
    <label>Search terms <input name="query" type="search" required /></label>
    <button type="submit">Use query</button>
    <output>Submitted query: ${submitted}</output>
  </form>`;
});
```

`currentTarget` is the element registered for this handler: the form. `target` is where the event
originated and can be a nested element. Read the needed browser data at this boundary, then pass
ordinary values to application work. Here the output changes only when the form is submitted;
typing alone edits the browser's input buffer.

## Decide native cancellation before awaiting application work

The form in this example is handled by the application, so its handler records `preventDefault`
as a pre-handler option. Cancellation must happen during dispatch, before asynchronous work begins.

`EventHandler.make` accepts native `AddEventListenerOptions` plus `preventDefault`,
`stopPropagation`, and `stopImmediatePropagation`. Native `capture`, `passive`, and `signal` keep
their meaning. A passive listener cannot cancel the default action, and a noncancelable event
cannot be canceled; these follow the browser's
[`preventDefault` contract](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault).

Use `once` only when the registration should handle one matching event. It is not a policy for
preventing overlapping requests; those belong in the operation's state.

## When the handler can fail

The local update above needs no service and has no expected failure. If it is replaced by a request,
the handler's error and required-service channels remain part of the template's type. Provide the
service at the application boundary and recover expected failures where the page can show feedback.
[`EventHandler.catchCause`](/reference/modules/%40typed%2Ftemplate%2FEventHandler) can recover a
reusable handler. A `try/catch` around `html` cannot catch a failure from a later submission.

## Check the submitted value

Enter a query and submit the form. The output should receive that query and the page should not
navigate. In a DOM test, dispatch a cancelable `SubmitEvent` and check both the output and
`event.defaultPrevented`. [Testing Typed systems](/explore/testing-typed-systems) covers mounting
and teardown checks.

For delegation mechanics and listener options across mounts, see
[EventSource delegation](/explore/event-source-delegation). Continue with
[keyed collections](/explore/keyed-template-collections) to keep item identity through list changes.
