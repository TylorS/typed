import { Fx } from "@typed/fx";
import { IdsTest } from "@typed/id/IdsTest";
import { Effect } from "effect";
import { expect, it } from "vitest";
import { HtmlRenderTemplate, renderToHtmlString } from "../Html.js";
import { html } from "../RenderTemplate.js";
import { rootIdentity } from "../RootIdentity.js";

it("uses the caller's ID services for every rendered identity", async () => {
  const island = Fx.gen(function* () {
    const identity = yield* rootIdentity();
    return html`<div ...${{ ref: identity.ref }} id=${identity.id}></div>`;
  });
  const render = () =>
    renderToHtmlString(html`${island}${island}`).pipe(
      Effect.provide([HtmlRenderTemplate, IdsTest()]),
      Effect.scoped,
      Effect.runPromise,
    );
  const first = await render();
  expect(await render()).toBe(first);
  const ids = [...first.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  expect(ids).toHaveLength(2);
  expect(new Set(ids).size).toBe(2);
});
