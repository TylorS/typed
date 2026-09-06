---
title: "Tabs: panel visibility and deliberate activation"
summary: "Choose automatic or manual activation and keep tab identity separate from panel lifetime."
section: "UI / Collections"
kind: "deep-dive"
order: 244
---

A project inspector shows Summary beside an Activity tab. Someone reading tab labels with arrow
keys should not have to load Activity merely to discover its name. We will build manual activation:
focus can reach Activity while Summary stays visible, and Enter opens the requested panel. Then we
will consider when automatic activation would be better and what hiding a panel does to its work.
If the choice is a bookmarkable destination rather than a local panel, use routing instead.

## Build manually activated panels

```ts
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Tabs from "@typed/ui/Tabs";

export const ProjectInspector = component(function* () {
  const state = yield* Tabs.makeState({ selectedId: "project-summary", activationMode: "manual" });
  const collection = yield* Tabs.makeCollection();
  return html`<section>
    <h2>Project inspector</h2>
    ${Tabs.List({ state, collection, label: "Project information", content: [
      Tabs.Tab({ state, collection, id: "project-summary", panelId: "project-summary-panel",
        content: "Summary" }),
      Tabs.Tab({ state, collection, id: "project-activity", panelId: "project-activity-panel",
        content: "Activity" }),
    ] })}
    ${Tabs.Panel({ state, id: "project-summary-panel", tabId: "project-summary",
      content: html`<p>The project is ready for review.</p>` })}
    ${Tabs.Panel({ state, id: "project-activity-panel", tabId: "project-activity",
      content: html`<ul><li>Draft created</li><li>Review requested</li></ul>` })}
  </section>`;
});
```

The selected tab ID defaults the active ID. `List` owns tablist keyboard handling and hydration;
`Tab` is a native button with tab semantics and a collection registration; `Panel` references its tab
with `aria-labelledby` and hides when another tab is selected. Tab and panel IDs are different
identities connected in both directions. Keep both stable across server rendering and hydration.

## Make panel activation a product decision

Automatic activation is the default: moving or focusing an enabled tab also changes `selectedId`.
Manual activation moves `activeId` but retains `selectedId` until Enter, Space, or click. The example
uses manual activation so arrowing to Activity does not hide Summary immediately. Both modes use
real DOM focus and a single active tab stop; neither puts active-descendant focus on the tablist.

Horizontal Left/Right or vertical Up/Down move according to orientation. Home/End choose bounds;
looping defaults true and RTL can reverse horizontal movement. Disabled registered tabs are skipped
by movement, and disabled tab focus/click handlers do not select them. Arrow behavior requires the
live collection or an explicit `items` array. Prefer the collection for rendered controls: it
supplies the actual elements for focusing and scrolling. An `items` array supports state movement
but is not a replacement for element registration.

`Tabs.select(state, id)` changes both selected and active identity, but is not a promise that browser
focus moved to that tab. `Tabs.move(state, items, direction)` is also a state transition; the List's
collection-backed handler performs the DOM focus/scroll step. Keep that difference visible in tests.
The [APG tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) recommends automatic activation
when panel display is sufficiently immediate. Manual mode is often a better experience for panels
whose selection triggers remote loading.

## Hidden does not mean disposed

`Panel` keeps its content mounted and changes `hidden`; it also has tabindex zero. The hidden
panel's DOM and subscriptions still exist in the surrounding render scope. This preserves draft
input and avoids reconstruction, but it also means that a hidden panel's polling or expensive stream
can continue. If selection should control resource lifetime, gate that work explicitly using the
selected-ID stream and [Fx concurrency](/explore/fx-higher-order-and-concurrency). Do not describe
CSS hiding as cancellation.

The [MDN hidden reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden)
explains the platform visibility attribute. Avoid author CSS that forces hidden panels back into
layout. Do not put all panels inside the tablist: the list owns navigation among tab labels, while
a panel may contain independent inputs and widgets with their own keys.

## Reconcile dynamic tab sets

Closing a tab requires a domain decision about its successor. Choose the remaining neighbor and
update selected/active IDs before leaving a state that references a removed tab. In manual mode,
removing the active tab and removing the selected tab are different cases. The collection unregisters
a removed element but does not invent that policy or implement a Delete-to-close interaction.

Browser checks should assert the active button, its tabindex, both ARIA relationships, and the
visible panel after arrow and commit steps. In manual mode specifically assert that an arrow changes
focus while leaving visibility unchanged. Check that a hidden panel cannot receive tab navigation,
and that nested controls in the selected panel keep their own behavior. Continue with
[the Tab module](/explore/ui-tab) for the alias and an instance-safe wrapper, or consult
[Tabs API](/reference/modules/%40typed%2Fui%2FTabs).
