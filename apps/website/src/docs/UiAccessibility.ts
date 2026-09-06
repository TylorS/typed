
export interface UiAccessibilityReference {
  readonly label: string;
  readonly href: string;
}

export interface UiAccessibilityEvidence {
  readonly file: string;
  readonly detail: string;
}

export interface UiAccessibilityFamily {
  readonly id: string;
  readonly label: string;
  readonly families: ReadonlyArray<string>;
  /** Concrete host, state, ARIA, or keyboard behavior asserted in Typed source/tests. */
  readonly typedVerifies: ReadonlyArray<string>;
  /** Content, context, and composition requirements that cannot be inferred by a component. */
  readonly authorsMustProvide: ReadonlyArray<string>;
  readonly references: ReadonlyArray<UiAccessibilityReference>;
  readonly evidence: ReadonlyArray<UiAccessibilityEvidence>;
}

const apg = (label: string, pattern: string): UiAccessibilityReference => ({
  label: `APG: ${label}`,
  href: `https://www.w3.org/WAI/ARIA/apg/patterns/${pattern}/`,
});

const aria = (label: string): UiAccessibilityReference => ({
  label: `ARIA: ${label}`,
  href: "https://www.w3.org/TR/wai-aria-1.3/",
});

const mdn = (label: string, path: string): UiAccessibilityReference => ({
  label: `MDN: ${label}`,
  href: `https://developer.mozilla.org/en-US/docs/Web/${path}`,
});

const whatwg = (label: string): UiAccessibilityReference => ({
  label: `HTML Standard: ${label}`,
  href: "https://html.spec.whatwg.org/multipage/",
});

const source = (file: string, detail: string): UiAccessibilityEvidence => ({ file, detail });
const test = (file: string, detail: string): UiAccessibilityEvidence => ({ file, detail });

/**
 * Source-backed accessibility contracts for the public UI families.
 *
 * This is deliberately a capability map, not an accessibility certification. Each entry says which
 * concrete behavior the Typed implementation supplies and what still belongs to the caller's
 * content, labels, context, and custom-host composition.
 */
