import type { StoryObj } from "@storybook/html-vite";
import { expect, within } from "storybook/test";
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import * as CarouselComponent from "../src/Carousel.js";
import * as ComboboxComponent from "../src/Combobox.js";
import { component } from "../src/Component.js";
import * as DialogComponent from "../src/Dialog.js";
import * as DisclosureComponent from "../src/Disclosure.js";
import * as GridComponent from "../src/Grid.js";
import * as HovercardComponent from "../src/Hovercard.js";
import * as ListboxComponent from "../src/Listbox.js";
import * as MenuComponent from "../src/Menu.js";
import * as MenubarComponent from "../src/Menubar.js";
import * as PopoverComponent from "../src/Popover.js";
import * as SelectComponent from "../src/Select.js";
import * as TabsComponent from "../src/Tabs.js";
import * as ToolbarComponent from "../src/Toolbar.js";
import * as TooltipComponent from "../src/Tooltip.js";
import * as TreeComponent from "../src/Tree.js";
import * as TreeGridComponent from "../src/TreeGrid.js";
import * as WindowSplitterComponent from "../src/WindowSplitter.js";
import { story } from "./story.js";

export default { title: "Patterns" };

const carousel = component(function* () {
  const state = yield* CarouselComponent.makeState({ activeId: "first" });
  const collection = yield* CarouselComponent.makeCollection();

  return CarouselComponent.Root({
    state,
    collection,
    label: "Featured stories",
    content: [
      CarouselComponent.Slide({
        state,
        collection,
        id: "first",
        label: "1 of 2",
        content: "First story",
      }),
      CarouselComponent.Slide({
        state,
        collection,
        id: "second",
        label: "2 of 2",
        content: "Second story",
      }),
      CarouselComponent.Previous({ state, collection, content: "Previous" }),
      CarouselComponent.Next({ state, collection, content: "Next" }),
      CarouselComponent.RotationControl({ state, content: "Pause rotation" }),
    ],
  });
});

export const Carousel = story(carousel);

const combobox = component(function* () {
  const state = yield* ComboboxComponent.makeState({ id: "search" });
  const collection = yield* ComboboxComponent.makeCollection();
  const values = ["Alpine", "Basil", "Cedar"] as const;
  const hiddenWhenNotMatching = (value: string) =>
    RefSubject.map(
      state,
      (current) =>
        current.value.length > 0 &&
        !value.toLocaleLowerCase().includes(current.value.toLocaleLowerCase()),
    );
  const results = RefSubject.map(state, (current) => {
    const needle = current.value.toLocaleLowerCase();
    const count = values.filter((value) => value.toLocaleLowerCase().includes(needle)).length;
    return `${count} result${count === 1 ? "" : "s"}`;
  });

  return html`<div class="story-field">
    <label for="search-input">Search herbs</label>
    ${ComboboxComponent.Input({
      state,
      collection,
      placeholder: "Type to filter",
      props: { id: "search-input" },
    })}
    <output aria-live="polite">${results}</output>
    ${ComboboxComponent.Popover({
      state,
      collection,
      content: [
        ComboboxComponent.Item({
          state,
          collection,
          id: "alpine",
          value: "Alpine",
          content: "Alpine",
          props: { "?hidden": hiddenWhenNotMatching("Alpine") },
        }),
        ComboboxComponent.Item({
          state,
          collection,
          id: "basil",
          value: "Basil",
          content: "Basil",
          props: { "?hidden": hiddenWhenNotMatching("Basil") },
        }),
        ComboboxComponent.Item({
          state,
          collection,
          id: "cedar",
          value: "Cedar",
          content: "Cedar",
          props: { "?hidden": hiddenWhenNotMatching("Cedar") },
        }),
      ],
    })}
  </div>`;
});

export const Combobox = story(combobox);

const dialog = component(function* () {
  const state = yield* DialogComponent.makeState();

  return [
    DialogComponent.Trigger({ state, content: "Open dialog" }),
    DialogComponent.Content({
      state,
      label: "Confirm deletion",
      content: [
        html`<p>This action cannot be undone.</p>`,
        DialogComponent.Close({ state, content: "Cancel" }),
      ],
    }),
  ];
});

export const Dialog = story(dialog);

const disclosure = component(function* () {
  const state = yield* DisclosureComponent.makeState();

  return DisclosureComponent.Content({
    state,
    content: [
      DisclosureComponent.Button({ content: "More details" }),
      html`<p>Details are synchronized with the native disclosure host.</p>`,
    ],
  });
});

export const Disclosure = story(disclosure);

