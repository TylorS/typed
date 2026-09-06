import { component, type Slots } from "@typed/astro/Component";
import * as RefSubject from "@typed/fx/RefSubject";
import { html } from "@typed/template";

export default component(function* (props: { id: string; initial: number }, slots: Slots) {
  const count = yield* RefSubject.make(props.initial);
  return html`<section id=${props.id}>
    <button @click=${RefSubject.update(count, (n) => n + 1)}>${count}</button
    >${slots.default}${slots.heading}
  </section>`;
});
