import type { AstroComponentMetadata, NamedSSRLoadedRendererValue } from "astro";
import * as Fx from "@typed/fx/Fx";
import * as Effect from "effect/Effect";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";
import * as Component from "./Component.js";

/** Astro supplies already-rendered slot HTML. This boundary is not a public raw HTML helper. */
function slotsFromAstro(
  slots: Record<string, string>,
  metadata?: AstroComponentMetadata,
): Component.Slots {
  const tag = metadata?.hydrate ? "astro-slot" : "astro-static-slot";
  return Object.fromEntries(
    Object.entries(slots).map(([name, content]) => [
      name,
      Fx.succeed(
        HtmlRenderEvent(
          `<${tag}${name === "default" ? "" : ` name="${escapeAttribute(name)}"`}>${content}</${tag}>`,
          true,
        ),
      ),
    ]),
  );
}

function escapeAttribute(value: string): string {
  return value.replace(/[&"<>']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      case "<":
        return "&lt;";
      default:
        return "&gt;";
    }
  });
}

/**
 * Astro renderer protocol for branded Typed components and trusted Astro slots.
 * Each render owns an HTML rendering scope that closes after serialization.
 * Astro loads this entry through the integration; it is not a raw-HTML API.
 *
 * @since 1.0.0
 * @category Server rendering
 */
const renderer = {
  name: "@typed/astro",
  supportsAstroStaticSlot: true,
  async check(component: unknown) {
    return Component.isComponent(component);
  },
  async renderToStaticMarkup(
    component: unknown,
    props: Record<string, unknown>,
    slots: Record<string, string> = {},
    metadata?: AstroComponentMetadata,
  ) {
    if (!Component.isComponent(component)) {
      throw new TypeError("@typed/astro requires a component created with component");
    }
    const html = await Effect.runPromise(
      Effect.suspend(() =>
        renderToHtmlString(Component.view(component, props, slotsFromAstro(slots, metadata))),
      ).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
    );
    return { html };
  },
} satisfies NamedSSRLoadedRendererValue;

export default renderer;
