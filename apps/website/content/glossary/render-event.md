---
id: render-event
term: "RenderEvent"
definition: "A value describing output a renderer can apply."
aliases: [render event]
related: [dom-render-event, html-render-event, fx, render-template]
links: []
---

A RenderEvent is an output value carried by `Fx<RenderEvent, E, R>`. It is neither the stream itself
nor a browser input event. [DomRenderEvent](#dom-render-event) carries concrete nodes;
[HtmlRenderEvent](#html-render-event) carries trusted serialized chunks.

An adapter can publish output through this boundary without adopting a component-tree protocol.
Acquisition and disposal remain with its producing work. Compare
[DOM output](/explore/dom-render-event) and [HTML output](/explore/html-render-event).
