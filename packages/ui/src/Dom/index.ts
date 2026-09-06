/**
 * Public DOM host types.
 *
 * @remarks
 * These exports describe native properties, attributes, events, refs, custom
 * host overrides, and the Scope-owned render result without a virtual DOM API.
 *
 * @since 1.0.0
 * @category DOM host contracts
 */
export type {
  BoundElementProperties,
  ElementByTagName,
  ElementEventHandlers,
  ElementOptions,
  ElementProperties,
  ElementRef,
  ElementRefCallback,
  EventHandlerInput,
  EventHandlerProperty,
  EventOf,
  HostOptions,
  HostOptionsForTag,
  HostOverride,
  HostProps,
  HostPropsByTagName,
  HostPropsForTag,
  HostRenderer,
  HostRendererForTag,
  IfEquals,
  InternalPropsHelpers,
  NonNullish,
  Nullish,
  OptionsByTagName,
  OptionsForTag,
  Property,
  TemplateAttributeProps,
  TemplateEventHandlers,
  WritableKeys,
} from "./Types.js";
/** Native event composition and event-state readers. @since 1.0.0 @category events*/
export { chainEvent, currentTarget, toggleState } from "./Events.js";
/** Element ref composition with single-owner hydration enforcement. @since 1.0.0 @category refs*/
export { composeRefs } from "./Refs.js";
/** Deterministic user/internal host-prop merging. @since 1.0.0 @category dom-hosts*/
export { mergeProps, type MergedHostProps, type RenderHostProps } from "./Props.js";
/** Default and overrideable DOM host rendering boundaries. @since 1.0.0 @category dom-hosts*/
export { renderDivHost, renderHost } from "./Render.js";
