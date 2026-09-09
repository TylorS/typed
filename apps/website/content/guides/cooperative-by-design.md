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

<span id="participate-without-taking-over"></span>

## Keep contracts intact

`Effect.Effect<A, E, R>` describes a result, possible failure and required services. Typed preserves that contract when work reaches the browser.

Consider saving a search:

```ts file="saved-search.ts"
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
  Effect.fn(function* (event: SubmitEvent & { currentTarget: HTMLFormElement }) {
    const searches = yield* SavedSearches
    const query = String(
      new FormData(event.currentTarget).get("query") ?? "",
    )
    yield* searches.save(query)
  }),
  { preventDefault: true },
)

export const form = html`
  <form onsubmit=${saveSearch}>
    <input name="query" type="search" />
    <button type="submit">Save search</button>
  </form>
`
```

The [event handler](/explore/native-events-with-effect) carries the Effect into a template. Its failure and service requirements survive both boundaries:

```ts
import { Fx } from "@typed/fx"
import { form } from "./saved-search.js"

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

## Let work and state answer different questions

<span id="let-producers-keep-the-clock"></span>

**Fx is where Effect and push-based semantics meet.** A socket, input or worker decides when its values arrive. Fx composes that work while retaining its errors and service requirements. For an existing pull-based source, keep its Stream and adapt it with `Fx.fromStream` at the push boundary.

A newer search can interrupt an obsolete read; a save may instead need ordering or exclusion. That policy belongs to the feature. [Build an issue search](/explore/async-data-requests-and-cache) to observe replacement and recovery in a running example.

<span id="let-state-keep-its-source-of-truth"></span>

[RefSubject](/explore/refsubject-renderer-independent-state) provides a current value and future changes. Derive a normalized query and a result count from their sources instead of adding writable copies. A command reads a snapshot; a view observes a relationship. Draft text, submitted queries and committed results remain distinct when they have different lifetimes.

<span id="let-existing-information-survive-new-work"></span>

[AsyncData](/explore/async-data) describes what is known while work happens. Refreshing successful data can retain it as progress; a provisional edit remains distinguishable from the server's accepted value. The request policy and the visible state cooperate without becoming the same abstraction.

## Share the document

Template bindings own particular properties, class tokens, listeners and ranges. A status update need not replace the editor beside it. [Keyed rows](/explore/keyed-template-collections) retain the identity of an item while its live value changes.

When a foreign editor owns its host's descendants, Typed can own the host's placement. The editor's worker or observer still needs an explicit finalizer in the Scope that acquired it. [Integration recipes](/integrate) show those agreements at real host boundaries.

<span id="keep-the-browser-good-at-being-a-browser"></span>

Use native buttons, links, labels and form behavior. [UI primitives](/explore/ui) add interactions while leaving CSS and themes with the application. Focus, active choice and committed selection are different facts; moving through a menu should not accidentally commit a choice.

<span id="keep-the-users-work-intact"></span>
<span id="keep-those-promises-observable"></span>
<span id="a-toolkit-not-a-takeover"></span>

These contracts matter when they protect someone's unfinished work. Test an obsolete completion, a keyed reorder and an interrupted owner—not only the final screenshot. You can adopt the capability you need in one part of a page. [Run the counter](/explore/quick-start) to start building, or [choose a library boundary](/explore/library-developers) to extend the toolkit.