const grid = component(function* () {
  const state = yield* GridComponent.makeState({ activeId: "a1" });
  const collection = yield* GridComponent.makeCollection();

  return GridComponent.Root({
    state,
    collection,
    label: "Invoices",
    content: [
      GridComponent.Row({
        content: [
          GridComponent.ColumnHeader({
            state,
            collection,
            id: "header-invoice",
            rowId: "header",
            columnIndex: 1,
            content: "Invoice",
          }),
          GridComponent.ColumnHeader({
            state,
            collection,
            id: "header-amount",
            rowId: "header",
            columnIndex: 2,
            content: "Amount",
          }),
        ],
      }),
      GridComponent.Row({
        content: [
          GridComponent.Cell({
            state,
            collection,
            id: "a1",
            rowId: "a",
            columnIndex: 1,
            content: "A-100",
          }),
          GridComponent.Cell({
            state,
            collection,
            id: "a2",
            rowId: "a",
            columnIndex: 2,
            content: "$100",
          }),
        ],
      }),
      GridComponent.Row({
        content: [
          GridComponent.Cell({
            state,
            collection,
            id: "b1",
            rowId: "b",
            columnIndex: 1,
            content: "B-200",
          }),
          GridComponent.Cell({
            state,
            collection,
            id: "b2",
            rowId: "b",
            columnIndex: 2,
            content: "$200",
          }),
        ],
      }),
    ],
  });
});

export const Grid = story(grid);

const hovercard = component(function* () {
  const state = yield* HovercardComponent.makeState({ id: "account-card" });

  return [
    HovercardComponent.Anchor({ state, content: "Account", props: { tabindex: 0 } }),
    HovercardComponent.Content({ state, label: "Account details", content: "Account details" }),
  ];
});

export const Hovercard = story(hovercard);

const listbox = component(function* () {
  const state = yield* ListboxComponent.makeState({ value: "one" });
  const collection = yield* ListboxComponent.makeCollection();

  return ListboxComponent.Root({
    state,
    collection,
    label: "Choices",
    content: [
      ListboxComponent.Option({ state, collection, id: "one", value: "one", content: "One" }),
      ListboxComponent.Option({ state, collection, id: "two", value: "two", content: "Two" }),
    ],
  });
});

export const Listbox = story(listbox);

const menu = component(function* () {
  const state = yield* MenuComponent.makeState({ id: "actions" });
  const collection = yield* MenuComponent.makeCollection();

  return [
    MenuComponent.Trigger({ state, content: "Actions" }),
    MenuComponent.Content({
      state,
      collection,
      label: "Actions",
      content: [
        MenuComponent.Item({ state, collection, id: "edit", content: "Edit" }),
        MenuComponent.CheckboxItem({ state, collection, id: "pin", checked: true, content: "Pin" }),
        MenuComponent.Separator({}),
        MenuComponent.Item({ state, collection, id: "delete", content: "Delete" }),
      ],
    }),
  ];
});

export const Menu = story(menu);

const menubar = component(function* () {
  const state = yield* MenubarComponent.makeState({ activeId: "file" });
  const collection = yield* MenubarComponent.makeCollection();

  return MenubarComponent.Root({
    state,
    collection,
    label: "Application menu",
    content: [
      MenubarComponent.Item({ state, collection, id: "file", content: "File" }),
      MenubarComponent.Item({ state, collection, id: "edit", content: "Edit" }),
      MenubarComponent.Item({ state, collection, id: "view", content: "View" }),
    ],
  });
});

export const Menubar = story(menubar);

const popover = component(function* () {
  const state = yield* PopoverComponent.makeState();

  return [
    PopoverComponent.Trigger({ state, content: "Open popover" }),
    PopoverComponent.Content({ state, content: "Popover content" }),
  ];
});

export const Popover = story(popover);

const select = component(function* () {
  const state = yield* SelectComponent.makeState({ id: "size", value: "small" });
  const collection = yield* SelectComponent.makeCollection();

  return [
    SelectComponent.Trigger({ state, content: "Small" }),
    SelectComponent.Content({
      state,
      collection,
      content: [
        SelectComponent.Option({
          state,
          collection,
          id: "small",
          value: "small",
          content: "Small",
        }),
        SelectComponent.Option({
          state,
          collection,
          id: "large",
          value: "large",
          content: "Large",
        }),
      ],
    }),
  ];
});

export const Select = story(select);

interface TabsStoryProps {
  readonly activationMode: TabsComponent.ActivationMode;
  readonly orientation: TabsComponent.Orientation;
}

