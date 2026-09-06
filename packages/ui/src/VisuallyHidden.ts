/**
 * Text clipped visually but retained for accessible names and descriptions.
 * The clipping style has no focus-reveal behavior and must not hide interactive descendants.
 *
 * Read the [VisuallyHidden guide](/explore/ui-visually-hidden) for a complete example.
 *
 * [Platform reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden).
 * @since 1.0.0
 * @category Overview
 * @packageDocumentation
 */
import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

const style =
  "border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;white-space:nowrap;width:1px";

/**
 */
export interface VisuallyHiddenOptions extends Dom.HostOptions<HTMLSpanElement> {
  /**
   * Content retained in the document and accessibility tree.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function internalProps() {
  return { style };
}

type VisuallyHiddenInternalProps = ReturnType<typeof internalProps>;

/**
 * Clips text visually while retaining it for accessible naming and reading.
 *
 * @remarks
 * The span uses absolute positioning and a one-pixel clipping recipe. It has no focus-reveal
 * behavior: do not hide interactive controls or use it alone as a skip link. An aria-hidden
 * ancestor still removes its content from accessibility exposure. Custom hosts must preserve the
 * supplied style.
 *
 * @example
 * ```ts
 * import { RefSubject } from "@typed/fx";
 * import { html } from "@typed/template";
 * import { Button } from "@typed/ui/Button";
 * import { component } from "@typed/ui/Component";
 * import { VisuallyHidden } from "@typed/ui/VisuallyHidden";
 *
 * export const ResetCounter = component(function* () {
 *   const count = yield* RefSubject.make(3);
 *   return html`<div>
 *     <p>Selected items: ${count}</p>
 *     ${Button({
 *     content: html`
 *       <span aria-hidden="true">×</span>
 *       ${VisuallyHidden({ content: "Clear selection" })}
 *     `,
 *     props: { class: "icon-action" },
 *     onclick: RefSubject.set(count, 0),
 *     })}
 *   </div>`;
 * });
 * ```
 * @since 1.0.0
 * @category Structure and naming
 */
export function VisuallyHidden<
  const Options extends VisuallyHiddenOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, VisuallyHiddenInternalProps>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLSpanElement>()(
    options,
    host,
    internalProps,
    options.content,
    (props, content) => html`<span ...${props}>${content}</span>`,
  );
}
