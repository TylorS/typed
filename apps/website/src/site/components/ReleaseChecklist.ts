import { component } from "@typed/astro/Component";
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { Button } from "@typed/ui/Button";
import * as Checkbox from "@typed/ui/Checkbox";
import { Effect } from "effect";

const tasks = ["Model the application", "Connect the interface", "Ship something useful"];

export default component(function* () {
  const states = yield* Effect.all(tasks.map((_, i) => Checkbox.makeState({ checked: i === 0 })));
  const completed = RefSubject.map(
    RefSubject.tuple(states),
    (items) => items.filter((item) => item.checked === true).length,
  );
  const reset = Effect.forEach(states, (state, index) => Checkbox.setChecked(state, index === 0));

  return html`<section class="release-demo" aria-label="Interactive release checklist">
    <header class="demo-toolbar">
      <span><span class="status-dot"></span> release-checklist.ts</span
      ><span class="badge badge-outline">LIVE</span>
    </header>
    <div class="demo-content">
      <p class="eyebrow">YOUR NEXT RELEASE</p>
      <h2>A little state. A real interface.</h2>
      <p class="demo-description">Try the checkboxes. The count is derived from the same state.</p>
      <ul class="release-tasks">
        ${states.map(
          (state, index) => html`<li>
            <label>
              ${Checkbox.Input({ state, props: { class: "checkbox checkbox-primary checkbox-sm" } })}
              <span>${tasks[index]}</span>
            </label>
          </li>`,
        )}
      </ul>
      <div class="demo-footer">
        <output aria-live="polite">${completed} / 3 complete</output>
        ${Button({ content: "Reset", props: { class: "btn btn-ghost btn-sm" }, onclick: reset })}
      </div>
    </div>
    <div class="demo-caption">
      @typed/fx <span>+</span> @typed/template <span>+</span> @typed/ui
    </div>
  </section>`;
});
