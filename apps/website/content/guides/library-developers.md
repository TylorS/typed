---
title: Library developers
summary: Choose a reusable capability, preserve its error and service channels, and let the caller own its lifetime.
section: Learning paths
kind: guide
order: 0.2
---

Start here after you can run an Effect and observe an Fx. Your library should expose the capability a caller needs, together with its failures, services and lifetime. Start with an existing producer or consumer; implementing a renderer is an optional boundary.

## Extract the selection before extracting the panel

For an account picker, selection is current state, refresh is an event, and search results arrive over time. Expose derived labels and counts as read-only capabilities. The caller can supply writable state without giving the library permission to replace it:

```ts
import { RefSubject } from "@typed/fx";

const selectedLabel = <E, R>(selectedName: RefSubject.Computed<string, E, R>) =>
  RefSubject.map(selectedName, (name) => `Selected account: ${name}`);
```

This preserves the source's errors and services. For a clearable selection, keep absence in an Option-valued source; [conditional state](/explore/derived-conditional-and-accumulated-state) explains why filtering absence does not emit a clear.

## Keep asynchronous work visible to the caller

Preserve `Fx<A, E, R>` through your wrapper. Handle an expected failure only when your API defines the resulting behavior. Supply services at the consuming application's boundary, so a test can replace the repository without a global runtime.

Next, [write a consumer with Sink](/explore/sink-writing-effects). That path then covers publication, scoped producers and resource ownership. Prefer existing operators before implementing a producer protocol.

## Choose the boundary your caller needs

<span id="add-a-host-without-taking-over-the-model"></span>
<span id="preserve-a-result-item-while-its-data-changes"></span>
<span id="cross-into-another-renderer-only-where-necessary"></span>

| Requirement | Focused extension |
| --- | --- |
| Share one current model | [Shared state contracts](/explore/shared-state-contracts) |
| Render caller-owned state | [Build a component](/explore/building-ui-components) |
| Retain an editable item across reorders | [Keyed collections](/explore/keyed-template-collections) |
| Place an existing chart or editor | [DOM output adapter](/explore/dom-render-event) |
| Accept already serialized HTML | [HTML output contract](/explore/html-render-event) |
| Interpret template syntax itself | [RenderTemplate implementation](/explore/implementing-render-template) |

These are alternatives, not prerequisites for finishing a library.

## Test the promises at the public boundary

Close the library's owner and verify that its acquisitions stop while caller-owned state survives. For replacement, make an old operation complete after newer intent. If you add a view, test retained row identity separately from its text. [Testing techniques](/explore/testing-typed-systems) supplies fixtures for each boundary.
