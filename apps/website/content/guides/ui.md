---
title: Learn the UI primitives
summary: Build interfaces by understanding their state, keyboard behavior, native hosts, and accessibility contracts.
section: Learning paths
kind: concept
order: 0.3
---

A component is useful when you can predict what it will do. Where does focus go when a menu opens?
Does moving through a list also select a value? What happens when the focused item disappears?
Can a person submit the form without touching a pointer? These questions belong in the design of
the feature, alongside its loading state and visual design.

Typed UI provides small pieces for answering them. Each guide below teaches one public primitive:
the problem it solves, the state it needs, the markup and interactions it supplies, and the parts
your application still owns. Start with a feature you are building; follow the lower-level
contracts when you need to customize it.

## Build your first reusable control

Begin with [Button](/explore/ui-button), [Checkbox](/explore/ui-checkbox), and
[component](/explore/ui-component). Together they introduce the core arrangement: an application
owns state and commands, a primitive supplies interaction behavior, and a template places the
host in the document. Your styles supply its appearance.

Suppose you are building a notification settings page. The persisted preference belongs to the
application model. The checkbox reflects that preference and reports changes. The save button
starts an application command. A disabled appearance alone must not be your duplicate-submission
policy: the command also needs to decide what to do while a save is running. Connect the control
to [AsyncData](/explore/async-data) and [Fx concurrency](/explore/fx-higher-order-and-concurrency)
when you add the request.

Then read [Form](/explore/ui-form). Browser form submission, text editing, decoded values, and
request state are related, but they are different contracts. A good form makes that distinction
visible through labels, validation feedback, and a predictable submission path.

## Choose the interaction before the widget

| A person needs to… | Start with | The important distinction |
| --- | --- | --- |
| Perform an action or go somewhere | [Button](/explore/ui-button), [Link](/explore/ui-link) | An action and a destination have different browser behavior. |
| Choose one value from a known set | [RadioGroup](/explore/ui-radio-group), [Select](/explore/ui-select) | An always-visible choice and a popup have different space and interaction costs. |
| Search through options | [Combobox](/explore/ui-combobox), [Listbox](/explore/ui-listbox) | The text query, active option, and committed value are separate state. |
| Run one of several commands | [Menu](/explore/ui-menu) | A command menu is not ordinary website navigation. |
| Complete a focused task | [Dialog](/explore/ui-dialog), [NativeDialog](/explore/ui-native-dialog) | Opening, closing, modality, and returning focus form one interaction. |
| Reveal supporting information | [Disclosure](/explore/ui-disclosure), [Popover](/explore/ui-popover) | Visibility alone does not determine dismissal or focus behavior. |
| Navigate structured information | [Tree](/explore/ui-tree), [Grid](/explore/ui-grid), [TreeGrid](/explore/ui-tree-grid) | Hierarchy and two-dimensional movement need deliberate keyboard rules. |

## Read APG patterns as behavior contracts

The [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)
explains the expected behavior of common widgets. Adding a role does not install keyboard
behavior. Native HTML already supplies many semantics and interactions; preserve those before
adding custom behavior. See [MDN's ARIA introduction](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
for that relationship.

Read a pattern while asking which state each key changes. In a listbox, focus identifies where
keyboard input goes; selection identifies the application's chosen value. They may move
together, but that is a decision with consequences. In a menu, choosing an item can run a command
and close the popup. The [APG keyboard guide](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
develops these distinctions across composite widgets.

The individual lessons link to their applicable patterns and explain Typed's implementation.
Some primitives, such as Group or VisuallyHidden, are structural utilities rather than complete
APG widgets. A library primitive also cannot prove an assembled product accessible: labels,
content, focus order, styling, and browser/assistive-technology behavior still depend on the
application you build.

## Make the component your own

Use [component](/explore/ui-component) for generator-backed views. A generator with parameters
creates a component function; a parameterless generator creates an Fx value. Its return value can
be any Renderable. Each execution forks the parent Scope; its setup and rendered output share that child lifetime.

When the higher-level control does not fit, follow the primitive's lower-level state and prop
functions. [Collection](/explore/ui-collection), [Composite](/explore/ui-composite), and
[Focusable](/explore/ui-focusable) explain the mechanisms behind managed lists and keyboard
movement. [Dom](/explore/ui-dom) explains the host boundary. These are useful when building a
design system or another component library, not prerequisites for rendering a checkbox.

Keep CSS responsible for appearance: spacing, color, focus indicators, responsive layout, and
states such as selected or invalid. Keep application commands responsible for business rules.
This separation lets one interaction contract serve different designs without copying its
keyboard behavior.

## Test a whole interaction

For a command palette, test opening it from the keyboard, entering a query, moving through
results, choosing a command, and returning to the invoking control. Also remove or disable the
active result and close the palette while the request is pending. Those transitions expose bugs
that a screenshot of the open popup will not show.

Use [Storybook](/explore/ui-storybook) to isolate states, then test the assembled feature in a
real browser. Keep [Testing Typed systems](/explore/testing-typed-systems) nearby for the
difference between model tests, DOM behavior, and resource cleanup. The lesson for each primitive
gives you a concrete interaction sequence to work through.

## Pick a primitive

The catalog below covers the public UI modules. Read a lesson to learn the behavior, then follow
its API links when you need an exact signature or option. The
[complete UI reference](/reference/packages/@typed/ui) includes every public export.
