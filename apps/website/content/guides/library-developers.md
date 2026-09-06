---
title: Library developers
summary: Design a reusable account picker by separating state, interaction, output, and the lifetime each caller controls.
section: Learning paths
kind: guide
order: 0.2
---

Suppose you are extracting an account picker from an application. The original control searches
accounts, tracks a selection, moves focus through results, and renders a styled panel. Another team
wants the same selection behavior inside a different panel. A third caller wants to drive it from a
command palette. What should your library expose?

Start with the behavior these callers share, then add the rendering boundary they actually need.
The goal is a contract that callers can supply with state and services, observe for failure, and
close without knowing your implementation. The [application path](/explore/application-developers)
introduces these concepts from the consuming side.

## Extract the selection before extracting the panel

The selected account is current state. A refresh command is an event. Search results are values that
arrive over time. Keeping those distinctions in the public API lets a caller ask different questions:
“What is selected now?”, “What changed?”, and “Please refresh.”

Use a [RefSubject](/explore/refsubject-renderer-independent-state) when a caller needs a current read
and future changes. Use [Subject](/explore/subject-event-publications) for a publication boundary,
choosing its replay behavior explicitly. Expose derived labels and counts as read-only views instead
of creating another writable store that callers could put out of sync.

“No selection” must also be an observable state if the panel needs to clear its label. A Filtered
view skips absent values in its Fx observations and fails a current read with `NoSuchElementError`.
It does not publish a “clear” event. An Option-valued source keeps both cases in the value channel.
[Conditional state](/explore/derived-conditional-and-accumulated-state) explains that choice.

Decide who acquires the state. A caller-supplied selection belongs to the caller; opening or closing
the picker must not silently replace it. A temporary query can belong to each open picker if it
should reset on every opening. Document this distinction as behavior, and test it without a DOM.
[Shared state contracts](/explore/shared-state-contracts) covers the reusable model boundary.

## Keep asynchronous work visible to the caller

A search function might emit account results, fail with a repository error, and require a repository
service. `Fx<A, E, R>` carries those three promises. Annotating its result with `unknown` errors or
hiding its service behind a singleton loses information the application needs to compose it.

Let inference carry the channels through transformations. A rendering wrapper must preserve failures
and requirements from both its setup and the output it returns. If your library handles one expected
failure, describe the resulting behavior: an empty result, a retryable error, or a fallback source
are different outcomes.

Before writing a custom producer, follow [how Fx runs](/explore/fx-push-reactivity) and
[how sinks consume it](/explore/sink-writing-effects). The
[operator atlas](/explore/fx-operator-atlas) helps choose existing composition for the required policy.
For this picker, newer query results should supersede older ones; that is a replacement policy, not
a property implied by the word “reactive.” Specify what happens to replaced work and test completion
in the opposite order from request creation.

Services also make the model portable. The application can provide an HTTP-backed account repository;
a test can provide controlled completions. Neither caller should need your library to start a global
runtime. See [services and lifetime](/explore/fx-services-and-lifetime) for the composition boundary.

## Add a host without taking over the model

The picker now needs a view. A component can consume caller-owned state and derive its presentation
without acquiring another copy:

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
const SelectedAccount = <E, R>(selectedName: RefSubject.Computed<string, E, R>) => {
  const label = RefSubject.map(selectedName, (name) => `Selected account: ${name}`);
  return html`<output>${label}</output>`;
};
```

The view requests only read access. It accepts a Computed or a writable RefSubject, preserving the
source's errors and service requirements through the returned template. Its running observation
belongs to the render lifetime; the caller still owns the selected name. Keeping the source live
avoids capturing only the first name during setup.

Direct `html` is enough here: the view has no Effect setup to yield. When setup does need Effects,
use `component` from `@typed/ui/Component` and return any supported renderable from its generator. A parameterless body creates an Fx; a parameterized body creates a function. Pipeline
steps receive the generated Fx and the original arguments. Use `Fx.fn` for generator-backed
functions whose output is not a component. [Component construction](/explore/ui-component) explains
the inference and [building UI components](/explore/building-ui-components) applies it to controls.

Next choose native semantics and interaction through [the UI hub](/explore/ui). The reusable behavior
must reach the actual host: event props, references, accessibility state, and disabled behavior are
part of the contract a styled wrapper forwards. A wrapper that forwards only appearance can look
correct while breaking focus or activation. [Collections and focus](/explore/ui-collections-and-focus)
explains the additional contract for navigating result items.

## Preserve a result item while its data changes

A search refresh may return the same account ID with a changed display name. The picker should
update that row without treating it as a different account. A reorder should move the retained row,
while removing an account should close only the work belonging to that removed item.

[Keyed collections](/explore/keyed-template-collections) connect stable identity to an item’s rendered
range and child Scope. Derive row fields from the supplied item RefSubject; capturing the initial
item would freeze the label even though the key is correctly retained. These are separate contracts:
the key establishes which row survives, and the live item supplies what that row currently displays.

Avoid adding caching until those replacement rules are clear. Sharing one acquisition across callers
changes its lifetime. If you expose shared work, make its owner and release condition explicit instead
of retaining it in a cache the caller cannot close.

## Cross into another renderer only where necessary

One consumer may already own an editor or chart rendered by another library. You do not need a new
component protocol just to place its output. Use [DomRenderEvent](/explore/dom-render-event) for exact
existing nodes, or [Wire](/explore/wire-and-rendered-dom-output) for a group that must move together.
Use [HtmlRenderEvent](/explore/html-render-event) when an existing server renderer owns safe HTML
serialization. It is a trust boundary, not a sanitizer.

The receiving Typed range owns placement; the foreign library owns its host’s descendants and
internal resources. Register its destroy operation when acquiring the foreign mount. A node’s removal
cannot discover or release those resources on its own. [Cooperative ownership](/explore/cooperative-by-design)
works through the mount and teardown agreement, and [integration recipes](/integrate) show adapters.

Only implement [RenderTemplate](/explore/implementing-render-template) when your library must interpret
template syntax itself. Read [the compilation pipeline](/explore/template-compilation-pipeline) first:
a parsed Template is metadata, while a rendered view is an Fx of output events. Confusing those layers
makes a small output adapter look like a renderer implementation problem.

## Test the promises at the public boundary

For the account picker, a useful library suite proves four scenarios. Caller-owned selection survives
closing and reopening the view. A newer search cannot be overwritten by an obsolete completion.
A retained account keeps its row when its data changes. Closing the picker releases its own listeners
and subscriptions without destroying caller-owned state.

State tests cover selection and transitions; controlled Fx tests cover request ordering; browser tests
cover native interaction and row identity. Add negative type checks for erased errors or missing
services, because runtime assertions cannot detect those losses. Custom-host tests must exercise the
forwarded props and references through the public wrapper, rather than testing the primitive alone.

[Testing Typed systems](/explore/testing-typed-systems) provides these test shapes. Use the
[API reference](/reference) for exact imports and signatures, and keep the library’s examples centered
on the promises those signatures expose.
