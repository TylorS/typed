---
title: Overlays, disclosure, and transient UI
summary: Choose document-flow disclosure, supporting popovers, or a focused dialog task from the behavior the feature needs.
section: UI / Overlays
kind: guide
order: 270
---

<span id="begin-with-content-that-belongs-in-the-document"></span>
<span id="move-a-short-legend-into-the-top-layer"></span>
<span id="give-a-decision-its-own-task-boundary"></span>
<span id="understand-what-the-browser-owns-and-what-it-cannot-decide"></span>
<span id="distinguish-a-description-from-an-interactive-preview"></span>
<span id="debug-one-synchronization-boundary-at-a-time"></span>

Choose the surface from its interaction policy.

| Need | Use | Primary contract |
| --- | --- | --- |
| Optional information where it appears | [Disclosure](/explore/ui-disclosure) | Native details stays in document flow. |
| A short description of an existing control | [Tooltip](/explore/ui-tooltip) | The anchor receives focus; the description is not interactive. |
| A supporting panel or interactive preview | [Popover](/explore/ui-popover) or [Hovercard](/explore/ui-hovercard) | Visibility, dismissal, and focus transfer are explicit. |
| A task that must be resolved or cancelled | [Dialog](/explore/ui-dialog) | Native lifecycle, close request, and accepted action are distinct. |

The [Dialog archive confirmation](/explore/ui-dialog) is the maintained worked example. It covers cancellation, recoverable failure, accepted archive work, and mounted versus visible lifetime once. Consult [NativeDialog](/explore/ui-native-dialog), [NativePopover](/explore/ui-native-popover), or [NativeDetails](/explore/ui-native-details) only when application-owned markup needs their low-level state bridges.
