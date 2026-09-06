import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/**
 * Options for a generic focusable host.
 *
 * @remarks
 * ## Why
 *
 * Some composite patterns need a focus target without adding a specialized
 * widget role. These options make that choice explicit.
 *
 * ## Ownership and lifetime
 *
 * The model is inert; rendered dynamic values live for the component Scope.
 *
 * @since 1.0.0
 * @category Keyboard focus
 */
export interface FocusableOptions extends Dom.HostOptions<HTMLDivElement> {
  /** Content rendered inside the focusable host.
   * @remarks
   * ## Why
   * Content remains independent of the focus behavior.
   * ## Ownership and lifetime
   * Dynamic content follows the rendered Scope and is released with it.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
  /** Optional ARIA role for the focus target.
   * @remarks
   * ## Why
   * Callers, not Typed, know which widget semantics apply.
   * ## Ownership and lifetime
   * The reflected value retains no resources.
   * @since 1.0.0
   * @category Semantic roles
   */
  readonly role?: Renderable.Any<string | null | undefined>;
  /** Tab order value; defaults to zero.
   * @remarks
   * ## Why
   * An explicit tab index makes a non-interactive host keyboard reachable.
   * ## Ownership and lifetime
   * Dynamic values are observed only for the component Scope.
   * @since 1.0.0
   * @category Keyboard focus
   */
  readonly tabIndex?: Renderable.Any<number | null | undefined>;
}

function internalProps<const Options extends FocusableOptions>({
  property,
}: Dom.InternalPropsHelpers<Options>) {
  return {
    role: property("role", undefined),
    tabindex: property("tabIndex", 0),
  };
}

type FocusableInternalProps<Options extends FocusableOptions> = ReturnType<
  typeof internalProps<Options>
>;

/**
 * Renders a keyboard-focusable host without inventing widget semantics.
 *
 * @remarks
 * ## Why
 *
 * The component provides a small native DOM primitive for higher-level
 * composites while requiring callers to choose an appropriate role and label.
 *
 * ## Ownership and lifetime
 *
 * The returned Fx starts on execution; its Scope owns dynamic subscriptions
 * and listener/ref cleanup. Custom hosts must retain the supplied tab index.
 *
 * @example
 * ```ts
 * import { Focusable } from "@typed/ui/Focusable"
 *
 * const region = Focusable({ role: "region", content: "Keyboard target" })
 * ```
 *
 * @since 1.0.0
 * @category Keyboard focus
 */
export function Focusable<
  const Options extends FocusableOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, FocusableInternalProps<Options>>,
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
