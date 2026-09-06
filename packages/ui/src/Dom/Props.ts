import type { EventHandler, Renderable } from "@typed/template";
import { chainEvent, isEventKey } from "./Events.js";
import { composeRefs, type ComposedRef } from "./Refs.js";
import type {
  EventHandlerInput,
  EventHandlerProperty,
  EventOf,
  InternalPropsHelpers,
  NonNullish,
  Property,
} from "./Types.js";

type ObjectValue<Value> = Value extends object ? Value : Record<never, never>;
type PropsRef<Props> = Property<Props, "ref">;
type MergedEventKeys<User, Internal> = Extract<
  keyof ObjectValue<User> | keyof ObjectValue<Internal>,
  EventHandlerProperty
>;
type MergedEvents<User, Internal> = {
  readonly [Key in MergedEventKeys<User, Internal>]?: EventHandler.EventHandler<
    EventOf<Property<User, Key> | Property<Internal, Key>>,
    Renderable.Error<Property<User, Key> | Property<Internal, Key>>,
    Renderable.Services<Property<User, Key> | Property<Internal, Key>>
  >;
};

/**
 * Type-level result of merging user and component-owned host props.
 *
 * @remarks
 * ## Why
 * Required internal values win, events compose, and refs compose while
 * unrelated user props pass through unchanged.
 *
 * ## Ownership and lifetime
 * The resulting event/ref work is owned by the host's rendering Scope.
 *
 * @since 1.0.0
 * @category Prop composition
 */
export type MergedHostProps<User, Internal> = Omit<
  ObjectValue<User>,
  keyof ObjectValue<Internal> | EventHandlerProperty | "ref"
> &
  Omit<ObjectValue<Internal>, EventHandlerProperty | "ref"> &
  MergedEvents<User, Internal> & {
    readonly ref?: ComposedRef<PropsRef<Internal>, PropsRef<User>>;
  };

/**
 * Option keys forwarded directly to a component host.
 *
 * @remarks
 * ## Why
 * Top-level refs and events remain ergonomic while other DOM props stay under `props`.
 *
 * ## Ownership and lifetime
 * Type-only; the rendered host owns listener/ref lifetime.
 *
 * @since 1.0.0
 * @category Prop forwarding
 */
export type ForwardedHostKeys<Options> = Extract<
  keyof ObjectValue<Options>,
  EventHandlerProperty | "ref"
>;
/**
 * Top-level event and ref props selected from component options.
 *
 * @remarks
 * ## Why
 * Provides the exact forwarded subset used by `renderHost`.
 *
 * ## Ownership and lifetime
 * Type-only; the rendered host owns listener/ref lifetime.
 *
 * @since 1.0.0
 * @category Prop forwarding
 */
export type ForwardedHostProps<Options> = Pick<ObjectValue<Options>, ForwardedHostKeys<Options>>;

/**
 * User host props after combining nested `props` with top-level refs/events.
 *
 * @remarks
 * ## Why
 * Gives both supported authoring forms one deterministic merge model.
 *
 * ## Ownership and lifetime
 * Type-only; runtime ownership begins when the host renders.
 *
 * @since 1.0.0
 * @category Prop composition
 */
export type HostOptionProps<Options> = MergedHostProps<
  Property<Options, "props">,
  ForwardedHostProps<Options>
>;

/**
 * Final props delivered to a default or custom host renderer.
 *
 * @remarks
 * ## Why
 * Custom hosts receive the same accessibility, event, disabled, and ref
 * contract as Typed's default element.
 *
 * ## Ownership and lifetime
 * The rendering Scope owns composed listeners and refs.
 *
 * @since 1.0.0
 * @category Prop composition
 */
export type RenderHostProps<Options, Internal> = MergedHostProps<
  HostOptionProps<Options>,
  Internal
>;

