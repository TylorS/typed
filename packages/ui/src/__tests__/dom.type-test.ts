import type * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type * as Stream from "effect/Stream";
import { RefSubject } from "@typed/fx";
import type * as Fx from "@typed/fx/Fx";
import { EventHandler, type Renderable } from "@typed/template";
import type { RenderEvent, RenderTemplate } from "@typed/template";
import * as Dialog from "../Dialog.js";
import * as Dom from "../Dom.js";
import * as Form from "../Form.js";

const numericInputAttributes = {
  min: 0,
  max: 100,
  step: 1,
  value: 50,
} satisfies Dom.HostProps<HTMLInputElement>;

void numericInputAttributes;

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

type FirstError = { readonly _tag: "FirstError" };
type SecondError = { readonly _tag: "SecondError" };
type ThirdError = { readonly _tag: "ThirdError" };
type FourthError = { readonly _tag: "FourthError" };
type FirstService = { readonly FirstService: unique symbol };
type SecondService = { readonly SecondService: unique symbol };
type ThirdService = { readonly ThirdService: unique symbol };
type FourthService = { readonly FourthService: unique symbol };

type _ButtonClickEvent = Assert<Equal<Dom.EventOf<HTMLButtonElement["onclick"]>, PointerEvent>>;

declare const firstRef: (
  element: HTMLButtonElement,
) => Effect.Effect<void, FirstError, FirstService>;
declare const secondRef: (
  element: HTMLButtonElement,
) => Stream.Stream<void, SecondError, SecondService>;

const composedRef = Dom.composeRefs(firstRef, secondRef);
type ComposedRefResult = ReturnType<NonNullable<typeof composedRef>>;
type _ComposedRefErrors = Assert<Equal<Effect.Error<ComposedRefResult>, FirstError | SecondError>>;
type _ComposedRefServices = Assert<
  Equal<Effect.Services<ComposedRefResult>, FirstService | SecondService>
>;

declare const hydrationRef: RefSubject.HydrationRef<FirstError, FirstService>;
const composedHydrationRef = Dom.composeRefs(hydrationRef, secondRef);
type _HydrationProtocol = Assert<
  NonNullable<typeof composedHydrationRef> extends RefSubject.HydrationRef<FirstError, FirstService>
    ? true
    : false
>;

const mergedHydrationProps = Dom.mergeProps(
  { ref: secondRef } satisfies Dom.HostProps<HTMLButtonElement>,
  { ref: hydrationRef } satisfies Dom.HostProps<HTMLButtonElement>,
);
type _MergedHydrationProtocol = Assert<
  NonNullable<typeof mergedHydrationProps.ref> extends RefSubject.HydrationRef<
    FirstError,
    FirstService
  >
    ? true
    : false
>;

declare const firstTitle: Effect.Effect<string, FirstError, FirstService>;
declare const secondTitle: Effect.Effect<string, SecondError, SecondService>;
const mergedProps = Dom.mergeProps(
  { title: firstTitle, ref: firstRef } satisfies Dom.HostProps<HTMLButtonElement>,
  { title: secondTitle, ref: secondRef } satisfies Dom.HostProps<HTMLButtonElement>,
);
type _MergedPropErrors = Assert<
  Equal<Renderable.Error<typeof mergedProps>, FirstError | SecondError>
>;
type _MergedPropServices = Assert<
  Equal<Renderable.Services<typeof mergedProps>, FirstService | SecondService>
>;

declare const helpers: Dom.InternalPropsHelpers<{
  readonly type?: "submit" | null | undefined;
}>;
const defaultedProperty = helpers.property("type", "button");
type _DefaultedProperty = Assert<Equal<typeof defaultedProperty, "button" | "submit">>;

declare const internalClick: EventHandler.EventHandler<Event, SecondError, SecondService>;
declare const content: Effect.Effect<string, ThirdError, ThirdService>;
declare const fallback: Effect.Effect<RenderEvent, FourthError, FourthService>;
const hostOptions = {
  props: { title: firstTitle },
  internalClick,
  content,
  fallback,
} satisfies Dom.HostOptions<HTMLDivElement> & {
  readonly internalClick: typeof internalClick;
  readonly content: typeof content;
  readonly fallback: typeof fallback;
};

const renderedHost = Dom.renderHost<HTMLDivElement>()(
  hostOptions,
  undefined,
  () => ({ "@click": hostOptions.internalClick }),
  hostOptions.content,
  (_props, _content) => hostOptions.fallback,
);
type _RenderedHostErrors = Assert<
  Equal<Fx.Error<typeof renderedHost>, FirstError | SecondError | ThirdError | FourthError>
>;
type _RenderedHostServices = Assert<
  Equal<
    Fx.Services<typeof renderedHost>,
    FirstService | SecondService | ThirdService | FourthService | Scope.Scope | RenderTemplate
  >
>;

const renderedDiv = Dom.renderDivHost({ title: secondTitle }, content);
type _RenderedDivErrors = Assert<Equal<Fx.Error<typeof renderedDiv>, SecondError | ThirdError>>;
type _RenderedDivServices = Assert<
  Equal<
    Fx.Services<typeof renderedDiv>,
    SecondService | ThirdService | Scope.Scope | RenderTemplate
  >
>;

const buttonProps = {
  type: "button",
  disabled: false,
  "?disabled": false,
  popover: "auto",
  popovertarget: "menu",
  popovertargetaction: "toggle",
  command: "show-modal",
  commandfor: "dialog",
  onclick: EventHandler.make((event: MouseEvent) => {
    event.preventDefault();
  }),
  "@click": EventHandler.make((event: Event) => {
    event.preventDefault();
  }),
  ref: (button: HTMLButtonElement) => {
    button.disabled = true;
  },
} satisfies Dom.HostPropsForTag<"button">;

void buttonProps;

const readonlyProperty = {
  // @ts-expect-error readonly DOM properties are not host inputs
  offsetHeight: 10,
} satisfies Dom.HostPropsForTag<"button">;

void readonlyProperty;

const anchorOnlyProperty = {
  // @ts-expect-error href is not a button property
  href: "/account",
} satisfies Dom.HostPropsForTag<"button">;

void anchorOnlyProperty;

const invalidPopoverAction = {
  // @ts-expect-error popovertargetaction uses the native enumerated values
  popovertargetaction: "open",
} satisfies Dom.HostPropsForTag<"button">;

void invalidPopoverAction;

const invalidCommand = {
  // @ts-expect-error custom commands must use the native -- prefix
  command: "open-dialog",
} satisfies Dom.HostPropsForTag<"button">;

void invalidCommand;

declare const formState: Form.FormState<{ readonly email: string; readonly quantity: number }>;
Form.EmailInput({ state: formState, name: "email" });
Form.NumberInput({ state: formState, name: "quantity" });
// @ts-expect-error string fields cannot use number controls
Form.NumberInput({ state: formState, name: "email" });
// @ts-expect-error numeric fields cannot use text controls
Form.TextInput({ state: formState, name: "quantity" });

declare const dialogState: Dialog.ContentOptions["state"];
// @ts-expect-error dialogs require an accessible name
Dialog.Content({ state: dialogState, content: "Body" });
Dialog.Content({ state: dialogState, content: "Body", label: "Delete account" });
Dialog.Content({ state: dialogState, content: "Body", labelledBy: "delete-title" });
// @ts-expect-error dialogs have one accessible-name source
Dialog.Content({
  state: dialogState,
  content: "Body",
  label: "Delete account",
  labelledBy: "delete-title",
});
