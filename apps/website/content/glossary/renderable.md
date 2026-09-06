---
id: renderable
term: "Renderable"
definition: "A value that Template can normalize into rendered output while preserving its error and service channels."
aliases: []
related: [template, render-event, fx]
links: []
---

Renderable describes inputs that template normalization can interpret, including ordinary values,
arrays, Effects, Fx or Stream output, and render events. A string label, an Effect that loads a label,
and a RefSubject that changes its label reach the same interpolation boundary with different behavior.

Asynchronous values retain their failures and requirements. Parsed Template metadata is a separate
renderer-author representation, not the value returned by `html`. See
[rendering values](/explore/render-your-first-template).
