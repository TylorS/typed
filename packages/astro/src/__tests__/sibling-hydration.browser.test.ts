import { describe, expect, it, vi } from "vitest";
import * as Effect from "effect/Effect";
import * as Button from "@typed/ui/Button";
import * as Checkbox from "@typed/ui/Checkbox";
import * as RefSubject from "@typed/fx/RefSubject";
import { html } from "@typed/template";
import { component } from "../Component.js";
import client from "../client.js";
import server from "../server.js";

const Checklist = component(function* () {
  const states = yield* Effect.all(
    [true, false, false].map((checked) => Checkbox.makeState({ checked })),
  );
  const completed = RefSubject.map(
    RefSubject.tuple(states),
    (items) => items.filter((item) => item.checked).length,
  );
  const reset = Effect.forEach(states, (state, index) => Checkbox.setChecked(state, index === 0));
  return html`<section>
    ${states.map((state) => html`<label>${Checkbox.Input({ state })}</label>`)}<output>${completed}</output>${Button.Button({ content: "Reset", onclick: reset })}
  </section>`;
});

describe("repeated sibling template hydration", () => {
  it("adopts separate sibling nodes and preserves independent hydrated states", async () => {
    const host = document.createElement("astro-island");
    host.innerHTML = (await server.renderToStaticMarkup(Checklist, {})).html;
    document.body.append(host);
    const original = [...host.querySelectorAll("input")];
    expect(original.map((input) => input.checked)).toEqual([true, false, false]);
    try {
      await client(host)(Checklist, {});
      await vi.waitFor(() =>
        expect([...host.querySelectorAll("input")].map((input) => input.checked)).toEqual([
          true,
          false,
          false,
        ]),
      );
      const inputs = [...host.querySelectorAll("input")];
      inputs.forEach((input, index) => expect(input).toBe(original[index]));
      expect(inputs.every((input) => !input.hasAttribute("data-typed-refsubject"))).toBe(true);
      expect(host.querySelector("output")?.textContent).toBe("1");
      inputs[1]?.click();
      await vi.waitFor(() => expect(host.querySelector("output")?.textContent).toBe("2"));
      expect(inputs.map((input) => input.checked)).toEqual([true, true, false]);
      inputs[0]?.click();
      await vi.waitFor(() => expect(host.querySelector("output")?.textContent).toBe("1"));
      expect(inputs.map((input) => input.checked)).toEqual([false, true, false]);
      inputs[2]?.click();
      await vi.waitFor(() => expect(host.querySelector("output")?.textContent).toBe("2"));
      host.querySelector("button")?.click();
      await vi.waitFor(() => expect(host.querySelector("output")?.textContent).toBe("1"));
      expect(inputs.map((input) => input.checked)).toEqual([true, false, false]);
    } finally {
      host.dispatchEvent(new Event("astro:unmount"));
      host.remove();
    }
  });
});
