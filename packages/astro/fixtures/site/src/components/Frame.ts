// oxlint-disable require-yield
import { component, type Slots } from "@typed/astro/Component";
import { html } from "@typed/template";

export default component(function* (props: { id: string }, slots: Slots) {
  return html`<aside id=${props.id}>${slots.default}${slots.heading}</aside>`;
});
