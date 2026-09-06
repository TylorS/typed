---
title: "Hydrating Typed HTML"
summary: "Adopt compatible Typed SSR output below one DOM host, or construct fresh output when the adoption contract does not match."
section: "Template rendering"
kind: "guide"
order: 3
---

A server-rendered search input may already contain a visitor's edit before JavaScript starts.
Hydration tries to retain that exact element and connect the live program to it. Producing identical
text by replacing the input is a different result, even if the page looks correct afterward.

Read [Rendering HTML on the server](/explore/rendering-html-on-the-server) and
[Mounting DOM output](/explore/mounting-dom-output) first. This article explains adoption and its
failure modes; the complete request/browser example is in
[Server rendering and hydration](/explore/server-rendering-and-hydration).

## Give the client the same inner template and host

`HtmlRenderTemplate` adds template and range markers. The browser's normal `render` entry examines
those markers below the supplied host. It does not attach behavior to arbitrary hand-authored HTML.

```ts
import { Effect, Fiber } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";

// The server placed this exact inner template below #app using HtmlRenderTemplate.
const page = html`<section><h1>Saved articles</h1><p>Collection ready.</p></section>`;
const host = document.getElementById("app");
if (host === null) throw new Error("Missing #app host");

const application = page.pipe(
  render(host),
  Fx.drain,
  Effect.provide(DomRenderTemplate.using(host.ownerDocument)),
  Effect.scoped,
);
const fiber = Effect.runFork(application);
export const stop = () => Effect.runPromise(Fiber.interrupt(fiber));
```

The server owns the response's document shell; the browser here owns the inner host's output.
Passing the entire document template to this host asks for a different shape. Clearing the host
before starting destroys the existing nodes and markers that adoption needs.

The mounted lifetime is otherwise ordinary: the owner supervises the fiber and interrupts it when
the host closes. Hydration does not establish a separate event or resource runtime.

## Understand what compatible adoption establishes

The renderer locates matching template identity and marked ranges, connects parts to the existing
nodes, and installs their browser behavior. Refs that restore hydration state run before ordinary
reactive parts begin. The returned DOM objects remain the server objects when adoption succeeds.

Missing markers, different authored template structure, or incompatible range wiring can prevent
adoption. If a hydration-specific failure occurs after partial setup, the renderer closes that
partial work and builds the affected range fresh. This fallback can restore a usable page while
losing identity and browser state in that range.

It is therefore misleading to call a response "hydrated" merely because the client eventually
shows the expected string. Test identity explicitly.

## Separate template compatibility from state decoding

A template hash identifies authored structure, not the correct query or account data. Server and
browser can use the same literal with different initial values. A hydration ref transfers state
through an explicitly encoded host attribute; its schema is another independent contract.

A correct marker range can contain invalid serialized numeric state. That is a decoding problem,
not a reason to delete markers and silently claim successful hydration. Conversely, valid data
outside the selected host cannot make that host's unrelated template compatible.

Use [RefSubject hydration](/explore/refsubject-template-hydration) for state codecs and
[Native element references](/explore/template-references-and-element-access) for host placement.
Ordinary refs have no server representation, and static HTML rendering deliberately omits hydration
metadata.

## Decide what should happen to early edits

Adopting an input preserves its node, but a controlled `.value` part is still a writer for its live
property. When client state is applied, it may replace text the visitor typed before startup.
Node identity does not decide whether that early edit or serialized application state wins.

An initial `value` attribute lets the browser own subsequent editing unless the application adds a
property writer. If application state must control editing, design how early edits are captured or
reconciled and test that policy. The same distinction applies to checked state, focus, selection,
and a widget initialized by another owner before Typed begins.

A ref running during adoption is also not an after-paint hook. An observer can track later geometry;
a library requiring a connected, laid-out element needs an explicit integration contract.

## Investigate replacement in dependency order

Retain a server element before the client starts and compare it with the corresponding element
after startup. If it changed, inspect:

1. The server layer: static output intentionally cannot provide interactive adoption metadata.
2. The host boundary: it must contain the inner template the client renders.
3. Authored template compatibility: cached HTML and a newer client bundle may differ.
4. Markers: HTML rewriting or another DOM owner may remove or relocate them.
5. Initial collection IDs: keyed children need compatible keys, not merely matching labels.

Then inspect state decoding separately. Record the response/client asset versions when investigating
a deployment-specific mismatch instead of assuming visible markup equality means template equality.

A complete test retains a node, starts the client, asserts identity, performs a native interaction,
and finally stops the render and verifies the old interaction is inert. Add an early-edit assertion
when that behavior is part of the product. Renderer extensions may use the public
[HydrateContext contract](/reference/modules/%40typed%2Ftemplate%2FHydrateContext), but ordinary
applications should let `render` create and own that context.
