import * as Fx from "@typed/fx"
import * as RefSubject from "@typed/fx/RefSubject"
import { ElementRef, EventHandler, html } from "@typed/template"
import * as Effect from "effect/Effect"

export const counter = Fx.gen(
  function*($) {
    const count = yield* $(RefSubject.make(Effect.succeed(0)))
    const increment = RefSubject.update(count, (n) => n + 1)
    const decrement = RefSubject.update(count, (n) => n - 1)

    return html`
      <button id="decrement" onclick=${decrement}>-</button>
      <span id="count">${count}</span>
      <button id="increment" onclick=${increment}>+</button>
    `
  }
)

export const inputWithLabel = Fx.gen(function*($) {
  const inputRef = yield* $(ElementRef.make<HTMLInputElement>())

  return html`<div class="formgroup">
    <input
      ref=${inputRef}
      ?disabled=${false}
      class="custom-input"
      onchange=${EventHandler.make(() => Effect.unit)}
    />
    <label class="custom-input-label" for="name">Name</label>
  </div>`
})