const tabs = component(function* ({ activationMode, orientation }: TabsStoryProps) {
  const state = yield* TabsComponent.makeState({
    selectedId: "workspace-overview",
    activationMode,
    orientation,
  });
  const collection = yield* TabsComponent.makeCollection();

  return html`<section class="story-tabs" aria-label="Project workspace">
    <header class="story-tabs-heading">
      <p class="story-tabs-eyebrow">Project workspace</p>
      <h2>Atlas design system</h2>
      <p>A shared home for the team's components, decisions, and release notes.</p>
    </header>
    <p id="workspace-tabs-help" class="story-tabs-help">${
      activationMode === "manual"
        ? "Use the arrow keys to explore tabs, then Enter or Space to open a panel. Billing is unavailable."
        : "Use the arrow keys to switch panels. Billing is unavailable and is skipped by keyboard navigation."
    }</p>
    <div class="story-tabs-layout">
      ${TabsComponent.List({
        state,
        collection,
        label: "Project details",
        props: { "aria-describedby": "workspace-tabs-help" },
        content: [
          TabsComponent.Tab({ state, collection, id: "workspace-overview",
            panelId: "workspace-overview-panel", content: "Overview" }),
          TabsComponent.Tab({ state, collection, id: "workspace-activity",
            panelId: "workspace-activity-panel", content: "Activity" }),
          TabsComponent.Tab({ state, collection, id: "workspace-billing",
            panelId: "workspace-billing-panel", content: "Billing", disabled: true }),
          TabsComponent.Tab({ state, collection, id: "workspace-settings",
            panelId: "workspace-settings-panel", content: "Settings" }),
        ],
      })}
      <div class="story-tabs-panels">
        ${TabsComponent.Panel({ state, id: "workspace-overview-panel", tabId: "workspace-overview",
          content: html`<h3>Everything the team needs to build together</h3>
            <p>Atlas keeps reusable components and the decisions behind them in one place.</p>
            <dl class="story-tabs-details">
              <div><dt>Project status</dt><dd>Ready for review</dd></div>
              <div><dt>Owner</dt><dd>Design systems team</dd></div>
              <div><dt>Latest release</dt><dd>Version 2.4</dd></div>
              <div><dt>Next milestone</dt><dd>Component review</dd></div>
            </dl>`,
        })}
        ${TabsComponent.Panel({ state, id: "workspace-activity-panel", tabId: "workspace-activity",
          content: html`<h3>Recent activity</h3><p>The latest changes to Atlas.</p>
            <ol class="story-tabs-activity">
              <li><strong>Navigation patterns reviewed</strong><span>Today · Design systems team</span></li>
              <li><strong>Version 2.4 published</strong><span>Yesterday · Release team</span></li>
              <li><strong>Color tokens updated</strong><span>Monday · Design systems team</span></li>
            </ol>`,
        })}
        ${TabsComponent.Panel({ state, id: "workspace-billing-panel", tabId: "workspace-billing",
          content: html`<h3>Billing</h3><p>Billing is managed by the organization owner.</p>`,
        })}
        ${TabsComponent.Panel({ state, id: "workspace-settings-panel", tabId: "workspace-settings",
          content: html`<h3>Workspace settings</h3><p>Preferences shared by the Atlas team.</p>
            <dl class="story-tabs-details">
              <div><dt>Visibility</dt><dd>Organization members</dd></div>
              <div><dt>Release notifications</dt><dd>Enabled</dd></div>
              <div><dt>Default branch</dt><dd>Main</dd></div>
              <div><dt>Review policy</dt><dd>One approval required</dd></div>
            </dl>`,
        })}
      </div>
    </div>
  </section>`;
});

