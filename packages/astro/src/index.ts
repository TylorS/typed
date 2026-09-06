import type { AstroIntegration } from "astro";

/**
 * Registers the Typed server and browser renderers with Astro.
 * Add one instance to astro.config's integrations list. Client directives then
 * select whether and when each branded Typed component starts in the browser.
 *
 * @example
 * ```ts
 * import { defineConfig } from "astro/config"
 * import typed from "@typed/astro"
 *
 * export default defineConfig({ integrations: [typed()] })
 * ```
 *
 * @since 1.0.0
 * @category Integration setup
 */
export default function typed(): AstroIntegration {
  return {
    name: "@typed/astro",
    hooks: {
      "astro:config:setup": ({ addRenderer }) => {
        addRenderer({
          name: "@typed/astro",
          serverEntrypoint: "@typed/astro/server",
          clientEntrypoint: "@typed/astro/client",
        });
      },
    },
  };
}
