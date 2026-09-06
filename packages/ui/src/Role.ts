import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/**
 * Options for assigning explicit ARIA semantics to a generic host.
 * @remarks
 * ## Why
 * This primitive keeps role selection visible when no dedicated component
 * matches the required semantic.
 * ## Ownership and lifetime
 * The model acquires no resources; dynamic values follow the rendered Scope.
 * @since 1.0.0
 * @category Semantic hosts
 */
export interface RoleOptions extends Dom.HostOptions<HTMLDivElement> {
  /** Content rendered inside the semantic host.
   * @remarks
   * ## Why
   * Native content remains available to the accessibility tree.
   * ## Ownership and lifetime
   * Dynamic content follows the component Scope.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
  /** The explicit ARIA role.
   * @remarks
   * ## Why
   * Callers must choose semantics appropriate to their interaction model.
   * ## Ownership and lifetime
   * The reflected value retains no resources.
   * @since 1.0.0
   * @category Semantic roles
   */
  readonly role: Renderable.Any<string | null | undefined>;
}

function internalProps<const Options extends RoleOptions>({
  property,
}: Dom.InternalPropsHelpers<Options>) {
  return { role: property("role", undefined) };
}

type RoleInternalProps<Options extends RoleOptions> = ReturnType<typeof internalProps<Options>>;

/**
 * Renders a generic element with caller-selected ARIA semantics.
 * @remarks
 * ## Why
 * It provides cooperative host composition without pretending every ARIA role
 * has identical keyboard behavior; the caller remains responsible for the
 * chosen role's complete accessibility contract.
 * ## Ownership and lifetime
 * Running the returned Fx owns dynamic attributes and content until its Effect
 * Scope closes. A custom host must preserve the supplied role.
 * @example
 * ```ts
 * import { Role } from "@typed/ui/Role"
 *
 * const status = Role({ role: "status", content: "Ready" })
 * ```
 * @since 1.0.0
 * @category Semantic hosts
 */
export function Role<const Options extends RoleOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, RoleInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    RoleInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    internalProps,
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}
