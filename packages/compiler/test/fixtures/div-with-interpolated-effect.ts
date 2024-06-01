import { html } from "@typed/core"
import { Effect } from "effect"

export const render = html`<div>${Effect.succeed(42n)}</div>`
