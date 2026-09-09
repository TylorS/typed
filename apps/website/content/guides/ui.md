---
title: Learn the UI primitives
summary: Choose a practical UI task, then follow its worked interaction and the module reference when you need exact contracts.
section: Learning paths
kind: concept
order: 0.3
---

<span id="build-your-first-reusable-control"></span>
<span id="choose-the-interaction-before-the-widget"></span>
<span id="read-apg-patterns-as-behavior-contracts"></span>
<span id="make-the-component-your-own"></span>
<span id="test-a-whole-interaction"></span>
<span id="pick-a-primitive"></span>

Start with the feature you are building. Typed primitives provide interaction and browser contracts; your application owns domain state, requests, and visual design.

## Choose a task

| Build | Start here | Check before shipping |
| --- | --- | --- |
| A save action with loading, failure, and retry | [Build a save control](/explore/building-ui-components) | Duplicate submission, failure recovery, and the control that receives focus. |
| A browser-backed editor | [Forms as a browser contract](/explore/forms-as-a-browser-contract) | Labels, decoded values, errors, reset, and submit. |
| A picker or command surface | [Selection, autocomplete, and command surfaces](/explore/selection-autocomplete-and-command-surfaces) | Query, active option, committed value, and keyboard commit. |
| Keyboard movement through rendered items | [Collections and focus](/explore/ui-collections-and-focus) | Disabled/removal behavior and the actual focused element. |
| An archive or other confirmation | [Dialog](/explore/ui-dialog) | Cancel, accepted action, failure, close request, and focus return. |
| Supporting information | [Overlays and disclosure](/explore/overlays-disclosure-and-transient-ui) | Whether it belongs in flow, a popover, or a modal task. |

For an ordinary action, destination, or native field, use the corresponding [Button](/explore/ui-button), [Link](/explore/ui-link), or form reference. Prefer native HTML where it already supplies the interaction you need.

## Read a reference when you need a contract

The module pages document exact options and limitations. Begin with [Component](/explore/ui-component) for generator arity and child scopes; [Form](/explore/ui-form) for decode, submit, and reset; [Collection](/explore/ui-collection) then [Composite](/explore/ui-composite) for managed focus; and [Dom](/explore/ui-dom) for the host boundary. The [complete UI reference](/reference/packages/@typed/ui) lists every public export.

Use [Storybook](/explore/ui-storybook) and browser tests to exercise the assembled interaction. Test transitions a screenshot cannot establish: a pending save, a rejected submit, an active item disappearing, or a dialog closing while work is pending.
