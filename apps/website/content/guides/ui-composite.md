---
title: "Composite: active identity, movement, and focus"
summary: "Build keyboard movement from a collection while choosing roving or virtual focus explicitly."
section: "UI / Foundations"
kind: "deep-dive"
order: 293
---

A composite widget usually presents one Tab entry and uses directional keys to move within it. Its active item is not automatically its selected value: focus may move without committing selection. `Composite` provides active-ID state, ordered movement, focus/scroll Effects, and typeahead functions. It does not render a widget or decide what activation means.

Prerequisites: [Collection](/explore/ui-collection), [Focusable](/explore/ui-focusable), and [event handlers](/explore/ui-dom#events). Prefer a public [Toolbar](/explore/ui-toolbar), [Listbox](/explore/ui-listbox), or other family when it already implements your pattern. Use the lower-level module when authoring a genuinely new family.

## Construct a small command strip

The controls use native buttons and a roving tabindex. Keyboard movement updates active state, focuses the registered control, and scrolls it into view. Pointer or Tab focus updates the same active ID.

```ts
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Collection from "@typed/ui/Collection";
import * as Composite from "@typed/ui/Composite";

const ReportStrip = <E, R>(run: (command: string) => Effect.Effect<void, E, R>) => component(function* () {
  const state = yield* Composite.makeState({ activeId: "strip-print", orientation: "horizontal" });
  const collection = yield* Collection.makeState<string, HTMLButtonElement>();
  const options = { state, collection };
  const keydown = EventHandler.make(Effect.fn(function* (event: KeyboardEvent) {
    const direction = Composite.keyMove(event, yield* state);
    if (direction === undefined) return;
    event.preventDefault();
    yield* Composite.moveAndFocus(options, direction);
  }));
  const controls = [
    { id: "strip-print", label: "Print", command: "print" },
    { id: "strip-export", label: "Export", command: "export" },
  ];
  return html`<div role="toolbar" aria-label="Report commands" ref=${state}
    tabindex=${Composite.rootTabIndex(state)} onkeydown=${keydown}>
    ${controls.map((item) => html`<button type="button" id=${item.id}
      ref=${Collection.ref(collection, { id: item.id, textValue: item.label, value: item.command })}
      tabindex=${Composite.tabIndex(state, item.id)}
      onfocus=${RefSubject.update(state, (current) => ({ ...current, activeId: item.id }))}
      onclick=${run(item.command)}>${item.label}</button>`)}
  </div>`;
});
const reportStrip = ReportStrip((command) => Effect.log(command));
```

This is a limited, fixed two-command example. A reusable family also needs policies for disabled commands, removal of the active item, dynamic registration, and focus entering when no active ID exists. Those decisions should be explicit before publishing a new component.

## Choose physical or virtual focus

State contains `activeId`, `orientation`, `loop`, `rtl`, and `virtualFocus`. Defaults are null, horizontal, true, false, and false. In roving mode, `tabIndex(state, id)` gives zero only to the active item; `rootTabIndex` gives the root zero only when no item is active. An invalid non-null ID needs application repair, otherwise no item may be tabbable.

With `virtualFocus: true`, items remain at -1 and the root stays at zero. Bind `activeDescendant(state)` to the root's `aria-activedescendant`, and keep DOM focus on that root. `focusActive` deliberately skips physical focus in this mode; the author still needs a valid active descendant, visible active styling, and suitable ARIA semantics. These two strategies are described by the [APG keyboard guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/).

## Separate movement, focus, and activation

`keyMove` maps Home/End and orientation-appropriate arrows, reversing horizontal movement in RTL. `moveByKey` prevents recognized defaults and updates state but does not itself focus. `moveAndFocus` adds focus and nearest scrolling. `moveActiveId` and `moveActiveItem` are pure alternatives for tests; movement uses DOM order and skips disabled entries unless `includeDisabled` is true.

`typeaheadFrom` searches after the active item and wraps, matching a case-insensitive prefix of `textValue` or ID. `typeahead` starts without an active ID. `typeaheadKey` rejects modified shortcuts; `updateTypeaheadBuffer` accepts an explicit clock value and defaults to a 500ms reset threshold. None of these installs a listener or starts a timer for you. A family decides whether matching moves focus, selects, or merely previews.

## Diagnose the right layer

If activeId changes but focus does not, distinguish `move` from `moveAndFocus` and check `virtualFocus`. If focus fails silently, inspect registration: `focusElement` tolerates an absent focus method. If the page scrolls on arrows, the handler has not prevented the recognized default. If order seems wrong after rearrangement, inspect the actual registered elements and DOM order.

The hydrated state and mounted collection have separate lifetimes. Movement combines both states' E/R; DOM focus calls add no typed domain error but can fail as defects. Scope owns registration, state, and rendered listeners. Test pure movement boundaries first, then real browser focus, scroll, disabled/removal behavior, and accessible state.

Next: [Dom](/explore/ui-dom) for host assembly or the existing [Toolbar](/explore/ui-toolbar) family. API: [Composite](/reference/modules/%40typed%2Fui%2FComposite).
