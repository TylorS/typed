/**
 * Assertive live-region content without focus movement or an announcement queue.
 * Use urgent text updates deliberately; routine feedback usually belongs in a status region.
 *
 * Read the [Alert guide](/explore/ui-alert) for a complete example.
 *
 * [APG interaction reference](https://www.w3.org/WAI/ARIA/apg/patterns/alert/).
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
 * Options for the assertive alert live region.
 *
 * @remarks
 * Alerts announce important, time-sensitive output without moving focus or
 * requiring a modal interaction.
 * @since 1.0.0
 * @category Component options
 */
export interface AlertOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Content announced by the `role="alert"` live region.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function internalProps() {
  return { role: "alert" } as const;
}
type AlertInternalProps = ReturnType<typeof internalProps>;

/**
 * Renders an assertive alert region without moving focus.
 *
 * @remarks
 * Keep the region mounted and change its text when an urgent event occurs. Initial page content
 * or repeated identical messages may not announce as expected. This primitive does not queue
 * announcements, schedule dismissal, or provide an acknowledgement dialog. Prefer a status
 * region for routine updates.
 *
 * @example
 * ```ts
 * import { RefSubject } from "@typed/fx";
 * import { html } from "@typed/template";
 * import { Alert } from "@typed/ui/Alert";
 * import { Button } from "@typed/ui/Button";
 * import { component } from "@typed/ui/Component";
 *
 * export const AlertPreview = component(function* () {
 *   const message = yield* RefSubject.make("");
 *   return html`<section>
 *     <p>Preview the message shown when an upload fails.</p>
 *     ${Button({
 *       content: "Preview upload failure",
 *       onclick: RefSubject.set(message, "Upload failed. Your file is still available; try again."),
 *     })}
 *     ${Alert({ content: message, props: { class: "upload-alert" } })}
 *   </section>`;
 * });
 * ```
 * @since 1.0.0
 * @category Controls
 */
export function Alert<const Options extends AlertOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, AlertInternalProps>,
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
