---
title: Library developers
summary: Choose a reusable capability, preserve its error and service channels, and let the caller own its lifetime.
section: Learning paths
kind: guide
order: 0.2
---

Start here after you can run an Effect and observe an Fx. Your library should expose the capability a caller needs, together with its failures, services and lifetime. Start with an existing producer or consumer; implementing a renderer is an optional boundary.

## Accept the narrow capability you need

A label needs to read the selected name, not change it. Accept a read-only capability so the caller can supply writable state without giving the library permission to replace it:

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
| Render caller-owned state | [Build a component](/explore/ui-component) |
| Retain an editable item across reorders | [Keyed collections](/explore/keyed-template-collections) |
| Place an existing chart or editor | [DOM output adapter](/explore/dom-render-event) |
| Accept already serialized HTML | [HTML output contract](/explore/html-render-event) |
| Interpret template syntax itself | [Template compilation](/explore/template-compilation-pipeline#check-a-new-targets-contract) |

These are alternatives, not prerequisites for finishing a library.

## Test the promises at the public boundary

Test the behavior your public contract promises, including cleanup for resources the library acquires. [Testing techniques](/explore/testing-typed-systems) shows how to observe those boundaries.
