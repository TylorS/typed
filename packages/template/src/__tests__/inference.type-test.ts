import type * as Scope from "effect/Scope";
import * as Effect from "effect/Effect";
import type * as Fx from "@typed/fx/Fx";
import { EventHandler, html, type RenderTemplate, type Renderable } from "@typed/template";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

type HandlerService = { readonly HandlerService: unique symbol };

declare const onclick: EventHandler.EventHandler<MouseEvent, "handler-error", HandlerService>;

type _DirectHandlerError = Assert<Equal<Renderable.Error<typeof onclick>, "handler-error">>;
type _DirectHandlerServices = Assert<Equal<Renderable.Services<typeof onclick>, HandlerService>>;

const direct = html`<button onclick=${onclick}>Click</button>`;

type _DirectErrors = Assert<Equal<Fx.Error<typeof direct>, "handler-error">>;
type _DirectServices = Assert<
  Equal<Fx.Services<typeof direct>, HandlerService | Scope.Scope | RenderTemplate>
>;

// @ts-expect-error the handler failure remains in the template failure channel
const _withoutHandlerError: Fx.Fx<unknown, never, Fx.Services<typeof direct>> = direct;
// @ts-expect-error the handler service remains in the template service channel
const _withoutHandlerService: Fx.Fx<
  unknown,
  Fx.Error<typeof direct>,
  Scope.Scope | RenderTemplate
> = direct;

type NestedService = { readonly NestedService: unique symbol };
type FxService = { readonly FxService: unique symbol };

declare const nestedEffect: Effect.Effect<string, "nested-error", NestedService>;
declare const refEffect: Effect.Effect<void, "ref-error", NestedService>;
declare const fxValue: Fx.Fx<number, "fx-error", FxService>;

const mixedChannels = html`<div>${nestedEffect}${fxValue}</div>
  <button onclick=${onclick}></button>`;
type MixedChannelServices = Fx.Services<typeof mixedChannels>;
type _MixedHasNestedService = Assert<NestedService extends MixedChannelServices ? true : false>;
type _MixedHasFxService = Assert<FxService extends MixedChannelServices ? true : false>;
type _MixedHasHandlerService = Assert<HandlerService extends MixedChannelServices ? true : false>;
type _MixedHasScope = Assert<Scope.Scope extends MixedChannelServices ? true : false>;
type _MixedHasRenderTemplate = Assert<RenderTemplate extends MixedChannelServices ? true : false>;

const data = html`<div .data=${{ value: nestedEffect }}></div>`;

type _NestedDataErrors = Assert<Equal<Fx.Error<typeof data>, "nested-error">>;
type _NestedDataServices = Assert<
  Equal<Fx.Services<typeof data>, NestedService | Scope.Scope | RenderTemplate>
>;

const elementRef = (_element: HTMLElement): Effect.Effect<void, "ref-error", NestedService> =>
  refEffect;
const referenced = html`<div ref=${elementRef}></div>`;
let _captured: HTMLElement | undefined;
const assigningRef = (element: HTMLElement) => (_captured = element);
const _assignedReference = html`<div ref=${assigningRef}></div>`;

type _RefErrors = Assert<Equal<Fx.Error<typeof referenced>, "ref-error">>;
type _RefServices = Assert<
  Equal<Fx.Services<typeof referenced>, NestedService | Scope.Scope | RenderTemplate>
>;

type _NativeDomHasNoErrorChannel = Assert<Equal<Renderable.Error<HTMLButtonElement>, never>>;
type _NativeDomHasNoServiceChannel = Assert<Equal<Renderable.Services<HTMLButtonElement>, never>>;
