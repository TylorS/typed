import * as Effect from "effect/Effect";
import { fromEffect } from "@typed/fx/Fx";
import { html, type RenderEvent } from "@typed/template";
import {
  forwardHostProps,
  getProperty,
  makeInternalPropsHelpers,
  mergeProps,
  type RenderHostProps,
} from "./Props.js";
import type {
  FxInput,
  HostComponent,
  HostOptions,
  HostOverride,
  HostProps,
  HostResult,
  InternalPropsHelpers,
  RenderableInput,
} from "./Types.js";

/**
 * Creates the host-rendering boundary for a particular DOM element type.
 *
 * @remarks
 * ## Why
 * Components can compute required props once, merge them with caller props,
 * then delegate either to a custom host or to a native-template fallback. This
 * exposes the boundary needed for external renderers without a framework adapter.
 *
 * ## Ownership and lifetime
 * The returned component is lazy. Its Scope owns the chosen Effect/Fx result,
 * merged listener/ref work, and only the render-event range that result emits.
 * A custom host owns output it creates and must honor the supplied props.
 *
 * @example
 * ```ts
 * import { renderHost } from "@typed/ui/Dom/Render"
 * import { html } from "@typed/template"
 *
 * const renderButton = renderHost<HTMLButtonElement>()
 * const button = renderButton(
 *   { props: { class: "action" } },
 *   undefined,
 *   () => ({ type: "button" }),
 *   "Save",
 *   (props, content) => html`<button ...${props}>${content}</button>`
 * )
 * ```
 *
 * @since 1.0.0
 * @category Host rendering
 */
export function renderHost<Element extends globalThis.Element>() {
  return function <
    const Options extends HostOptions<Element>,
    const Internal extends HostProps<Element>,
    const Content extends RenderableInput,
    const Fallback extends HostResult,
    const Host extends HostResult = never,
  >(
    options: Options,
    host: HostOverride<RenderHostProps<Options, Internal>, Content, Host> | undefined,
    buildInternal: (helpers: InternalPropsHelpers<Options>) => Internal,
    content: Content,
    fallback: (props: RenderHostProps<Options, Internal>, content: Content) => Fallback,
  ): HostComponent<Options | Host> {
    const props = mergeProps(
      mergeProps(getProperty(options, "props"), forwardHostProps(options)),
      buildInternal(makeInternalPropsHelpers(options)),
    );
    const rendered = host ? host(props, content) : fallback(props, content);

    return componentBoundary(rendered) as HostComponent<Options | Host>;
  };
}

/**
 * Renders a native `div` host from supplied props and content.
 *
 * @remarks
 * ## Why
 * Many behavior-only components need a standards-based neutral fallback while
 * still allowing callers to replace the host through `renderHost`.
 *
 * ## Ownership and lifetime
 * The returned template is lazy. Its Scope owns reactive parts and the created
 * div; it does not claim surrounding or externally supplied DOM.
 *
 * @example
 * ```ts
 * import { renderDivHost } from "@typed/ui/Dom/Render"
 *
 * const host = renderDivHost({ role: "group", class: "cluster" }, "Actions")
 * ```
 *
 * @since 1.0.0
 * @category Host rendering
 */
export function renderDivHost<
  const Props extends HostProps<HTMLDivElement>,
  const Content extends RenderableInput,
>(props: Props, content: Content): HostComponent<Props | Content> {
  return html`<div ...${props}>${content}</div>` as HostComponent<Props | Content>;
}

function componentBoundary(value: HostResult): FxInput<RenderEvent> {
  return (Effect.isEffect(value) ? fromEffect(value) : value) as FxInput<RenderEvent>;
}
