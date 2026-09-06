---
id: accessibility
term: "Accessibility"
definition: "Native semantic and interaction behavior that remains usable across input methods and assistive technology."
aliases: [a11y]
related: [ui, template, cooperative-ownership]
links: []
---

Accessibility is part of a control’s behavior: its name and meaning, keyboard interaction, focus,
and state must work together. A native button supplies behavior that a clickable div does not gain
merely by receiving a role. Typed UI composes those contracts with native hosts.

Start with [choosing UI components](/explore/choosing-ui-components), then test the actual interaction
in a browser. The [ARIA Authoring Practices introduction](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)
explains the responsibilities that come with custom semantics.
