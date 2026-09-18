import { expect, it } from "vitest";
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "../index.js";

it.each(["", "prefix"])("resolves nested part paths before inserting %j", async (prefix) => {
  const host = document.createElement("div");
  const view = html`<header>Review</header>
    ${prefix}
    <section>${"content"}<span>${"nested"}</span></section>`;

  await Effect.runPromise(
    render(view, host).pipe(
      Fx.take(1),
      Fx.drain,
      Effect.provide(DomRenderTemplate.using(document)),
      Effect.scoped,
    ),
  );

  expect(host.textContent).toBe(`Review${prefix}contentnested`);
  expect(host.querySelector("section > span")?.textContent).toBe("nested");
});