export const Tabs = {
  ...story(
    tabs,
    { activationMode: "automatic", orientation: "horizontal" },
    {
      activationMode: { control: "inline-radio", options: ["automatic", "manual"] },
      orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    },
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const overview = canvas.getByRole("tab", { name: "Overview" });
    const billing = canvas.getByRole("tab", { name: "Billing" });

    // Catch missing compound-framework styles without changing the visitor's state.
    await expect(Number.parseFloat(getComputedStyle(overview).paddingInlineStart)).toBeGreaterThanOrEqual(12);
    await expect(overview.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    await expect(Number.parseFloat(getComputedStyle(overview.parentElement!).gap)).toBeGreaterThanOrEqual(8);
    await expect(billing).toHaveAttribute("aria-disabled", "true");
  },
} satisfies StoryObj<TabsStoryProps>;

const toolbar = component(function* () {
  const state = yield* ToolbarComponent.makeState({ activeId: "bold" });
  const collection = yield* ToolbarComponent.makeCollection();

  return ToolbarComponent.Root({
    state,
    collection,
    label: "Text formatting",
    content: [
      ToolbarComponent.Item({ state, collection, id: "bold", content: "Bold" }),
      ToolbarComponent.Item({ state, collection, id: "italic", content: "Italic" }),
      ToolbarComponent.Item({ state, collection, id: "underline", content: "Underline" }),
    ],
  });
});

export const Toolbar = story(toolbar);

const tooltip = component(function* () {
  const state = yield* TooltipComponent.makeState({ id: "save-tip" });

  return [
    TooltipComponent.Anchor({ state, content: "Save", props: { tabindex: 0 } }),
    TooltipComponent.Content({ state, content: "Save your changes" }),
  ];
});

export const Tooltip = story(tooltip);

const tree = component(function* () {
  const state = yield* TreeComponent.makeState({ activeId: "root", expandedIds: ["root"] });
  const collection = yield* TreeComponent.makeCollection();

  return TreeComponent.Root({
    state,
    collection,
    label: "Files",
    content: TreeComponent.Item({
      state,
      collection,
      id: "root",
      hasChildren: true,
      content: [
        "Source",
        TreeComponent.Group({
          state,
          parentId: "root",
          content: TreeComponent.Item({
            state,
            collection,
            id: "child",
            parentId: "root",
            content: "index.ts",
          }),
        }),
      ],
    }),
  });
});

export const Tree = story(tree);

const treeGrid = component(function* () {
  const state = yield* TreeGridComponent.makeState({
    activeId: "root-name",
    expandedIds: ["root"],
  });
  const collection = yield* TreeGridComponent.makeCollection();

  return TreeGridComponent.Root({
    state,
    collection,
    label: "Files",
    content: [
      TreeGridComponent.Row({
        state,
        rowId: "root",
        hasChildren: true,
        content: [
          TreeGridComponent.Cell({
            state,
            collection,
            id: "root-name",
            rowId: "root",
            columnIndex: 1,
            hasChildren: true,
            content: "Source",
          }),
          TreeGridComponent.Cell({
            state,
            collection,
            id: "root-size",
            rowId: "root",
            columnIndex: 2,
            content: "1 KB",
          }),
        ],
      }),
      TreeGridComponent.Group({
        state,
        parentId: "root",
        content: TreeGridComponent.Row({
          state,
          rowId: "child",
          parentId: "root",
          content: [
            TreeGridComponent.Cell({
              state,
              collection,
              id: "child-name",
              rowId: "child",
              parentId: "root",
              columnIndex: 1,
              content: "index.ts",
            }),
            TreeGridComponent.Cell({
              state,
              collection,
              id: "child-size",
              rowId: "child",
              parentId: "root",
              columnIndex: 2,
              content: "2 KB",
            }),
          ],
        }),
      }),
    ],
  });
});

export const TreeGrid = story(treeGrid);

const windowSplitter = component(function* (options: {
  readonly orientation: WindowSplitterComponent.Orientation;
  readonly min: number;
  readonly max: number;
  readonly disabled: boolean;
}) {
  const state = yield* WindowSplitterComponent.makeState({ value: 40, step: 10, ...options });
  const paneSizes = RefSubject.map(state, (current) => {
    const tracks = `minmax(0, ${current.value}fr) 12px minmax(0, ${100 - current.value}fr)`;
    return current.orientation === "vertical"
      ? `grid-template-columns:${tracks};grid-template-rows:1fr;min-height:180px;`
      : `grid-template-rows:${tracks};grid-template-columns:1fr;height:320px;`;
  });
  const valueText = RefSubject.map(
    state,
    (current) => `${Math.round(current.value)}% table of contents, ${Math.round(100 - current.value)}% document`,
  );

  return html`<p>Drag the divider, or focus it and use arrow keys. Home/End reach the bounds; Enter collapses or restores.</p>
    <div class="story-split-view" style=${paneSizes}>
      <aside id="contents">Table of contents</aside>
      ${WindowSplitterComponent.WindowSplitter({
        state,
        primaryPaneId: "contents",
        label: "Table of contents",
        disabled: options.disabled,
        valueText,
      })}
      <main>Document</main>
    </div>
    <output aria-live="polite">${valueText}</output>`;
});

export const WindowSplitter = story(windowSplitter, {
  orientation: "vertical", min: 10, max: 90, disabled: false,
}, {
  orientation: { control: "select", options: ["vertical", "horizontal"] },
  min: { control: { type: "range", min: 0, max: 40, step: 5 } },
  max: { control: { type: "range", min: 60, max: 100, step: 5 } },
  disabled: { control: "boolean" },
});
