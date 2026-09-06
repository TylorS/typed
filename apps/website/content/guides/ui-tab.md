---
title: "Tab: the singular module and reusable tab instances"
summary: "Use the Tab re-export correctly and design instance-safe local panel switches."
section: "UI / Collections"
kind: "deep-dive"
order: 245
---

A comparison screen needs two copies of the same Summary/History inspector. Copying the markup
is easy; reusing the same tab and panel IDs would make each inspector's accessible relationships
ambiguous. This guide packages a tab set for repeated use, with one state and ID namespace per
instance. It uses `@typed/ui/Tab`, the singular public path that re-exports `@typed/ui/Tabs`.
There is one implementation, not a second standalone-tab state machine. Read
[Tabs](/explore/ui-tabs) first for activation and panel lifetime.

## Give every instance a namespace

A reusable inspector can appear twice on one screen. Hardcoded `summary-tab` IDs would collide even
if the two instances own independent RefSubjects. Accept an instance prefix and derive all tab and
panel IDs once in the component generator.

```ts
import { component } from "@typed/ui/Component";
import * as Tab from "@typed/ui/Tab";

interface DetailsProps {
  readonly id: string;
  readonly label: string;
  readonly summary: string;
  readonly history: string;
}

export const Details = component(function* (props: DetailsProps) {
  const summaryId = `${props.id}-summary`;
  const historyId = `${props.id}-history`;
  const state = yield* Tab.makeState({ selectedId: summaryId, activationMode: "manual" });
  const collection = yield* Tab.makeCollection();
  return [
    Tab.List({ state, collection, label: props.label, content: [
      Tab.Tab({ state, collection, id: summaryId, panelId: `${summaryId}-panel`, content: "Summary" }),
      Tab.Tab({ state, collection, id: historyId, panelId: `${historyId}-panel`, content: "History" }),
    ] }),
    Tab.Panel({ state, id: `${summaryId}-panel`, tabId: summaryId, content: props.summary }),
    Tab.Panel({ state, id: `${historyId}-panel`, tabId: historyId, content: props.history }),
  ];
});

export const CompareDetails = [
  Details({ id: "left-project", label: "First project details", summary: "Draft", history: "Created today" }),
  Details({ id: "right-project", label: "Second project details", summary: "Reviewed", history: "Reviewed today" }),
];
```

The parameterized generator produces a callable component. Each rendered invocation acquires its
own state and registry. The caller supplies stable, page-unique `id` values, including during SSR;
a random value created separately on client and server would break the relationship. The two lists
can have identical visible labels for their tabs because their DOM identities differ.

## A tab is not a standalone toggle

A tab needs a tablist, associated panel, and shared selected identity. `Tab.Tab` renders a button
but gives it `role=tab`, `aria-controls`, `aria-selected`, and managed tabindex. Using it without
`List` removes the shared arrow handler. Giving each tab its own `makeState` removes mutual
exclusion. Putting a native button inside its content creates nested interactive controls; use text
and noninteractive decoration for the label.

Manual mode preserves the current panel while arrows move focus. Enter/Space selects the active
tab; a pointer click selects directly. Automatic mode selects on focus. Focus is browser focus on
the tab button, not a separate `aria-activedescendant` relationship. The
[APG tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) describes the complete composite
relationship. [MDN's aria-controls reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-controls)
explains the ID reference; it does not itself cause panel visibility or keyboard behavior.

## Preserve the host boundary when styling

The default host is a native button with `type=button`. Apply classes or props through the public
options so internal handlers and refs remain composed. A custom host must retain the button's
interaction semantics, generated props, and registration on the element that actually receives
focus. Do not move the registration to a decorative wrapper or replace the component's tabindex
with an always-zero value: that turns one composite tab stop into many unrelated stops.

The panel remains mounted while hidden. That is useful for two inspectors with draft state, but
all content scopes remain alive. If closing an inspector should release background work, remove
the component through the surrounding render lifetime, not by merely setting a CSS class. See
[building components](/explore/building-ui-components) for scope and composition.

For a reusable wrapper, test two instances at once. Arrowing in the first must not change the
second, every `aria-controls` must resolve to exactly one panel, and each visible panel must name
its own tab. Assert manual activation separately from focus movement. The source alias means fixes
and limitations in Tabs apply here too; there is no independent singular-module behavior to test.
Use [Tab API](/reference/modules/%40typed%2Fui%2FTab) for that public import path.
