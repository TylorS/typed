/**
 * Contextual heading semantics independent of typography.
 * The default div uses role=heading and aria-level; fixed native headings remain useful.
 *
 * Read the [Heading guide](/explore/ui-heading) for a complete example.
 *
 * [Platform reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/heading_role).
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
export interface HeadingOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Heading content and accessible name.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
  /**
   */
  readonly level?: Renderable.Any<number | null | undefined>;
}

function internalProps<const Options extends HeadingOptions>({
  property,
}: Dom.InternalPropsHelpers<Options>) {
  return { role: "heading", "aria-level": property("level", 1) };
}

type HeadingInternalProps<Options extends HeadingOptions> = ReturnType<
  typeof internalProps<Options>
>;

/**
 * Renders a div with heading semantics and an explicit level.
 *
 * @remarks
 * level defaults to one and may be reactive; it does not choose font size, infer nesting, or
 * validate the document outline. Use native h1–h6 markup when the level is fixed. A custom host
 * must keep its native level and aria-level consistent.
 *
 * @example
 * ```ts
 * import { html } from "@typed/template";
 * import { Heading } from "@typed/ui/Heading";
 *
 * export function AccountSection(level: 2 | 3) {
 *   return html`<section aria-labelledby="account-section-title">
 *     ${Heading({
 *       level,
 *       content: "Account security",
 *       props: { id: "account-section-title", class: "section-title" },
 *     })}
 *     <p>Review the devices and credentials that can access this account.</p>
 *   </section>`;
 * }
 *
 * export const AccountPage = html`<main>
 *     <h1>Account settings</h1>
 *     ${AccountSection(2)}
 *   </main>`;
 * ```
 * @since 1.0.0
 * @category Structure and naming
 */
export function Heading<
  const Options extends HeadingOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, HeadingInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()(
    options,
    host,
    internalProps,
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

/**
 * Alias for `Heading` retained for level-oriented imports.
 * @remarks
 * The alias names the role the component plays in a contextual heading system.
 * It has exactly the same Scope and host ownership as `Heading`.
 * @since 1.0.0
 * @category Aliases
 */
export const Level = Heading;
/**
 * Descriptive alias for `Heading`.
 * @remarks
 * The name remains available without duplicating an implementation contract.
 * It has exactly the same Scope and host ownership as `Heading`.
 * @since 1.0.0
 * @category Aliases
 */
export const HeadingLevel = Heading;
