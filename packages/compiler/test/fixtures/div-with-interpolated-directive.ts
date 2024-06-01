import { Directive, html } from "@typed/core"

export const render = html`<div>${Directive.node((part) => part.update("Hello World"))}</div>`