export const uiAccessibilityFamilies: ReadonlyArray<UiAccessibilityFamily> = [
  {
    id: "actions-and-navigation",
    label: "Actions and navigation",
    families: ["Button", "Link"],
    typedVerifies: [
      "Button renders a native button with a non-submitting default type and native disabled behavior.",
      "Link renders a native anchor and only intercepts eligible same-origin primary clicks.",
    ],
    authorsMustProvide: [
      "An accessible name through visible content or another valid naming mechanism.",
      "A destination and link-versus-action choice that matches the user’s intent.",
    ],
    references: [
      apg("Button", "button"),
      apg("Link", "link"),
      mdn("button", "HTML/Reference/Elements/button"),
      whatwg("native button and anchor elements"),
    ],
    evidence: [
      source("packages/ui/src/Button.ts", "native button fallback, type, and disabled props"),
      source("packages/ui/src/Link.ts", "native anchor fallback and eligible-click handling"),
      test("packages/ui/src/__tests__/Button.browser.test.ts", "real button interaction coverage"),
      test(
        "packages/ui/src/__tests__/Link.browser.test.ts",
        "modified and eligible click coverage",
      ),
    ],
  },
  {
    id: "boolean-and-exclusive-choice",
    label: "Boolean and exclusive choice",
    families: ["Checkbox", "Switch", "RadioGroup"],
    typedVerifies: [
      "Checkbox derives native checked, indeterminate, and aria-checked state from one subject.",
      "Switch and RadioGroup expose their checked state and keyboard collection behavior through their public parts.",
    ],
    authorsMustProvide: [
      "A visible or programmatic label, meaningful option text, and the correct single-versus-multiple-choice model.",
      "A custom host that keeps the supplied checked, disabled, event, and ref props.",
    ],
    references: [
      apg("Checkbox", "checkbox"),
      apg("Switch", "switch"),
      apg("Radio Group", "radio"),
      whatwg("native input controls"),
    ],
    evidence: [
      source("packages/ui/src/Checkbox.ts", "native input and checked/mixed state projection"),
      source("packages/ui/src/Switch.ts", "switch role and aria-checked projection"),
      source("packages/ui/src/RadioGroup.ts", "radiogroup and radio parts"),
      test(
        "packages/ui/src/__tests__/ValueControls.browser.test.ts",
        "value-control browser behavior",
      ),
      test("packages/ui/src/__tests__/RadioGroup.browser.test.ts", "radio-group browser behavior"),
    ],
  },
  {
    id: "numeric-and-measurement",
    label: "Numeric input and measurement",
    families: ["Slider", "SpinButton", "Meter"],
    typedVerifies: [
      "Slider and SpinButton synchronize finite state with native range and number inputs.",
      "Meter renders the native meter element from finite state and range props.",
    ],
    authorsMustProvide: [
      "A label, units, min/max/step values, and a value meaning that a person can understand.",
      "A non-native host only when it preserves the supplied range and value semantics.",
    ],
    references: [
      apg("Slider", "slider"),
      apg("Spinbutton", "spinbutton"),
      apg("Meter", "meter"),
      whatwg("native range, number, and meter controls"),
    ],
    evidence: [
      source("packages/ui/src/Slider.ts", "native range input and state mapping"),
      source("packages/ui/src/SpinButton.ts", "native number input and state mapping"),
      source("packages/ui/src/Meter.ts", "native meter fallback"),
      test(
        "packages/ui/src/__tests__/ValueControls.browser.test.ts",
        "range and numeric browser coverage",
      ),
    ],
  },
  {
    id: "forms",
    label: "Forms and validation",
    families: ["Form"],
    typedVerifies: [
      "Form supplies native form controls, field metadata, aria-describedby/aria-invalid projection, and alert-role error output.",
      "Submit and reset behavior remains attached to native form semantics.",
    ],
    authorsMustProvide: [
      "Field labels, instructions, error wording, required constraints, and a validation policy appropriate to the domain.",
      "Server-side validation and an error-recovery flow; a client component cannot establish either alone.",
    ],
    references: [
      apg("Alert", "alert"),
      aria("form, textbox, and alert roles"),
      mdn("form", "HTML/Reference/Elements/form"),
      whatwg("forms and form controls"),
    ],
    evidence: [
      source(
        "packages/ui/src/Form.ts",
        "native control hosts, field metadata, and error relationships",
      ),
      test("packages/ui/src/__tests__/Form.test.ts", "form-state and rendered-contract coverage"),
      test("packages/ui/src/__tests__/Form.browser.test.ts", "browser form interaction coverage"),
    ],
  },
  {
    id: "disclosure-and-overlays",
    label: "Disclosure and overlays",
    families: [
      "Disclosure",
      "Dialog",
      "Popover",
      "Tooltip",
      "Hovercard",
      "NativeDetails",
      "NativeDialog",
      "NativePopover",
    ],
    typedVerifies: [
      "Disclosure, Dialog, and Popover synchronize one open state with the corresponding native details, dialog, or popover lifecycle.",
      "Tooltip and Hovercard supply their documented trigger/content roles and relationships, including Escape handling where implemented.",
    ],
    authorsMustProvide: [
      "A useful trigger name, a dialog label/description when required, and content that is appropriate for a transient overlay.",
      "Focus-return, dismissal, modality, and reading-order choices when composing outside the public family contract.",
    ],
    references: [
      apg("Disclosure", "disclosure"),
      apg("Dialog (Modal)", "dialog-modal"),
      apg("Tooltip", "tooltip"),
      mdn("dialog", "HTML/Reference/Elements/dialog"),
      mdn("Popover API", "API/Popover_API"),
      whatwg("dialog and details elements"),
    ],
    evidence: [
      source("packages/ui/src/Disclosure.ts", "native details and toggle synchronization"),
      source("packages/ui/src/Dialog.ts", "dialog trigger/content naming and lifecycle props"),
      source("packages/ui/src/Popover.ts", "native popover trigger/content synchronization"),
      source("packages/ui/src/Tooltip.ts", "tooltip relationship and trigger behavior"),
      source("packages/ui/src/Hovercard.ts", "hovercard trigger/content behavior"),
      test("packages/ui/src/__tests__/Dialog.browser.test.ts", "dialog browser behavior"),
      test("packages/ui/src/__tests__/Popover.browser.test.ts", "popover browser behavior"),
      test("packages/ui/src/__tests__/Tooltip.browser.test.ts", "tooltip browser behavior"),
    ],
  },
  {
    id: "popup-selection",
    label: "Popup selection and autocomplete",
    families: ["Menu", "Select", "Combobox", "Listbox"],
    typedVerifies: [
      "The public parts provide menu, listbox, option, and combobox roles plus their state-derived relationships.",
      "Collections drive active identity, enabled-item ordering, and the keyboard/typeahead behavior implemented by each family.",
    ],
    authorsMustProvide: [
      "Stable item ids, accurate option labels, and content whose meaning matches the chosen interaction pattern.",
      "A selection and filtering policy; Typed cannot infer whether every source value should be selectable or visible.",
    ],
    references: [
      apg("Menu Button", "menu-button"),
      apg("Combobox", "combobox"),
      apg("Listbox", "listbox"),
      aria("menu, listbox, option, and combobox roles"),
    ],
    evidence: [
      source("packages/ui/src/Menu.ts", "menu roles, trigger, items, and collection state"),
      source("packages/ui/src/Select.ts", "select trigger, popup, and option roles"),
      source("packages/ui/src/Combobox.ts", "combobox input, popup, and active descendant props"),
      source("packages/ui/src/Listbox.ts", "listbox root and option roles"),
      test("packages/ui/src/__tests__/Menu.browser.test.ts", "menu browser behavior"),
      test("packages/ui/src/__tests__/Combobox.browser.test.ts", "combobox browser behavior"),
      test("packages/ui/src/__tests__/Listbox.browser.test.ts", "listbox browser behavior"),
    ],
  },
  {
    id: "composite-navigation",
    label: "Composite navigation",
    families: ["Tab", "Tabs", "Toolbar", "Menubar"],
    typedVerifies: [
      "Tabs supplies tablist, tab, and tabpanel relationships from shared state and collection identity.",
      "Toolbar and Menubar supply their roles, orientation, active-item state, and collection-driven keyboard behavior.",
    ],
    authorsMustProvide: [
      "A concise accessible name where the pattern needs one and items with meaningful labels in a logical order.",
      "A deliberate activation and navigation policy when mixing controls with different behavior.",
    ],
    references: [
      apg("Tabs", "tabs"),
      apg("Toolbar", "toolbar"),
      apg("Menu and Menubar", "menubar"),
    ],
    evidence: [
      source("packages/ui/src/Tabs.ts", "tablist/tab/tabpanel roles and relationships"),
      source("packages/ui/src/Toolbar.ts", "toolbar role and composite state"),
      source("packages/ui/src/Menubar.ts", "menubar role and composite state"),
      source("packages/ui/src/Tab.ts", "tab-specific public module"),
      test("packages/ui/src/__tests__/Tabs.browser.test.ts", "tab browser behavior"),
      test("packages/ui/src/__tests__/Toolbar.browser.test.ts", "toolbar browser behavior"),
      test("packages/ui/src/__tests__/Menubar.test.ts", "menubar rendered contract"),
    ],
  },
  {
    id: "structured-navigation",
    label: "Structured navigation",
    families: ["Tree", "Grid", "TreeGrid"],
    typedVerifies: [
      "Tree, Grid, and TreeGrid derive public roles, active identity, and item/row/cell relationships from their state and collections.",
      "Grid and TreeGrid keep their composite focus model at the root through aria-activedescendant when that pattern is used.",
    ],
    authorsMustProvide: [
      "A stable, meaningful hierarchy or table model; correct row, cell, and header content; and labels that explain the collection.",
      "Data-loading, editing, sorting, and selection semantics beyond the public component state contract.",
    ],
    references: [apg("Tree View", "treeview"), apg("Grid", "grid"), apg("Treegrid", "treegrid")],
    evidence: [
      source("packages/ui/src/Tree.ts", "tree/treeitem/group roles and expansion state"),
      source("packages/ui/src/Grid.ts", "grid, row, cell, and header roles"),
      source("packages/ui/src/TreeGrid.ts", "treegrid, row, cell, and hierarchy roles"),
      test("packages/ui/src/__tests__/Tree.browser.test.ts", "tree browser behavior"),
      test("packages/ui/src/__tests__/Grid.browser.test.ts", "grid browser behavior"),
      test("packages/ui/src/__tests__/TreeGrid.browser.test.ts", "treegrid browser behavior"),
    ],
  },
  {
    id: "layout-and-rotation",
    label: "Layout and rotation controls",
    families: ["Carousel", "WindowSplitter"],
    typedVerifies: [
      "Carousel supplies region/group structure, active-slide state, and its documented previous/next/rotation controls.",
      "WindowSplitter supplies a focusable separator role with orientation and range values from shared state.",
    ],
    authorsMustProvide: [
      "An accessible carousel name, meaningful slide content, and a rotation policy that is appropriate for the page.",
      "Pane labels, a usable collapsed-state policy, and content that remains understandable at all splitter sizes.",
    ],
    references: [apg("Carousel", "carousel"), apg("Window Splitter", "windowsplitter")],
    evidence: [
      source("packages/ui/src/Carousel.ts", "carousel roles, slide state, and controls"),
      source("packages/ui/src/WindowSplitter.ts", "separator role and value/orientation props"),
      test("packages/ui/src/__tests__/Carousel.test.ts", "carousel rendered contract"),
      test("packages/ui/src/__tests__/WindowSplitter.browser.test.ts", "splitter browser behavior"),
    ],
  },
  {
    id: "semantic-primitives",
    label: "Semantic primitives",
    families: ["Alert", "Group", "Heading", "Separator", "Focusable", "Role", "VisuallyHidden"],
    typedVerifies: [
      "These families render their documented native host or explicit ARIA role, level, orientation, focusability, or visually-hidden treatment.",
      "Alert, heading, group, and separator semantics are supplied as props rather than inferred from styling.",
    ],
    authorsMustProvide: [
      "Accurate role selection, headings in a meaningful document outline, and labels for groups or focusable content when needed.",
      "Announcement timing and message priority; role=alert must not be used for routine static content.",
    ],
    references: [
      apg("Alert", "alert"),
      aria("document structure and widget roles"),
      mdn("heading elements", "HTML/Reference/Elements/Heading_Elements"),
    ],
    evidence: [
      source("packages/ui/src/Alert.ts", "alert role fallback"),
      source("packages/ui/src/Heading.ts", "heading role and level props"),
      source("packages/ui/src/Group.ts", "group and label host contracts"),
      source("packages/ui/src/Separator.ts", "separator role and orientation props"),
      source("packages/ui/src/Focusable.ts", "focusable host contract"),
      source("packages/ui/src/Role.ts", "explicit role host"),
      source("packages/ui/src/VisuallyHidden.ts", "visually hidden host"),
      test("packages/ui/src/__tests__/Alert.test.ts", "alert rendered contract"),
      test("packages/ui/src/__tests__/ThinHosts.test.ts", "semantic primitive host coverage"),
    ],
  },
] as const;
