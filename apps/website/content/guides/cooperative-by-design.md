---
title: "Cooperative by design"
summary: "Effectful web applications that respect a person's work: explicit lifetimes, meaningful state, portable templates, and inclusive interactions."
section: "Learning paths"
kind: "concept"
order: -1
---

You are searching for an issue. While you type, an earlier request finishes. The results change,
but the input keeps focus. You open an issue, edit its title, and save. A slow connection should
leave your draft intact. A failed save should explain what happened and let you try again. Using
a keyboard or a screen reader should give you the same ability to finish the task.

There is a lot of engineering inside that ordinary experience.

Typed is a toolkit for building **Effectful web applications**: applications whose work,
dependencies, changing state, and interactions can be composed and understood together. Effect
provides the foundation. Fx, Template, and UI carry that foundation into the way an application
changes over time and meets the browser. The goal is to make useful pieces that fit together
without making every piece responsible for the whole application.

## Let a useful piece stay small

A result summary can be an ordinary function:

```ts
import { html, type Renderable } from "@typed/template"

const ResultSummary = <const Count extends Renderable.Any<number>>(count: Count) =>
  html`<p role="status">${count} issues found.</p>`
```

Its input can be a number or a live source of numbers. The template describes where that input
appears; the running renderer handles its updates. Plain `html` is sufficient here.

This small example says something about the rest of Typed. A value should retain the abilities
it already has when it crosses a boundary. An Effect can still require a service. A changing
value can still change. A native element can still behave like a native element. Composition
should connect those contracts, with as little extra machinery as the job needs.

## Keep the work in the program

