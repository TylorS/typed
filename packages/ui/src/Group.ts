/**
 * Explicitly named collections of related content.
 * Group.Label is a span; connect its ID through labelledBy rather than assuming implicit wiring.
 *
 * Read the [Group guide](/explore/ui-group) for a complete example.
 *
 * [Platform reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/group_role).
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
 * Related content with either a direct accessible label or an external label ID.
 *
 * @remarks
 * Use labelledBy when visible text already names the group; use label when that text is absent.
 * Native fieldset/legend and composite keyboard behavior are not created by these options.
 * @since 1.0.0
 * @category Component options
 */
export interface GroupOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
  /**
   * Accessible label rendered through aria-label.
   * @since 1.0.0
   * @category Accessible naming
   */
  readonly label?: Renderable.Any<string | null | undefined>;
  /**
   * Id of the external element used through aria-labelledby.
   * @since 1.0.0
   * @category Accessible naming
   */
  readonly labelledBy?: Renderable.Any<string | null | undefined>;
}

function internalProps<const Options extends GroupOptions>({ property }: Dom.InternalPropsHelpers<Options>) {
  return {
    role: "group",
    "aria-label": property("label", undefined),
    "aria-labelledby": property("labelledBy", undefined),
  };
}

type GroupInternalProps<Options extends GroupOptions> = ReturnType<typeof internalProps<Options>>;

/**
 * Renders a semantic group with an explicit accessible name.
 *
 * @remarks
 * label becomes aria-label; labelledBy references existing visible text through aria-labelledby.
 * The div does not implement fieldset disabling, toolbar navigation, or child selection. Name
 * each interactive child independently.
 *
 * @example
 * ```ts
 * import { RefSubject } from "@typed/fx";
 * import { html } from "@typed/template";
 * import { Button } from "@typed/ui/Button";
 * import { component } from "@typed/ui/Component";
 * import * as Group from "@typed/ui/Group";
 *
 * export const PreviewActions = component(function* () {
 *   const rotation = yield* RefSubject.make(45);
 *   const scale = yield* RefSubject.make(150);
 *   return html`<section>
 *     <p>Rotation: ${rotation} degrees. Scale: ${scale}%.</p>
 *     ${Group.Label({
 *       content: "Preview controls",
 *       props: { id: "preview-control-label", class: "control-group-label" },
 *     })}
 *     ${Group.Group({
 *       labelledBy: "preview-control-label",
 *       props: { class: "preview-actions" },
 *       content: [
 *         Button({ content: "Reset rotation", onclick: RefSubject.set(rotation, 0) }),
 *         Button({ content: "Reset scale", onclick: RefSubject.set(scale, 100) }),
 *       ],
 *     })}
 *   </section>`;
 * });
 * ```
 * @since 1.0.0
 * @category Structure and naming
 */
export function Group<const Options extends GroupOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, GroupInternalProps<Options>>, Options["content"], Host>,
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
 * Visible span content and host props for an explicitly linked group label.
 *
 * @remarks
 * Set props.id and reference it through Group.labelledBy. There is no generated ID or implicit
 * relationship.
 * @since 1.0.0
 * @category Component options
 */
export interface LabelOptions extends Dom.HostOptions<HTMLSpanElement> {
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

/**
 * Renders visible group-label text in a span.
 *
 * @remarks
 * Pass an ID through props and reference it from Group.labelledBy to create a relationship.
 * Rendering this span beside a group does not connect them automatically, and it does not create
 * heading semantics.
 *
 * @example
 * ```ts
 * import * as Group from "@typed/ui/Group";
 *
 * const view = Group.Label({ content: "Formatting" });
 * ```
 * @since 1.0.0
 * @category Controls
 */
export function Label<const Options extends LabelOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, Record<never, never>>, Options["content"], Host>,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLSpanElement>()(
    options,
    host,
    () => ({}),
    options.content,
    (props, content) => html`<span ...${props}>${content}</span>`,
  );
}
