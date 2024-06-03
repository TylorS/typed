import { html, RefSubject } from "@typed/core"

const ref = RefSubject.tagged<number, string>()("ref")

export const render = html`<div>${ref}</div>`