Searching issues involves more than a function from text to an array. It may fail, it needs an
implementation, and someone must decide how long to wait for it. Effect gives that work a type:
[`Effect<A, E, R>`](https://www.effect.website/docs/v4/getting-started/the-effect-type) describes its
successful value, expected failures, and required services.

For example, the application can depend on a search capability:

```ts
import { Context, Data, Effect } from "effect"

type Issue = { readonly id: string; readonly title: string }

class SearchUnavailable extends Data.TaggedError("SearchUnavailable")<{
  readonly reason: string
}> {}

class IssueSearch extends Context.Service<IssueSearch, {
  readonly search: (query: string) => Effect.Effect<ReadonlyArray<Issue>, SearchUnavailable>
}>()("issues/IssueSearch") {}
```

That contract says what the feature needs. A service Layer can supply an HTTP implementation,
a development fixture, or a controlled test implementation. The application can decide how to
respond to `SearchUnavailable` without also knowing how to construct URLs or decode a response.
The HTTP implementation can validate incoming data with Effect Schema before publishing it as
an `Issue`.

An Effect is a description of work. Constructing it does not start a request. This gives the
application a chance to compose dependencies, error handling, and lifetime before execution.
Expected failures stay visible in `E`; defects and interruption retain their place in Effect's
structured failure Cause. A cancelled search and an unavailable server deserve different
responses in the interface.

[Scope](https://www.effect.website/docs/v4/api/effect/Scope) gives acquired resources an owner. Pair a
listener, connection, or editor mount with its release using `Effect.acquireRelease`. When the
owning Scope closes, registered finalizers run. A page can own its search observation, an open
issue can own its editor, and the application can own a connection shared by several pages.
Those are different lifetimes, even when their output appears in the same document.

The choice is practical: leaving a page should stop page-specific work, while an application
service may need to survive that navigation. Starting everything at module import time or
attaching every resource to one global runtime obscures that distinction.

## Make time part of the behavior

A person decides when to type. A socket decides when another update arrives. The next value is
not always something the application requests on its own schedule.

[`Fx<A, E, R>`](/explore/fx-push-reactivity) models that producer-driven flow with the same success,
error, and service vocabulary as Effect. Its `run` method connects a producer to an effectful
consumer, a Sink. Observing an Fx is Effect work, so it participates in the same concurrency,
interruption, and resource management as the rest of the program.

For search, the newest query makes the previous query obsolete. This function isolates that
replacement policy:

```ts
import { Effect } from "effect"
import { Fx } from "@typed/fx"

type Issue = { readonly id: string; readonly title: string }

const latestResults = <E, R>(
  queries: Fx.Fx<string>,
  search: (query: string) => Effect.Effect<ReadonlyArray<Issue>, E, R>,
) => queries.pipe(
  Fx.map((query) => query.trim()),
  Fx.skipRepeats,
  Fx.switchMapEffect((query) => query === ""
    ? Effect.succeed<ReadonlyArray<Issue>>([])
    : search(query)),
)
```

`switchMapEffect` interrupts the previous inner computation before starting its replacement.
Clearing the input also reaches the switch, cancelling the previous search and producing an
empty result. Filtering empty queries out earlier would leave that previous search running.
The returned Fx retains the search implementation's errors and service requirements.

Cancellation has to reach the resource doing the work. Use Effect's `HttpClient` service for HTTP:
its implementations connect interruption to the underlying request, while the application composes
status handling and Schema decoding. The [HTTP recipe](/integrate/fetch-schema) shows that boundary.
For a foreign Promise API, pass the AbortSignal from `Effect.tryPromise` to the operation when it
supports cancellation. Interrupting a wrapper cannot cancel unrelated work or undo a write the
server has already accepted.

That is why a save operation may need a different policy. [`concatMap`](/explore/fx-higher-order-and-concurrency)
can finish work in order; `exhaustMap` can ignore repeated activation while current work runs;
`mergeMap` can allow independent work to overlap. Choosing one describes what the interface
promises when people act faster than the system responds.

Rate also needs a decision. An Effect-aware producer can wait for its Sink; an external DOM
event source cannot make the browser wait for asynchronous processing. Buffering, dropping,
coalescing, and limiting concurrency have different consequences. A pointer preview may only
need the latest position. An audit log may need every accepted event. Fx makes these choices
composable; a push interface alone does not promise bounded buffering or universal backpressure.
[Timing and rate](/explore/fx-time-and-rate) develops those choices; the
[Fx reference](/reference/modules/%40typed%2Ffx%2FFx) supplies the individual contracts.

## Give state the shape of the experience

A query has a current value and later changes. Those are two useful ways to access the same
fact. A [`RefSubject`](/explore/refsubject-renderer-independent-state) supports both: read it in
an Effect, observe it as an Fx, and change it through explicit update operations.

A component generator becomes useful when a view needs to create that state:

```ts
import { RefSubject } from "@typed/fx"
import { EventHandler, html } from "@typed/template"
import { component } from "@typed/ui/Component"

const SearchField = component(function* (id: string) {
  const query = yield* RefSubject.make("")
  const hint = RefSubject.map(query, (text) => text.trim() === ""
    ? "Enter an issue title."
    : `Ready to search for ${text.trim()}.`)

  const onInput = EventHandler.make((event: InputEvent & { currentTarget: HTMLInputElement }) =>
    RefSubject.set(query, event.currentTarget.value))

  return html`<section aria-label="Search query">
    <label for=${id}>Issue title</label>
    <input id=${id} type="search" .value=${query}
      aria-describedby="${id}-hint" oninput=${onInput} />
    <p id="${id}-hint">${hint}</p>
  </section>`
})
```

This example owns a local field and its hint; it does not issue a request yet. Call
`SearchField("issue-query")` with an ID unique in the document. The label and description use
that ID to identify their input, including for assistive technology.

`component` connects the generator's Effectful setup to its returned Renderable. Each run forks
the parent Scope and supplies that child to both setup and the returned renderable. Completion,
failure, or interruption closes the child; closing the parent also releases it. Two mounted fields
therefore own separate queries and subscriptions. A zero-argument generator produces the Fx directly.

`hint` is a **Computed**: a read-only view of the query. There is one writable fact and a rule
for deriving the hint. A command can read the current hint, and a template can observe it,
without keeping another mutable string synchronized. Passing `query` into the input keeps it
live; reading `yield* query` and passing the resulting string would pass a snapshot.

Other distinctions matter just as much. The text someone is editing can differ from the query
last submitted. A focused result can differ from the selected issue. An unsaved title can differ
from the server's last accepted title. Collapsing each pair into one variable creates surprising
behavior; giving each fact a deliberate home makes its transitions explainable.

A **Filtered** view represents a value available only when a condition matches. Its current
Effect read can fail with `NoSuchElementError`; its Fx observation emits present matches. That
is useful for work that only applies to a selected issue. To tell a view that selection has been
cleared, keep the absence visible with `Option`, or use the Filtered view's `asComputed()`.
Skipping an emission is not a command to clear existing content.

These data structures work without a renderer. Domain commands, tests, and other adapters can
use the same state contracts. A view can borrow a Computed and a few commands while the feature
keeps write access to its RefSubject. [Derived state](/explore/derived-conditional-and-accumulated-state)
and [shared state contracts](/explore/shared-state-contracts) show how that boundary grows.

## Keep useful information while work is pending

The successful-results pipeline above leaves an important design decision open: what does the
person see before a result arrives, while refreshing it, or after a failure?

[`AsyncData`](/explore/async-data) represents those situations as values. The issue search starts
with `NoData`, moves to `Loading` for its first request, and becomes `Success` or `Failure`.
Refreshing an existing success can retain its value and attach progress:

```ts
import * as AsyncData from "@typed/async-data"

const previous = AsyncData.success([{ id: "42", title: "Preserve editor focus" }])
const refreshing = AsyncData.startLoading(previous)
const editing = AsyncData.optimistic(previous, [
  { id: "42", title: "Preserve focus when results move" },
])
```

`refreshing` still carries the previous issues. `editing` carries a provisional value and the
state it replaced. The model can distinguish useful content with pending work from an empty
first load. A view can keep the list visible, show a modest progress message, and preserve the
person's place.

This is data modeling, not request execution. AsyncData does not start a request, choose which
response wins, or roll back a server mutation. The feature must associate results with the
right workspace and query, decide whether stale data remains useful, and reconcile overlapping
edits. An optimistic value's `previous` is available for rollback; blindly restoring it after
a newer edit could discard that newer work.

A request failure can become a `Failure` value without failing the state observation itself.
That lets the same view render the error and remain available for retry. The original Cause
can still be retained for diagnostics. [Build an asynchronous issue search](/explore/async-data-requests-and-cache)
connects service, request identity, cancellation, AsyncData, commands, and a working view.

## Let the rendering environment be a dependency

A template can combine ordinary values, Effects, Fx, Effect Streams, other templates, and
keyed collections through the [Renderable contract](/explore/renderable-normalization).
The `html` tag produces an Fx of rendering output while preserving the errors and services
required by its inputs. Nesting a feature inside another template does not require erasing
those requirements or starting a separate Effect runtime.

The **RenderTemplate** service determines how the template is interpreted. The DOM renderer
creates and updates browser nodes. The HTML renderer produces server output. Hydration connects
client behavior to matching server-rendered structure. The same portable template can therefore
participate in browser rendering, server rendering, and hydration.

Portability needs care at the edges. Reading `document` while constructing a shared module makes
that module browser-specific. A request-specific service or RefSubject should be created within
the request's lifetime. Hydration needs compatible structure, stable identities, and matching
initial state; otherwise the browser and server disagree about what they are continuing.
[`RefSubject.hydrate`](/explore/refsubject-template-hydration) makes the handoff of named state
explicit. Browser behavior attaches on the client; server HTML supplies structure and content.

“Render everywhere” means the reusable part has a rendering contract and the host supplies the
appropriate environment. It does not mean a browser-only editor suddenly works on the server.
Keep that editor behind a browser adapter and provide useful server content around it. The
[Quick Start](/explore/quick-start) follows a template from its first render through that handoff.

## Cooperate with the document already there

The browser is a shared platform. A page can contain Typed output, a chart, a custom element,
and an editor maintained by another library. A design system may already control its visual
language. Typed should have a clear job among those participants.

Dynamic template parts target particular text, attributes, properties, class tokens, event
listeners, or node ranges. Class bindings reconcile the tokens represented by their binding;
structural bindings reconcile their represented nodes. Updating a status beside an editor
need not recreate the editor or inspect its descendants. An adapter can return a
[DomRenderEvent](/explore/dom-render-event) containing the editor's existing host node.

The boundary must be explicit. Two independent writers to the same input property or class
token can still conflict. And [`render(page, host)`](/explore/mounting-dom-output) uses the host
as a mount slot: changed root output can replace its children. Give that mount a dedicated
element when independently owned siblings must remain. Cooperation is a specific agreement
about what each participant may change.

Identity belongs in that agreement. With [`many`](/explore/keyed-template-collections), a stable
key connects an issue to its item state, child Scope, and rendered output. Reordering the same
issues can retain their existing nodes; removing an issue releases its child work. An array
index would describe a position, not the issue whose draft or focus should survive a move.
Node identity alone does not guarantee every browser-managed state survives every move, so
exercise the focus and selection behavior the application relies on.

An external editor also needs its own disposal operation registered with the owning Scope.
Removing a node does not stop its worker, observer, or subscription. DOM placement and resource
lifetime are related responsibilities, and the adapter must honor both. The
[integration recipes](/integrate) show how to make those agreements with other tools.

## Include the person using the interface

The same care must reach the interaction. A result that appears visually but cannot be found
with a screen reader is not a complete result. A dialog that opens but strands keyboard focus
is not a complete dialog. A request policy that reloads a panel on every arrow key can make
navigation exhausting even when each individual request is correct.

[`@typed/ui`](/explore/ui) builds reusable interactions from the same Effect, state, and template
contracts. It starts with native elements where they provide the right behavior: buttons for
commands, anchors for navigation, form controls for input. A plain `html` template using the
right native element is also a good solution. Native behavior is something to preserve as
composition becomes more elaborate.

For richer controls, UI brings together state, roles, keyboard behavior, focus, and host
customization. Those pieces need to agree. In a selectable result list, **focus** identifies
where keyboard interaction is happening; **selection** identifies the chosen issue. Keeping
them separate lets a person explore results without committing each movement. WAI-ARIA's
[keyboard guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) explains why
making selection follow focus needs particular care when activation starts slow work.

Names and feedback complete the experience. A visible label gives an input a discoverable
purpose. A result count can be exposed as a status without moving focus away from the field.
A failed save needs understandable recovery text near the task. WAI-ARIA's guidance on
[accessible names and descriptions](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/)
helps connect that meaning to the rendered elements.

The UI library leaves visual design to the application, including its CSS, theme, and layout.
That freedom comes with real choices: preserve visible focus, readable contrast, useful names,
and sensible behavior when content grows or motion is reduced. Customizing a host must preserve
the semantics its interaction depends on. Every component guide explains its implemented
behavior and relevant platform or APG pattern; using a component does not by itself establish
conformance for the assembled page. The APG's
[read-me-first guidance](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/) is a useful
companion when extending an interaction.

## Keep the promises observable

The benefit of these boundaries is that you can exercise them separately and together:

- A model test can submit two queries, complete them out of order, and verify that the newest
  intent owns the result.
- A state test can prove that a refresh retains useful content and a failed save retains the
  person's draft.
- A rendering test can reorder issues and verify the identity of an existing row and input.
- A lifetime test can close the owning Scope and verify that its listener or adapter was released.
- A browser test can complete the task with a keyboard, check focus after transitions, and inspect
  the controls' names and relationships. Assistive-technology testing checks the experience that
  those programmatic assertions alone cannot establish.

These are observable promises about the application people use. The same service boundaries
that make the feature composable make failures easier to reproduce. Read
[testing Typed systems](/explore/testing-typed-systems) for examples at each boundary.

Typed is just a toolkit. You can use Fx and its state structures with an existing renderer,
introduce a template into a larger page, or build an application or framework from the pieces.
The parts share Effect's foundations so that you can choose where to begin and keep composing
as the work grows.

Continue with [the application developer's path](/explore/application-developers) to organize a
feature around these ideas, or [the Quick Start](/explore/quick-start) to render something and
follow its behavior into the browser. If you are designing reusable infrastructure, read
[the library developer's path](/explore/library-developers). Keep the
[Effect documentation](https://effect.website/) alongside these guides: its model of work remains
the model underneath the application.
