import { component } from "@typed/astro/Component";
import * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import { html } from "@typed/template";

export const Zero = component(function* () {
  return "Zero";
});

export const PipedZero = component(
  function* () {
    const count = yield* RefSubject.make(0);
    return html`<button @click=${RefSubject.update(count, (n) => n + 1)}>Piped ${count}</button>`;
  },
  Fx.map((event) => event),
);

export const WithProps = component(function* (props: { label: string }) {
  return html`<span>${props.label}</span>`;
});
