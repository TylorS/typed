/** @effect-diagnostics missingEffectError:skip-file */
/** @effect-diagnostics missingEffectContext:skip-file */

import type * as Effect from "effect/Effect";
import type * as ManagedRuntime from "effect/ManagedRuntime";
import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import type { RefSubject } from "@typed/fx/RefSubject";
import type { RenderEvent } from "@typed/template/RenderEvent";
import type { RenderTemplate } from "@typed/template/RenderTemplate";
import type { Component } from "svelte";
import { toReadable, toWritable, view } from "../index.js";
import { attachment } from "../Attachment.js";
import { renderToHtmlString } from "@typed/template/Html";
import { render } from "@typed/template/Render";
import { mount } from "svelte";
import Typed from "@typed/svelte/Typed.svelte";
import type * as Stream from "effect/Stream";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

type Props = { readonly label: string };
type PropsError = { readonly _tag: "PropsError" };
type PropsService = { readonly PropsService: unique symbol };

declare const component: Component<Props>;
declare const props: Effect.Effect<Props, PropsError, PropsService>;

const rendered = view(component, props, { id: "counter" });
type _ViewError = Assert<Equal<Fx.Error<typeof rendered>, PropsError>>;
type _ViewServices = Assert<
  Equal<Fx.Services<typeof rendered>, PropsService | Scope.Scope | RenderTemplate>
>;

view(component, { label: "ok" }, { id: "counter" });
// @ts-expect-error component props are inferred from the Svelte component
view(component, { label: 123 }, { id: "counter" });

declare const failingFx: Fx<number, PropsError>;
declare const failingRef: RefSubject<number, PropsError>;
// @ts-expect-error Svelte Readable has no Typed error channel
void toReadable(failingFx, 0);
// @ts-expect-error Svelte Writable has no Typed error channel
void toWritable(failingRef);

declare const typedView: Fx<RenderEvent, never, RenderTemplate | Scope.Scope>;
declare const runtime: ManagedRuntime.ManagedRuntime<RenderTemplate, never>;
attachment(runtime, typedView);

declare const runtimeWithoutRenderer: ManagedRuntime.ManagedRuntime<never, never>;
attachment(runtimeWithoutRenderer, typedView);
declare const serviceView: Fx<RenderEvent, PropsError, PropsService | RenderTemplate | Scope.Scope>;
// @ts-expect-error application services remain required
attachment(runtimeWithoutRenderer, serviceView);
// @ts-expect-error required props cannot be omitted
view(component, {}, { id: "counter" });
declare const stream: Stream.Stream<Props, PropsError, PropsService>;
const streamed = view(component, stream, { id: "counter" });
type _StreamError = Assert<Equal<Fx.Error<typeof streamed>, PropsError>>;
type _StreamServices = Assert<
  Equal<Fx.Services<typeof streamed>, PropsService | Scope.Scope | RenderTemplate>
>;
const serialized = renderToHtmlString(rendered);
type _HtmlError = Assert<Equal<Effect.Error<typeof serialized>, PropsError>>;
type _HtmlServices = Assert<
  Equal<Effect.Services<typeof serialized>, PropsService | RenderTemplate | Scope.Scope>
>;
declare const target: HTMLElement;
const mountedView = render(rendered, target);
type _DomServices = Assert<
  Equal<Fx.Services<typeof mountedView>, PropsService | Scope.Scope | RenderTemplate>
>;
mount(Typed, { target, props: { view: typedView } });

// @ts-expect-error each framework island requires a deterministic id
view(component, { label: "missing-id" });

const nativeAttachment: import("svelte/attachments").Attachment<HTMLElement> = attachment(
  runtime,
  typedView,
);
void nativeAttachment;
