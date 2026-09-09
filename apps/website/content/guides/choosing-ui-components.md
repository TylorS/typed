---
title: Choosing Typed UI components
summary: Use the UI task chooser to select a worked interaction, then consult module references for exact contracts.
section: UI
kind: guide
order: 220
---

<span id="let-document-content-stay-document-content"></span>
<span id="add-state-where-two-parts-must-agree"></span>
<span id="separate-actions-values-and-destinations"></span>
<span id="keep-the-screen-policy-outside-the-primitive"></span>
<span id="choose-a-larger-interaction-only-when-the-task-needs-it"></span>
<span id="recognize-when-you-are-authoring-a-new-family"></span>

This page is a routing note, not a second component tutorial. Start at [Learn the UI primitives](/explore/ui) and choose the task closest to the feature you are building.

Native HTML is usually the right first choice: a button performs an action, a link changes location, a native field participates in a form, and details expands content in document flow. Typed components make stateful interaction explicit when the feature needs it.

For a maintained worked path, use [save controls](/explore/building-ui-components), [form editing](/explore/forms-as-a-browser-contract), [pickers and commands](/explore/selection-autocomplete-and-command-surfaces), [composite focus](/explore/ui-collections-and-focus), or [confirmation dialogs](/explore/ui-dialog). The references explain the individual public APIs.
