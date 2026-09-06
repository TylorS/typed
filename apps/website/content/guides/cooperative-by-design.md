---
title: "Cooperative by design"
summary: "Build Effectful web applications from pieces that preserve each other's contracts, ownership, timing, and semantics."
section: "Learning paths"
kind: "concept"
order: -1
---

You are searching for an issue. While you type, an earlier request finishes. The results
change, but the input keeps focus. You open an issue, edit its title, and save. A slow
connection should leave your draft intact. A failed save should explain what happened and
let you try again. Using a keyboard or a screen reader should give you the same ability
to finish the task.

There is a lot of engineering inside that ordinary experience.

Typed is built around one idea:

**Software should be able to participate without taking over.**

A cooperative abstraction does not require everything around it to become part of its
model. It preserves the contracts, capabilities, ownership, and semantics of the things
it composes with.

An [Effect](/glossary#effect) should keep its errors and requirements when it reaches
the UI. A producer should keep control over when its values happen. Derived state should
not become another writable truth. A renderer should not need to own the entire document.
Native browser behavior should remain native behavior.

Typed brings those ideas together across Effect, [Fx](/explore/fx-push-reactivity),
[state](/explore/refsubject-renderer-independent-state),
[templates](/explore/authoring-typed-templates), and [UI](/explore/ui).

## Participate without taking over

A result summary can be an ordinary function:

```ts
import { html, type Renderable } from "@typed/template"

const ResultSummary = <
  const Count extends Renderable.Any<number>
>(
  count: Count,
) =>
  html`<p role="status">${count} issues found.</p>`
```

`count` can be a number or a live source of numbers. `ResultSummary` does not need to
turn either one into some framework-owned state first.

A static value stays static.

A changing value keeps changing.

The summary contributes presentation without taking ownership of where its value came
from or how it changes.

That is the basic shape of cooperation in Typed:

**Composition preserves capabilities instead of flattening them.**

## Keep contracts intact

Effect gives work a contract:

```ts
Effect.Effect<A, E, R>
```

It can produce `A`, fail with `E`, and requires `R`.

Typed does not create an escape hatch from that model when work reaches the browser.

Consider saving a search:

```ts
import { Context, Data, Effect } from "effect"
import { Fx } from "@typed/fx"
import { EventHandler, html } from "@typed/template"

class SaveRejected extends Data.TaggedError("SaveRejected")<{
  readonly message: string
}> {}

class SavedSearches extends Context.Service<
  SavedSearches,
  {
    readonly save: (
      query: string,
    ) => Effect.Effect<void, SaveRejected>
  }
>()("SavedSearches") {}

const saveSearch = EventHandler.make(
  (event: SubmitEvent & { currentTarget: HTMLFormElement }) =>
    Effect.gen(function* () {
      const searches = yield* SavedSearches
      const query = String(
        new FormData(event.currentTarget).get("query") ?? "",
      )
      yield* searches.save(query)
    }),
  { preventDefault: true },
)

const form = html`
  <form onsubmit=${saveSearch}>
    <input name="query" type="search" />
    <button type="submit">Save search</button>
  </form>
`
```

The Effect became an [event handler](/explore/native-events-with-effect).

The event handler became part of a template.

Its contract survived both boundaries:

```ts
type Errors = Fx.Error<typeof form>
// SaveRejected

type Services = Fx.Services<typeof form>
// SavedSearches | Scope.Scope | RenderTemplate
```

Each layer adds what it needs without erasing what came before it.

**Errors disappear because you handled them. Requirements disappear because you provided
them. They do not disappear because your Effect happened to reach a button.**

The browser keeps its side of the contract too. `preventDefault`, capture, propagation,
passive listeners, and native events retain their platform meanings. `EventHandler`
connects browser dispatch to Effect work instead of inventing a synthetic event universe
around it.

## Let producers keep the clock

Not every value exists because the application asked for it.

A person decides when to type. A socket decides when another message arrives. A worker
decides when computation finishes.

```
time ─────────────────────────────────────────────▶

query
────── "t" ─── "ty" ─ "typ" ─────────── "typed" ─▶
```

The application does not pull those values into existence.

**The producer owns the clock.**

[`Fx<A, E, R>`](/explore/fx-push-reactivity) cooperates with that direction of causality.
It describes what to do as values arrive, while keeping the same error and service
vocabulary as Effect.

For search, typing can settle before work begins:

```
query
──── "t" ─ "ty" ─ "typ" ───────────── "typed" ───▶

debounce(250ms)
────────────────── "typ" ───────────── "typed" ───▶
```

And when newer intent makes older work irrelevant, that relationship can be expressed
directly:

```ts
import { Effect } from "effect"
import { Fx } from "@typed/fx"

const results = queries.pipe(
  Fx.map((query) => query.trim()),
  Fx.skipRepeats,
  Fx.debounce("250 millis"),
  Fx.switchMapEffect((query) =>
    query === ""
      ? Effect.succeed([])
      : Effect.flatMap(IssueSearch, (search) => search.search(query)),
  ),
)
```

```
query
────── "typ" ───────────────── "typed" ─────────▶

work
────── [ search("typ") ───────── ×
                                 [ search("typed") ────●

results
─────────────────────────────────────────────────●───▶

× interrupted
● emitted
```

The old result is not merely ignored after wasting the work.

The old **work itself becomes obsolete**.

`switchMapEffect` lets the producer's newer event cooperate with Effect's interruption
and lifetime model. Writes can choose ordering instead. Repeated submissions can choose
exclusion. Independent work can overlap.

The temporal policy belongs to the behavior being modeled rather than to a hidden
scheduler.

And the search is still Effectful throughout: its failures and required services remain
part of the resulting Fx.

**Time changed. The contract did not disappear.**

## Let state keep its source of truth

Events describe things happening.

State describes what is true now.

A search query has a current value and future changes.
[`RefSubject`](/explore/refsubject-renderer-independent-state) supports both:

```ts
import { Effect } from "effect"
import { RefSubject } from "@typed/fx"

const makeSearchModel = Effect.gen(function* () {
  const query = yield* RefSubject.make("")
  const normalized = RefSubject.map(query, (query) => query.trim())
  const canSearch = RefSubject.map(normalized, (query) => query.length >= 2)

  return { query, normalized, canSearch }
})
```

There is one writable fact:

```
query ─────────▶ normalized ─────────▶ canSearch
```

`normalized` and `canSearch` cooperate with `query` by describing relationships to it.
They do not compete with it by becoming additional writable stores.

There is no synchronization code to forget.

A command can read a snapshot:

```ts
const query = yield* model.normalized
```

A template can observe the same relationship:

```ts
html`
  <button ?disabled=${RefSubject.map(model.canSearch, (ready) => !ready)}>
    Search
  </button>
`
```

**Derived state stays derived.**

The same principle helps keep other distinctions honest. The text someone is editing can
differ from the query last submitted. Focus can differ from selection. An optimistic
title can differ from the server's last accepted title.

Cooperation does not mean collapsing related concepts together. Sometimes it means
allowing each fact to keep its own meaning.

## Let existing information survive new work

Starting another request does not mean useful information suddenly stopped existing.

[`AsyncData`](/explore/async-data) makes that distinction explicit:

```ts
import * as AsyncData from "@typed/async-data"

const previous = AsyncData.success([
  { id: "42", title: "Preserve editor focus" },
])

const refreshing = AsyncData.startLoading(previous)
const editing = AsyncData.optimistic(previous, [
  { id: "42", title: "Preserve focus when results move" },
])
```

`refreshing` still contains the previous result.

`editing` contains the provisional value and what it replaced.

Fx answers questions about the work:

> Which request is active? Which work should be interrupted?

AsyncData answers questions about knowledge:

> What do we know while that work is happening?

Neither abstraction has to impersonate the other.

More importantly, the network does not get to erase the person's context merely because
another request started. A refresh can keep useful content visible. A failed save can
preserve the draft. An [optimistic update](/explore/async-data-optimistic-edits) can
remain distinguishable from server-confirmed state.

The application's internal boundaries cooperate with the person's ongoing work.

## Share the document

The browser is already a shared platform.

A page can contain Typed output, a chart, a custom element, an editor from another
library, and an application's own design system.

Typed does not need to own all of them.

Template bindings target particular pieces of output: text, attributes, properties,
class tokens, listeners, or structural ranges. Updating one dynamic status does not
require rebuilding an unrelated editor beside it.

Identity can be preserved too:

```ts
many(
  issues,
  (issue) => issue.id,
  (issue) => IssueRow(issue),
)
```

The key identifies the issue, not its current array position.

If an editor owns the contents of its host, let it.

If Typed owns where that host belongs, let Typed do that.

If the editor starts a worker or observer, its cleanup belongs to the
[Scope](/glossary#scope) that owns that integration.

The same idea applies to rendering environments. A portable template can cooperate with
[DOM rendering](/explore/mounting-dom-output),
[server HTML](/explore/rendering-html-on-the-server), or
[hydration](/explore/hydrating-typed-html) because the rendering implementation is
supplied by the environment rather than baked into every reusable view.

**Cooperation is a concrete agreement about who may change what, and for how long.**

## Keep the browser good at being a browser

The platform itself is another participant.

Use a button when something is a button:

```ts
html`
  <button onclick=${save}>
    Save
  </button>
`
```

Use an anchor for navigation.

Use a label for an input.

Native focus, keyboard behavior, accessible names, form semantics, and event behavior
are useful capabilities. [Typed UI](/explore/ui) builds richer interactions without
requiring those capabilities to be discarded first.

That matters when interactions become more complex.

Focus is not necessarily selection.

Navigating through choices is not necessarily activation.

Updating a result count should not require stealing focus from the search field.

A control that looks correct but strands keyboard users is not cooperating with the
platform or with the person using it.

Typed leaves CSS, themes, and visual language to the application. Its UI primitives
participate in those systems rather than requiring another styling universe around them.

## Keep the user's work intact

All of these boundaries eventually meet one participant that matters more than the
abstractions themselves: the person using the application.

A slow request should not destroy their draft.

A refresh should not casually blank useful information.

A keyed reorder should not unnecessarily replace the input they are editing.

A background update should not move focus without a reason.

A screen reader should expose the same task the visual interface provides.

The engineering choices throughout Typed—explicit state, preserved identity, scoped
lifetimes, native semantics, interruptible work—are not ends by themselves.

They make it possible for different parts of an application to change **without trampling
over one another or over the person's unfinished work**.

That is cooperation at the level people actually experience.

## Keep those promises observable

Because the boundaries stay explicit, their promises can be
[tested](/explore/testing-typed-systems) directly:

- submit two queries out of order and verify that newer intent owns the result;
- update source state and verify that Computed state follows it;
- prove that refreshing retains useful content;
- fail a save and verify that the draft survives;
- close a Scope and verify that its listener or editor is released;
- reorder keyed issues and verify that an existing row survives;
- complete the task with a keyboard and verify focus, names, and relationships.

These are not tests of framework machinery for its own sake.

They are tests of the agreements the application makes with the other systems—and
people—it participates with.

## A toolkit, not a takeover

Typed's pieces share a foundation, but you do not have to adopt all of them.

Use Fx with [another renderer](/integrate).

Use RefSubject behind an existing UI.

Introduce a Typed template into one part of a larger page.

Build a component library from the primitives, or compose them into an entire
application.

**“Just a toolkit” is a statement about where control belongs, not a limit on what can
be built.**

Typed can compose deeply precisely because it does not need to own everything it
touches.

Effects keep their contracts.

Producers keep their clocks.

State keeps its source of truth.

Resources keep their owners.

Renderers keep clear boundaries.

The browser keeps its semantics.

Other libraries keep their responsibilities.

And the person using the application keeps their work.

**That is what cooperative by design means.**

Continue with the [application developer's path](/explore/application-developers) to
build a feature around these ideas, or start with the [Quick Start](/explore/quick-start)
and follow a template into the browser. If you are building reusable infrastructure,
continue with the [library developer's path](/explore/library-developers).