/**
 * Merges user host props with component-required internal props.
 *
 * @remarks
 * ## Why
 * Internal accessibility/state props must remain authoritative, but user
 * events still run first and may cancel component behavior. Disabled hosts
 * suppress user activation handlers. Refs compose instead of overwriting one
 * another.
 *
 * ## Ownership and lifetime
 * The function allocates only a merged object. Listener and ref effects are
 * run by the eventual template Scope. `composeRefs` rejects two hydration
 * owners because one element can restore only one hydration protocol.
 *
 * @example
 * ```ts
 * import { mergeProps } from "@typed/ui/Dom/Props"
 * import { EventHandler } from "@typed/template"
 * import { Effect } from "effect"
 *
 * const props = mergeProps(
 *   {
 *     class: "external",
 *     onclick: EventHandler.make(() => Effect.log("user activation"))
 *   },
 *   { role: "button", "aria-disabled": false }
 * )
 * ```
 *
 * @since 1.0.0
 * @category Prop composition
 */
export function mergeProps<const User extends object | undefined, const Internal extends object>(
  user: User,
  internal: Internal,
): MergedHostProps<User, Internal> {
  if (!user) return internal as MergedHostProps<User, Internal>;
  const merged = { ...user, ...internal };
  const internalRecord = internal as unknown as Record<string, unknown>;
  const mergedRecord = merged as unknown as Record<string, unknown>;
  const activationDisabled =
    internalRecord["aria-disabled"] === true || internalRecord["?disabled"] === true;

  for (const [key, value] of Object.entries(user)) {
    if (isEventKey(key)) {
      mergedRecord[key] = chainEvent(
        activationDisabled && (key === "onclick" || key === "@click")
          ? undefined
          : (value as EventHandlerInput<Event>),
        internalRecord[key] as EventHandlerInput<Event>,
      );
    }
  }

  mergedRecord["ref"] = composeRefs(
    internalRecord["ref"] as ((element: never) => unknown) | undefined,
    (user as Record<string, unknown>)["ref"] as ((element: never) => unknown) | undefined,
  );
  return merged as MergedHostProps<User, Internal>;
}

/**
 * Reads a property from an unknown generic value without throwing on nullish input.
 *
 * @remarks
 * ## Why
 * Generic option construction needs runtime behavior matching the public `Property` type.
 *
 * ## Ownership and lifetime
 * Pure read; no value is retained.
 *
 * @since 1.0.0
 * @category Property inspection
 */
export function getProperty<const Value, const Key extends PropertyKey>(
  value: Value,
  key: Key,
): Property<Value, Key> {
  return (
    value === null || value === undefined ? undefined : Reflect.get(Object(value), key)
  ) as Property<Value, Key>;
}

/**
 * Builds typed fallback helpers for component-owned host props.
 *
 * @remarks
 * ## Why
 * Components can distinguish an absent option from valid falsy values.
 *
 * ## Ownership and lifetime
 * The helper closes over `options` only during synchronous prop construction.
 *
 * @since 1.0.0
 * @category Internal prop defaults
 */
export function makeInternalPropsHelpers<const Options>(
  options: Options,
): InternalPropsHelpers<Options> {
  return {
    property: (key, fallback) => {
      const value = getProperty(options, key);
      return (value === null || value === undefined ? fallback : value) as
        | NonNullish<Property<Options, typeof key>>
        | typeof fallback;
    },
  };
}

/**
 * Extracts top-level refs and event handlers from component options.
 *
 * @remarks
 * ## Why
 * Convenience event/ref options can enter the same deterministic host merge as `props`.
 *
 * ## Ownership and lifetime
 * Returns a shallow object. The rendering Scope owns any contained listener/ref work.
 *
 * @since 1.0.0
 * @category Prop forwarding
 */
export function forwardHostProps<const Options extends object>(
  options: Options,
): ForwardedHostProps<Options> {
  const props: Record<PropertyKey, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    if (key === "ref" || isEventKey(key)) props[key] = value;
  }
  return props as ForwardedHostProps<Options>;
}
