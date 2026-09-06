---
title: "Tree: hierarchical focus and expansion"
summary: "Model parent identities and visible descendants without mistaking focus for file selection."
section: "UI / Collections"
kind: "deep-dive"
order: 247
---

A project browser shows a Source folder, its App.ts and config.ts files, and a root README.md.
Collapsing Source should hide its files and remove them from arrow navigation, while leaving the
README reachable. This requires the visible hierarchy and the navigation metadata to agree.
We will construct that agreement explicitly. Tree tracks expansion and keyboard activity here;
opening or selecting a file remains an application decision. For navigable columns such as file
size, continue from this guide to [TreeGrid](/explore/ui-tree-grid).

## Represent the same hierarchy in metadata and DOM

The parent item's `hasChildren`, the child's `parentId`, and the group's `parentId` must agree.
`level` expresses the accessible depth. A group hides descendants when its parent is collapsed,
while registration metadata lets keyboard traversal exclude those same descendants.

```ts
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Tree from "@typed/ui/Tree";

export const ProjectFiles = component(function* () {
  const state = yield* Tree.makeState({ activeId: "files-source", loop: false });
  const collection = yield* Tree.makeCollection();
  return Tree.Root({ state, collection, label: "Project files", content: [
    Tree.Item({ state, collection, id: "files-source", level: 1, hasChildren: true,
      content: html`Source${Tree.Group({ state, parentId: "files-source", content: [
        Tree.Item({ state, collection, id: "files-app", parentId: "files-source", level: 2,
          content: "App.ts" }),
        Tree.Item({ state, collection, id: "files-config", parentId: "files-source", level: 2,
          content: "config.ts" }),
      ] })}` }),
    Tree.Item({ state, collection, id: "files-readme", level: 1, content: "README.md" }),
  ] });
});
```

This example is a hierarchy browser. Focusing App.ts does not open an editor or claim the file is
selected. Add an explicit application action only after deciding whether activation means opening,
selecting, or previewing. For a larger tree, keep the same ID graph in a domain model and derive
both grouping and registration metadata from it; independently assembling them invites mismatches.

## Traverse only the visible hierarchy

Root focus initializes the first item when there is no active ID and moves real focus to it.
Up/Down and Home/End traverse visible registered items in DOM order. Right expands a collapsed
parent; Right again on an expanded parent moves to its first child. Left collapses an expanded
parent, otherwise moves to its parent. Enter/Space activates the active enabled item's click
behavior. The implementation does not add APG's optional typeahead or expand-all-siblings command.

Expansion is stored by item ID. `expand`, `collapse`, and `activate` are public state transitions;
calling them directly does not promise a DOM focus operation. The keyboard handler couples the
necessary focus movement to those transitions. Ordinary item click updates active identity; it
does not automatically toggle expansion. If your design wants pointer expansion, provide a deliberate
control and reconcile its keyboard interaction with the tree instead of assuming click expands.

The [APG tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) distinguishes focus,
selection, and expansion. Typed exposes `aria-expanded` for parents and `aria-level` for items but
no built-in selection model. Adding `aria-selected` requires real application selection behavior;
multiple selection needs more than an array of checked CSS classes.

## Hidden descendants and removed descendants differ

`Group` uses the [hidden attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden),
so collapsed content remains mounted. Its registrations persist, but parent expansion metadata
filters it out of visible keyboard traversal. This retains local state and avoids remounting; it
also retains subscriptions and memory. Large or remote hierarchies need a deliberate loading and
unmounting policy rather than treating the collection as an offscreen database.

Never use cyclic parent relationships. Visibility checks walk ancestors, so a parent graph must
terminate. A missing parent or inconsistent `hasChildren` can make a visibly indented item behave
like a root. On programmatic collapse, first move active identity/focus out of a descendant that
will become hidden. Keyboard Left already acts from the currently focused node, but an unrelated
collapse button can hide that node from elsewhere.

## Nested content needs careful event ownership

Groups contain child treeitems, but arbitrary editors are not automatically integrated. Tree root
keys can bubble from descendant controls. Do not embed a text editor and expect Left/Right to edit
text while the tree independently handles the same event. The existing family has no edit-mode
entry/exit protocol. Even nested click actions need testing because a child's click bubbles through
ancestor item elements; avoid attaching unconditional open-file actions to every ancestor.

Test expand, descend, return, collapse, and the next visible sibling in a real browser. Assert
`document.activeElement`, expanded IDs, and `hidden` together. Include programmatic collapse of an
active descendant and disabled-child traversal in your application checks; sibling movement and
parent/child movement use different paths. Public contracts: [Tree API](/reference/modules/%40typed%2Fui%2FTree).
