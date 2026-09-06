/**
 * A non-focusable semantic boundary with an orientation attribute.
 * CSS draws the line; WindowSplitter supplies the separate adjustable-pane interaction.
 *
 * Read the [Separator guide](/explore/ui-separator) for a complete example.
 *
 * [Platform reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/separator_role).
 * @since 1.0.0
 * @category Overview
 * @packageDocumentation
 */
import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/**
 */
export interface SeparatorOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Separator orientation, defaulting to horizontal.
   * @since 1.0.0
   * @category Keyboard navigation
   */
  readonly orientation?: Renderable.Any<"horizontal" | "vertical" | null | undefined>;
}

function internalProps<const Options extends SeparatorOptions>({
  property,
}: Dom.InternalPropsHelpers<Options>) {
  return { role: "separator", "aria-orientation": property("orientation", "horizontal") };
}

type SeparatorInternalProps<Options extends SeparatorOptions> = ReturnType<
  typeof internalProps<Options>
>;

/**
 * Renders a non-interactive semantic division.
 *
 * @remarks
 * orientation defaults to horizontal and changes aria-orientation, not layout or dimensions.
 * Supply the visible line through CSS. Do not make this host focusable to imitate a resizer;
 * WindowSplitter owns that separate interaction.
 *
 * @example
 * ```ts
 * import { html } from "@typed/template";
 * import { Heading } from "@typed/ui/Heading";
 * import { Separator } from "@typed/ui/Separator";
 *
 * export const AccountSummary = html`<section>
 *     ${Heading({ level: 2, content: "Account summary" })}
 *     <p>Personal account</p>
 *     ${Separator({ props: { class: "summary-divider" } })}
 *     <p>Next renewal: September 30</p>
 *   </section>`;
 * ```
 * @since 1.0.0
 * @category Structure and naming
 */
export function Separator<
  const Options extends SeparatorOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, SeparatorInternalProps<Options>>, "", Host>,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()(
    options,
    host,
    internalProps,
    "",
    (props) => html`<div ...${props}></div>`,
  );
}
