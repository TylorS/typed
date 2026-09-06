---
title: "Grid: spatial navigation with active-descendant focus"
summary: "Build a two-dimensional keyboard surface and distinguish it from an editable spreadsheet."
section: "UI / Collections"
kind: "deep-dive"
order: 248
---

A build monitor lets an engineer inspect results across operating systems. Left/Right should move
between system and result within one row; Up/Down should compare the same column across rows.
That spatial interaction is what this Grid example supplies. If the monitor only displays a report,
a semantic table is simpler and should be preferred. We will build the interactive matrix, trace
its active-descendant focus, and identify the additional decisions required before adding editors
or virtualized rows. [Collection focus](/explore/ui-collections-and-focus) introduces the registry.

## Render an inspectable matrix

The root keeps native focus. Cells have globally unique IDs, a row identity, and a one-based
column index. Row/column metadata describes the keyboard matrix; CSS alone does not establish it.

```ts
import { component } from "@typed/ui/Component";
import * as Grid from "@typed/ui/Grid";

export const BuildMatrix = component(function* () {
  const state = yield* Grid.makeState({ activeId: "build-linux-name" });
  const collection = yield* Grid.makeCollection();
  return Grid.Root({ state, collection, label: "Build results", content: [
    Grid.Row({ rowIndex: 1, content: [
      Grid.ColumnHeader({ state, collection, id: "build-heading-system", rowId: "build-headings",
        columnIndex: 1, content: "System" }),
      Grid.ColumnHeader({ state, collection, id: "build-heading-result", rowId: "build-headings",
        columnIndex: 2, content: "Result" }),
    ] }),
    Grid.Row({ rowIndex: 2, content: [
      Grid.RowHeader({ state, collection, id: "build-linux-name", rowId: "build-linux",
        columnIndex: 1, content: "Linux" }),
      Grid.Cell({ state, collection, id: "build-linux-result", rowId: "build-linux",
        columnIndex: 2, content: "Passed" }),
    ] }),
    Grid.Row({ rowIndex: 3, content: [
      Grid.RowHeader({ state, collection, id: "build-macos-name", rowId: "build-macos",
        columnIndex: 1, content: "macOS" }),
      Grid.Cell({ state, collection, id: "build-macos-result", rowId: "build-macos",
        columnIndex: 2, content: "Queued" }),
    ] }),
  ] });
});
```

`Row` emits row semantics. `Cell`, `RowHeader`, and `ColumnHeader` all register navigable cell
positions with the same collection. Root focus chooses the first DOM-ordered registered item only
if `activeId` is null. Setting the initial ID above begins in a data row without changing tab order.

## Inspect the active descendant, not the focused cell

Root has tabindex zero and `aria-activedescendant`; cells expose `data-active` when their IDs match.
Keyboard movement changes state while `document.activeElement` remains the root. Style
`[data-active]` for a visible cell indicator: `:focus` on individual cells will not describe this
model. [MDN's active-descendant reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-activedescendant)
explains the reference relationship; the ID must continue to resolve to a rendered descendant.

Left/Right select adjacent DOM-ordered cells in the same `rowId`. Home/End select row bounds;
Ctrl+Home/Ctrl+End select collection bounds. Up/Down select registered cells with the same
`columnIndex`, so ragged rows skip rows missing that column. The current implementation uses
negative array indexing for upward movement: ArrowUp on the first registered cell in a column
wraps to the last, while downward overflow retains the current cell. Treat that asymmetry as a
current limitation to test, not a configurable wrap policy.

Rows need coherent DOM order, row IDs, and column indices. `aria-rowindex` supplies accessible
metadata but is not the sorting key for navigation. Reordering just the displayed number leaves
movement following the mounted DOM. `Grid.activate` changes active identity; it does not click a
cell, scroll it, or transfer focus to an editor.

## Selection and editing are separate features

A cell's `selected` option supplies `aria-selected`; the root's `multiselectable` option supplies
metadata. Neither adds selection transitions or Shift+Arrow range behavior. Application state must
represent the real selected cells and implement a complete interaction before advertising multiple
selection. Active identity remains the navigation cursor, even if nothing is selected.

The [APG grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) describes richer interaction
variants, including cells containing controls. This primitive has no built-in Enter/F2 editing mode
or Escape return protocol. Its root arrow handler can receive bubbling keys from an input. Simply
placing an input in a cell therefore creates competing key owners; design and test explicit
navigation/editing modes before introducing nested interactive content.

## Treat rendering limits as part of navigation

The collection only knows mounted cells. It cannot target an unloaded row, and the root handler
does not automatically scroll the active cell into view. A virtualized grid must coordinate active
identity, row mounting, and scrolling while ensuring the ARIA target exists. A sortable grid must
reconcile removed or replaced cells. Neither is obtained by keeping a larger array beside a smaller
DOM window.

Browser tests should assert root focus, changing active-descendant, and the matching `data-active`
cell after horizontal, vertical, and boundary keys. Test the current first-row upward behavior
explicitly. With row changes, assert the referenced ID still exists. For plain read-only data without
cell interaction, prefer a table and avoid introducing these navigation obligations.
Public API: [Grid](/reference/modules/%40typed%2Fui%2FGrid).
