---
title: "TreeGrid: hierarchical rows and spatial cell focus"
summary: "Keep row expansion identities separate from cell focus identities in a hierarchical grid."
section: "UI / Collections"
kind: "deep-dive"
order: 249
---

A storage browser needs the Source folder's name and size in separate navigable columns, with
App.ts beneath it. The folder expands as one row, but keyboard activity can be on either its name
cell or its size cell. We will model those two identities explicitly so collapsing Source also
removes its children's cells from navigation. Read [Tree](/explore/ui-tree) for hierarchy and
[Grid](/explore/ui-grid) for spatial focus before combining their ideas here.

## Connect rows, cells, and groups

The example repeats parent metadata on child cells because the keyboard collection registers cells,
not rows. Row options provide the accessible hierarchy; cell options provide navigation metadata.

```ts
import { component } from "@typed/ui/Component";
import * as TreeGrid from "@typed/ui/TreeGrid";

export const StorageBrowser = component(function* () {
  const state = yield* TreeGrid.makeState({ activeId: "storage-source-name" });
  const collection = yield* TreeGrid.makeCollection();
  return TreeGrid.Root({ state, collection, label: "Storage files and sizes", content: [
    TreeGrid.Row({ state, rowId: "storage-source", level: 1, hasChildren: true, content: [
      TreeGrid.Cell({ state, collection, id: "storage-source-name", rowId: "storage-source",
        columnIndex: 1, hasChildren: true, content: "Source" }),
      TreeGrid.Cell({ state, collection, id: "storage-source-size", rowId: "storage-source",
        columnIndex: 2, hasChildren: true, content: "12 KB" }),
    ] }),
    TreeGrid.Group({ state, parentId: "storage-source", content:
      TreeGrid.Row({ state, rowId: "storage-app", parentId: "storage-source", level: 2, content: [
        TreeGrid.Cell({ state, collection, id: "storage-app-name", rowId: "storage-app",
          parentId: "storage-source", columnIndex: 1, content: "App.ts" }),
        TreeGrid.Cell({ state, collection, id: "storage-app-size", rowId: "storage-app",
          parentId: "storage-source", columnIndex: 2, content: "12 KB" }),
      ] }),
    }),
  ] });
});
```

`expandedIds` contains `storage-source`, never `storage-source-name`. `activeId` contains a cell
ID such as `storage-app-name`, never merely `storage-app`. Group visibility reads expansion by row
ID. When a parent is collapsed, traversal walks each cell's parent chain to exclude hidden rows.
A parent graph must terminate and agree with the DOM structure.

## The first column has a hierarchy-specific contract

The root is the tab stop and keeps DOM focus, exposing the active cell with `aria-activedescendant`.
Cells use `data-active` for visual emphasis. At column one, Right on a parent expands its row; Right
again moves to its first child's first column. Left collapses an expanded row or moves to its parent's
first column. Elsewhere, ordinary Grid movement uses row identity and column index. Home/End and
Ctrl+Home/Ctrl+End follow the visible collection's grid bounds.

That first-column precedence matters: Right on an expanded parent does not move to column two;
it attempts to descend. This implementation is a particular navigation policy, not a configurable
spreadsheet engine. It inherits Grid's current upward boundary asymmetry: the first registered cell
in a column can wrap to the last through negative indexing. Test that behavior against the product's
expected interaction before using the primitive for a large operational grid.

The [APG treegrid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/) describes richer
combinations of row focus, cell focus, selection, and embedded controls. This family uses cell IDs
with root-held focus. It does not implement all those variants, editing mode, selection ranges, or
custom control entry/exit keys. [MDN active-descendant](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-activedescendant)
explains why the referenced cell must remain in the rendered accessible structure.

## Expansion does not select a row

`TreeGrid.makeState`, `expand`, `collapse`, `activate`, and `isExpanded` reuse the Tree state
contract. They track expansion and activity, not which records an application has selected.
Do not derive a saved account or file selection automatically from `activeId` unless that is the
explicit product behavior. A user may move across a row only to inspect its size.

Group hiding keeps descendant rows mounted. This preserves state but does not release their
subscriptions. A remote folder loader needs separate loading/error state and a decision about what
happens when the folder collapses during a request. Removing rows also needs active-cell repair;
otherwise the root may keep referencing a vanished ID. If a parent is collapsed programmatically
while a descendant is active, move activity to the parent cell as part of the same interaction.

## Debug both metadata layers

If a row looks collapsed but remains reachable, check each child's `parentId` in the cell registry,
not only the Row props. If Right never expands, inspect the active cell's `columnIndex` and
`hasChildren`. If expansion changes state but not visibility, inspect the Group's parent row ID.
A row's `level` changes ARIA metadata, not the registry's ancestry.

Keep nested text inputs and buttons out until their event ownership is designed: bubbling arrow
keys currently reach the root navigation handler. Test parent expand, descend, return, collapse,
next visible row, second-column movement, and active-descendant existence after data replacement.
The exact focused DOM node should remain the root throughout those navigation checks.
Public contracts: [TreeGrid](/reference/modules/%40typed%2Fui%2FTreeGrid).
