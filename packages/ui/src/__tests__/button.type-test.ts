import type * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type * as Fx from "@typed/fx/Fx";
import { EventHandler, type RenderEvent, type RenderTemplate } from "@typed/template";
import { Button as PublicButton } from "../index.js";
import * as Button from "../Button.js";
import type * as Dom from "../Dom.js";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

type ContentError = { readonly _tag: "ContentError" };
type HandlerError = { readonly _tag: "HandlerError" };
type PropError = { readonly _tag: "PropError" };
type HostError = { readonly _tag: "HostError" };
type ContentService = { readonly ContentService: unique symbol };
type HandlerService = { readonly HandlerService: unique symbol };
type PropService = { readonly PropService: unique symbol };
type HostService = { readonly HostService: unique symbol };

declare const content: Effect.Effect<string, ContentError, ContentService>;
declare const onclick: EventHandler.EventHandler<MouseEvent, HandlerError, HandlerService>;
declare const title: Effect.Effect<string, PropError, PropService>;
declare const host: Dom.HostRenderer<HTMLButtonElement, RenderEvent, HostError, HostService>;
declare const hostOutput: Effect.Effect<RenderEvent, HostError, HostService>;

const button = Button.Button({ content, onclick, props: { title } }, host);

type _ButtonErrors = Assert<
  Equal<Fx.Error<typeof button>, ContentError | HandlerError | PropError | HostError>
>;
type _ButtonServices = Assert<
  Equal<
    Fx.Services<typeof button>,
    ContentService | HandlerService | PropService | HostService | Scope.Scope | RenderTemplate
  >
>;

const publicButton = PublicButton.Button({ content: "Public" });
type _PublicButton = Assert<Equal<Fx.Success<typeof publicButton>, RenderEvent>>;

const exactHostButton = Button.Button(
  {
    content: "Hosted",
    type: "submit",
    props: { id: "save" },
  },
  (props, hostContent) => {
    type _ExactHostId = Assert<Equal<typeof props.id, "save">>;
    type _ExactHostType = Assert<Equal<typeof props.type, "button" | "submit">>;
    type _ExactHostContent = Assert<Equal<typeof hostContent, "Hosted">>;
    return hostOutput;
  },
);

void exactHostButton;

declare const neverContent: Effect.Effect<string, never, never>;
declare const neverType: Effect.Effect<"button", never, never>;
declare const neverClick: EventHandler.EventHandler<PointerEvent, never, never>;
declare const neverHost: Dom.HostRenderer<HTMLButtonElement>;
declare const neverRef: (element: HTMLButtonElement) => Effect.Effect<void, never, never>;
const neverButton = Button.Button(
  {
    content: neverContent,
    type: neverType,
    onclick: neverClick,
    props: { title: neverContent },
    ref: neverRef,
  },
  neverHost,
);
type _NeverButtonErrors = Assert<Equal<Fx.Error<typeof neverButton>, never>>;
type _NeverButtonServices = Assert<
  Equal<Fx.Services<typeof neverButton>, Scope.Scope | RenderTemplate>
>;

// @ts-expect-error button type uses the native enumerated values
const invalidType = "link" satisfies NonNullable<Button.ButtonOptions["type"]>;

void invalidType;
