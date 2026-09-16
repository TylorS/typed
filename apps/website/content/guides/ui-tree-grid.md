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
import { component } from "@typed/template";
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

TreeGrid tracks expansion and activity, not row selection or editing. Those additional interaction
modes have the same boundaries described in [Tree](/explore/ui-tree) and [Grid](/explore/ui-grid).
The [APG treegrid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/) describes other variants.

## Expansion does not select a row

`expand`, `collapse`, `activate`, and `isExpanded` reuse the Tree state contract. Moving across a
row to inspect its size does not select that record. Group hiding retains mounted descendants;
removing a row instead requires repair of any active cell ID that disappears. If a programmatic
collapse hides the active descendant, move activity to the parent cell in the same interaction.

## Debug both metadata layers

If a row looks collapsed but remains reachable, check each child's `parentId` in the cell registry,
not only the Row props. If Right never expands, inspect the active cell's `columnIndex` and
`hasChildren`. If expansion changes state but not visibility, inspect the Group's parent row ID.
A row's `level` changes ARIA metadata, not the registry's ancestry.

Verify parent expansion, descent, return, collapse, and second-column movement. Throughout those
operations, DOM focus stays on the root and its active-descendant ID must name a visible cell.
Public contracts: [TreeGrid](/reference/modules/%40typed%2Fui%2FTreeGrid).
