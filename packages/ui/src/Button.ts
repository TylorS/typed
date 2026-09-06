/**
 * Native command activation and explicit button/submit/reset behavior.
 * The control has no internal click action; return application Effects from its handler.
 *
 * Read the [Button guide](/explore/ui-button) for a complete example.
 *
 * [APG interaction reference](https://www.w3.org/WAI/ARIA/apg/patterns/button/).
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
 * Native button submission behavior.
 *
 * @remarks
 * The union exposes the exact HTML button types and defaults components to the
 * non-submitting `button` behavior.
 * @since 1.0.0
 * @category State models
 */
export type ButtonType = "button" | "submit" | "reset";

/**
 * Renderable state and host options for a native button.
 *
 * @remarks
 * The model keeps native button semantics while allowing content, disabled
 * state, and handlers to come from any Typed renderable source.
 * @since 1.0.0
 * @category Component options
 */
export interface ButtonOptions extends Dom.HostOptions<HTMLButtonElement> {
  /**
   * The button's visible and accessible content.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
  /**
   * The native `type` attribute; defaults to `"button"`.
   * @since 1.0.0
   * @category Native attributes
   */
  readonly type?: Renderable.Any<ButtonType | null | undefined>;
  /**
   * Whether the native control is disabled.
   * @since 1.0.0
   * @category Availability
   */
  readonly disabled?: Renderable.Any<boolean | null | undefined>;
  /**
   * A real DOM click handler supplied by the consumer.
   * @since 1.0.0
   * @category Event handlers
   */
  readonly onclick?: Dom.EventHandlerInput<Dom.EventOf<HTMLButtonElement["onclick"]>>;
}

function internalProps<const Options extends ButtonOptions>({
  property,
}: Dom.InternalPropsHelpers<Options>) {
  return {
    type: property("type", "button"),
    "?disabled": property("disabled", false),
  };
}

type ButtonInternalProps<Options extends ButtonOptions> = ReturnType<typeof internalProps<Options>>;

/**
 * Renders a semantic native button with cooperative host customization.
 *
 * @remarks
 * `Button` retains browser keyboard, form, focus, and accessibility behavior.
 * Its internal props only establish the default type and disabled state. Any
 * `onclick` behavior belongs entirely to the consumer and receives a real DOM
 * event; there is no component-internal click action to chain or cancel.
 *
 * @example
 * ```ts
 * import { RefSubject } from "@typed/fx";
 * import { html } from "@typed/template";
 * import { Button } from "@typed/ui/Button";
 * import { component } from "@typed/ui/Component";
 *
 * export const PreviewCounter = component(function* () {
 *   const previews = yield* RefSubject.make(0);
 *   return html`<section>
 *     ${Button({
 *       content: "Recalculate preview",
 *       props: { class: "preview-action" },
 *       onclick: RefSubject.update(previews, (count) => count + 1),
 *     })}
 *     <p role="status">Preview calculations: ${previews}</p>
 *   </section>`;
 * });
 * ```
 * @since 1.0.0
 * @category Native controls
 */
export function Button<const Options extends ButtonOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ButtonInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLButtonElement>()(
    options,
    host,
    internalProps,
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}
