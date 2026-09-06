---
title: "UI collections, focus, and keyboard behavior"
summary: "Build a changing editor toolbar and trace the relationship between command identity, DOM registration, browser focus, and application state."
section: "UI"
kind: "deep-dive"
order: 4.2
---

An editor has three tools: Move, Draw, and Erase. The user tabs into its toolbar, presses Right to
inspect Draw, then presses Enter to use it. Later, the document becomes read-only and Erase disappears.
A good implementation must answer two questions that a row of styled buttons does not answer: did
moving focus also change the editor tool, and where does focus go when its current control vanishes?

We will build that interaction in two stages. First, give the toolbar a keyboard location without
confusing it with the selected editor tool. Then make the command list change while preserving the
relationship between logical identity and actual DOM elements. The same reasoning explains why a
combobox can keep focus in an input, why a grid can keep focus on its root, and why those families
cannot all use one generic “selected item” abstraction.

## Start with two different facts

The editor's current tool is application state: it changes what a pointer drag does on the canvas.
The toolbar's active item is interaction state: it tells the next arrow key where to start. A user
must be able to navigate the toolbar without changing the canvas tool on every arrow press.

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Toolbar from "@typed/ui/Toolbar";

export const DrawingTools = component(function* () {
  const tool = yield* RefSubject.make("move");
  const state = yield* Toolbar.makeState({ activeId: "drawing-move" });
  const collection = yield* Toolbar.makeCollection();

  return html`<section>
    ${Toolbar.Root({ state, collection, label: "Drawing tools", content: [
      Toolbar.Item({ state, collection, id: "drawing-move", content: "Move",
        props: {
          "aria-pressed": RefSubject.map(tool, (value) => value === "move"),
          onclick: RefSubject.set(tool, "move"),
        },
      }),
      Toolbar.Item({ state, collection, id: "drawing-draw", content: "Draw",
        props: {
          "aria-pressed": RefSubject.map(tool, (value) => value === "draw"),
          onclick: RefSubject.set(tool, "draw"),
        },
      }),
    ] })}
    <p>Canvas tool: ${tool}</p>
  </section>`;
});
```

Render `DrawingTools` inside the application's normal render scope. The zero-argument component
is an Fx; creating the value does not eagerly mount elements or install keyboard listeners. Its
generator acquires state when rendered. The canvas-tool subject, toolbar state, and collection then
share that component's lifetime. See [building components](/explore/building-ui-components) if this
acquisition boundary is new.

Tab into Move and press Right. `state.activeId` becomes `drawing-draw`, the actual Draw element
receives focus, and `tool` stays `move`. Press Enter: the root activates the registered item, which
runs its click effect and sets `tool` to `draw`. The pressed attributes and the visible text now agree.
This separation is why the example does not subscribe to active-ID changes to select tools.

## Understand what the collection contributes

There is no array of elements in our application code. Each rendered `Toolbar.Item` supplies a ref
that registers its stable ID and actual DOM element in `collection`. The root uses that registry
to find the next item and focus it. Mounting an item acquires a registration; removing its rendered
scope releases that registration. Replacement cleanup is identity-safe: an older registration's
finalizer cannot remove a newer registration with the same ID.

The active ID is a string because it names a logical command. An array index would instead name a
position, and a DOM element would tie application state to one render instance. The registry bridges
those layers. It reads current DOM order for movement rather than assuming the order in which
asynchronous registrations happened is visual order.

In the default horizontal toolbar, Left/Right move through enabled registered items, Home/End move
to the bounds, and Enter/Space activate. Only the active item has tabindex zero; other items have
minus one. If no active item exists, the root can take the initial tab stop and establish one.
Normal operation then uses real focus on the item. The root does not implement Menu's printable-key
typeahead merely because both families use Collection.

## Make the commands change without losing their identity

Now allow Erase to be removed from the toolbar. A keyed `many` gives each command ID one retained
rendered range. The collection gives each mounted item its DOM registration. These solve related
but different problems: keyed rendering preserves nodes through updates; registration lets keyboard
behavior find the nodes that currently exist.

This version repairs active identity before removing Erase, and moves browser focus only if Erase
still owns it. That distinction matters: clicking the external Remove button normally focuses that
button, and the toolbar should not steal focus back. The editor also switches away from Erase when
necessary, because removing a control and removing the underlying capability are one application
operation.

```ts
import * as Effect from "effect/Effect";
import { RefSubject } from "@typed/fx";
import { html, many } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Composite from "@typed/ui/Composite";
import * as Toolbar from "@typed/ui/Toolbar";

interface DrawingCommand {
  readonly id: string;
  readonly label: string;
}

