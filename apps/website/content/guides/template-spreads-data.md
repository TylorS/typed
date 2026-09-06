---
title: "Spread props and data records"
summary: "Combine native attributes, DOM properties, dataset values, and event handlers without losing their individual semantics."
section: "Template bindings"
kind: "guide"
order: 2
---

A reusable search field sometimes receives a capability record: a help title, an analytics ID,
a disabled state, and an event handler. The record may change when a feature is enabled or removed.
A spread lets those fields travel together while preserving each field's native meaning and lifetime.

Read [Attributes, properties, and boolean state](/explore/template-element-bindings) first. A spread
is a grouping mechanism for those operations, not an alternative object model for DOM elements.

## Keep known fields explicit; group fields that belong together

If a component always owns `.value`, write that part directly. Use a spread when a caller genuinely
supplies a group of fields or when the set of contributed capabilities changes:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

const saveCapabilities = {
  title: "Save the current search",
  "aria-label": "Save search",
  "?disabled": Fx.succeed(false),
  ".data": { action: "save-search" },
  onclick: Effect.log("Save search requested"),
} as const;

export const save = html`<button type="button" ...${saveCapabilities}>Save</button>`;
```

Each accepted key installs the same kind of part as explicitly authored syntax. The event is a
registration; `?disabled` controls presence; the dataset contains serialized metadata. They do not
all become string attributes merely because they were supplied in a record.

This example logs a command rather than claiming to persist anything. In an application, replace
the Effect with the actual command operation and retain its error/service requirements.

## Understand the accepted surface before designing a public prop bag

| Record key | Meaning |
| --- | --- |
| `title`, `id`, `aria-label` | ordinary attribute set/removal |
| `?disabled` | boolean attribute presence |
| `.value`, `.checked`, `.indeterminate`, `.selected`, `.selectedIndex` | allowed live property assignments |
| `class` or `className` | contributed class tokens |
| `.data` | contributed `data-*` keys |
| `onclick` or `@click` | native event handler |
| `ref` | setup on the exact element |
| `.props` or `.properties` | nested capability record |

Arbitrary property assignment is deliberately not a spread feature. Name a property directly in
the template when an integration needs it. Invalid attribute names and prototype-sensitive keys
(`constructor`, `prototype`, `__proto__`) are ignored. Event-shaped `on*` keys are not emitted as
HTML attributes. Cyclic nested records stop at the cycle boundary.

This allowlist is renderer behavior, not a reason to accept arbitrary untrusted records in a library.
Expose a narrow typed contract for the capabilities a component actually supports.

## Use `.data` for a slice of metadata

Dataset keys are contributed independently from the rest of the element:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

export const article = html`<article .data=${{
  id: "scope",
  kind: Effect.succeed("saved-article"),
  rank: Fx.succeed(3),
}}>Understanding resource scopes</article>`;
```

This contributes `data-id`, `data-kind`, and `data-rank`. A later record omitting `rank` removes
only `data-rank`; unrelated keys contributed by another system remain. Values may themselves be
producers and are serialized as data. Use explicit hyphenated keys when that is the attribute name
you intend; `.data` builds `data-${key}` rather than implementing arbitrary property-name magic.

A nullish or non-object record contributes no keys, clearing this part's previous contributions.
That differs from a nullish value inside a record, which follows value serialization for that key.
Do not confuse clearing the record with removing all `data-*` attributes on the element.

## Follow a capability through replacement and removal

Suppose the outer record initially contains `title`, `onclick`, and `ref`, then becomes an empty
record. Typed removes the contributed title, unregisters that handler, and closes the resource scope
owned by that ref. The host element and independently installed capabilities remain.

Removing a spread property restores the property's value from before that part was installed.
Removing class/data/nested spread entries clears their local contributions. This makes removal
meaningful: a capability has both a value and an end to its lifetime.

A retained record containing a reactive `.value` does not need to be re-enumerated for every emission
from that entry. The retained entry updates its captured target. Replacing the *outer record* does
require comparing its keys and replacing, retaining, or disposing entries. Measure those separately
when a large capability record is involved.

Two independent writers should not claim the same field. A spread cannot distinguish another
owner's later write to its `title` from its own contribution when it removes that key. Give helpers
separate attributes and class tokens, and decide explicitly which component owns the edit property.

## Verify both lifetime and serialization

A useful browser test replaces a capability record while retaining the same element. Assert the
removed handler no longer runs, its ref finalizer ran, and an unrelated class/data key survives.
Checking only final HTML would miss a leaked event registration.

On the HTML target, attributes, booleans, classes, dataset keys, and nested spreads serialize.
DOM properties, event handlers, and ordinary refs do not. Hydration refs are an explicit exception
that carry state metadata. Compare server attributes with the browser property behavior rather than
expecting all spread fields to appear in a response.

Continue with [Class contributions](/explore/dom-class-names) for token conflicts and
[Reference the native element](/explore/template-references-and-element-access) for the ref resources
a removable capability may acquire.
