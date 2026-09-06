import * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import { DomRenderTemplate, render } from "@typed/template/Render";
import type { Renderable } from "@typed/template/Renderable";
import type { RenderTemplate } from "@typed/template/RenderTemplate";
import { rootEvents, type RootEventOptions } from "@typed/template/RootEvents";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Layer from "effect/Layer";
import type * as Scope from "effect/Scope";
import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  onServerPrefetch,
  shallowRef,
  useId,
  watch,
  type DefineSetupFnComponent,
} from "vue";
import { useRuntime, type VueRuntime } from "./Runtime.js";

/** Props for a Typed view hosted inside a Vue component. */
export interface TypedProps<R> {
  readonly value: Renderable<Renderable.Primitive, unknown, R | Scope.Scope | RenderTemplate>;
  /** Overrides reporting to Vue's component error boundary. Receives the full Effect cause. */
  readonly onCause?: (cause: Cause.Cause<unknown>) => void;
  readonly stopPropagation?: RootEventOptions;
  /** Defaults to Vue useId, which is stable across server rendering and hydration. */
  readonly id?: string;
}

type TypedValueProps<V extends Renderable.Any> = Omit<TypedProps<never>, "value"> & {
  readonly value: V;
};

type TypedServices<V extends Renderable.Any> = Exclude<
  Exclude<Renderable.Services<V>, RenderTemplate>,
  Scope.Scope
>;
type TypedRuntime<V extends Renderable.Any, ER> = VueRuntime<TypedServices<V>, ER>;

/**
 * Creates a Vue component bound to a borrowed runtime. Vue owns the native Typed
 * renderer and its replacement Scope. The caller owns runtime disposal.
 */
export function createTypedComponent<R = never, ER = never>(
  runtime?: VueRuntime<R, ER>,
): DefineSetupFnComponent<TypedProps<R>>;
export function createTypedComponent<const V extends Renderable.Any, ER = never>(
  runtime?: TypedRuntime<V, ER>,
) {
  return defineComponent(
    (props: TypedValueProps<V>) => {
      const currentRuntime = runtime ? shallowRef(runtime) : useRuntime<TypedServices<V>, ER>();
      const generatedId = `typed-vue-${useId()}`;
      const host = shallowRef<HTMLElement>();
      const failure = shallowRef<Cause.Cause<Renderable.Error<V> | ER>>();
      const serverHTML = shallowRef<string>();

      let disposed = false;

      const report = (cause: Cause.Cause<Renderable.Error<V> | ER>) => {
        if (disposed) return;

        if (props.onCause) props.onCause(cause);
        else failure.value = cause;
      };

      onBeforeUnmount(() => {
        disposed = true;
        if (renderFiber) Effect.runFork(Fiber.interrupt(renderFiber));
      });

      onServerPrefetch(async () => {
        const exit = await currentRuntime.value.runPromiseExit(
          renderToHtmlString(props.value).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
        );

        if (Exit.isSuccess(exit)) serverHTML.value = exit.value;
        else if (props.onCause) props.onCause(exit.cause);
        else throw Cause.squash(exit.cause);
      });

      type RenderRequest = {
        readonly target: HTMLElement;
        readonly value: V;
        readonly runtime: TypedRuntime<V, ER>;
      };
      let renderFiber: Fiber.Fiber<unknown, Renderable.Error<V> | ER> | undefined;
      const renderRequests = Fx.callback<RenderRequest>((emit) => {
        const stop = watch(
          [host, () => props.value, () => currentRuntime.value],
          ([target, value, runtime]) => {
            if (target) void emit.succeed({ target, value, runtime });
          },
          { flush: "post", immediate: true },
        );

        return Effect.sync(stop);
      });

      onMounted(() => {
        const switched = renderRequests.pipe(
          Fx.switchMapEffect(({ target, value, runtime }) => {
            const program = render(value, target).pipe(
              Fx.provide(DomRenderTemplate.using(target.ownerDocument)),
              Fx.provideService(RefSubject.CurrentComputedBehavior, "multiple"),
              Fx.continueWith(() => Fx.never),
              Fx.drain,
              Effect.scoped,
            );

            return Effect.acquireUseRelease(
              Effect.sync(() => runtime.runFork(program)),
              Fiber.join,
              Fiber.interrupt,
            );
          }),
        );

        renderFiber = Effect.runFork(Effect.scoped(Fx.drain(switched)));
        void Effect.runPromise(Fiber.await(renderFiber)).then((exit) => {
          if (!disposed && Exit.isFailure(exit)) report(exit.cause);
        });
      });

      // Event policy can change independently, preserving the mounted Typed node identities.
      watch(
        [host, () => currentRuntime.value, () => props.stopPropagation],
        ([target], _, onCleanup) => {
          if (!target) return;

          const boundary = new AbortController();
          onCleanup(() => boundary.abort());

          void currentRuntime.value
            .runPromiseExit(
              rootEvents(target, props.stopPropagation).pipe(Layer.effectDiscard, Layer.launch),
              { signal: boundary.signal },
            )
            .then((exit) => {
              if (!boundary.signal.aborted && Exit.isFailure(exit)) report(exit.cause);
            });
        },
        { flush: "post" },
      );

      return () => {
        if (failure.value) throw Cause.squash(failure.value);

        // No Vue child VNodes: the native Typed renderer owns this interior.
        return h("div", {
          id: props.id ?? generatedId,
          "data-typed-vue-slot": "",
          style: { display: "contents" },
          ref: host,
          ...(serverHTML.value === undefined ? {} : { innerHTML: serverHTML.value }),
        });
      };
    },
    {
      name: "TypedView",
      inheritAttrs: false,
      props: ["value", "onCause", "stopPropagation", "id"],
    },
  );
}

/** Typed view using the inherited runtime when present. */
export const Typed = createTypedComponent<any, unknown>();