export const ChangingDrawingTools = component(function* () {
  const commands = yield* RefSubject.make<ReadonlyArray<DrawingCommand>>([
    { id: "drawing-move", label: "Move" },
    { id: "drawing-draw", label: "Draw" },
    { id: "drawing-erase", label: "Erase" },
  ]);
  const tool = yield* RefSubject.make("drawing-move");
  const state = yield* Toolbar.makeState({ activeId: "drawing-move" });
  const collection = yield* Toolbar.makeCollection();

  const removeErase = Effect.andThen(
    Effect.flatMap(state, ({ activeId }) => activeId === "drawing-erase"
      ? Effect.flatMap(collection, (items) => {
          const erased = items.find((item) => item.id === "drawing-erase")?.element;
          const heldFocus = erased !== undefined && erased.ownerDocument.activeElement === erased;
          return Effect.andThen(
            RefSubject.update(state, (current) => ({ ...current, activeId: "drawing-move" })),
            heldFocus ? Composite.focusActive({ state, collection }) : Effect.void,
          );
        })
      : Effect.void),
    Effect.andThen(
      RefSubject.update(tool, (current) => current === "drawing-erase" ? "drawing-move" : current),
      RefSubject.update(commands, (current) => current.filter((command) => command.id !== "drawing-erase")),
    ),
  );

  return html`<section>
    ${Toolbar.Root({ state, collection, label: "Drawing tools", content: many(
      commands,
      (command) => command.id,
      (command, id) => Toolbar.Item({ state, collection, id,
        content: RefSubject.map(command, (current) => current.label),
        props: {
          "aria-pressed": RefSubject.map(tool, (current) => current === id),
          onclick: RefSubject.set(tool, id),
        },
      }),
    ) })}
    <button type="button" onclick=${removeErase}>Remove Erase tool</button>
    <p>Canvas tool: ${tool}</p>
  </section>`;
});
```

This example has a known Move command that always survives, so it is an adequate successor
policy. A tab strip that can close any tab needs a different policy, often the preceding or following
neighbor. An empty list needs an explicit external focus destination. Those are domain decisions;
a registry cannot infer them from an unmount notification.

Notice that the removal action is idempotent. Repeating it does not add duplicate items or move focus
away from a retained active tool. If a permission update can arrive from outside this component,
route it through the same reconciliation operation rather than filtering the rendered array in one
place and repairing interaction state somewhere else.

## Check the boundary that state cannot prove

A state-only check can confirm the active ID. It cannot prove the ref was registered on the correct
node, the browser accepted focus, or a custom host retained the keyboard handlers. After pressing
Right in a browser, inspect both `state.activeId` and `document.activeElement.id`. In this toolbar
they should identify the same command. After an external update removes a focused Erase, Move
should receive focus and no registration should point at the detached Erase node. When removal
comes from the external button, that button should retain focus instead.

When wrapping an item, keep its supplied ref, role, tabindex, and event props on the element that
actually receives focus. A decorative outer div can make the page look correct while registering
the wrong node. If arrow state changes but the visual focus indicator stays behind, inspect that
boundary before changing the movement algorithm. Disabled commands are skipped by toolbar movement;
a custom application click effect still needs to respect the same disabled condition.

## Transfer the reasoning, not the exact focus implementation

A [Listbox](/explore/ui-listbox) intentionally selects as real focus moves. A
[Combobox](/explore/ui-combobox) keeps browser focus in the native input and reports its active option
through `aria-activedescendant`; moving to a suggestion does not commit the text. A
[Grid](/explore/ui-grid) likewise keeps focus on its root while active cell identity changes.
For those widgets, asserting that `document.activeElement.id` equals the option or cell ID would
be the wrong test. [MDN's active-descendant reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-activedescendant)
explains the alternative relationship.

Hierarchy introduces another boundary. [Tree](/explore/ui-tree) descendants share one registry and
use parent metadata to calculate visible navigation. A [Menu](/explore/ui-menu) submenu gets its
own registry; its trigger links parent and child interaction scopes. Arbitrary nested editors do
not acquire such coordination automatically. A text input placed inside Grid can still bubble
arrow events to the root, so an editing mode needs a deliberate entry, exit, and event policy.

The [APG keyboard interface guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
provides the broader focus-versus-selection vocabulary. Continue to [Toolbar](/explore/ui-toolbar)
for its full public behavior, [Tabs](/explore/ui-tabs) for manual panel activation, or
[Collection](/reference/modules/%40typed%2Fui%2FCollection) and
[Composite](/reference/modules/%40typed%2Fui%2FComposite) when implementing a new interaction family.
